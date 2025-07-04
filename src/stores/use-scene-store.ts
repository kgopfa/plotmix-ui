import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

export interface SceneState {
  activeSceneId: string | null;
  
  // Actions
  setActiveScene: (sceneId: string) => void;
  getActiveSceneId: () => string | null;
}

const DEFAULT_SCENE_ID = 'scene-1';

export const useSceneStore = create<SceneState>()(
  devtools(
    (set, get) => ({
      activeSceneId: DEFAULT_SCENE_ID,
      
      setActiveScene: (sceneId: string) => {
        set({ activeSceneId: sceneId });
      },
      
      getActiveSceneId: () => {
        return get().activeSceneId;
      },
    }),
    {
      name: 'scene-store',
    }
  )
);

// Helper hooks for easier component consumption
export const useActiveSceneId = () => useSceneStore(state => state.activeSceneId);
export const useSceneActions = () => useSceneStore(state => ({
  setActiveScene: state.setActiveScene,
  getActiveSceneId: state.getActiveSceneId,
})); 