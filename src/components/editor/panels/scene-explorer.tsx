import { useState, useEffect } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { SelectionManager } from '@/lib/selection-manager';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectionManager: SelectionManager;
}

export function SceneExplorer({ elements, groups, selectionManager }: SceneExplorerProps) {
  // Filter out animation paths and character elements (characters will be shown under their group parent)
  const shapes = elements.filter(element => !element.isAnimationPath && element.type !== 'character' && element.type !== 'textGroup');
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Helper function to get characters for a text group
  const getCharactersForTextGroup = (groupId: string): AnimatedCanvasObject[] => {
    const group = groups.find(g => g.id === groupId && g.type === 'text');
    if (!group) return [];
    
    return elements
      .filter(el => el.type === 'character' && group.elementIds.includes(el.id))
      .sort((a, b) => (a.characterIndex || 0) - (b.characterIndex || 0));
  };

  // Helper function to get group elements (non-character elements)
  const getGroupElements = (groupId: string): AnimatedCanvasObject[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return elements.filter(el => group.elementIds.includes(el.id) && el.type !== 'character');
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
      'textGroup': '📄',
      'character': '🔤'
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
      selectionManager.select(null);
      animationSelectionManager.clearSelection();
    }
  };

  // Get elements that are not in any non-default group
  const ungroupedElements = shapes.filter(element => {
    const group = groups.find(g => g.elementIds.includes(element.id));
    return !group || group.isDefaultGroup;
  });

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
                  const characters = group.type === 'text' ? getCharactersForTextGroup(group.id) : [];
                  const hasAnimations = group.animations.length > 0;
                  const hasCharacters = characters.length > 0;
                  const hasElements = groupElements.length > 0;
                  const shouldShowExpandButton = hasAnimations || hasCharacters || (hasElements && group.type !== 'text');
                  const isSelected = selectionManager.getSelectedGroups().some(g => g.id === group.id);

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
                        <div
                          className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-purple-600 flex items-center gap-2 ${
                            isSelected ? 'bg-purple-100 text-purple-600' : ''
                          }`}
                          onClick={(e) => {
                            e.stopPropagation();
                            const isMultiSelect = e.metaKey || e.ctrlKey;
                            const elementsInGroup = elements.filter(el => group.elementIds.includes(el.id));
                            selectionManager.select(elementsInGroup, isMultiSelect);
                            animationSelectionManager.clearSelection();
                          }}
                        >
                          <span className="text-sm">{getGroupIcon(group.type)}</span>
                          <span className="flex-1">{group.name}</span>
                          <span className="text-xs text-gray-500">
                            ({group.elementIds.length} items)
                            {hasAnimations && ` • ${group.animations.length} anim`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Group Children */}
                      {isGroupExpanded && (
                        <ul className="ml-6 mt-1 space-y-1">
                          {/* For text groups, show characters */}
                          {group.type === 'text' && hasCharacters && characters.map(character => (
                            <li key={character.id}>
                              <div 
                                className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-orange-600 flex items-center gap-2 text-sm ${
                                  selectionManager.isSelected(character) ? 'bg-orange-100 text-orange-700' : ''
                                } ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) return; // Prevent character selection if group is selected
                                  const isMultiSelect = e.metaKey || e.ctrlKey;
                                  selectionManager.select(character, isMultiSelect);
                                  animationSelectionManager.clearSelection();
                                }}
                              >
                                <span className="text-xs">{getShapeIcon(character.type)}</span>
                                <span className="flex-1">{character.character || 'char'}</span>
                                <span className="text-xs text-gray-400">#{character.characterIndex}</span>
                              </div>
                            </li>
                          ))}

                          {/* For custom/polygon groups, show elements */}
                          {(group.type === 'custom' || group.type === 'polygon') && hasElements && groupElements.map(element => (
                            <li key={element.id}>
                              <div 
                                className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2 text-sm ${
                                  selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-700' : ''
                                } ${isSelected ? 'opacity-50 cursor-not-allowed' : ''}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (isSelected) return; // Prevent element selection if group is selected
                                  const isMultiSelect = e.metaKey || e.ctrlKey;
                                  selectionManager.select(element, isMultiSelect);
                                  animationSelectionManager.clearSelection();
                                }}
                              >
                                <span className="text-xs">{getShapeIcon(element.type)}</span>
                                <span className="flex-1">{element.name}</span>
                                {element.animations.length > 0 && (
                                  <span className="text-xs text-gray-400">({element.animations.length} anim)</span>
                                )}
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
                                    selectionManager.select(elementsInGroup[0]);
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
                                 selectionManager.select(element);
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