import { FC, useState, useRef } from 'react';
import { Plus, Trash2, Copy, Clapperboard, X } from 'lucide-react';
import { useScenes, useActiveSceneId, useCreateScene, useDeleteScene, useRenameScene, useDuplicateScene } from '@/stores/use-scene-store';
import { ProjectManager } from '@/lib/project-manager';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

export const ScenesTab: FC = () => {
  const scenes = useScenes();
  const activeSceneId = useActiveSceneId();
  const createScene = useCreateScene();
  const deleteScene = useDeleteScene();
  const renameScene = useRenameScene();
  const duplicateScene = useDuplicateScene();
  const setActiveRightPanel = useSetActiveRightPanel();
  
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);

  const handleCreateScene = () => {
    createScene();
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length <= 1) {
      alert('Cannot delete the last scene');
      return;
    }
    if (confirm('Are you sure you want to delete this scene?')) {
      deleteScene(sceneId);
    }
  };

  const handleRenameScene = (sceneId: string, currentName: string) => {
    setEditingSceneId(sceneId);
    setEditingName(currentName);
  };

  const handleDuplicateScene = (sceneId: string) => {
    duplicateScene(sceneId);
  };

  const handleSwitchScene = async (sceneId: string) => {
    if (sceneId === activeSceneId) return;
    
    try {
      const projectManager = ProjectManager.getInstance();
      await projectManager.switchToScene(sceneId);
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  };

  const commitRename = () => {
    if (editingSceneId && editingName.trim()) {
      renameScene(editingSceneId, editingName.trim());
      setEditingSceneId(null);
      setEditingName('');
    }
  };

  const cancelRename = () => {
    setEditingSceneId(null);
    setEditingName('');
  };

  return (
    <div className="h-full p-4 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-zinc-600 text-sm">Scenes</h3>
          </div>
          <button
            onClick={() => setActiveRightPanel(null)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 px-1 py-4 overflow-y-auto">
        <div className="space-y-2 text-sm">
          {/* Create New Scene Button */}
          <button
            onClick={handleCreateScene}
            className="w-full p-2 rounded-lg transition-colors bg-gray-50 hover:bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-700 flex items-center gap-2 justify-center"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">New Scene</span>
          </button>

          {/* Scenes List */}
          {scenes.map((scene) => {
            const isActive = scene.id === activeSceneId;
            const isEditing = editingSceneId === scene.id;
            
            return (
              <div key={scene.id} className="space-y-1">
                <div
                  className={`w-full py-2 pl-8 pr-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-indigo-100 border border-indigo-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Clapperboard className="w-4 h-4 text-purple-600" />
                    {isEditing ? (
                      <input
                        ref={nameInputRef}
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            commitRename();
                          }
                          if (e.key === 'Escape') {
                            cancelRename();
                          }
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm px-1 py-0.5 border border-indigo-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                      />
                    ) : (
                      <button
                        onClick={() => handleSwitchScene(scene.id)}
                        onDoubleClick={(e) => { e.stopPropagation(); handleRenameScene(scene.id, scene.name); }}
                        className="text-gray-700 flex-1 truncate text-left hover:text-indigo-600 transition-colors"
                      >
                        {scene.name}
                      </button>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicateScene(scene.id);
                      }}
                      className="p-1 hover:bg-gray-200 rounded transition-colors"
                      title="Duplicate scene"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                    {scenes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteScene(scene.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title="Delete scene"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
