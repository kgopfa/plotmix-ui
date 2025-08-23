import { create } from 'zustand';
import { produce } from 'immer';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useSceneStore } from '@/stores/use-scene-store';
import { DiffPatcher } from 'jsondiffpatch';
import { apiClient } from '@/lib/api-client';
import { useUIStore } from '@/stores/use-ui-store';

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
  forceFullSave: () => Promise<boolean>;
  checkStateDiff: (stateToCheck: Record<string, unknown>) => boolean;
  getStateDiff: (stateToCheck: Record<string, unknown>) => Record<string, unknown> | null;
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
      autosaveDelayMs: 1200,

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
      // Validate that the state object uses the new schema format
      if (!stateObj || !stateObj.scenes || !Array.isArray(stateObj.scenes)) {
        console.error('Invalid mainState format: missing scenes array');
        return;
      }
      
      const deepCopy = JSON.parse(JSON.stringify(stateObj));
      set(produce((state: ProjectStore) => {
        state.baselineMainState = deepCopy;
      }));
      
      // Update the scene store with scene data
      if (stateObj && 'scenes' in stateObj && 'activeSceneId' in stateObj) {
        const sceneStore = useSceneStore.getState();
        const scenesData = stateObj.scenes?.map((scene: any) => ({
          id: scene.id,
          name: scene.name,
          lastModified: scene.lastModified || new Date().toISOString()
        })) || [];
        
        if (scenesData.length > 0) {
          const activeSceneId = typeof stateObj.activeSceneId === 'string' ? stateObj.activeSceneId : 'scene-1';
          sceneStore.loadScenes(scenesData, activeSceneId);
        }
      }
    },

    getCurrentMainState: () => {
      const canvas = useCanvasStore.getState();
      const timeline = useTimelineStore.getState();
      const sceneStore = useSceneStore.getState();

      // Get current scene data
      const currentScene = {
        id: sceneStore.activeSceneId || 'scene-1',
        name: sceneStore.getSceneById(sceneStore.activeSceneId || 'scene-1')?.name || 'Scene 1',
        lastModified: new Date().toISOString(),
        canvas: {
          elements: canvas.elements,
          groups: canvas.groups,
          dimensions: { width: 1920, height: 1080 },
          canvasSize: {
            currentSizeId: 'fhd',
            customSize: null
          }
        },
        timeline: {
          scale: timeline.ui.scale,
          duration: timeline.playback.totalDuration,
          currentTime: timeline.playback.currentTime,
          animationStates: Object.fromEntries(timeline.animationStates as unknown as Iterable<readonly [PropertyKey, unknown]>),
        },
        ui: {
          zoom: 1,
          selectedElements: [],
          selectedGroups: [],
          panelState: {
            leftPanelVisible: true,
            rightPanelVisible: true,
            leftPanelWidth: 320,
            rightPanelWidth: 320,
            timelineHeight: 240,
            isTimelineCollapsed: true,
          },
          toolState: {
            activeTool: 'select',
            isPathMode: false,
            showPaths: true,
          }
        }
      };

      // Build complete project state with all scenes
      const projectState = {
        scenes: sceneStore.getScenes().map(sceneInfo => {
          if (sceneInfo.id === sceneStore.activeSceneId) {
            return currentScene;
          }
          // For other scenes, we'd need to get them from the project manager cache
          // For now, return basic info - this will be populated when scenes are loaded
          return {
            id: sceneInfo.id,
            name: sceneInfo.name,
            lastModified: sceneInfo.lastModified,
            canvas: { elements: [], groups: [], dimensions: { width: 1920, height: 1080 }, canvasSize: { currentSizeId: 'fhd', customSize: null } },
            timeline: { scale: 1, duration: 10, currentTime: 0, animationStates: {} },
            ui: {
              zoom: 1,
              selectedElements: [],
              selectedGroups: [],
              panelState: { leftPanelVisible: true, rightPanelVisible: true, leftPanelWidth: 320, rightPanelWidth: 320, timelineHeight: 240, isTimelineCollapsed: true },
              toolState: { activeTool: 'select', isPathMode: false, showPaths: true }
            }
          };
        }),
        activeSceneId: sceneStore.activeSceneId || 'scene-1',
      };



      return projectState;
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
      const { autosaveTimer, autosaveDelayMs } = get();
      if (autosaveTimer) {
        clearTimeout(autosaveTimer as unknown as number);
      }
      const timerId = setTimeout(() => {
        get().persistIfDirty('Autosave edits');
      }, autosaveDelayMs) as unknown as number;
      set(produce((state: ProjectStore) => {
        state.autosaveTimer = timerId;
      }));
    },

    setAutosaveDelay: (ms: number) => {
      set(produce((state: ProjectStore) => {
        state.autosaveDelayMs = Math.max(300, Math.min(ms, 10000));
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
    }
  })
);


