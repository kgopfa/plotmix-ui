import { create } from 'zustand';
import { produce } from 'immer';
import { useShallow } from 'zustand/react/shallow';
import { TimeManager, TimeManagerState } from '@/lib/time-manager';
import { GSAPTimelineManagerEnhanced } from '@/lib/gsap-timeline-manager-enhanced';
import { TimelineManager } from '@/lib/timeline-manager';
import { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import { TimelineTrackData } from '@/types/timeline';

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
    timelineManager: (() => void) | null;
  };
  
  // Loading and error state
  isLoading: boolean;
  error: string | null;
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

type TimelineStore = TimelineStoreState & TimelineStoreActions;

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
      timelineManager: TimelineManager.getInstance(),
      subscriptions: {
        timeManager: null,
        timelineManager: null,
      },
      isLoading: false,
      error: null,

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
        gsapManager.handlePlayback(false, () => {});
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
          state.subscriptions.timelineManager = timelineManager.subscribe((timelineState) => {
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
        if (subscriptions.timelineManager) {
          subscriptions.timelineManager();
        }
        
        set(produce((state) => {
          state.subscriptions.timeManager = null;
          state.subscriptions.timelineManager = null;
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
          const endTime = animation.startTime + animation.duration;
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
        
        return Math.max(10, maxDuration); // Minimum 10 seconds
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
        const { gsapManager } = get();
        return gsapManager.getPerformanceMetrics();
      },

      getCacheStatistics: () => {
        const { gsapManager } = get();
        return gsapManager.getCacheStats();
      },

      generatePerformanceReport: () => {
        const { gsapManager } = get();
        return gsapManager.generatePerformanceReport();
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