import { create } from 'zustand';
import { produce, enableMapSet } from 'immer';
import { useShallow } from 'zustand/react/shallow';
import { TimeManager, TimeManagerState } from '@/lib/time-manager';
import { TimelineManagerV2 } from '@/lib/timeline-manager-v2';
import { GSAPTimelineManagerV2 } from '@/lib/gsap-timeline-manager-v2';
import { AnimatedCanvasObject, CanvasGroup, ElementAnimation, TimelineAnimation } from '@/types/canvas';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { MAX_SCENE_DURATION } from '@/types/project';

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
  scale: number;
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
  // Core timeline data - NEW STRUCTURE
  timelineAnimations: TimelineAnimation[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  currentSceneId: string | null;
  
  // Playback state
  playback: PlaybackState;
  
  // UI state
  ui: TimelineUIState;
  
  // Timeline managers
  timeManager: TimeManager;
  gsapManager: GSAPTimelineManagerV2;
  timelineManager: TimelineManagerV2;
  
  // Real-time subscription state
  subscriptions: {
    timeManager: (() => void) | null;
    timelineManager: (() => void) | null;
    canvasStore: (() => void) | null;
  };
  
  // Loading and error state
  isLoading: boolean;
  error: string | null;
}

interface TimelineStoreActions {
  // Scene management
  setCurrentScene: (sceneId: string) => void;
  loadSceneTimeline: (sceneId: string, timelineData: unknown) => void;
  saveCurrentSceneTimeline: () => unknown;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekToTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  
  // Timeline data management - NEW STRUCTURE
  setTimelineAnimations: (animations: TimelineAnimation[]) => void;
  setElements: (elements: AnimatedCanvasObject[]) => void;
  setGroups: (groups: CanvasGroup[]) => void;
  updateTracks: () => void;
  
  // Animation management - NEW STRUCTURE
  addTimelineAnimation: (animation: TimelineAnimation) => void;
  updateTimelineAnimation: (animationId: string, updates: Partial<TimelineAnimation>) => void;
  removeTimelineAnimation: (animationId: string) => void;
  duplicateTimelineAnimation: (animationId: string) => void;
  
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
  clearSelection: () => void;
    loadProjectData: (data: {
      elements: AnimatedCanvasObject[];
      groups: CanvasGroup[];
      timelineAnimations?: TimelineAnimation[];
      animationStates?: Record<string, any>;
      scale?: number;
      duration?: number;
      currentTime?: number;
    }) => void;
  
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
  getTimelineAnimationById: (animationId: string) => TimelineAnimation | undefined;
  getTotalDuration: () => number;
  getTimeAtPosition: (position: number) => number;
  getPositionAtTime: (time: number) => number;
}

type TimelineStoreV2 = TimelineStoreState & TimelineStoreActions;

const initialPlaybackState: PlaybackState = {
  isPlaying: false,
  isPaused: false,
  isStopped: true,
  currentTime: 0,
  totalDuration: MAX_SCENE_DURATION,
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
  gridSize: 1,
};

export const useTimelineStoreV2 = create<TimelineStoreV2>()(
  (set, get) => ({
    // Initial state
    timelineAnimations: [],
    elements: [],
    groups: [],
    currentSceneId: null,
    playback: initialPlaybackState,
    ui: initialUIState,
    timeManager: TimeManager.getInstance(),
    gsapManager: new GSAPTimelineManagerV2(),
    timelineManager: TimelineManagerV2.getInstance(),
    subscriptions: {
      timeManager: null,
      timelineManager: null,
      canvasStore: null,
    },
    isLoading: false,
    error: null,

    // Scene management
    setCurrentScene: (sceneId: string) => {
      set(produce((state) => {
        state.currentSceneId = sceneId;
      }));
    },

    loadSceneTimeline: (sceneId: string, timelineData: any) => {
      set(produce((state) => {
        state.currentSceneId = sceneId;
        state.elements = timelineData.elements || [];
        state.groups = timelineData.groups || [];
        state.timelineAnimations = timelineData.timeline || [];
        state.playback = timelineData.playback || initialPlaybackState;
      }));
      get().updateTracks();
    },

    saveCurrentSceneTimeline: () => {
      const sceneId = get().currentSceneId;
      if (!sceneId) {
        console.warn('Cannot save timeline: no scene ID set.');
        return;
      }
      return {
        elements: get().elements,
        groups: get().groups,
        timeline: get().timelineAnimations,
        playback: get().playback
      };
    },

    // Playback controls
    play: () => {
      const { timeManager, gsapManager } = get();
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
      gsapManager.stop();
    },

    seek: (time: number) => {
      const { gsapManager } = get();
      const clampedTime = Math.max(0, Math.min(time, get().playback.totalDuration));
      
      set(produce((state) => {
        state.playback.currentTime = clampedTime;
      }));
      
      gsapManager.seekToTime(clampedTime);
      
      if (clampedTime === 0) {
        set(produce((state) => {
          state.playback.isPlaying = false;
          state.playback.isPaused = false;
          state.playback.isStopped = true;
        }));
      }
    },

    seekToTime: (time: number) => {
      get().seek(time);
    },

    setPlaybackSpeed: (speed: number) => {
      set(produce((state) => {
        state.playback.playbackSpeed = Math.max(0.1, Math.min(speed, 4));
      }));
    },

    // Timeline data management - NEW STRUCTURE
    setTimelineAnimations: (animations: TimelineAnimation[]) => {
      set(produce((state) => {
        state.timelineAnimations = animations;
      }));
      get().updateTracks();
    },

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
      const { timelineAnimations, elements, groups, timelineManager } = get();
      
      if (!elements || elements.length === 0) {
        return;
      }
      
      timelineManager.setTimelineAnimations(timelineAnimations, elements, groups);
      const timelineState = timelineManager.getState();
      
      set(produce((state) => {
        state.playback.totalDuration = timelineState.duration;
        state.ui.scale = timelineState.scale;
      }));
      
      get().buildGSAPTimeline();
    },

    // Animation management - NEW STRUCTURE
    addTimelineAnimation: (animation: TimelineAnimation) => {
      set(produce((state) => {
        state.timelineAnimations.push(animation);
      }));
      get().updateTracks();
    },

    updateTimelineAnimation: (animationId: string, updates: Partial<TimelineAnimation>) => {
      set(produce((state) => {
        const index = state.timelineAnimations.findIndex((anim: TimelineAnimation) => anim.id === animationId);
        if (index >= 0) {
          state.timelineAnimations[index] = { ...state.timelineAnimations[index], ...updates };
        }
      }));
      get().updateTracks();
    },

    removeTimelineAnimation: (animationId: string) => {
      set(produce((state) => {
        state.timelineAnimations = state.timelineAnimations.filter((anim: TimelineAnimation) => anim.id !== animationId);
        state.ui.selectedAnimationIds.delete(animationId);
      }));
      get().updateTracks();
    },

    duplicateTimelineAnimation: (animationId: string) => {
      set(produce((state) => {
        const sourceAnimation = state.timelineAnimations.find((anim: TimelineAnimation) => anim.id === animationId);
        if (sourceAnimation) {
          const duplicatedAnimation: TimelineAnimation = {
            ...sourceAnimation,
            id: crypto.randomUUID(),
            startAt: sourceAnimation.startAt + 2, // Offset by 2 seconds
            tracks: sourceAnimation.tracks.map((track: ElementAnimation) => ({
              ...track,
              id: crypto.randomUUID(),
              startTime: track.startTime + 2
            }))
          };
          state.timelineAnimations.push(duplicatedAnimation);
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

    loadProjectData: (data) => {
      set(produce((state) => {
        state.elements = data.elements;
        state.groups = data.groups;
        if (data.timelineAnimations !== undefined) {
          state.timelineAnimations = data.timelineAnimations;
        }
        if (data.scale !== undefined) {
          state.playback.scale = data.scale;
        }
        if (data.duration !== undefined) {
          state.playback.duration = data.duration;
        }
        if (data.currentTime !== undefined) {
          state.playback.currentTime = data.currentTime;
        }
      }));
      
      get().updateTracks();
      
      const { gsapManager, playback } = get();
      if (gsapManager && playback.currentTime >= 0) {
        gsapManager.seekToTime(playback.currentTime);
      }
    },

    // Real-time synchronization
    initializeSubscriptions: () => {
      const { timeManager, timelineManager, syncWithTimeManager } = get();
      
      get().cleanupSubscriptions();
      
      set(produce((state) => {
        state.subscriptions.timeManager = timeManager.subscribe((timeState) => {
          syncWithTimeManager(timeState);
        });
        
        state.subscriptions.timelineManager = timelineManager.subscribe((timelineState) => {
          set(produce((state) => {
            state.playback.totalDuration = timelineState.duration;
            if (state.ui.scale !== timelineState.scale) {
              state.ui.scale = timelineState.scale;
            }
          }));
        });
      }));
      
      const canvasStore = useCanvasStore.getState();
      const unsubscribeCanvas = canvasStore.subscribe((canvasState) => {
        const timelineStore = get();
        timelineStore.setElements(canvasState.elements);
        timelineStore.setGroups(canvasState.groups);
      });
      
      set(produce((state) => {
        state.subscriptions.canvasStore = unsubscribeCanvas;
      }));
    },

    cleanupSubscriptions: () => {
      const { subscriptions } = get();
      
      if (subscriptions.timeManager) subscriptions.timeManager();
      if (subscriptions.timelineManager) subscriptions.timelineManager();
      if (subscriptions.canvasStore) subscriptions.canvasStore();
      
      set(produce((state) => {
        state.subscriptions.timeManager = null;
        state.subscriptions.timelineManager = null;
        state.subscriptions.canvasStore = null;
      }));
    },

    syncWithTimeManager: (timeState: TimeManagerState) => {
      const { playback, timeManager, gsapManager } = get();
      
      set(produce((state) => {
        state.playback.isPlaying = timeState.isPlaying;
        state.playback.isPaused = !timeState.isPlaying && timeState.elapsedTime > 0;
        state.playback.isStopped = !timeState.isPlaying && timeState.elapsedTime === 0;
        state.playback.currentTime = Math.max(0, Math.min(timeState.elapsedTime, playback.totalDuration));
      }));

      if (timeState.elapsedTime >= playback.totalDuration) {
        try {
          timeManager.pause();
          gsapManager.handlePlayback(false, () => {});
          
          set(produce((state) => {
            state.playback.isPlaying = false;
            state.playback.isPaused = true;
            state.playback.isStopped = false;
            state.playback.currentTime = playback.totalDuration;
          }));
        } catch (error) {
          console.error('Error handling timeline end:', error);
        }
      }
    },

    syncWithGSAP: () => {
      try {
        const { playback, gsapManager } = get();
        if (playback.totalDuration > 0 && gsapManager.getTimelineDuration() > 0) {
          gsapManager.updateTime(playback.currentTime);
        }
      } catch {}
    },

    buildGSAPTimeline: () => {
      const { timelineAnimations, elements, groups, gsapManager } = get();
      gsapManager.buildAnimationTimeline(timelineAnimations, elements, groups);
      
      const timelineDuration = gsapManager.getTimelineDuration();
      if (timelineDuration > 0) {
        set(produce((state) => {
          state.playback.totalDuration = Math.max(10, timelineDuration);
        }));
      }
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
        state.timelineAnimations = [];
        state.elements = [];
        state.groups = [];
        state.playback = { ...initialPlaybackState };
        state.ui = { ...initialUIState };
        state.error = null;
      }));
      
      const { clearSelections } = useSelectionStore.getState();
      clearSelections();
      
      get().buildGSAPTimeline();
    },

    // Utility functions
    getTimelineAnimationById: (animationId: string) => {
      const { timelineAnimations } = get();
      return timelineAnimations.find(anim => anim.id === animationId);
    },

    getTotalDuration: () => {
      const { timelineAnimations } = get();
      let maxDuration = 0;
      
      timelineAnimations.forEach(anim => {
        anim.tracks.forEach(track => {
          const endTime = track.startTime + track.duration;
          maxDuration = Math.max(maxDuration, endTime);
        });
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
    }
  })
);

// Selector hooks for optimized access
export const useTimelinePlaybackV2 = () => {
  return useTimelineStoreV2(useShallow((state) => ({
    playback: state.playback,
    play: state.play,
    pause: state.pause,
    stop: state.stop,
    seek: state.seek,
    seekToTime: state.seekToTime,
    setPlaybackSpeed: state.setPlaybackSpeed,
  })));
};

export const useTimelineAnimationsV2 = () => {
  return useTimelineStoreV2(useShallow((state) => ({
    timelineAnimations: state.timelineAnimations,
    addTimelineAnimation: state.addTimelineAnimation,
    updateTimelineAnimation: state.updateTimelineAnimation,
    removeTimelineAnimation: state.removeTimelineAnimation,
    duplicateTimelineAnimation: state.duplicateTimelineAnimation,
    getTimelineAnimationById: state.getTimelineAnimationById,
    seekToTime: state.seekToTime,
  })));
};

export const useTimelineDataV2 = () => {
  return useTimelineStoreV2(useShallow((state) => ({
    elements: state.elements,
    groups: state.groups,
    timelineAnimations: state.timelineAnimations,
    setElements: state.setElements,
    setGroups: state.setGroups,
    setTimelineAnimations: state.setTimelineAnimations,
    updateTracks: state.updateTracks,
    getTotalDuration: state.getTotalDuration,
    seekToTime: state.seekToTime,
  })));
};

// Export aliases for compatibility with existing code
export const useTimelineSync = useTimelineStoreV2;
export const useTimelineOperations = useTimelineStoreV2;
export const useTimelinePlayback = useTimelinePlaybackV2;
export const useTimelineTracks = useTimelineAnimationsV2;
