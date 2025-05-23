import { AnimatedCanvasElement } from '@/types/canvas';
import { SelectionManager } from '@/lib/selection-manager';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface SceneExplorerProps {
  elements: AnimatedCanvasElement[];
  selectionManager: SelectionManager;
}

export function SceneExplorer({ elements, selectionManager }: SceneExplorerProps) {
  const shapes = elements.filter(element => !element.isPath);
  const animationSelectionManager = AnimationSelectionManager.getInstance();

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

  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the aside element (empty space)
    if (e.target === e.currentTarget) {
      selectionManager.select(null);
      animationSelectionManager.clearSelection();
    }
  };

  return (
    <aside 
      className="w-80 min-w-48 max-w-xs bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto text-gray-800"
      onClick={handleEmptySpaceClick}
    >
      <h3 className="font-semibold mb-2">Scenes</h3>
      <ul>
        <li>
          <details open>
            <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
            <ul className="ml-4 mt-1 space-y-1">
              {shapes.map(element => (
                <li key={element.id}>
                  {/* Shape Item */}
                  <div
                    className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 flex items-center gap-2 ${
                      selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      selectionManager.select(element);
                      animationSelectionManager.clearSelection();
                    }}
                  >
                    <span className="text-sm">{getShapeIcon(element.type)}</span>
                    <span className="flex-1">{element.name}</span>
                    {element.animations.length > 0 && (
                      <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
                    )}
                  </div>
                  
                  {/* Animations Children */}
                  {element.animations.length > 0 && (
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
              ))}
              {shapes.length === 0 && (
                <li className="text-sm text-gray-500 italic">No shapes added yet</li>
              )}
            </ul>
          </details>
        </li>
      </ul>
    </aside>
  );
} 