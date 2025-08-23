import { FC, useState } from 'react';
import { Plus, Trash2, Copy, Edit3, Film } from 'lucide-react';
import { useScenes, useActiveSceneId, useCreateScene, useDeleteScene, useRenameScene, useDuplicateScene } from '@/stores/use-scene-store';

export const ScenesTab: FC = () => {
  const scenes = useScenes();
  const activeSceneId = useActiveSceneId();
  const createScene = useCreateScene();
  const deleteScene = useDeleteScene();
  const renameScene = useRenameScene();
  const duplicateScene = useDuplicateScene();
  
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">Scenes</h3>
        <button
          onClick={handleCreateScene}
          className="flex items-center space-x-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={16} />
          <span className="text-sm">New Scene</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2">
        {scenes.map((scene) => {
          const isActive = scene.id === activeSceneId;
          const isEditing = editingSceneId === scene.id;
          
          return (
            <div
              key={scene.id}
              className={`p-3 border rounded-lg ${
                isActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-gray-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Film size={16} className="text-blue-600" />
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={commitRename}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          commitRename();
                        } else if (e.key === 'Escape') {
                          cancelRename();
                        }
                      }}
                      className="text-sm border border-blue-300 rounded px-2 py-1 bg-white"
                      autoFocus
                    />
                  ) : (
                    <span className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-700'}`}>
                      {scene.name}
                    </span>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleRenameScene(scene.id, scene.name)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                    title="Rename scene"
                  >
                    <Edit3 size={14} />
                  </button>
                  
                  <button
                    onClick={() => handleDuplicateScene(scene.id)}
                    className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors"
                    title="Duplicate scene"
                  >
                    <Copy size={14} />
                  </button>
                  
                  {scenes.length > 1 && (
                    <button
                      onClick={() => handleDeleteScene(scene.id)}
                      className="p-1 text-red-500 hover:text-red-700 hover:bg-red-100 rounded transition-colors"
                      title="Delete scene"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              
              {isActive && (
                <div className="mt-2 text-xs text-blue-600">
                  Active Scene
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
