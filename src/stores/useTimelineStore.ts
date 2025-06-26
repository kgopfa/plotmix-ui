import { create } from 'zustand';
import { produce } from 'immer';
import { useShallow } from 'zustand/react/shallow';
import { TimeManager, TimeManagerState } from '@/lib/time-manager';
import { GSAPTimelineManagerEnhanced } from '@/lib/gsap-timeline-manager-enhanced';
import { IndividualTimelineManager } from '@/lib/individual-timeline-manager';
import { TimelineManager } from '@/lib/timeline-manager';
import { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import { TimelineTrackData } from '@/types/timeline';
import { calculateEffectiveEndTime, calculateEffectiveDuration } from '@/utils/animation-utils';

interface PlaybackState {
  isPlaying: boolean;
  isPaused: boolean;
  isStopped: boolean;
  currentTime: number;
  totalDuration: number;
  playbackSpeed: number;
}

interface TimelineUIState {
  scale: number; // pixels per second
  scrollPosition: number;
  selectedTrackIds: Set<string>;
  selectedAnimationIds: Set<string>;
  expandedTrackIds: Set<string>;
  isTimelineCollapsed: boolean;
  showGrid: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

interface AnimationState {
  // Source of truth
  baseDuration: number;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  
  // Computed/cached values
  effectiveDuration: number;
  effectiveEndTime: number;
}

interface TimelineStoreState {
  // Core timeline data
  tracks: TimelineTrackData[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  
  // Playback state
  playback: PlaybackState;
  
  // UI state
  ui: TimelineUIState;
  
  // Timeline managers
  timeManager: TimeManager;
  gsapManager: GSAPTimelineManagerEnhanced;
  individualManager: IndividualTimelineManager;
  timelineManager: TimelineManager;
  currentManagerType: 'enhanced' | 'individual';
  
  // Real-time subscription state
  subscriptions: {
    timeManager: (() => void) | null;
    gsapManager: (() => void) | null;
  };
  
  // Loading and error state
  isLoading: boolean;
  error: string | null;
  
  // Animation duration management
  animationStates: Map<string, AnimationState>; // keyed by animationId
}

interface TimelineStoreActions {
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // Timeline data management
  setElements: (elements: AnimatedCanvasObject[]) => void;
  setGroups: (groups: CanvasGroup[]) => void;
  updateTracks: () => void;
  
  // Animation management
  addAnimation: (trackId: string, animation: ElementAnimation, trackType: 'element' | 'group') => void;
  updateAnimation: (trackId: string, animationId: string, updates: Partial<ElementAnimation>, trackType: 'element' | 'group') => void;
  removeAnimation: (trackId: string, animationId: string, trackType: 'element' | 'group') => void;
  duplicateAnimation: (trackId: string, animationId: string, trackType: 'element' | 'group') => void;
  
  // UI controls
  setScale: (scale: number) => void;
  setScrollPosition: (position: number) => void;
  toggleTrackSelection: (trackId: string) => void;
  toggleAnimationSelection: (animationId: string) => void;
  expandTrack: (trackId: string) => void;
  collapseTrack: (trackId: string) => void;
  toggleTrackExpansion: (trackId: string) => void;
  setTimelineCollapsed: (collapsed: boolean) => void;
  toggleGrid: () => void;
  toggleSnapToGrid: () => void;
  setGridSize: (size: number) => void;
  clearSelection: () => void;
  
  // Real-time synchronization
  initializeSubscriptions: () => void;
  cleanupSubscriptions: () => void;
  syncWithTimeManager: (timeState: TimeManagerState) => void;
  syncWithGSAP: () => void;
  buildGSAPTimeline: () => void;
  
  // Timeline operations
  exportTimeline: () => string;
  importTimeline: (data: string) => void;
  resetTimeline: () => void;
  
  // Utility functions
  getTrackById: (trackId: string) => TimelineTrackData | undefined;
  getAnimationById: (trackId: string, animationId: string) => ElementAnimation | undefined;
  getTrackDuration: (trackId: string) => number;
  getTotalDuration: () => number;
  getTimeAtPosition: (position: number) => number;
  getPositionAtTime: (time: number) => number;
  
     // Enhanced performance monitoring
   getAnimationPerformance: () => object;
   getCacheStatistics: () => object;
   generatePerformanceReport: () => string;
}

interface TimelineStoreActionsExtended {
  // Individual Timeline Manager methods
  updateElementAnimations: (elementId: string, animations: ElementAnimation[], allElements: AnimatedCanvasObject[]) => void;
  updateGroupAnimations: (groupId: string, animations: ElementAnimation[], group: CanvasGroup) => void;
  batchUpdateElements: (updates: Array<{elementId: string, animations: ElementAnimation[]}>, allElements: AnimatedCanvasObject[]) => void;
  batchUpdateGroups: (updates: Array<{groupId: string, animations: ElementAnimation[], group: CanvasGroup}>) => void;
  
  // Manager selection
  setAnimationManager: (useIndividual: boolean) => void;
  getCurrentManagerType: () => 'enhanced' | 'individual';
  
  // Enhanced performance monitoring for Phase 2
  getIndividualTimelineStats: () => object;
  
  // Animation duration management
  updateAnimationDuration: (animationId: string, elementId: string, baseDuration: number) => void;
  updateAnimationRepeat: (animationId: string, elementId: string, repeat: number, repeatDelay?: number, yoyo?: boolean) => void;
  updateAnimationFromTimeline: (animationId: string, elementId: string, newEffectiveDuration: number, startTime: number) => void;
  getEffectiveDuration: (animationId: string) => number;
  getAnimationState: (animationId: string) => AnimationState | null;
}

type TimelineStore = TimelineStoreState & TimelineStoreActions & TimelineStoreActionsExtended;

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  isStopped: true,
  currentTime: 0,
  totalDuration: 10,
  playbackSpeed: 1,
};

const initialUIState: TimelineUIState = {
  scale: 100,
  scrollPosition: 0,
  selectedTrackIds: new Set(),
  selectedAnimationIds: new Set(),
  expandedTrackIds: new Set(),
  isTimelineCollapsed: false,
  showGrid: true,
  snapToGrid: true,
  gridSize: 1, // 1 second grid
};

export const useTimelineStore = create<TimelineStore>()(
  (set, get) => ({
      // Initial state
      tracks: [],
      elements: [],
      groups: [],
      playback: initialPlaybackState,
      ui: initialUIState,
      timeManager: TimeManager.getInstance(),
      gsapManager: new GSAPTimelineManagerEnhanced(),
      individualManager: new IndividualTimelineManager(),
      timelineManager: TimelineManager.getInstance(),
      currentManagerType: 'enhanced',
      subscriptions: {
        timeManager: null,
        gsapManager: null,
      },
      isLoading: false,
      error: null,
      animationStates: new Map(),

      // Playback controls
      play: () => {
        const { timeManager, gsapManager } = get();
        set(produce((state) => {
          state.playback.isPlaying = true;
          state.playback.isPaused = false;
          state.playback.isStopped = false;
        }));
        
        timeManager.play();
        gsapManager.handlePlayback(true, () => {
          // This callback is called on each tick
          get().syncWithGSAP();
        });
      },

      pause: () => {
        const { timeManager, gsapManager } = get();
        set(produce((state) => {
          state.playback.isPlaying = false;
          state.playback.isPaused = true;
          state.playback.isStopped = false;
        }));
        
        timeManager.pause();
        gsapManager.handlePlayback(false, () => {});
      },

      stop: () => {
        const { timeManager, gsapManager } = get();
        set(produce((state) => {
          state.playback.isPlaying = false;
          state.playback.isPaused = false;
          state.playback.isStopped = true;
          state.playback.currentTime = 0;
        }));
        
        timeManager.stop();
        if ('stop' in gsapManager && typeof gsapManager.stop === 'function') {
          gsapManager.stop();
        } else {
          gsapManager.handlePlayback(false, () => {});
        }
      },

      seek: (time: number) => {
        const { gsapManager } = get();
        set(produce((state) => {
          state.playback.currentTime = Math.max(0, Math.min(time, state.playback.totalDuration));
        }));
        
        gsapManager.updateTime(time);
      },

      setPlaybackSpeed: (speed: number) => {
        set(produce((state) => {
          state.playback.playbackSpeed = Math.max(0.1, Math.min(speed, 4));
        }));
      },

      // Timeline data management
      setElements: (elements: AnimatedCanvasObject[]) => {
        set(produce((state) => {
          state.elements = elements;
        }));
        get().updateTracks();
      },

      setGroups: (groups: CanvasGroup[]) => {
        set(produce((state) => {
          state.groups = groups;
        }));
        get().updateTracks();
      },

      updateTracks: () => {
        const { elements, groups, timelineManager } = get();
        
        // Update the timeline manager with current data
        timelineManager.setTrackData(elements, groups);
        
        // Get the updated track data
        const timelineState = timelineManager.getState();
        
        set(produce((state) => {
          state.tracks = timelineState.trackData;
          state.playback.totalDuration = timelineState.duration;
          state.ui.scale = timelineState.scale;
        }));
        
        // Rebuild GSAP timeline
        get().buildGSAPTimeline();
      },

      // Animation management
      addAnimation: (trackId: string, animation: ElementAnimation, trackType: 'element' | 'group') => {
        set(produce((state) => {
          if (trackType === 'element') {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
            if (element) {
              element.animations.push(animation);
            }
          } else {
            const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
            if (group) {
              group.animations.push(animation);
            }
          }
        }));
        get().updateTracks();
      },

      updateAnimation: (trackId: string, animationId: string, updates: Partial<ElementAnimation>, trackType: 'element' | 'group') => {
        set(produce((state) => {
          if (trackType === 'element') {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
            if (element) {
              const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
              if (animation) {
                Object.assign(animation, updates);
              }
            }
          } else {
            const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
            if (group) {
              const animation = group.animations.find((anim: ElementAnimation) => anim.id === animationId);
              if (animation) {
                Object.assign(animation, updates);
              }
            }
          }
        }));
        get().updateTracks();
      },

      removeAnimation: (trackId: string, animationId: string, trackType: 'element' | 'group') => {
        set(produce((state) => {
          if (trackType === 'element') {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
            if (element) {
              element.animations = element.animations.filter((anim: ElementAnimation) => anim.id !== animationId);
            }
          } else {
            const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
            if (group) {
              group.animations = group.animations.filter((anim: ElementAnimation) => anim.id !== animationId);
            }
          }
          // Remove from selection if selected
          state.ui.selectedAnimationIds.delete(animationId);
        }));
        get().updateTracks();
      },

      duplicateAnimation: (trackId: string, animationId: string, trackType: 'element' | 'group') => {
        set(produce((state) => {
          let sourceAnimation: ElementAnimation | undefined;
          
          if (trackType === 'element') {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
            sourceAnimation = element?.animations.find((anim: ElementAnimation) => anim.id === animationId);
          } else {
            const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
            sourceAnimation = group?.animations.find((anim: ElementAnimation) => anim.id === animationId);
          }
          
          if (sourceAnimation) {
            const duplicatedAnimation: ElementAnimation = {
              ...sourceAnimation,
              id: crypto.randomUUID(),
              startTime: sourceAnimation.startTime + sourceAnimation.duration + 0.5, // Offset by duration + 0.5s
            };
            
            if (trackType === 'element') {
              const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
              if (element) {
                element.animations.push(duplicatedAnimation);
              }
            } else {
              const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
              if (group) {
                group.animations.push(duplicatedAnimation);
              }
            }
          }
        }));
        get().updateTracks();
      },

      // UI controls
      setScale: (scale: number) => {
        const { timelineManager } = get();
        const clampedScale = Math.max(10, Math.min(scale, 1000));
        
        set(produce((state) => {
          state.ui.scale = clampedScale;
        }));
        
        timelineManager.setScale(clampedScale);
      },

      setScrollPosition: (position: number) => {
        set(produce((state) => {
          state.ui.scrollPosition = Math.max(0, position);
        }));
      },

      toggleTrackSelection: (trackId: string) => {
        set(produce((state) => {
          if (state.ui.selectedTrackIds.has(trackId)) {
            state.ui.selectedTrackIds.delete(trackId);
          } else {
            state.ui.selectedTrackIds.add(trackId);
          }
        }));
      },

      toggleAnimationSelection: (animationId: string) => {
        set(produce((state) => {
          if (state.ui.selectedAnimationIds.has(animationId)) {
            state.ui.selectedAnimationIds.delete(animationId);
          } else {
            state.ui.selectedAnimationIds.add(animationId);
          }
        }));
      },

      expandTrack: (trackId: string) => {
        set(produce((state) => {
          state.ui.expandedTrackIds.add(trackId);
        }));
      },

      collapseTrack: (trackId: string) => {
        set(produce((state) => {
          state.ui.expandedTrackIds.delete(trackId);
        }));
      },

      toggleTrackExpansion: (trackId: string) => {
        set(produce((state) => {
          if (state.ui.expandedTrackIds.has(trackId)) {
            state.ui.expandedTrackIds.delete(trackId);
          } else {
            state.ui.expandedTrackIds.add(trackId);
          }
        }));
      },

      setTimelineCollapsed: (collapsed: boolean) => {
        set(produce((state) => {
          state.ui.isTimelineCollapsed = collapsed;
        }));
      },

      toggleGrid: () => {
        set(produce((state) => {
          state.ui.showGrid = !state.ui.showGrid;
        }));
      },

      toggleSnapToGrid: () => {
        set(produce((state) => {
          state.ui.snapToGrid = !state.ui.snapToGrid;
        }));
      },

      setGridSize: (size: number) => {
        set(produce((state) => {
          state.ui.gridSize = Math.max(0.1, Math.min(size, 10));
        }));
      },

      clearSelection: () => {
        set(produce((state) => {
          state.ui.selectedTrackIds.clear();
          state.ui.selectedAnimationIds.clear();
        }));
      },

      // Real-time synchronization
      initializeSubscriptions: () => {
        const { timeManager, timelineManager, syncWithTimeManager } = get();
        
        // Clean up existing subscriptions
        get().cleanupSubscriptions();
        
        set(produce((state) => {
          // Subscribe to TimeManager updates
          state.subscriptions.timeManager = timeManager.subscribe((timeState) => {
            syncWithTimeManager(timeState);
          });
          
          // Subscribe to TimelineManager updates
          state.subscriptions.gsapManager = timelineManager.subscribe((timelineState) => {
            set(produce((state) => {
              state.tracks = timelineState.trackData;
              state.playback.totalDuration = timelineState.duration;
              if (state.ui.scale !== timelineState.scale) {
                state.ui.scale = timelineState.scale;
              }
            }));
          });
        }));
      },

      cleanupSubscriptions: () => {
        const { subscriptions } = get();
        
        if (subscriptions.timeManager) {
          subscriptions.timeManager();
        }
        if (subscriptions.gsapManager) {
          subscriptions.gsapManager();
        }
        
        set(produce((state) => {
          state.subscriptions.timeManager = null;
          state.subscriptions.gsapManager = null;
        }));
      },

      syncWithTimeManager: (timeState: TimeManagerState) => {
        set(produce((state) => {
          state.playback.isPlaying = timeState.isPlaying;
          state.playback.isPaused = !timeState.isPlaying && state.playback.currentTime > 0;
          state.playback.isStopped = !timeState.isPlaying && state.playback.currentTime === 0;
          state.playback.currentTime = timeState.elapsedTime;
        }));
      },

      syncWithGSAP: () => {
        // This can be called on each animation frame to sync GSAP state
        // Currently, GSAP updates are handled through TimeManager
        // Additional GSAP-specific synchronization can be added here if needed
      },

      buildGSAPTimeline: () => {
        const { elements, groups, gsapManager } = get();
        gsapManager.buildAnimationTimeline(elements, groups);
      },

      // Timeline operations
      exportTimeline: () => {
        const { timelineManager } = get();
        return timelineManager.exportTimeline();
      },

      importTimeline: (data: string) => {
        const { timelineManager } = get();
        try {
          timelineManager.importTimeline(data);
          get().updateTracks();
        } catch (error) {
          set(produce((state) => {
            state.error = `Failed to import timeline: ${error}`;
          }));
        }
      },

      resetTimeline: () => {
        set(produce((state) => {
          state.tracks = [];
          state.elements = [];
          state.groups = [];
          state.playback = { ...initialPlaybackState };
          state.ui = { ...initialUIState };
          state.error = null;
        }));
        get().buildGSAPTimeline();
      },

      // Utility functions
      getTrackById: (trackId: string) => {
        const { tracks } = get();
        return tracks.find((track: TimelineTrackData) => track.id === trackId);
      },

      getAnimationById: (trackId: string, animationId: string) => {
        const track = get().getTrackById(trackId);
        if (!track) return undefined;
        
        if (track.type === 'element') {
          const element = track.item as AnimatedCanvasObject;
          return element.animations.find((anim: ElementAnimation) => anim.id === animationId);
        } else {
          const group = track.item as CanvasGroup;
          return group.animations.find((anim: ElementAnimation) => anim.id === animationId);
        }
      },

      getTrackDuration: (trackId: string) => {
        const track = get().getTrackById(trackId);
        if (!track) return 0;
        
        let maxEndTime = 0;
        track.animations.forEach(animation => {
          const endTime = calculateEffectiveEndTime(animation as ElementAnimation);
          maxEndTime = Math.max(maxEndTime, endTime);
        });
        
        return maxEndTime;
      },

      getTotalDuration: () => {
        const { tracks } = get();
        let maxDuration = 0;
        
        tracks.forEach(track => {
          const trackDuration = get().getTrackDuration(track.id);
          maxDuration = Math.max(maxDuration, trackDuration);
        });
        
        return Math.max(10, maxDuration);
      },

      getTimeAtPosition: (position: number) => {
        const { ui } = get();
        return position / ui.scale;
      },

      getPositionAtTime: (time: number) => {
        const { ui } = get();
        return time * ui.scale;
      },

      // Enhanced performance monitoring
      getAnimationPerformance: () => {
        const state = get();
        const managerType = state.getCurrentManagerType();
        
        if (managerType === 'individual') {
          return state.individualManager.getPerformanceStats();
        } else {
          return state.gsapManager.getPerformanceMetrics();
        }
      },

      getCacheStatistics: () => {
        const state = get();
        const managerType = state.getCurrentManagerType();
        
        if (managerType === 'individual') {
          const stats = state.individualManager.getPerformanceStats();
          return {
            type: 'individual',
            poolStats: stats.poolStats,
            activeElements: stats.activeElements,
            activeGroups: stats.activeGroups,
            totalAnimations: stats.totalAnimations
          };
        } else {
          return state.gsapManager.getCacheStats();
        }
      },

      generatePerformanceReport: () => {
        const state = get();
        const managerType = state.getCurrentManagerType();
        
        if (managerType === 'individual') {
          return state.individualManager.generatePerformanceReport();
        } else {
          return state.gsapManager.generatePerformanceReport();
        }
      },

      buildTimeline: (elements: AnimatedCanvasObject[], groups: CanvasGroup[], useIndividualManager = false) => {
        const state = get();
        
        try {
          if (useIndividualManager) {
            console.log('Building timeline with Individual Timeline Manager');
            
            // Use Individual Timeline Manager (Phase 2)
            const individualManager = state.individualManager;
            
            // Clear existing timelines
            individualManager.clearTimeline();
            
            // Batch update all elements
            const elementUpdates = elements.map(element => ({
              elementId: element.id,
              animations: element.animations || []
            }));
            
            const groupUpdates = groups.map(group => ({
              groupId: group.id,
              animations: group.animations || [],
              group
            }));
            
            individualManager.batchUpdateElements(elementUpdates, elements);
            individualManager.batchUpdateGroups(groupUpdates);
            
            console.log('Individual Timeline Manager build complete');
          } else {
            console.log('Building timeline with Enhanced Timeline Manager');
            
            // Use Enhanced Timeline Manager (Phase 1)
            state.gsapManager.buildAnimationTimeline(elements, groups);
            
            console.log('Enhanced Timeline Manager build complete');
          }
          
          // Update store state
          set(produce((draft) => {
            draft.elements = elements;
            draft.groups = groups;
          }));
          
        } catch (error) {
          console.error('Error building timeline:', error);
        }
      },

      // Individual Timeline Manager methods
      updateElementAnimations: (elementId, animations, allElements) => {
        const state = get();
        try {
          state.individualManager.updateElementAnimations(elementId, animations, allElements);
          console.log(`Updated animations for element ${elementId}`);
        } catch (error) {
          console.error(`Error updating element ${elementId}:`, error);
        }
      },

      updateGroupAnimations: (groupId, animations, group) => {
        const state = get();
        try {
          state.individualManager.updateGroupAnimations(groupId, animations, group);
          console.log(`Updated animations for group ${groupId}`);
        } catch (error) {
          console.error(`Error updating group ${groupId}:`, error);
        }
      },

      batchUpdateElements: (updates, allElements) => {
        const state = get();
        try {
          state.individualManager.batchUpdateElements(updates, allElements);
          console.log(`Batch updated ${updates.length} elements`);
        } catch (error) {
          console.error('Error in batch element update:', error);
        }
      },

      batchUpdateGroups: (updates) => {
        const state = get();
        try {
          state.individualManager.batchUpdateGroups(updates);
          console.log(`Batch updated ${updates.length} groups`);
        } catch (error) {
          console.error('Error in batch group update:', error);
        }
      },

      // Manager selection
      setAnimationManager: (useIndividual) => {
        set(produce((draft) => {
          if (useIndividual) {
            console.log('Switching to Individual Timeline Manager (Phase 2)');
            draft.currentManagerType = 'individual';
          } else {
            console.log('Switching to Enhanced Timeline Manager (Phase 1)');
            draft.currentManagerType = 'enhanced';
          }
        }));
      },

      getCurrentManagerType: () => {
        const state = get();
        return state.currentManagerType || 'enhanced';
      },

      // Enhanced performance monitoring for Phase 2
      getIndividualTimelineStats: () => {
        const state = get();
        return state.individualManager.getPerformanceStats();
      },

      // Animation duration management
      updateAnimationDuration: (animationId: string, elementId: string, baseDuration: number) => {
        set(produce((state) => {
          // Update the actual animation object
          const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
          if (element) {
            const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
            if (animation) {
              animation.duration = baseDuration;
              
              // Update cached state
              const animState = state.animationStates.get(animationId);
              if (animState) {
                animState.baseDuration = baseDuration;
                animState.effectiveDuration = calculateEffectiveDuration(animation);
                animState.effectiveEndTime = animation.startTime + animState.effectiveDuration;
              } else {
                state.animationStates.set(animationId, {
                  baseDuration,
                  repeat: animation.repeat,
                  repeatDelay: animation.repeatDelay,
                  yoyo: animation.yoyo,
                  effectiveDuration: calculateEffectiveDuration(animation),
                  effectiveEndTime: animation.startTime + calculateEffectiveDuration(animation)
                });
              }
            }
          }
        }));
        get().updateTracks();
      },

      updateAnimationRepeat: (animationId: string, elementId: string, repeat: number, repeatDelay = 0, yoyo = false) => {
        set(produce((state) => {
          const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
          if (element) {
            const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
            if (animation) {
              animation.repeat = repeat;
              animation.repeatDelay = repeatDelay;
              animation.yoyo = yoyo;
              
              // Update cached state
              const animState = state.animationStates.get(animationId);
              if (animState) {
                animState.repeat = repeat;
                animState.repeatDelay = repeatDelay;
                animState.yoyo = yoyo;
                animState.effectiveDuration = calculateEffectiveDuration(animation);
                animState.effectiveEndTime = animation.startTime + animState.effectiveDuration;
              }
            }
          }
        }));
        get().updateTracks();
      },

      updateAnimationFromTimeline: (animationId: string, elementId: string, newEffectiveDuration: number, startTime: number) => {
        set(produce((state) => {
          const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
          if (element) {
            const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
            if (animation) {
              // Strategy: If no repeats, adjust base duration
              // If has repeats, we need to decide what to adjust
              if ((animation.repeat ?? 0) === 0) {
                // No repeats - simple case
                animation.duration = newEffectiveDuration;
                animation.startTime = startTime;
              } else {
                // Has repeats - multiple strategies possible:
                // Strategy A: Adjust base duration proportionally
                const currentEffective = calculateEffectiveDuration(animation);
                const ratio = newEffectiveDuration / currentEffective;
                animation.duration = Math.max(0.1, animation.duration * ratio);
                animation.startTime = startTime;
                
                // Strategy B: Keep base duration, adjust repeat count
                // const repeatCount = Math.max(0, Math.floor((newEffectiveDuration - animation.duration) / (animation.duration + (animation.repeatDelay ?? 0))));
                // animation.repeat = repeatCount;
              }
              
              // Update cached state
              const animState = state.animationStates.get(animationId);
              if (animState) {
                animState.baseDuration = animation.duration;
                animState.effectiveDuration = calculateEffectiveDuration(animation);
                animState.effectiveEndTime = animation.startTime + animState.effectiveDuration;
              }
            }
          }
        }));
        get().updateTracks();
      },

      getEffectiveDuration: (animationId: string) => {
        const state = get().animationStates.get(animationId);
        return state?.effectiveDuration ?? 0;
      },

      getAnimationState: (animationId: string) => {
        return get().animationStates.get(animationId) ?? null;
      },
    })
);

// Selector hooks for optimized access to specific parts of the store
export const useTimelinePlayback = () => {
  return useTimelineStore(useShallow((state) => ({
    playback: state.playback,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    seek: state.seek,
    setPlaybackSpeed: state.setPlaybackSpeed,
  })));
};

export const useTimelineUI = () => {
  return useTimelineStore(useShallow((state) => ({
    ui: state.ui,
    setScale: state.setScale,
    setScrollPosition: state.setScrollPosition,
    toggleTrackSelection: state.toggleTrackSelection,
    toggleAnimationSelection: state.toggleAnimationSelection,
    toggleTrackExpansion: state.toggleTrackExpansion,
    setTimelineCollapsed: state.setTimelineCollapsed,
    toggleGrid: state.toggleGrid,
    toggleSnapToGrid: state.toggleSnapToGrid,
    setGridSize: state.setGridSize,
    clearSelection: state.clearSelection,
  })));
};

export const useTimelineTracks = () => {
  return useTimelineStore(useShallow((state) => ({
    tracks: state.tracks,
    elements: state.elements,
    groups: state.groups,
    setElements: state.setElements,
    setGroups: state.setGroups,
    updateTracks: state.updateTracks,
    getTrackById: state.getTrackById,
    getTrackDuration: state.getTrackDuration,
    getTotalDuration: state.getTotalDuration,
  })));
};

export const useTimelineAnimations = () => {
  return useTimelineStore(useShallow((state) => ({
    addAnimation: state.addAnimation,
    updateAnimation: state.updateAnimation,
    removeAnimation: state.removeAnimation,
    duplicateAnimation: state.duplicateAnimation,
    getAnimationById: state.getAnimationById,
  })));
};

export const useTimelineSync = () => {
  return useTimelineStore(useShallow((state) => ({
    initializeSubscriptions: state.initializeSubscriptions,
    cleanupSubscriptions: state.cleanupSubscriptions,
    buildGSAPTimeline: state.buildGSAPTimeline,
    syncWithTimeManager: state.syncWithTimeManager,
    isLoading: state.isLoading,
    error: state.error,
  })));
};

export const useTimelineOperations = () => {
  return useTimelineStore(useShallow((state) => ({
    exportTimeline: state.exportTimeline,
    importTimeline: state.importTimeline,
    resetTimeline: state.resetTimeline,
    getTimeAtPosition: state.getTimeAtPosition,
    getPositionAtTime: state.getPositionAtTime,
  })));
};