import { create } from 'zustand';
import { produce, enableMapSet } from 'immer';
import { useShallow } from 'zustand/react/shallow';
import { TimeManager, TimeManagerState } from '@/lib/time-manager';
import { GSAPTimelineManagerEnhanced } from '@/lib/gsap-timeline-manager-enhanced';
import { TimelineManager } from '@/lib/timeline-manager';
import { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import { TimelineTrackData } from '@/types/timeline';
import { calculateEffectiveEndTime, calculateEffectiveDuration } from '@/utils/animation-utils';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useProjectStore } from '@/stores/use-project-store';
import { MAX_SCENE_DURATION } from '@/types/project';

// Enable Immer MapSet plugin for Map support
enableMapSet();

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
  timelineManager: TimelineManager;
  
  // Real-time subscription state
  subscriptions: {
    timeManager: (() => void) | null;
    gsapManager: (() => void) | null;
    canvasStore: (() => void) | null; // Added for Canvas Store
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
  seekToTime: (time: number) => void;
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
  // Animation duration management
  updateAnimationDuration: (animationId: string, elementId: string, baseDuration: number) => void;
  updateAnimationRepeat: (animationId: string, elementId: string, repeat: number, repeatDelay?: number, yoyo?: boolean) => void;
  updateAnimationFromTimeline: (animationId: string, elementId: string, newEffectiveDuration: number, startTime: number) => void;
  getEffectiveDuration: (animationId: string) => number;
  getAnimationState: (animationId: string) => AnimationState | null;
  
  // Project save/load support
  getProjectData: () => {
    elements: AnimatedCanvasObject[];
    groups: CanvasGroup[];
    animationStates: Map<string, AnimationState>;
    scale: number;
    duration: number;
    currentTime: number;
  };
  
  loadProjectData: (data: {
    elements: AnimatedCanvasObject[];
    groups: CanvasGroup[];
    animationStates: Record<string, AnimationState>;
    scale: number;
    duration: number;
    currentTime: number;
  }) => void;
}

type TimelineStore = TimelineStoreState & TimelineStoreActions & TimelineStoreActionsExtended;

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  isStopped: true,
  currentTime: 0,
  totalDuration: MAX_SCENE_DURATION, // Maximum scene duration: 2 minutes (120 seconds)
  playbackSpeed: 1,
};

const initialUIState: TimelineUIState = {
  scale: 100,
  scrollPosition: 0,
  selectedTrackIds: new Set(),
  selectedAnimationIds: new Set(),
  expandedTrackIds: new Set(),
        isTimelineCollapsed: true,
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
      timelineManager: TimelineManager.getInstance(),
      subscriptions: {
        timeManager: null,
        gsapManager: null,
        canvasStore: null, // Initialize canvasStore
      },
      isLoading: false,
      error: null,
      animationStates: new Map(),

      // Playback controls
      play: () => {
        const { timeManager, gsapManager } = get();
        // Ensure timeline is freshly built before starting playback
        try {
          get().buildGSAPTimeline();
        } catch {}
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
        const clampedTime = Math.max(0, Math.min(time, get().playback.totalDuration));
        
        set(produce((state) => {
          state.playback.currentTime = clampedTime;
        }));
        
        // Use the robust seek method for all time updates to ensure proper visual state
        gsapManager.seekToTime(clampedTime);
        
        // If seeking to time 0, ensure we're in a stopped state
        if (clampedTime === 0) {
          set(produce((state) => {
            state.playback.isPlaying = false;
            state.playback.isPaused = false;
            state.playback.isStopped = true;
          }));
        }
      },

      /**
       * Seek to a specific time with proper visual state synchronization
       * This method ensures that all animated elements are in their correct state for the given time
       */
      seekToTime: (time: number) => {
        const { gsapManager } = get();
        const clampedTime = Math.max(0, Math.min(time, get().playback.totalDuration));
        
        set(produce((state) => {
          state.playback.currentTime = clampedTime;
        }));
        
        // Use the robust seek method for all time updates to ensure proper visual state
        gsapManager.seekToTime(clampedTime);
        
        // If seeking to time 0, ensure we're in a stopped state
        if (clampedTime === 0) {
          set(produce((state) => {
            state.playback.isPlaying = false;
            state.playback.isPaused = false;
            state.playback.isStopped = true;
          }));
        }
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
          
          // Initialize animation states for all element animations
          elements.forEach(element => {
            element.animations.forEach(animation => {
              if (!state.animationStates.has(animation.id)) {
                const effectiveDuration = calculateEffectiveDuration(animation);
                state.animationStates.set(animation.id, {
                  baseDuration: animation.duration,
                  repeat: animation.repeat,
                  repeatDelay: animation.repeatDelay,
                  yoyo: animation.yoyo,
                  effectiveDuration,
                  effectiveEndTime: animation.startTime + effectiveDuration
                });
              }
            });
          });
        }));
        get().updateTracks();
        // Autosave on timeline-affecting element updates
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
      },

      setGroups: (groups: CanvasGroup[]) => {
        set(produce((state) => {
          state.groups = groups;
          
          // Initialize animation states for all group animations
          groups.forEach(group => {
            group.animations.forEach(animation => {
              if (!state.animationStates.has(animation.id)) {
                const effectiveDuration = calculateEffectiveDuration(animation);
                state.animationStates.set(animation.id, {
                  baseDuration: animation.duration,
                  repeat: animation.repeat,
                  repeatDelay: animation.repeatDelay,
                  yoyo: animation.yoyo,
                  effectiveDuration,
                  effectiveEndTime: animation.startTime + effectiveDuration
                });
              }
            });
          });
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
      },

      updateTracks: () => {
        const { elements, groups, timelineManager } = get();
        
        // Skip if elements are empty (might be in transition)
        if (!elements || elements.length === 0) {
          console.warn('Timeline Store: Skipping updateTracks - no elements available');
          return;
        }
        
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

          // Initialize animation state cache for immediate timeline display
          const effectiveDuration = calculateEffectiveDuration(animation);
          state.animationStates.set(animation.id, {
            baseDuration: animation.duration,
            repeat: animation.repeat,
            repeatDelay: animation.repeatDelay,
            yoyo: animation.yoyo,
            effectiveDuration,
            effectiveEndTime: animation.startTime + effectiveDuration
          });
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
      },

      updateAnimation: (trackId: string, animationId: string, updates: Partial<ElementAnimation>, trackType: 'element' | 'group') => {
        set(produce((state) => {
          let updatedAnimation: ElementAnimation | undefined;
          
          if (trackType === 'element') {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === trackId);
            if (element) {
              const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
              if (animation) {
                Object.assign(animation, updates);
                updatedAnimation = animation;
              }
            }
          } else {
            const group = state.groups.find((g: CanvasGroup) => g.id === trackId);
            if (group) {
              const animation = group.animations.find((anim: ElementAnimation) => anim.id === animationId);
              if (animation) {
                Object.assign(animation, updates);
                updatedAnimation = animation;
              }
            }
          }

          // Update animation state cache if animation was found and updated
          if (updatedAnimation) {
            const effectiveDuration = calculateEffectiveDuration(updatedAnimation);
            const existingState = state.animationStates.get(animationId);
            
            if (existingState) {
              // Update existing state
              existingState.baseDuration = updatedAnimation.duration;
              existingState.repeat = updatedAnimation.repeat;
              existingState.repeatDelay = updatedAnimation.repeatDelay;
              existingState.yoyo = updatedAnimation.yoyo;
              existingState.effectiveDuration = effectiveDuration;
              existingState.effectiveEndTime = updatedAnimation.startTime + effectiveDuration;
            } else {
              // Create new state if it doesn't exist
              state.animationStates.set(animationId, {
                baseDuration: updatedAnimation.duration,
                repeat: updatedAnimation.repeat,
                repeatDelay: updatedAnimation.repeatDelay,
                yoyo: updatedAnimation.yoyo,
                effectiveDuration,
                effectiveEndTime: updatedAnimation.startTime + effectiveDuration
              });
            }
          }
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
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
          // Clean up animation state cache
          state.animationStates.delete(animationId);
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
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

            // Initialize animation state cache for the duplicated animation
            const effectiveDuration = calculateEffectiveDuration(duplicatedAnimation);
            state.animationStates.set(duplicatedAnimation.id, {
              baseDuration: duplicatedAnimation.duration,
              repeat: duplicatedAnimation.repeat,
              repeatDelay: duplicatedAnimation.repeatDelay,
              yoyo: duplicatedAnimation.yoyo,
              effectiveDuration,
              effectiveEndTime: duplicatedAnimation.startTime + effectiveDuration
            });
          }
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
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
        
        // Subscribe to Canvas Store changes
        const canvasStore = useCanvasStore.getState();
        const unsubscribeCanvas = canvasStore.subscribe((canvasState) => {
          // Sync Timeline Store with Canvas Store changes
          const timelineStore = get();
          timelineStore.setElements(canvasState.elements);
          timelineStore.setGroups(canvasState.groups);
        });
        
        // Store the canvas unsubscribe function for cleanup
        set(produce((state) => {
          state.subscriptions.canvasStore = unsubscribeCanvas;
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
        if (subscriptions.canvasStore) {
          subscriptions.canvasStore();
        }
        
        set(produce((state) => {
          state.subscriptions.timeManager = null;
          state.subscriptions.gsapManager = null;
          state.subscriptions.canvasStore = null;
        }));
      },

      syncWithTimeManager: (timeState: TimeManagerState) => {
        const { playback, timeManager, gsapManager } = get();
        const totalDuration = playback.totalDuration;

        // First, clamp the reported time to total duration
        const clampedTime = Math.max(0, Math.min(timeState.elapsedTime, totalDuration));

        set(produce((state) => {
          state.playback.isPlaying = timeState.isPlaying;
          state.playback.isPaused = !timeState.isPlaying && state.playback.currentTime > 0;
          state.playback.isStopped = !timeState.isPlaying && state.playback.currentTime === 0;
          state.playback.currentTime = clampedTime;
        }));

        // If we've reached or exceeded the scene cap, pause everything exactly at the cap
        if (timeState.elapsedTime >= totalDuration) {
          // Pause tickers
          try { timeManager.pause(); } catch {}
          try { gsapManager.handlePlayback(false, () => {}); } catch {}

          // Reflect paused-at-end UI state
          set(produce((state) => {
            state.playback.isPlaying = false;
            state.playback.isPaused = true;
            state.playback.isStopped = false;
            state.playback.currentTime = totalDuration;
          }));
        }
      },

      syncWithGSAP: () => {
        // Called on each tick. Keep GSAP timeline time in sync with store state.
        try {
          const { playback, gsapManager } = get();
          gsapManager.updateTime(playback.currentTime);
        } catch {}
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
          // Ensure all cached animation state is cleared when resetting timeline
          state.animationStates.clear();
        }));
        
        // Clear selection state when timeline is reset
        const { clearSelections } = useSelectionStore.getState();
        clearSelections();
        
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
        return state.gsapManager.getPerformanceMetrics();
      },

      getCacheStatistics: () => {
        const state = get();
        return state.gsapManager.getCacheStats();
      },

      generatePerformanceReport: () => {
        const state = get();
        return state.gsapManager.generatePerformanceReport();
      },

      // Animation duration management
      updateAnimationDuration: (animationId: string, elementId: string, baseDuration: number) => {
        set(produce((state) => {
          // Update Timeline Store first
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
        
        // Update the canvas store second (to maintain consistency)
        const canvasStore = useCanvasStore.getState();
        canvasStore.updateElementAnimation(elementId, animationId, { duration: baseDuration });
        
        // Update tracks after both stores are consistent
        get().updateTracks();
      },

      updateAnimationRepeat: (animationId: string, elementId: string, repeat: number, repeatDelay = 0, yoyo = false) => {
        set(produce((state) => {
          // Update Timeline Store first
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
              } else {
                state.animationStates.set(animationId, {
                  baseDuration: animation.duration,
                  repeat,
                  repeatDelay,
                  yoyo,
                  effectiveDuration: calculateEffectiveDuration(animation),
                  effectiveEndTime: animation.startTime + calculateEffectiveDuration(animation)
                });
              }
            }
          }
        }));
        
        // Update the canvas store second (to maintain consistency)
        const canvasStore = useCanvasStore.getState();
        canvasStore.updateElementAnimation(elementId, animationId, { repeat, repeatDelay, yoyo });
        
        // Update tracks after both stores are consistent
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
        
        // Update the canvas store second (to maintain consistency)
        const canvasStore = useCanvasStore.getState();
        canvasStore.updateElementAnimation(elementId, animationId, { 
          duration: newEffectiveDuration, 
          startTime: startTime 
        });
        
        // Update the selection store to ensure the animations tab gets the updated data
        const selectionStore = useSelectionStore.getState();
        const updatedElement = canvasStore.getElementById(elementId);
        if (updatedElement && selectionStore.isSelected(updatedElement)) {
          // Re-select the element to update the selection store with fresh data
          selectionStore.select(updatedElement);
        }
        
        // Update tracks after both stores are consistent
        get().updateTracks();
      },

      getEffectiveDuration: (animationId: string) => {
        const state = get().animationStates.get(animationId);
        if (state) {
          return state.effectiveDuration;
        }

        // Fallback: Find the animation in elements/groups and calculate duration
        const { elements, groups } = get();
        
        // Search in elements
        for (const element of elements) {
          const animation = element.animations.find(anim => anim.id === animationId);
          if (animation) {
            const effectiveDuration = calculateEffectiveDuration(animation);
            // Do not mutate store state during render; return computed value only
            return effectiveDuration;
          }
        }
        
        // Search in groups
        for (const group of groups) {
          const animation = group.animations.find(anim => anim.id === animationId);
          if (animation) {
            const effectiveDuration = calculateEffectiveDuration(animation);
            // Do not mutate store state during render; return computed value only
            return effectiveDuration;
          }
        }
        
        // Default fallback if animation not found
        return 2; // Default 2-second duration
      },

      getAnimationState: (animationId: string) => {
        return get().animationStates.get(animationId) ?? null;
      },

      // Project save/load support
      getProjectData: () => {
        const state = get();
        return {
          elements: state.elements,
          groups: state.groups,
          animationStates: state.animationStates,
          scale: state.ui.scale,
          duration: state.playback.totalDuration,
          currentTime: state.playback.currentTime,
        };
      },

      loadProjectData: (data) => {
        set(produce((state) => {
          // Load core data - create deep copies to avoid frozen object issues
          state.elements = data.elements.map(element => ({
            ...element,
            animations: element.animations.map(anim => ({ ...anim }))
          }));
          state.groups = data.groups.map(group => ({
            ...group,
            animations: group.animations.map(anim => ({ ...anim }))
          }));
          
          // Clear and reload animation states
          state.animationStates.clear();
          Object.entries(data.animationStates).forEach(([key, value]) => {
            // Create a fresh copy to avoid frozen object issues
            state.animationStates.set(key, {
              baseDuration: value.baseDuration,
              repeat: value.repeat,
              repeatDelay: value.repeatDelay,
              yoyo: value.yoyo,
              effectiveDuration: value.effectiveDuration,
              effectiveEndTime: value.effectiveEndTime,
            });
          });
          
          // Update timeline UI
          state.ui.scale = data.scale;
          state.playback.totalDuration = data.duration;
          state.playback.currentTime = data.currentTime;
        }));
        
        // Update tracks and rebuild timeline
        get().updateTracks();
        get().buildGSAPTimeline();
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
    seekToTime: state.seekToTime,
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
    seekToTime: state.seekToTime,
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
    seekToTime: state.seekToTime,
  })));
};

export const useTimelineAnimations = () => {
  return useTimelineStore(useShallow((state) => {
    return {
      addAnimation: state.addAnimation,
      updateAnimation: state.updateAnimation,
      removeAnimation: state.removeAnimation,
      duplicateAnimation: state.duplicateAnimation,
      getAnimationById: state.getAnimationById,
      seekToTime: state.seekToTime,
    };
  }));
};

export const useTimelineSync = () => {
  return useTimelineStore(useShallow((state) => ({
    initializeSubscriptions: state.initializeSubscriptions,
    cleanupSubscriptions: state.cleanupSubscriptions,
    buildGSAPTimeline: state.buildGSAPTimeline,
    syncWithTimeManager: state.syncWithTimeManager,
    seekToTime: state.seekToTime,
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
    seekToTime: state.seekToTime,
  })));
};