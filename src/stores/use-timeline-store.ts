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
  currentSceneId: string | null;
  
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
  // Scene management
  setCurrentScene: (sceneId: string) => void;
  loadSceneTimeline: (sceneId: string, timelineData: any) => void;
  saveCurrentSceneTimeline: () => any;
  
  // Playback controls
  play: () => void;
  pause: () => void;
  stop: () => void;
  seek: (time: number) => void;
  seekToTime: (time: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  getGlobalTime: () => number;
  getTotalProjectDuration: () => number;
  
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

export const useTimelineStore: any = create<TimelineStore>()(
  (set, get) => ({
      // Initial state
      tracks: [],
      elements: [],
      groups: [],
      currentSceneId: null,
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

      // Scene management
      setCurrentScene: (sceneId: string) => {
        set(produce((state) => {
          state.currentSceneId = sceneId;
        }));
      },

      loadSceneTimeline: (sceneId: string, timelineData: any) => {
        set(produce((state) => {
          state.currentSceneId = sceneId;
          // For now, we'll just set the elements and groups.
          // In a real app, you'd deserialize the timelineData into tracks, elements, groups.
          state.elements = timelineData.elements || [];
          state.groups = timelineData.groups || [];
          // Clear and reload animation states for the loaded scene
          state.animationStates.clear();
          state.elements.forEach((element: AnimatedCanvasObject) => {
            element.animations.forEach((animation: ElementAnimation) => {
              const effectiveDuration = calculateEffectiveDuration(animation);
              state.animationStates.set(animation.id, {
                baseDuration: animation.duration,
                repeat: animation.repeat,
                repeatDelay: animation.repeatDelay,
                yoyo: animation.yoyo,
                effectiveDuration,
                effectiveEndTime: animation.startTime + effectiveDuration
              });
            });
          });
          state.groups.forEach((group: CanvasGroup) => {
            group.animations.forEach((animation: ElementAnimation) => {
              const effectiveDuration = calculateEffectiveDuration(animation);
              state.animationStates.set(animation.id, {
                baseDuration: animation.duration,
                repeat: animation.repeat,
                repeatDelay: animation.repeatDelay,
                yoyo: animation.yoyo,
                effectiveDuration,
                effectiveEndTime: animation.startTime + effectiveDuration
              });
            });
          });
        }));
        get().updateTracks();
        try { useProjectStore.getState().scheduleAutosave(); } catch {}
      },

      saveCurrentSceneTimeline: () => {
        const sceneId = get().currentSceneId;
        if (!sceneId) {
          console.warn('Cannot save timeline: no scene ID set.');
          return;
        }
      },

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
        const projectStore = useProjectStore.getState();
        
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
        
        // Reset to first scene when stopping
        if (projectStore.currentSceneIndex !== 0) {
          projectStore.switchToScene(0);
        }
      },

      seek: (time: number) => {
        const { gsapManager } = get();
        const projectStore = useProjectStore.getState();
        const allScenes = projectStore.scenes;
        
        // Calculate which scene this time belongs to
        let targetSceneIndex = 0;
        let accumulatedTime = 0;
        let sceneLocalTime = time;
        
        for (let i = 0; i < allScenes.length; i++) {
          const sceneDuration = allScenes[i].sceneCanvas.timeline?.duration || 0;
          
          if (accumulatedTime + sceneDuration > time) {
            targetSceneIndex = i;
            sceneLocalTime = time - accumulatedTime;
            break;
          }
          
          accumulatedTime += sceneDuration;
          
          // If this is the last scene, stay on it
          if (i === allScenes.length - 1) {
            targetSceneIndex = i;
            sceneLocalTime = Math.min(time - accumulatedTime, sceneDuration);
          }
        }
        
        // Switch to target scene if different from current
        const currentSceneIndex = projectStore.currentSceneIndex;
        if (targetSceneIndex !== currentSceneIndex) {
          try {
            // Stop current playback
            const wasPlaying = get().playback.isPlaying;
            if (wasPlaying) {
              get().pause();
            }
            
            // Switch scene
            projectStore.switchToScene(targetSceneIndex);
            
            // Wait for scene switch to complete, then seek within the scene
            setTimeout(() => {
              const newTimelineStore = useTimelineStore.getState();
              
              // Update local time within the scene
              const clampedSceneTime = Math.max(0, sceneLocalTime);
              newTimelineStore.set(produce((state: TimelineStoreState & TimelineStoreActions & TimelineStoreActionsExtended) => {
                state.playback.currentTime = clampedSceneTime;
              }));
              
              // Use the robust seek method for all time updates to ensure proper visual state
              // Only seek if the scene has animations (duration > 0)
              const currentSceneDuration = newTimelineStore.playback.totalDuration;
              if (currentSceneDuration > 0) {
                newTimelineStore.gsapManager.seekToTime(clampedSceneTime);
              }
              
              // If seeking to time 0, ensure we're in a stopped state
              if (time === 0) {
                newTimelineStore.set(produce((state: TimelineStoreState & TimelineStoreActions & TimelineStoreActionsExtended) => {
                  state.playback.isPlaying = false;
                  state.playback.isPaused = false;
                  state.playback.isStopped = true;
                }));
              }
              
              // Resume playback if it was playing
              if (wasPlaying) {
                newTimelineStore.play();
              }
            }, 50);
            
          } catch (error) {
            console.error('Error seeking across scenes:', error);
          }
        } else {
          // Seeking within current scene
          const clampedTime = Math.max(0, sceneLocalTime);
          
          set(produce((state) => {
            state.playback.currentTime = clampedTime;
          }));
          
          // Use the robust seek method for all time updates to ensure proper visual state
          // Only seek if the scene has animations (duration > 0)
          const { playback } = get();
          if (playback.totalDuration > 0) {
            gsapManager.seekToTime(clampedTime);
          }
          
          // If seeking to time 0, ensure we're in a stopped state
          if (time === 0) {
            set(produce((state) => {
              state.playback.isPlaying = false;
              state.playback.isPaused = false;
              state.playback.isStopped = true;
            }));
          }
        }
      },

      // Helper function to get current global time across all scenes
      getGlobalTime: () => {
        const { playback } = get();
        const projectStore = useProjectStore.getState();
        const allScenes = projectStore.scenes;
        const currentSceneIndex = projectStore.currentSceneIndex;
        
        // Calculate accumulated time from previous scenes
        let accumulatedTime = 0;
        for (let i = 0; i < currentSceneIndex; i++) {
          accumulatedTime += allScenes[i].sceneCanvas.timeline?.duration || 0;
        }
        
        return accumulatedTime + playback.currentTime;
      },

      // Helper function to get total project duration
      getTotalProjectDuration: (): number => {
        const projectStore = useProjectStore.getState();
        const allScenes = projectStore.scenes;
        
        return allScenes.reduce((total: number, scene: any) => {
          return total + (scene.sceneCanvas.timeline?.duration || 0);
        }, 0);
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
          
          // Always update animation states for all element animations to ensure synchronization
          elements.forEach(element => {
            element.animations.forEach(animation => {
              const effectiveDuration = calculateEffectiveDuration(animation);
              state.animationStates.set(animation.id, {
                baseDuration: animation.duration,
                repeat: animation.repeat,
                repeatDelay: animation.repeatDelay,
                yoyo: animation.yoyo,
                effectiveDuration,
                effectiveEndTime: animation.startTime + effectiveDuration
              });
            });
          });
        }));
        get().updateTracks();
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
      },

      setGroups: (groups: CanvasGroup[]) => {
        set(produce((state) => {
          state.groups = groups;
          
          // Always update animation states for all group animations to ensure synchronization
          groups.forEach(group => {
            group.animations.forEach(animation => {
              const effectiveDuration = calculateEffectiveDuration(animation);
              state.animationStates.set(animation.id, {
                baseDuration: animation.duration,
                repeat: animation.repeat,
                repeatDelay: animation.repeatDelay,
                yoyo: animation.yoyo,
                effectiveDuration,
                effectiveEndTime: animation.startTime + effectiveDuration
              });
            });
          });
        }));
        get().updateTracks();
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
      },

      updateTracks: () => {
        const { elements, groups, timelineManager } = get();
        
        // Skip if elements are empty (might be in transition)
        if (!elements || elements.length === 0) {
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
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
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
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
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
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
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
        
        // Temporarily disable autosave to prevent failed saves from rolling back animation changes
        const projectStore = useProjectStore.getState();
        projectStore.disableAutosave();
        
        // Re-enable autosave after a delay to allow the animation to be properly established
        setTimeout(() => {
          projectStore.enableAutosave();
        }, 2000);
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
        const projectStore = useProjectStore.getState();
        const currentScene = projectStore.getCurrentScene();
        const allScenes = projectStore.scenes;
        const currentSceneIndex = projectStore.currentSceneIndex;
        
        // Calculate total project duration across all scenes
        const totalProjectDuration = allScenes.reduce((total, scene) => {
          return total + (scene.sceneCanvas.timeline?.duration || 0);
        }, 0);
        
        // Calculate current scene's position in the overall timeline
        let sceneStartTime = 0;
        for (let i = 0; i < currentSceneIndex; i++) {
          sceneStartTime += allScenes[i].sceneCanvas.timeline?.duration || 0;
        }
        
        const currentSceneDuration = currentScene?.sceneCanvas.timeline?.duration || 0;
        const globalTime = sceneStartTime + timeState.elapsedTime;

        // First, clamp the reported time to current scene duration for local playback
        const clampedTime = Math.max(0, Math.min(timeState.elapsedTime, currentSceneDuration));

        set(produce((state) => {
          state.playback.isPlaying = timeState.isPlaying;
          state.playback.isPaused = !timeState.isPlaying && globalTime > 0;
          state.playback.isStopped = !timeState.isPlaying && globalTime === 0;
          state.playback.currentTime = clampedTime;
          state.playback.totalDuration = totalProjectDuration; // Update to show total project duration
        }));

        // Check if current scene has ended and we need to transition to next scene
        if (timeState.elapsedTime >= currentSceneDuration) {
          const nextSceneIndex = currentSceneIndex + 1;
          
          if (nextSceneIndex < allScenes.length) {
            // Switch to next scene and continue playing
            try {
              // Stop current scene playback
              timeManager.pause();
              gsapManager.handlePlayback(false, () => {});
              
              // Switch to next scene
              projectStore.switchToScene(nextSceneIndex);
              
              // Reset timeline to beginning of new scene and continue playing
              setTimeout(() => {
                const newTimelineStore = useTimelineStore.getState();
                newTimelineStore.seek(0);
                // Only play if the scene has animations (duration > 0)
                if (newTimelineStore.playback.totalDuration > 0) {
                  newTimelineStore.play();
                }
              }, 50); // Small delay to ensure scene switch is complete
              
            } catch (error) {
              console.error('Error transitioning to next scene:', error);
            }
          } else {
            // Reached end of all scenes, pause everything
            try { timeManager.pause(); } catch {}
            try { gsapManager.handlePlayback(false, () => {}); } catch {}

            // Reflect paused-at-end UI state
            set(produce((state) => {
              state.playback.isPlaying = false;
              state.playback.isPaused = true;
              state.playback.isStopped = false;
              state.playback.currentTime = currentSceneDuration;
            }));
          }
        }
      },

      syncWithGSAP: () => {
        // Called on each tick. Keep GSAP timeline time in sync with store state.
        try {
          const { playback, gsapManager } = get();
          // Only update time if the scene has animations (duration > 0)
          // Also check the GSAP timeline duration to avoid race conditions during scene switching
          if (playback.totalDuration > 0 && gsapManager.getTimelineDuration() > 0) {
            gsapManager.updateTime(playback.currentTime);
          }
        } catch {}
      },

      buildGSAPTimeline: () => {
        const { elements, groups, gsapManager } = get();
        gsapManager.buildAnimationTimeline(elements, groups);
        
        // Update the total duration based on the actual timeline duration
        // This ensures the timeline doesn't stop prematurely when group animations end
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
          
          // Clear and reload animation states with proper validation
          state.animationStates.clear();
          
          // First, load animation states from project data if available
          if (data.animationStates && Object.keys(data.animationStates).length > 0) {
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
          }
          
          // Then, ensure all animations from elements and groups have their states initialized
          // This handles cases where animationStates might be missing or incomplete
          state.elements.forEach((element: AnimatedCanvasObject) => {
            element.animations.forEach((animation: ElementAnimation) => {
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
          
          state.groups.forEach((group: CanvasGroup) => {
            group.animations.forEach((animation: ElementAnimation) => {
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
          
          // Update timeline UI
          state.ui.scale = data.scale || 1;
          state.playback.currentTime = data.currentTime || 0;
          
          // Recalculate duration based on loaded animations
          // If the loaded duration is 0 or not specified, calculate from animations
          if (data.duration === 0 || data.duration === undefined) {
            let maxEndTime = 0;
            
            // Check element animations
            state.elements.forEach((element: AnimatedCanvasObject) => {
              if (!element.isAnimationPath && element.animations && element.animations.length > 0) {
                element.animations.forEach((animation: ElementAnimation) => {
                  const endTime = animation.startTime + animation.duration;
                  maxEndTime = Math.max(maxEndTime, endTime);
                });
              }
            });
            
            // Check group animations
            state.groups.forEach((group: CanvasGroup) => {
              if (!group.isDefaultGroup && group.animations && group.animations.length > 0) {
                group.animations.forEach((animation: ElementAnimation) => {
                  const endTime = animation.startTime + animation.duration;
                  maxEndTime = Math.max(maxEndTime, endTime);
                });
              }
            });
            
            state.playback.totalDuration = maxEndTime;
          } else {
            state.playback.totalDuration = data.duration;
          }
        }));
        
        // Update tracks and rebuild timeline
        // Note: Don't call updateTracks() here since elements/groups are already set
        // Just rebuild the GSAP timeline directly
        get().buildGSAPTimeline();
      },
    })
);

// Selector hooks for optimized access to specific parts of the store
export const useTimelinePlayback = () => {
  return useTimelineStore(useShallow((state: any) => ({
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
  return useTimelineStore(useShallow((state: any) => ({
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
  return useTimelineStore(useShallow((state: any) => ({
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
  return useTimelineStore(useShallow((state: any) => {
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
  return useTimelineStore(useShallow((state: any) => ({
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
  return useTimelineStore(useShallow((state: any) => ({
    exportTimeline: state.exportTimeline,
    importTimeline: state.importTimeline,
    resetTimeline: state.resetTimeline,
    getTimeAtPosition: state.getTimeAtPosition,
    getPositionAtTime: state.getPositionAtTime,
    seekToTime: state.seekToTime,
  })));
};