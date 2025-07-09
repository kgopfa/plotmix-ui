import React from 'react';
import { FilmIcon, EyeIcon } from '@heroicons/react/24/outline';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useActiveSceneId, useScenes } from '@/stores/use-scene-store';

export const SceneExplorerTab: React.FC = () => {
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const activeSceneId = useActiveSceneId();
  const scenes = useScenes();

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'rectangle': return '▭';
      case 'circle': return '⭕';
      case 'text': return 'T';
      case 'textGroup': return '📝';
      case 'image': return '🖼️';
      case 'line': return '📏';
      case 'arrow': return '➡️';
      default: return '🔷';
    }
  };

  const visibleElements = canvasObjects.filter(el => el.visible !== false);
  const visibleGroups = groups.filter(group => group.visible !== false);

  return (
    <div className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FilmIcon className="w-5 h-5 text-blue-600" />
        <h3 className="font-semibold text-gray-900">Scenes</h3>
      </div>
      
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
              <div className="font-bold text-lg text-green-600">{visibleElements.length}</div>
              <div className="text-gray-600">Elements</div>
            </div>
          </div>
        </div>

        {/* Elements in Current Scene */}
        {visibleElements.length > 0 && (
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2">Elements</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {visibleElements.slice(0, 6).map((element) => (
                <div key={element.id} className="flex items-center gap-2 text-xs p-1">
                  <span>{getElementIcon(element.type)}</span>
                  <span className="flex-1 truncate">{element.name}</span>
                  <EyeIcon className="w-3 h-3 text-green-600" />
                </div>
              ))}
              {visibleElements.length > 6 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{visibleElements.length - 6} more elements
                </div>
              )}
            </div>
          </div>
        )}

        {/* Groups in Current Scene */}
        {visibleGroups.length > 0 && (
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2">Groups</div>
            <div className="space-y-1">
              {visibleGroups.slice(0, 3).map((group) => (
                <div key={group.id} className="flex items-center gap-2 text-xs p-1">
                  <span>📁</span>
                  <span className="flex-1 truncate">{group.name}</span>
                  <span className="text-purple-600 bg-purple-100 px-1 rounded text-xs">
                    {group.elementIds.length}
                  </span>
                </div>
              ))}
              {visibleGroups.length > 3 && (
                <div className="text-xs text-gray-500 text-center py-1">
                  +{visibleGroups.length - 3} more groups
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="p-3 bg-gradient-to-r from-blue-100 to-purple-100 rounded-lg">
          <div className="text-xs font-medium text-gray-700 mb-1">Quick Actions</div>
          <div className="text-xs text-gray-600 space-y-1">
            <div>• Create new scene</div>
            <div>• Organize elements</div>
            <div>• Manage visibility</div>
          </div>
        </div>

        {/* Empty State */}
        {visibleElements.length === 0 && visibleGroups.length === 0 && (
          <div className="p-4 text-center text-gray-500">
            <span className="text-2xl block mb-2">🎨</span>
            <div className="text-sm">No elements in scene</div>
            <div className="text-xs">Start by adding shapes or text</div>
          </div>
        )}
      </div>
    </div>
  );
}; 