import React from 'react';
import { Film } from 'lucide-react';
import { useCanvasElements } from '@/stores/use-canvas-store';
import { useActiveSceneId, useScenes } from '@/stores/use-scene-store';

export const SceneExplorerTab: React.FC = () => {
  const canvasObjects = useCanvasElements();
  const activeSceneId = useActiveSceneId();
  const scenes = useScenes();

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Film className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Scenes</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 text-sm">
          {/* Current Scene Info */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-1">Active Scene</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">🎬</span>
              <span className="text-blue-700 font-medium">
                {scenes.find(s => s.id === activeSceneId)?.name || 'Scene 1'}
              </span>
              <span className="text-xs text-blue-500 bg-blue-100 px-2 py-0.5 rounded-full">Active</span>
            </div>
          </div>

          {/* Scene Statistics */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2">Scene Overview</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-blue-600">{scenes.length}</div>
                <div className="text-gray-600">Total Scenes</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-green-600">{canvasObjects.length}</div>
                <div className="text-gray-600">Elements</div>
              </div>
            </div>
          </div>

          {/* Scene Management */}
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2">Scene Management</div>
            <div className="space-y-2">
              <button className="w-full p-2 bg-white rounded border text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">➕</span>
                  <span className="text-sm font-medium text-gray-700">Create New Scene</span>
                </div>
              </button>
              <button className="w-full p-2 bg-white rounded border text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">📋</span>
                  <span className="text-sm font-medium text-gray-700">Duplicate Scene</span>
                </div>
              </button>
              <button className="w-full p-2 bg-white rounded border text-left hover:bg-gray-50 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🗂️</span>
                  <span className="text-sm font-medium text-gray-700">Scene Templates</span>
                </div>
              </button>
            </div>
          </div>

          {/* Scene List */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2">All Scenes</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {scenes.map((scene) => (
                <div key={scene.id} className={`flex items-center gap-2 text-xs p-2 rounded ${
                  scene.id === activeSceneId ? 'bg-blue-100 border border-blue-200' : 'bg-white border border-gray-200'
                }`}>
                  <span className="text-lg">🎬</span>
                  <span className="flex-1 truncate font-medium">{scene.name}</span>
                  {scene.id === activeSceneId && (
                    <span className="text-xs px-1 bg-blue-200 text-blue-700 rounded">Active</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Scene Tips */}
          <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Scene Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Use scenes to organize different shots</div>
              <div>• Each scene has its own timeline</div>
              <div>• Switch between scenes to compare</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 