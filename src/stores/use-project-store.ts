import { create } from 'zustand';
import { produce } from 'immer';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { DiffPatcher } from 'jsondiffpatch';

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export interface ProjectInfo {
  projectId: string | null;
  name: string;
  title?: string;
  version: string;
}

interface ProjectStoreState extends ProjectInfo {
  baselineMainState: Record<string, any> | null;
  lastSavedAt: string | null;
  saveStatus: SaveStatus;
}

interface ProjectStoreActions {
  setProjectInfo: (info: Partial<ProjectInfo>) => void;
  captureBaseline: () => void;
  setBaseline: (state: Record<string, any> | null) => void;
  getCurrentMainState: () => Record<string, any>;
  getDiffFromBaseline: () => Record<string, any> | null;
  setVersion: (version: string) => void;
  setSaveStatus: (status: SaveStatus) => void;
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
      set(produce((state: ProjectStore) => {
        state.baselineMainState = current;
        state.lastSavedAt = new Date().toISOString();
      }));
    },

    setBaseline: (stateObj) => {
      set(produce((state: ProjectStore) => {
        state.baselineMainState = stateObj;
      }));
    },

    getCurrentMainState: () => {
      const canvas = useCanvasStore.getState();
      const timeline = useTimelineStore.getState();

      return {
        elements: canvas.elements,
        groups: canvas.groups,
        timeline: {
          scale: timeline.ui.scale,
          duration: timeline.playback.totalDuration,
          currentTime: timeline.playback.currentTime,
          animationStates: Object.fromEntries(timeline.animationStates),
        },
      };
    },

    getDiffFromBaseline: () => {
      const baseline = get().baselineMainState;
      const current = get().getCurrentMainState();
      if (!baseline) return null;
      const diffPatcher = new DiffPatcher();
      const delta = diffPatcher.diff(baseline, current);
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
  })
);


