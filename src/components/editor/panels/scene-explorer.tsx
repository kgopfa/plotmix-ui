import { useState, useEffect } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedElements: AnimatedCanvasObject[];
  selectedGroups: CanvasGroup[];
  onElementSelect: (element: AnimatedCanvasObject | null, addToSelection?: boolean) => void;
  onGroupSelect: (group: CanvasGroup, addToSelection?: boolean) => void;
  onClearSelection: () => void;
  onElementVisibilityChange: (elementId: string, visible: boolean) => void;
  onGroupVisibilityChange: (groupId: string, visible: boolean) => void;
}

export function SceneExplorer({ 
  elements, 
  groups, 
  selectedElements, 
  selectedGroups,
  onElementSelect,
  onGroupSelect,
  onClearSelection,
  onElementVisibilityChange,
  onGroupVisibilityChange
}: SceneExplorerProps) {
  // Filter out animation paths and character elements (characters will be shown under their group parent)
  const shapes = elements.filter(element => !element.isAnimationPath);
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Helper function to get characters for a text group
  // Helper function to get group elements
  const getGroupElements = (groupId: string): AnimatedCanvasObject[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return elements.filter(el => group.elementIds.includes(el.id));
  };

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
      'text': '📝',
      
    };
    return iconMap[shapeType] || '◻️';
  };

  const getGroupIcon = (groupType: string) => {
    const iconMap: Record<string, string> = {
      'text': '📄',
      'custom': '📦',
      'polygon': '◇'
    };
    return iconMap[groupType] || '📦';
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
      onClearSelection();
      animationSelectionManager.clearSelection();
    }
  };

  // Get elements that are not in any non-default group
  const ungroupedElements = shapes.filter(element => {
    const group = groups.find(g => g.elementIds.includes(element.id));
    return !group || group.isDefaultGroup;
  });

  // Helper method to properly select a group
  const selectGroup = (group: CanvasGroup, isMultiSelect: boolean = false) => {
    onGroupSelect(group, isMultiSelect);
  };

  // Helper function to check if an element is selected
  const isElementSelected = (element: AnimatedCanvasObject) => {
    return selectedElements.some(el => el.id === element.id);
  };

  // Helper function to check if a group is selected
  const isGroupSelected = (group: CanvasGroup) => {
    return selectedGroups.some(g => g.id === group.id);
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
              {/* Render non-default groups */}
              {groups
                .filter(group => !group.isDefaultGroup)
                .map(group => {
                  const isGroupExpanded = expandedGroups.has(group.id);
                  const groupElements = getGroupElements(group.id);
                  const hasAnimations = group.animations.length > 0;
                  const hasElements = groupElements.length > 0;
                  const shouldShowExpandButton = hasAnimations || hasElements;
                  const isSelected = isGroupSelected(group);

                  return (
                    <li key={group.id}>
                      {/* Group Item */}
                      <div className="flex items-center">
                        {/* Collapse/Expand Button */}
                        {shouldShowExpandButton && (
                          <button
                            className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleGroupExpansion(group.id);
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
                        )}
                        
                        {/* Group Content */}
                        <div className="flex items-center gap-1">
                          <div
                            className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-purple-600 flex items-center gap-2 ${
                              isSelected ? 'bg-purple-100 text-purple-600' : ''
                            } ${group.visible === false ? 'opacity-50' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const isMultiSelect = e.metaKey || e.ctrlKey;
                              selectGroup(group, isMultiSelect);
                              animationSelectionManager.clearSelection();
                            }}
                          >
                            <span className="text-sm">{getGroupIcon(group.type)}</span>
                            <span className="flex-1">{group.name}</span>
                            {hasAnimations && (
                              <span className="text-xs text-gray-500">({group.animations.length} anim)</span>
                            )}
                          </div>
                          
                          {/* Visibility Toggle */}
                          <button
                            className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 rounded text-gray-500 hover:text-gray-700"
                            onClick={(e) => {
                              e.stopPropagation();
                              const newVisible = !(group.visible ?? true);
                              onGroupVisibilityChange(group.id, newVisible);
                            }}
                            title={`${group.visible === false ? 'Show' : 'Hide'} group`}
                          >
                            {group.visible === false ? (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                              </svg>
                            ) : (
                              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Group Children */}
                      {isGroupExpanded && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {/* For all groups, show elements */}
                          {hasElements && groupElements.map(element => (
                            <li key={element.id}>
                              <div className="flex items-center gap-1">
                                <div 
                                  className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2 text-sm ${
                                    isElementSelected(element) ? 'bg-blue-100 text-blue-700' : ''
                                  } ${isSelected ? 'opacity-50 cursor-not-allowed' : ''} ${element.visible === false ? 'opacity-50' : ''}`}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (isSelected) return; // Prevent element selection if group is selected
                                    const isMultiSelect = e.metaKey || e.ctrlKey;
                                    onElementSelect(element, isMultiSelect);
                                    animationSelectionManager.clearSelection();
                                  }}
                                >
                                  <span className="text-xs">{getShapeIcon(element.type)}</span>
                                  <span className="flex-1">{element.name}</span>
                                  {element.animations.length > 0 && (
                                    <span className="text-xs text-gray-400">({element.animations.length} anim)</span>
                                  )}
                                </div>
                                
                                {/* Element Visibility Toggle */}
                                <button
                                  className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded text-gray-400 hover:text-gray-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const newVisible = !(element.visible ?? true);
                                    onElementVisibilityChange(element.id, newVisible);
                                  }}
                                  title={`${element.visible === false ? 'Show' : 'Hide'} element`}
                                >
                                  {element.visible === false ? (
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                                      <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                                    </svg>
                                  ) : (
                                    <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                                      <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                                      <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                                    </svg>
                                  )}
                                </button>
                              </div>
                            </li>
                          ))}

                          {/* Group Animations */}
                          {hasAnimations && group.animations.map(animation => (
                            <li key={animation.id}>
                              <div 
                                className="px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Need to select group for animation
                                  const elementsInGroup = elements.filter(el => group.elementIds.includes(el.id));
                                  if (elementsInGroup.length > 0) {
                                    onElementSelect(elementsInGroup[0]);
                                    // For group animations, we'll handle selection differently
                                  }
                                }}
                              >
                                <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                                <span className="flex-1">{animation.type}</span>
                                <span className="text-xs text-gray-400">
                                  {animation.startTime.toFixed(1)}s → {(animation.startTime + animation.duration).toFixed(1)}s
                                </span>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}

              {/* Render ungrouped elements */}
              {ungroupedElements.map(element => {
                const hasAnimations = element.animations.length > 0;
                const isExpanded = expandedShapes.has(element.id);
                const shouldShowExpandButton = hasAnimations;

                return (
                  <li key={element.id}>
                    {/* Single Element Item */}
                    <div className="flex items-center">
                      {/* Collapse/Expand Button for animations */}
                      {shouldShowExpandButton && (
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
                          isElementSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                        } ${element.visible === false ? 'opacity-50' : ''}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          const isMultiSelect = e.metaKey || e.ctrlKey;
                          onElementSelect(element, isMultiSelect);
                          animationSelectionManager.clearSelection();
                        }}
                      >
                        <span className="text-sm">{getShapeIcon(element.type)}</span>
                        <span className="flex-1">{element.name}</span>
                        {hasAnimations && (
                          <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
                        )}
                      </div>
                      
                      {/* Element Visibility Toggle */}
                      <button
                        className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 rounded text-gray-500 hover:text-gray-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          const newVisible = !(element.visible ?? true);
                          onElementVisibilityChange(element.id, newVisible);
                        }}
                        title={`${element.visible === false ? 'Show' : 'Hide'} element`}
                      >
                        {element.visible === false ? (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                            <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                          </svg>
                        ) : (
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                            <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                    
                    {/* Element Animations */}
                    {isExpanded && hasAnimations && (
                      <ul className="ml-6 mt-1 space-y-1">
                        {element.animations.map(animation => (
                          <li key={animation.id}>
                            <div 
                              className="px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                                                 // For element animations
                                 onElementSelect(element);
                                 // Need to investigate animation selection pattern for elements
                              }}
                            >
                              <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                              <span className="flex-1">{animation.type}</span>
                              <span className="text-xs text-gray-400">
                                {animation.startTime.toFixed(1)}s → {(animation.startTime + animation.duration).toFixed(1)}s
                              </span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </li>
                );
              })}

              {/* Empty state */}
              {groups.filter(g => !g.isDefaultGroup).length === 0 && ungroupedElements.length === 0 && (
                <li className="px-2 py-4 text-gray-500 text-center">
                  No elements to display
                </li>
              )}
            </ul>
          </details>
        </li>
      </ul>
    </div>
  );
} 