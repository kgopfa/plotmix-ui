import { create } from 'zustand';
import { produce } from 'immer';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { DiffPatcher } from 'jsondiffpatch';
import { apiClient } from '@/lib/api-client';
import { useUIStore } from '@/stores/use-ui-store';
import { isAutosaveEnabled, getConfig } from '@/lib/config';
import type { ProjectScene, ProjectDimensions, MultiSceneProjectData } from '@/types/project';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface ProjectInfo {
  projectId: string | null;
  name: string;
  title?: string;
  version: string;
}

interface ProjectStoreState extends ProjectInfo {
  baselineMainState: Record<string, unknown> | null;
  lastSavedAt: string | null;
  saveStatus: SaveStatus;
  autosaveTimer: number | null;
  autosaveDelayMs: number;
  // Multi-scene support
  scenes: ProjectScene[];
  dimensions: ProjectDimensions | null;
  currentSceneIndex: number;
}

interface ProjectStoreActions {
  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  captureBaseline: () => void;
  setBaseline: (state: Record<string, unknown> | null) => void;
  getCurrentMainState: () => Record<string, unknown>;
  getDiffFromBaseline: () => Record<string, unknown> | null;
  setVersion: (version: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
  persistIfDirty: (actionDescription?: string) => Promise<boolean>;
  scheduleAutosave: () => void;
  setAutosaveDelay: (ms: number) => void;
  disableAutosave: () => void;
  enableAutosave: () => void;
  forceFullSave: () => Promise<boolean>;
  checkStateDiff: (stateToCheck: Record<string, unknown>) => boolean;
  getStateDiff: (stateToCheck: Record<string, unknown>) => Record<string, unknown> | null;
  // Multi-scene actions
  setScenes: (scenes: ProjectScene[], dimensions: ProjectDimensions) => void;
  addScene: (scene: ProjectScene) => void;
  removeScene: (sceneId: string) => void;
  updateScene: (sceneId: string, updates: Partial<ProjectScene>) => void;
  switchToScene: (sceneIndex: number) => void;
  getCurrentScene: () => ProjectScene | null;
  getSceneCount: () => number;
  getDimensions: () => ProjectDimensions | null;
}

type ProjectStore = ProjectStoreState & ProjectStoreActions;

export const useProjectStore = create<ProjectStore>()(
  (set, get) => ({
    // Initial state
    projectId: null,
    name: 'Project',
    title: undefined,
    version: '1.0.0',
    baselineMainState: null,
    lastSavedAt: null,
    saveStatus: 'idle',
    autosaveTimer: null,
    autosaveDelayMs: getConfig('autosave').delayMs,
    // Multi-scene initial state
    scenes: [],
    dimensions: null,
    currentSceneIndex: 0,

    setProjectInfo: (info) => {
      set(produce((state: ProjectStore) => {
        if (typeof info.projectId !== 'undefined') state.projectId = info.projectId;
        if (typeof info.name !== 'undefined') state.name = info.name;
        if (typeof info.title !== 'undefined') state.title = info.title;
        if (typeof info.version !== 'undefined') state.version = info.version;
      }));
    },

    captureBaseline: () => {
      const current = get().getCurrentMainState();
      const deepCopy = JSON.parse(JSON.stringify(current));
      set(produce((state: ProjectStore) => {
        state.baselineMainState = deepCopy;
        state.lastSavedAt = new Date().toISOString();
      }));
    },

    setBaseline: (stateObj) => {
      if (!stateObj) {
        console.error('Invalid mainState format: null or undefined state');
        return;
      }
      
      // BREAKING CHANGE: Only accept new multi-scene format
      const hasNewFormat = stateObj.dimensions && Array.isArray(stateObj.scenes);
      const hasLegacyFormat = Array.isArray(stateObj.elements) && Array.isArray(stateObj.groups);
      
      if (hasLegacyFormat && !hasNewFormat) {
        throw new Error(
          'LEGACY FORMAT DETECTED: This project uses the old single-scene format. ' +
          'Expected new multi-scene format: { dimensions: {...}, scenes: [...] }. ' +
          'Legacy format is no longer supported.'
        );
      }
      
      if (!hasNewFormat) {
        console.error('Invalid mainState format: Expected {dimensions, scenes} structure');
        return;
      }
      
      const deepCopy = JSON.parse(JSON.stringify(stateObj));
      set(produce((state: ProjectStore) => {
        state.baselineMainState = deepCopy;
        // Also update internal scene state
        if (deepCopy.dimensions) {
          state.dimensions = deepCopy.dimensions;
        }
        if (Array.isArray(deepCopy.scenes)) {
          state.scenes = deepCopy.scenes;
        }
      }));
    },

    getCurrentMainState: () => {
      const canvas = useCanvasStore.getState();
      const timeline = useTimelineStore.getState();
      const { scenes, dimensions, currentSceneIndex } = get();

      // Return NEW multi-scene format: {dimensions, scenes}
      const currentScene = scenes[currentSceneIndex];
      if (!currentScene) {
        // Fallback: create a default scene from current canvas state
        return {
          dimensions: dimensions || { width: 1920, height: 1080 },
          scenes: [{
            sceneId: 'scene-1',
            sceneName: 'Scene 1',
            sceneCanvas: {
              elements: canvas.elements,
              groups: canvas.groups,
              timeline: {
                scale: timeline.ui.scale,
                duration: timeline.playback.totalDuration,
                currentTime: timeline.playback.currentTime,
                animationStates: Object.fromEntries(timeline.animationStates as unknown as Iterable<readonly [PropertyKey, unknown]>) as Record<string, any>,
              }
            }
          }]
        };
      }

      // Update current scene with latest canvas/timeline state
      const updatedScenes = [...scenes];
      updatedScenes[currentSceneIndex] = {
        ...currentScene,
        sceneCanvas: {
          elements: canvas.elements,
          groups: canvas.groups,
          timeline: {
            scale: timeline.ui.scale,
            duration: timeline.playback.totalDuration,
            currentTime: timeline.playback.currentTime,
            animationStates: Object.fromEntries(timeline.animationStates as unknown as Iterable<readonly [PropertyKey, unknown]>) as Record<string, any>,
          }
        }
      };

      return {
        dimensions: dimensions || { width: 1920, height: 1080 },
        scenes: updatedScenes
      };
    },

    getDiffFromBaseline: () => {
      const baseline = get().baselineMainState;
      const current = get().getCurrentMainState();
      if (!baseline) return null;
      
      // Fast equality check
      const baselineStr = JSON.stringify(baseline ?? {});
      const currentStr = JSON.stringify(current ?? {});
      if (baselineStr === currentStr) return null;

      // Robust diff with objectHash and move detection
      const robustPatcher = new DiffPatcher({
        objectHash: (obj: any) => obj?.id ?? JSON.stringify(obj),
        arrays: { detectMove: true, includeValueOnMove: false }
      } as any);
      let delta = robustPatcher.diff(baseline ?? {}, current);

      // Last resort: snapshot diff to force persistence
      if (!delta) {
        const snapshotPatcher = new DiffPatcher();
        delta = snapshotPatcher.diff({}, current);
      }
      return delta || null;
    },

    setVersion: (version: string) => {
      set(produce((state: ProjectStore) => {
        state.version = version;
      }));
    },

    setSaveStatus: (status: SaveStatus) => {
      set(produce((state: ProjectStore) => {
        state.saveStatus = status;
      }));
    },

    // Persist if there are changes compared to baseline
    persistIfDirty: async (actionDescription = 'Autosave edits') => {
      const { projectId } = get();
      if (!projectId) return false;
      try {
        const diff = get().getDiffFromBaseline();
        const baseline = get().baselineMainState;
        const current = get().getCurrentMainState();
        const hasChanges = JSON.stringify(baseline ?? {}) !== JSON.stringify(current ?? {});
        if (!diff && !hasChanges) {
          return false;
        }

        set(produce((state: ProjectStore) => { state.saveStatus = 'saving'; }));

        if (diff) {
          const response = await apiClient.post<any>(`/api/projects/${projectId}/changes`, {
            diff,
            actionDescription,
          });
          // Update baseline and version
          get().captureBaseline();
          set(produce((state: ProjectStore) => {
            state.version = response.data.project.version;
            state.saveStatus = 'success';
          }));
        } else if (hasChanges) {
          // Fallback: PUT full mainState if no diff object could be generated
          const response = await apiClient.put<any>(`/api/projects/${projectId}`, { mainState: current });
          get().captureBaseline();
          set(produce((state: ProjectStore) => {
            state.version = response.data.project.version;
            state.saveStatus = 'success';
          }));
        }

        // Also save UI configuration (including snapping preferences)
        try {
          const uiStore = useUIStore.getState();
          const configuration = {
            canvas: uiStore.canvas,
            ui: {
              zoom: uiStore.canvasZoom,
              selectedElements: [], // These change frequently, don't persist
              selectedGroups: [],   // These change frequently, don't persist
              panelState: uiStore.panels,
              toolState: uiStore.tools,
            },
            editor: {
              selectedShape: undefined, // Don't persist current selection
              snappingEnabled: uiStore.snapping.elementSnapConfig.enabled,
              gridEnabled: uiStore.snapping.gridConfig.enabled,
              gridSize: uiStore.snapping.gridConfig.size,
              showGuides: uiStore.snapping.elementSnapConfig.showGuides,
              snapping: {
                grid: uiStore.snapping.gridConfig,
                elements: uiStore.snapping.elementSnapConfig,
              },
            },
            animation: {
              playbackRate: 1, // Default values
              isLooping: false,
              autoPlay: false,
            },
          };

          await apiClient.put<any>(`/api/projects/${projectId}`, { configuration });
        } catch (configError) {
          console.warn('Failed to save UI configuration:', configError);
          // Don't fail the save if configuration save fails
        }

        // Reset save status back to idle shortly
        setTimeout(() => {
          set(produce((state: ProjectStore) => { state.saveStatus = 'idle'; }));
        }, 1500);
        return true;
      } catch (e) {
        console.error('Persist failed', e);
        set(produce((state: ProjectStore) => { state.saveStatus = 'error'; }));
        setTimeout(() => {
          set(produce((state: ProjectStore) => { state.saveStatus = 'idle'; }));
        }, 2000);
        return false;
      }
    },

    scheduleAutosave: () => {
      // Check if auto-save is enabled from environment variable
      const autoSaveEnabled = process.env.NEXT_PUBLIC_AUTOSAVE_ENABLED !== 'false';
      if (!autoSaveEnabled) {
        return; // Don't schedule auto-save if it's disabled
      }

      const { autosaveTimer } = get();
      if (autosaveTimer) {
        clearTimeout(autosaveTimer as unknown as number);
      }
      
      // Use the interval from UI preferences, with fallback to default
      const uiStore = useUIStore.getState();
      const intervalMs = (uiStore.preferences.autoSaveInterval || 30) * 1000;
      
      const timerId = setTimeout(() => {
        get().persistIfDirty('Autosave edits');
      }, intervalMs) as unknown as number;
      set(produce((state: ProjectStore) => {
        state.autosaveTimer = timerId;
      }));
    },

    setAutosaveDelay: (ms: number) => {
      set(produce((state: ProjectStore) => {
        state.autosaveDelayMs = Math.max(300, Math.min(ms, 10000));
      }));
    },

    // Temporarily disable autosave to prevent failed saves from rolling back changes
    disableAutosave: () => {
      set(produce((state: ProjectStore) => {
        if (state.autosaveTimer) {
          clearTimeout(state.autosaveTimer as unknown as number);
          state.autosaveTimer = null;
        }
        state.autosaveDelayMs = 0; // Set to 0 to effectively disable
      }));
    },

    // Re-enable autosave with default delay
    enableAutosave: () => {
      set(produce((state: ProjectStore) => {
        state.autosaveDelayMs = getConfig('autosave').delayMs; // Restore default delay from config
      }));
    },

    // Force a full project save (bypasses incremental changes)
    forceFullSave: async () => {
      const { projectId } = get();
      if (!projectId) return false;
      
      try {
        set(produce((state: ProjectStore) => { state.saveStatus = 'saving'; }));
        
        const current = get().getCurrentMainState();
        const response = await apiClient.put<any>(`/api/projects/${projectId}`, { mainState: current });
        
        // Update baseline and version
        get().captureBaseline();
        set(produce((state: ProjectStore) => {
          state.version = response.data.project.version;
          state.saveStatus = 'success';
        }));
        

        return true;
      } catch (e) {
        console.error('Full project save failed', e);
        set(produce((state: ProjectStore) => { state.saveStatus = 'error'; }));
        setTimeout(() => {
          set(produce((state: ProjectStore) => { state.saveStatus = 'idle'; }));
        }, 2000);
        return false;
      }
    },

    // Reusable function to check if a given state differs from baseline
    // This can be used by other components (like scripts page) to check dirty state
    checkStateDiff: (stateToCheck: Record<string, unknown>): boolean => {
      const baseline = get().baselineMainState;
      if (!baseline) return true; // If no baseline, consider it different
      
      // Fast equality check
      const baselineStr = JSON.stringify(baseline);
      const checkStr = JSON.stringify(stateToCheck);
      if (baselineStr === checkStr) return false;
      
      // Use the same robust diffing logic as getDiffFromBaseline
      const robustPatcher = new DiffPatcher({
        objectHash: (obj: any) => obj?.id ?? JSON.stringify(obj),
        arrays: { detectMove: true, includeValueOnMove: false }
      } as any);
      
      const delta = robustPatcher.diff(baseline, stateToCheck);
      return delta !== null;
    },

    // Reusable function to get diff between baseline and a given state
    // Returns the diff delta that can be used for versioning
    getStateDiff: (stateToCheck: Record<string, unknown>): Record<string, unknown> | null => {
      const baseline = get().baselineMainState;
      if (!baseline) return null;
      
      // Fast equality check
      const baselineStr = JSON.stringify(baseline);
      const checkStr = JSON.stringify(stateToCheck);
      if (baselineStr === checkStr) return null;
      
      // Use the same robust diffing logic as getDiffFromBaseline
      const robustPatcher = new DiffPatcher({
        objectHash: (obj: any) => obj?.id ?? JSON.stringify(obj),
        arrays: { detectMove: true, includeValueOnMove: false }
      } as any);
      
      let delta = robustPatcher.diff(baseline, stateToCheck);
      
      // Last resort: snapshot diff to force persistence
      if (!delta) {
        const snapshotPatcher = new DiffPatcher();
        delta = snapshotPatcher.diff({}, stateToCheck);
      }
      
      return delta || null;
    },

    // Multi-scene actions
    setScenes: (scenes, dimensions) => {
      set(produce((state: ProjectStore) => {
        state.scenes = scenes;
        state.dimensions = dimensions;
        state.currentSceneIndex = 0;
      }));
    },

    addScene: (scene) => {
      set(produce((state: ProjectStore) => {
        state.scenes.push(scene);
      }));
    },

    removeScene: (sceneId) => {
      set(produce((state: ProjectStore) => {
        const index = state.scenes.findIndex(s => s.sceneId === sceneId);
        if (index !== -1) {
          state.scenes.splice(index, 1);
          // Adjust current scene index if needed
          if (state.currentSceneIndex >= state.scenes.length) {
            state.currentSceneIndex = Math.max(0, state.scenes.length - 1);
          }
        }
      }));
    },

    updateScene: (sceneId, updates) => {
      set(produce((state: ProjectStore) => {
        const index = state.scenes.findIndex(s => s.sceneId === sceneId);
        if (index !== -1) {
          Object.assign(state.scenes[index], updates);
        }
      }));
    },

    switchToScene: (sceneIndex) => {
      const { scenes } = get();
      if (sceneIndex >= 0 && sceneIndex < scenes.length) {
        set(produce((state: ProjectStore) => {
          state.currentSceneIndex = sceneIndex;
        }));
        
        // Load the scene data into canvas and timeline stores
        const scene = scenes[sceneIndex];
        const canvasStore = useCanvasStore.getState();
        const timelineStore = useTimelineStore.getState();
        
        canvasStore.loadSceneData(
          scene.sceneId,
          scene.sceneCanvas.elements,
          scene.sceneCanvas.groups
        );
        
        timelineStore.loadProjectData({
          elements: scene.sceneCanvas.elements,
          groups: scene.sceneCanvas.groups,
          animationStates: scene.sceneCanvas.timeline.animationStates || {},
          scale: scene.sceneCanvas.timeline.scale || 1,
          duration: scene.sceneCanvas.timeline.duration || 10,
          currentTime: scene.sceneCanvas.timeline.currentTime || 0,
        });
      }
    },

    getCurrentScene: () => {
      const { scenes, currentSceneIndex } = get();
      return scenes[currentSceneIndex] || null;
    },

    getSceneCount: () => {
      return get().scenes.length;
    },

    getDimensions: () => {
      return get().dimensions;
    }
  })
);


