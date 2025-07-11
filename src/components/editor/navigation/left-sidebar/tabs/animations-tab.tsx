import React from 'react';
import { Play, Pause, RotateCw, Move, Scale, Zap, Plus } from 'lucide-react';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { AnimationType, ElementAnimation, GsapEase } from '@/types/canvas';

export const AnimationsTab: React.FC = () => {
  const { isPlaying, currentTime, totalDuration } = useTimelineStore(state => state.playback);
  const { selectedElements } = useSelectionStore();
  const { addElementAnimation } = useCanvasStore();

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
    }
  ];

  const handleAddAnimation = (animationType: AnimationType) => {
    if (!selectedElement) return;

    const defaultProperties = {
      rotate: { rotation: 360 },
      scale: { scaleX: 1.5, scaleY: 1.5 },
      move: { x: selectedElement.x + 100, y: selectedElement.y },
      color: { fillColor: '#ff6b6b' },
      fade: { alpha: 0 },
      path: {
        pathPoints: [],
        pathDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
        yoyo: false,
      },
    };

    const newAnimation: ElementAnimation = {
      id: `${animationType}-${Date.now()}`,
      type: animationType,
      startTime: 0,
      duration: 1,
      properties: defaultProperties[animationType as keyof typeof defaultProperties] || {},
      easing: 'power1.inOut' as GsapEase,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false
    };

    addElementAnimation(selectedElement.id, newAnimation);
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = (time % 60).toFixed(1);
    return `${minutes}:${seconds.padStart(4, '0')}`;
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

          {/* Timeline Status */}
          <div className="p-3 bg-purple-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Timeline Status</div>
            <div className="flex items-center gap-2 mb-2">
              {isPlaying ? (
                <Pause className="w-4 h-4 text-purple-600" />
              ) : (
                <Play className="w-4 h-4 text-gray-400" />
              )}
              <span className="text-xs font-mono">
                {formatTime(currentTime)} / {formatTime(totalDuration)}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                isPlaying ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
              }`}>
                {isPlaying ? 'Playing' : 'Paused'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div 
                className="bg-purple-600 h-1 rounded-full transition-all duration-100"
                style={{ width: `${totalDuration > 0 ? (currentTime / totalDuration) * 100 : 0}%` }}
              />
            </div>
          </div>

          {/* Animation Controls */}
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Timeline Controls</div>
            <div className="flex flex-wrap gap-2">
              <button className="flex items-center gap-1 p-2 bg-white rounded border hover:bg-gray-50 text-xs">
                <Play className="w-3 h-3" />
                Play
              </button>
              <button className="flex items-center gap-1 p-2 bg-white rounded border hover:bg-gray-50 text-xs">
                <Pause className="w-3 h-3" />
                Pause
              </button>
              <button className="flex items-center gap-1 p-2 bg-white rounded border hover:bg-gray-50 text-xs">
                <RotateCw className="w-3 h-3" />
                Restart
              </button>
            </div>
          </div>

          {/* Properties */}
          <div className="p-3 bg-yellow-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Animatable Properties</div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-white rounded border">
                <Move className="w-3 h-3" />
                Position
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-white rounded border">
                <Scale className="w-3 h-3" />
                Scale
              </span>
              <span className="flex items-center gap-1 text-xs px-2 py-1 bg-white rounded border">
                <RotateCw className="w-3 h-3" />
                Rotation
              </span>
              <span className="text-xs px-2 py-1 bg-white rounded border">
                Opacity
              </span>
              <span className="text-xs px-2 py-1 bg-white rounded border">
                Color
              </span>
            </div>
          </div>

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