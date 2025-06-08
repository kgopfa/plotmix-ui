import { useState, useEffect } from 'react';
import { AnimatedCanvasObject } from '@/types/canvas';
import { SelectionManager } from '@/lib/selection-manager';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  selectionManager: SelectionManager;
}

export function SceneExplorer({ elements, selectionManager }: SceneExplorerProps) {
  const shapes = elements.filter(element => !element.isAnimationPath);
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  const [selectedObjects, setSelectedObjects] = useState<AnimatedCanvasObject[]>([]);

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
      'svg': '🖼️'
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

  // Subscribe to selection changes
  useEffect(() => {
    return selectionManager.subscribe((selectionState) => {
      setSelectedObjects(selectionState.selectedObjects);
    });
  }, [selectionManager]);

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

  const handleShapeClick = (element: AnimatedCanvasObject, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (e.ctrlKey || e.metaKey) {
      // Multi-selection with Ctrl/Cmd
      selectionManager.toggleSelection(element);
    } else {
      // Single selection
      selectionManager.select(element);
    }
    
    animationSelectionManager.clearSelection();
  };

  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the aside element (empty space)
    if (e.target === e.currentTarget) {
      selectionManager.select(null);
      animationSelectionManager.clearSelection();
    }
  };

  const selectionCount = selectedObjects.length;
  const hasMultipleSelection = selectionCount > 1;

  return (
    <div 
      className="h-full p-2 text-gray-800"
      onClick={handleEmptySpaceClick}
    >
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-semibold">Scenes</h3>
        {selectionCount > 0 && (
          <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
            {selectionCount} selected
          </div>
        )}
      </div>

      {/* Multi-selection instructions */}
      {hasMultipleSelection && (
        <div className="mb-2 p-2 bg-blue-50 text-blue-700 text-xs rounded">
          <div className="font-medium mb-1">Multi-selection active</div>
          <div>Hold Ctrl/Cmd to add/remove objects</div>
        </div>
      )}

      <ul>
        <li>
          <details open>
            <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
            <ul className="ml-4 mt-1 space-y-1">
              {shapes.map(element => {
                const hasAnimations = element.animations.length > 0;
                const isExpanded = expandedShapes.has(element.id);
                const isSelected = selectionManager.isSelected(element);
                
                return (
                  <li key={element.id}>
                    {/* Shape Item */}
                    <div className="flex items-center">
                      {/* Collapse/Expand Button */}
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
                      
                      {/* Shape Content */}
                      <div
                        className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 flex items-center gap-2 ${
                          isSelected ? 'bg-blue-100 text-blue-600 ring-1 ring-blue-200' : ''
                        }`}
                        onClick={(e) => handleShapeClick(element, e)}
                      >
                        <span className="text-sm">{getShapeIcon(element.type)}</span>
                        <span className="flex-1">{element.name}</span>
                        {hasAnimations && (
                          <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
                        )}
                        {isSelected && hasMultipleSelection && (
                          <span className="text-xs bg-blue-200 text-blue-800 px-1 rounded">✓</span>
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