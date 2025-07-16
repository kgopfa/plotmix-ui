import React from 'react';
import { Zap, Plus } from 'lucide-react';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSetActiveRightPanel, useUIStore } from '@/stores/use-ui-store';
import { AnimationType, ElementAnimation, GsapEase } from '@/types/canvas';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { generateAnimationDisplayName } from '@/utils/animation-utils';

export const AnimationsTab: React.FC = () => {
  const { selectedElements, select } = useSelectionStore();
  const { addElementAnimation, getElementById } = useCanvasStore();
  const setActiveRightPanel = useSetActiveRightPanel();
  const animationSelectionManager = AnimationSelectionManager.getInstance();

  const selectedElement = selectedElements.length === 1 ? selectedElements[0] : null;
  const hasSelection = selectedElements.length > 0;

  const animationTypes = [
    {
      name: 'Fade In/Out',
      type: 'fade' as AnimationType,
      description: 'Opacity transitions',
      icon: '🌫️',
      category: 'Opacity'
    },
    {
      name: 'Scale',
      type: 'scale' as AnimationType,
      description: 'Resize elements smoothly',
      icon: '🔄',
      category: 'Transform'
    },
    {
      name: 'Move',
      type: 'move' as AnimationType,
      description: 'Position animations',
      icon: '📍',
      category: 'Transform'
    },
    {
      name: 'Rotate',
      type: 'rotate' as AnimationType,
      description: 'Rotation effects',
      icon: '🌀',
      category: 'Transform'
    },
    {
      name: 'Color Change',
      type: 'color' as AnimationType,
      description: 'Color transitions',
      icon: '🎨',
      category: 'Appearance'
    },
    {
      name: 'Path Motion',
      type: 'path' as AnimationType,
      description: 'Follow custom paths',
      icon: '〰️',
      category: 'Motion'
    },
    {
      name: 'Physics',
      type: 'physics' as AnimationType,
      description: 'Physics-based motion',
      icon: '⚽',
      category: 'Motion'
    }
  ];

  const handleAddAnimation = (animationType: AnimationType) => {
    if (!selectedElement) return;

    const defaultProperties = {
      rotate: { rotation: 360 },
      scale: { scaleX: 1.5, scaleY: 1.5 },
      move: { x: 0, y: 0 },
      color: { fillColor: '#ff6b6b' },
      fade: { alpha: 0 },
      path: {
        pathPoints: [],
        pathDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
        yoyo: false,
      },
      physics: {
        velocity: 400,
        angle: 60,
        gravity: 800,
        acceleration: undefined,
        accelerationAngle: undefined,
        friction: undefined,
        xProp: '',
        yProp: ''
      },
    };

    const newAnimation: ElementAnimation = {
      id: `${animationType}-${Date.now()}`,
      displayName: generateAnimationDisplayName(animationType, selectedElement.animations),
      type: animationType,
      startTime: 0,
      duration: 1,
      properties: defaultProperties[animationType as keyof typeof defaultProperties] || {},
      easing: 'power1.inOut' as GsapEase,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false
    };

    // Add the animation to the element
    addElementAnimation(selectedElement.id, newAnimation);

    // Get the updated element from canvas store and refresh selection store
    const updatedElement = getElementById(selectedElement.id);
    if (updatedElement) {
      select(updatedElement);
    }

    // Switch to the right sidebar animations panel
    setActiveRightPanel('animations');

    // Close the left sidebar animations tab
    const { setShowAnimationsTab } = useUIStore.getState();
    setShowAnimationsTab(false);

    // Select the newly created animation in the animations panel after the next render cycle
    setTimeout(() => {
      // Use the updated element for selection
      const finalUpdatedElement = getElementById(selectedElement.id);
      if (finalUpdatedElement) {
        animationSelectionManager.selectAnimation(finalUpdatedElement, newAnimation);
      }
    }, 50);
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">Animations</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 text-sm">
          {/* Selected Element Info */}
          {hasSelection && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="font-medium text-blue-900 mb-2 text-xs">Selected Element</div>
              {selectedElements.length === 1 ? (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-blue-700 font-medium">{selectedElement?.name}</span>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-0.5 rounded">
                    {selectedElement?.type}
                  </span>
                </div>
              ) : (
                <div className="text-blue-700">
                  {selectedElements.length} elements selected
                </div>
              )}
            </div>
          )}

          {/* No Selection State */}
          {!hasSelection && (
            <div className="p-4 bg-gray-50 rounded-lg text-center">
              <div className="text-gray-500 mb-2">💡</div>
              <div className="text-gray-600 text-xs">
                Select an element to create animations
              </div>
            </div>
          )}

          {/* Add Animation Section */}
          {selectedElement && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-medium text-gray-700 mb-3">
                <Plus className="w-4 h-4" />
                Add Animation
              </div>
              <div className="grid grid-cols-2 gap-2">
                {animationTypes.map((type, index) => (
                  <button
                    key={index}
                    onClick={() => handleAddAnimation(type.type)}
                    className="p-3 bg-white hover:bg-purple-50 border hover:border-purple-200 rounded-lg text-left transition-colors group"
                  >
                    <div className="text-lg mb-1">{type.icon}</div>
                    <div className="text-xs font-medium text-gray-700 group-hover:text-purple-700">
                      {type.name}
                    </div>
                    <div className="text-xs text-gray-500">{type.category}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">💡 Animation Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Right-click elements for quick &quot;Animate&quot; option</div>
              <div>• Animations appear in the right sidebar</div>
              <div>• Use ease-out for natural motion</div>
              <div>• Keep durations under 1 second for UI</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 