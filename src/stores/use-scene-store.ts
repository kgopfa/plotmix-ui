import { create } from 'zustand';
import { devtools, subscribeWithSelector } from 'zustand/middleware';

interface SceneInfo {
  id: string;
  name: string;
  lastModified: string;
}

export interface SceneState {
  activeSceneId: string | null;
  scenes: SceneInfo[];
  
  // Actions
  setActiveScene: (sceneId: string) => void;
  getActiveSceneId: () => string | null;
  createScene: (name?: string) => string;
  deleteScene: (sceneId: string) => boolean;
  renameScene: (sceneId: string, newName: string) => boolean;
  duplicateScene: (sceneId: string, newName?: string) => string | null;
  getScenes: () => SceneInfo[];
  getSceneById: (sceneId: string) => SceneInfo | undefined;
  updateSceneModified: (sceneId: string) => void;
}

const DEFAULT_SCENE_ID = 'scene-1';

// Use a deterministic timestamp for SSR compatibility
const INITIAL_TIMESTAMP = '2024-01-01T00:00:00.000Z';

const createInitialState = (): Pick<SceneState, 'activeSceneId' | 'scenes'> => ({
  activeSceneId: DEFAULT_SCENE_ID,
  scenes: [
    {
      id: DEFAULT_SCENE_ID,
      name: 'Scene 1',
      lastModified: INITIAL_TIMESTAMP
    }
  ]
});

export const useSceneStore = create<SceneState>()(
  subscribeWithSelector(
    devtools(
      (set, get) => ({
        ...createInitialState(),
        
        setActiveScene: (sceneId: string) => {
          const { scenes } = get();
          const sceneExists = scenes.some(s => s.id === sceneId);
          if (sceneExists) {
            set({ activeSceneId: sceneId });
          } else {
            console.warn(`Scene ${sceneId} does not exist`);
          }
        },
        
        getActiveSceneId: () => {
          return get().activeSceneId;
        },
        
        createScene: (name?: string) => {
          const { scenes } = get();
          const sceneNumber = scenes.length + 1;
          const newSceneId = `scene-${Date.now()}`;
          const newSceneName = name || `Scene ${sceneNumber}`;
          
          const newScene: SceneInfo = {
            id: newSceneId,
            name: newSceneName,
            lastModified: new Date().toISOString()
          };
          
          set({
            scenes: [...scenes, newScene],
            activeSceneId: newSceneId
          });
          
          console.log(`Created new scene: ${newSceneName} (${newSceneId})`);
          return newSceneId;
        },
        
        deleteScene: (sceneId: string) => {
          const { scenes, activeSceneId } = get();
          
          // Don't allow deleting the last scene
          if (scenes.length <= 1) {
            console.warn('Cannot delete the last scene');
            return false;
          }
          
          const sceneToDelete = scenes.find(s => s.id === sceneId);
          if (!sceneToDelete) {
            console.warn(`Scene ${sceneId} not found`);
            return false;
          }
          
          const updatedScenes = scenes.filter(s => s.id !== sceneId);
          let newActiveSceneId = activeSceneId;
          
          // If we're deleting the active scene, switch to the first available scene
          if (activeSceneId === sceneId) {
            newActiveSceneId = updatedScenes[0]?.id || null;
          }
          
          set({
            scenes: updatedScenes,
            activeSceneId: newActiveSceneId
          });
          
          console.log(`Deleted scene: ${sceneToDelete.name} (${sceneId})`);
          return true;
        },
        
        renameScene: (sceneId: string, newName: string) => {
          const { scenes } = get();
          const sceneIndex = scenes.findIndex(s => s.id === sceneId);
          
          if (sceneIndex === -1) {
            console.warn(`Scene ${sceneId} not found`);
            return false;
          }
          
          const updatedScenes = [...scenes];
          updatedScenes[sceneIndex] = {
            ...updatedScenes[sceneIndex],
            name: newName,
            lastModified: new Date().toISOString()
          };
          
          set({ scenes: updatedScenes });
          console.log(`Renamed scene ${sceneId} to "${newName}"`);
          return true;
        },
        
        duplicateScene: (sceneId: string, newName?: string) => {
          const { scenes } = get();
          const sceneToClone = scenes.find(s => s.id === sceneId);
          
          if (!sceneToClone) {
            console.warn(`Scene ${sceneId} not found`);
            return null;
          }
          
          const newSceneId = `scene-${Date.now()}`;
          const duplicatedName = newName || `${sceneToClone.name} Copy`;
          
          const newScene: SceneInfo = {
            id: newSceneId,
            name: duplicatedName,
            lastModified: new Date().toISOString()
          };
          
          set({
            scenes: [...scenes, newScene],
            activeSceneId: newSceneId
          });
          
          console.log(`Duplicated scene: ${sceneToClone.name} -> ${duplicatedName} (${newSceneId})`);
          return newSceneId;
        },
        
        getScenes: () => {
          return get().scenes;
        },
        
        getSceneById: (sceneId: string) => {
          const { scenes } = get();
          return scenes.find(s => s.id === sceneId);
        },
        
        updateSceneModified: (sceneId: string) => {
          const { scenes } = get();
          const sceneIndex = scenes.findIndex(s => s.id === sceneId);
          
          if (sceneIndex !== -1) {
            const updatedScenes = [...scenes];
            updatedScenes[sceneIndex] = {
              ...updatedScenes[sceneIndex],
              lastModified: new Date().toISOString()
            };
            
            set({ scenes: updatedScenes });
          }
        },
      }),
      {
        name: 'scene-store',
      }
    )
  )
);

// Helper hooks for easier component consumption
export const useActiveSceneId = () => useSceneStore(state => state.activeSceneId);
export const useScenes = () => useSceneStore(state => state.scenes);

// Individual action hooks to avoid object creation
export const useSetActiveScene = () => useSceneStore(state => state.setActiveScene);
export const useGetActiveSceneId = () => useSceneStore(state => state.getActiveSceneId);
export const useCreateScene = () => useSceneStore(state => state.createScene);
export const useDeleteScene = () => useSceneStore(state => state.deleteScene);
export const useRenameScene = () => useSceneStore(state => state.renameScene);
export const useDuplicateScene = () => useSceneStore(state => state.duplicateScene);
export const useGetScenes = () => useSceneStore(state => state.getScenes);
export const useGetSceneById = () => useSceneStore(state => state.getSceneById);
export const useUpdateSceneModified = () => useSceneStore(state => state.updateSceneModified);

// Legacy hook for backwards compatibility - but avoid using this
export const useSceneActions = () => ({
  setActiveScene: useSceneStore.getState().setActiveScene,
  getActiveSceneId: useSceneStore.getState().getActiveSceneId,
  createScene: useSceneStore.getState().createScene,
  deleteScene: useSceneStore.getState().deleteScene,
  renameScene: useSceneStore.getState().renameScene,
  duplicateScene: useSceneStore.getState().duplicateScene,
  getScenes: useSceneStore.getState().getScenes,
  getSceneById: useSceneStore.getState().getSceneById,
  updateSceneModified: useSceneStore.getState().updateSceneModified,
}); 