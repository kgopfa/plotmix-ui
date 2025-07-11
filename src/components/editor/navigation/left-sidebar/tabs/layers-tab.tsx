import React from 'react';
import { Layers, Eye, EyeOff, Square, Circle, Type, Image, Minus, Group } from 'lucide-react';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

export const LayersTab: React.FC = () => {
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const { selectedElements, selectedGroups, select: selectElement, selectGroup } = useSelectionStore();

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'rectangle': return Square;
      case 'circle': return Circle;
      case 'text': return Type;
      case 'textGroup': return Group;
      case 'image': return Image;
      case 'line': 
      case 'simpleLine': return Minus;
      default: return Square;
    }
  };

  const getElementColor = (type: string) => {
    switch (type) {
      case 'rectangle': return 'text-blue-600';
      case 'circle': return 'text-green-600';
      case 'text': 
      case 'textGroup': return 'text-orange-600';
      case 'image': return 'text-purple-600';
      case 'line': 
      case 'simpleLine': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleElementClick = (element: AnimatedCanvasObject) => {
    selectElement([element]);
  };

  const handleGroupClick = (group: CanvasGroup) => {
    selectGroup(group);
  };

  const isElementSelected = (elementId: string) => {
    return selectedElements.some(el => el.id === elementId);
  };

  const isGroupSelected = (groupId: string) => {
    return selectedGroups.some(group => group.id === groupId);
  };

  // Group elements by their groupId
  const ungroupedElements = canvasObjects.filter(el => !el.groupId || el.groupId === '');
  const groupedElements = canvasObjects.filter(el => el.groupId && el.groupId !== '');

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Layers</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2 text-sm">
          {/* Canvas Overview */}
          <div className="p-3 bg-indigo-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Canvas Overview</div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-indigo-600">{canvasObjects.length}</div>
                <div className="text-gray-600">Elements</div>
              </div>
              <div className="text-center p-2 bg-white rounded">
                <div className="font-bold text-lg text-purple-600">{groups.filter(g => !g.isDefaultGroup).length}</div>
                <div className="text-gray-600">Groups</div>
              </div>
            </div>
          </div>

          {/* Groups */}
          {groups.filter(group => !group.isDefaultGroup).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Group className="w-3 h-3" />
                Groups
              </div>
              {groups.filter(group => !group.isDefaultGroup).map((group) => (
                <div key={group.id} className="space-y-1">
                  <button
                    onClick={() => handleGroupClick(group)}
                    className={`w-full p-2 rounded-lg text-left transition-colors ${
                      isGroupSelected(group.id) 
                        ? 'bg-indigo-100 border border-indigo-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Group className="w-4 h-4 text-purple-600" />
                      <span className="font-medium text-gray-700 flex-1 truncate">
                        {group.name}
                      </span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs px-1 bg-purple-100 text-purple-700 rounded">
                          {group.elementIds.length}
                        </span>
                        {group.visible !== false ? (
                          <Eye className="w-3 h-3 text-green-600" />
                        ) : (
                          <EyeOff className="w-3 h-3 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                  
                  {/* Group Elements */}
                  <div className="ml-4 space-y-1">
                    {groupedElements
                      .filter(el => el.groupId === group.id)
                      .map((element) => {
                        const IconComponent = getElementIcon(element.type);
                        return (
                          <button
                            key={element.id}
                            onClick={() => handleElementClick(element)}
                            className={`w-full p-2 rounded text-left transition-colors ${
                              isElementSelected(element.id) 
                                ? 'bg-blue-100 border border-blue-200' 
                                : 'bg-white hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <IconComponent className={`w-3 h-3 ${getElementColor(element.type)}`} />
                              <span className="text-xs text-gray-700 flex-1 truncate">
                                {element.name}
                              </span>
                              {element.visible !== false ? (
                                <Eye className="w-3 h-3 text-green-600" />
                              ) : (
                                <EyeOff className="w-3 h-3 text-gray-400" />
                              )}
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Ungrouped Elements */}
          {ungroupedElements.length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Elements
              </div>
              {ungroupedElements.map((element) => {
                const IconComponent = getElementIcon(element.type);
                return (
                  <button
                    key={element.id}
                    onClick={() => handleElementClick(element)}
                    className={`w-full p-2 rounded-lg text-left transition-colors ${
                      isElementSelected(element.id) 
                        ? 'bg-blue-100 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${getElementColor(element.type)}`} />
                      <span className="font-medium text-gray-700 flex-1 truncate">
                        {element.name}
                      </span>
                      {element.visible !== false ? (
                        <Eye className="w-4 h-4 text-green-600" />
                      ) : (
                        <EyeOff className="w-4 h-4 text-gray-400" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {canvasObjects.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <span className="text-2xl block mb-2">📄</span>
              <div className="text-sm">No elements on canvas</div>
              <div className="text-xs">Create shapes or add text to get started</div>
            </div>
          )}

          {/* Layer Tips */}
          <div className="p-3 bg-gradient-to-r from-indigo-100 to-blue-100 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Layer Management</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Click elements to select them</div>
              <div>• Group related elements together</div>
              <div>• Use eye icon to toggle visibility</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 