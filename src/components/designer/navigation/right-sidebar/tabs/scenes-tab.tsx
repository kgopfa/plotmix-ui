'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, MoreVertical, Copy, Trash2, X, Clapperboard, Layers } from 'lucide-react';
import { useProjectStore } from '@/stores/use-project-store';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

export const ScenesTab: React.FC = () => {
  const {
    scenes,
    currentSceneIndex,
    switchToScene,
    addScene,
    removeScene,
    updateScene
  } = useProjectStore();

  const setActiveRightPanel = useSetActiveRightPanel();

  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const commitByEnterRef = useRef<boolean>(false);

  // Focus the input when starting to edit
  useEffect(() => {
    if (editingSceneId) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingSceneId]);

  const handleAddScene = () => {
    const newScene = {
      sceneId: `scene-${Date.now()}`,
      sceneName: `Scene ${scenes.length + 1}`,
      sceneCanvas: {
        elements: [],
        groups: [],
        timeline: {
          scale: 100,
          duration: 10,
          currentTime: 0,
          animationStates: {}
        }
      }
    };
    addScene(newScene);
  };

  const handleSceneSelect = (index: number) => {
    switchToScene(index);
  };

  const startEditScene = (scene: any) => {
    setEditingSceneId(scene.sceneId);
    setEditingName(scene.sceneName || '');
  };

  const commitEditScene = (scene: any) => {
    const newName = editingName.trim();
    setEditingSceneId(null);
    if (newName && newName !== scene.sceneName) {
      updateScene(scene.sceneId, { sceneName: newName });
    }
  };

  const handleDuplicateScene = (scene: any) => {
    const duplicatedScene = {
      ...scene,
      sceneId: `scene-${Date.now()}`,
      sceneName: `${scene.sceneName} Copy`,
    };
    addScene(duplicatedScene);
  };

  const handleDeleteScene = (sceneId: string) => {
    if (scenes.length > 1) {
      removeScene(sceneId);
    }
  };

  return (
    <div className="h-full p-4 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      {/* Header - matching layers tab */}
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-green-500 text-sm">Scenes</h3>
            <button
              onClick={handleAddScene}
              className="p-1 text-gray-400 hover:text-blue-600 transition-colors rounded-lg hover:bg-blue-50"
              title="Add Scene"
            >
              <Plus className="w-4 h-4" />
            </button>
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

      {/* Scenes List - matching layers tab structure */}
      <div className="flex-1 px-1 py-4 overflow-y-auto">
        <div className="space-y-2 text-sm">
          {scenes.map((scene, index) => {
            const isActive = index === currentSceneIndex;
            const isEditing = editingSceneId === scene.sceneId;

            return (
              <div
                key={scene.sceneId}
                className={`w-full py-2 px-3 rounded-lg transition-colors group cursor-pointer ${isActive
                    ? 'bg-blue-100 border border-blue-200'
                    : 'hover:bg-gray-50 border border-transparent'
                  }`}
                onClick={() => !isEditing && handleSceneSelect(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Clapperboard
                      className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-400'}`}
                    />

                    {isEditing ? (
                      <input
                        ref={nameInputRef}
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => {
                          if (commitByEnterRef.current) {
                            commitByEnterRef.current = false;
                            return;
                          }
                          commitEditScene(scene);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            e.stopPropagation();
                            commitByEnterRef.current = true;
                            commitEditScene(scene);
                          }
                          if (e.key === 'Escape') setEditingSceneId(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 text-sm px-1 py-0.5 border border-blue-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                      />
                    ) : (
                      <button
                        onClick={(e) => handleSceneSelect(index)}
                        onDoubleClick={(e) => { e.stopPropagation(); startEditScene(scene); }}
                        className={`font-medium text-sm pl-0.5 flex-1 truncate text-left transition-colors ${
                          isActive ? 'text-blue-700 hover:text-blue-800' : 'text-gray-700 hover:text-blue-600'
                        }`}
                      >
                        {scene.sceneName}
                      </button>
                    )}
                  </div>

                  {/* Scene Actions */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditScene(scene);
                        }}
                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors hover:bg-gray-200"
                        title="Rename scene"
                      >
                        <MoreVertical className="w-3 h-3" />
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDuplicateScene(scene);
                        }}
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors hover:bg-blue-50"
                        title="Duplicate scene"
                      >
                        <Copy className="w-3 h-3" />
                      </button>

                      {scenes.length > 1 && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteScene(scene.sceneId);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors hover:bg-red-50"
                          title="Delete scene"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
