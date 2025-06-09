import { useState, useEffect } from 'react';
import { AnimatedCanvasObject } from '@/types/canvas';
import { SelectionManager } from '@/lib/selection-manager';
import { GroupManager } from '@/lib/group-manager';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  selectionManager: SelectionManager;
}

export function SceneExplorer({ elements, selectionManager }: SceneExplorerProps) {
  const shapes = elements.filter(element => !element.isAnimationPath);
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const groupManager = GroupManager.getInstance();
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Group elements by their groupId
  const groupedElements = shapes.reduce((acc, element) => {
    const groupId = element.groupId || 'no-group'; // Fallback for elements without groupId
    if (!acc[groupId]) {
      acc[groupId] = [];
    }
    acc[groupId].push(element);
    return acc;
  }, {} as Record<string, AnimatedCanvasObject[]>);

  const getAnimationIcon = (animationType: string) => {
    const iconMap: Record<string, string> = {
      'move': '🔄',
      'rotate': '↻',
      'scale': '⚏',
      'color': '🎨',
      'fade': '👻',
      'path': '📍'
    };
    return iconMap[animationType] || '⚡';
  };

  const getShapeIcon = (shapeType: string) => {
    const iconMap: Record<string, string> = {
      'rectangle': '▭',
      'circle': '○',
      'triangle': '△',
      'line': '—',
      'path': '〰️',
      'image': '🖼️',
      'text': '📝'
    };
    return iconMap[shapeType] || '◻️';
  };

  const toggleShapeExpansion = (shapeId: string) => {
    setExpandedShapes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shapeId)) {
        newSet.delete(shapeId);
      } else {
        newSet.add(shapeId);
      }
      return newSet;
    });
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Auto-expand shapes when their animations are selected from other parts of the UI
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection) {
        setExpandedShapes(prev => {
          const newSet = new Set(prev);
          newSet.add(selection.elementId);
          return newSet;
        });
      }
    });
  }, [animationSelectionManager]);

  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the aside element (empty space)
    if (e.target === e.currentTarget) {
      selectionManager.select(null);
      animationSelectionManager.clearSelection();
    }
  };

  return (
    <div 
      className="h-full p-2 text-gray-800"
      onClick={handleEmptySpaceClick}
    >
      <h3 className="font-semibold mb-2">Scenes</h3>
      <ul>
        <li>
          <details open>
            <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
            <ul className="ml-4 mt-1 space-y-1">
              {Object.entries(groupedElements).map(([groupId, groupElements]) => {
                const group = groupManager.getGroup(groupId);
                const isGroupExpanded = expandedGroups.has(groupId);
                const isMultiElementGroup = groupElements.length > 1;
                
                // For single-element groups (whether default or not), show the element directly
                if (!isMultiElementGroup) {
                  const element = groupElements[0];
                  const hasAnimations = element.animations.length > 0;
                  const isExpanded = expandedShapes.has(element.id);
                  
                  return (
                    <li key={element.id}>
                      {/* Single Element Item */}
                      <div className="flex items-center">
                        {/* Collapse/Expand Button for animations */}
                        {hasAnimations && (
                          <button
                            className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleShapeExpansion(element.id);
                            }}
                          >
                            <svg 
                              className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              fill="currentColor" 
                              viewBox="0 0 20 20"
                            >
                              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                        
                        {/* Element Content */}
                        <div
                          className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 flex items-center gap-2 ${
                            selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const isMultiSelect = e.metaKey || e.ctrlKey;
                            selectionManager.select(element, isMultiSelect);
                            animationSelectionManager.clearSelection();
                          }}
                        >
                          <span className="text-sm">{getShapeIcon(element.type)}</span>
                          <span className="flex-1">{element.name}</span>
                          {hasAnimations && (
                            <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
                          )}
                        </div>
                      </div>
                      
                      {/* Animations Children */}
                      {hasAnimations && isExpanded && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {element.animations.map(animation => (
                            <li key={animation.id}>
                              {/* Animation Item */}
                              <div 
                                className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm ${
                                  animationSelectionManager.isAnimationSelected(element.id, animation.id) ? 'bg-green-100 text-green-700' : ''
                                }`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  selectionManager.select(element);
                                  animationSelectionManager.selectAnimation(element, animation);
                                }}
                              >
                                <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                                <span className="flex-1 capitalize">{animation.type}</span>
                                <span className="text-xs text-gray-400">{animation.duration}s</span>
                              </div>
                              
                              {/* Path Shape Child (for path animations) */}
                              {animation.type === 'path' && animation.properties.pathElement && (() => {
                                const pathElement = animation.properties.pathElement;
                                return (
                                  <ul className="ml-6 mt-1">
                                    <li>
                                      <div 
                                        className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-purple-600 flex items-center gap-2 text-sm ${
                                          animationSelectionManager.isPathShapeSelected(element.id, animation.id, pathElement.id) ? 'bg-purple-100 text-purple-700' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectionManager.select(element);
                                          animationSelectionManager.selectPathShape(element, animation, pathElement);
                                        }}
                                      >
                                        <span className="text-xs">{getShapeIcon(pathElement.type)}</span>
                                        <span className="flex-1">{pathElement.name}</span>
                                        <span className="text-xs text-gray-400">path</span>
                                      </div>
                                    </li>
                                  </ul>
                                );
                              })()}
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                }
                
                // For multi-element groups, show as collapsible group
                return (
                  <li key={groupId}>
                    {/* Group Header */}
                    <div className="flex items-center">
                      <button
                        className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleGroupExpansion(groupId);
                        }}
                      >
                        <svg 
                          className={`w-3 h-3 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </button>
                      
                      {/* Group Content */}
                      <div
                        className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-purple-600 flex items-center gap-2 ${
                          selectionManager.getSelectedGroups().some(g => g.id === groupId) ? 'bg-purple-100 text-purple-600' : ''
                        }`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const isMultiSelect = e.metaKey || e.ctrlKey;
                          selectionManager.select(groupElements, isMultiSelect);
                          animationSelectionManager.clearSelection();
                        }}
                      >
                        <span className="text-sm">📦</span>
                        <span className="flex-1">{group?.name || `Group ${groupId.slice(0, 8)}`}</span>
                        <span className="text-xs text-gray-500">({groupElements.length} items)</span>
                      </div>
                    </div>
                    
                    {/* Group Elements */}
                    {isGroupExpanded && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {groupElements.map(element => {
                          const hasAnimations = element.animations.length > 0;
                          const isExpanded = expandedShapes.has(element.id);
                          
                          return (
                            <li key={element.id}>
                              <div className="flex items-center">
                                {hasAnimations && (
                                  <button
                                    className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      toggleShapeExpansion(element.id);
                                    }}
                                  >
                                    <svg 
                                      className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                      fill="currentColor" 
                                      viewBox="0 0 20 20"
                                    >
                                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                    </svg>
                                  </button>
                                )}
                                
                                <div
                                  className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 flex items-center gap-2 ${
                                    selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                                  }`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const isMultiSelect = e.metaKey || e.ctrlKey;
                                    selectionManager.select(element, isMultiSelect);
                                    animationSelectionManager.clearSelection();
                                  }}
                                >
                                  <span className="text-sm">{getShapeIcon(element.type)}</span>
                                  <span className="flex-1">{element.name}</span>
                                  {hasAnimations && (
                                    <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
                                  )}
                                </div>
                              </div>
                              
                              {/* Animations for group elements */}
                              {hasAnimations && isExpanded && (
                                <ul className="ml-6 mt-1 space-y-1">
                                  {element.animations.map(animation => (
                                    <li key={animation.id}>
                                      <div 
                                        className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm ${
                                          animationSelectionManager.isAnimationSelected(element.id, animation.id) ? 'bg-green-100 text-green-700' : ''
                                        }`}
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          selectionManager.select(element);
                                          animationSelectionManager.selectAnimation(element, animation);
                                        }}
                                      >
                                        <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                                        <span className="flex-1 capitalize">{animation.type}</span>
                                        <span className="text-xs text-gray-400">{animation.duration}s</span>
                                      </div>
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
              {shapes.length === 0 && (
                <li className="text-sm text-gray-500 italic">No shapes added yet</li>
              )}
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
} 