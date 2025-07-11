import React from 'react';
import { Play, Pause, RotateCw, Move, Scale, Zap } from 'lucide-react';
import { useTimelineStore } from '@/stores/use-timeline-store';

export const AnimationsTab: React.FC = () => {
  const { isPlaying, currentTime, totalDuration } = useTimelineStore(state => state.playback);

  const animationTypes = [
    {
      name: 'Fade In/Out',
      description: 'Opacity transitions',
      icon: '🌫️',
      category: 'Opacity'
    },
    {
      name: 'Scale',
      description: 'Resize elements smoothly',
      icon: '🔄',
      category: 'Transform'
    },
    {
      name: 'Move',
      description: 'Position animations',
      icon: '📍',
      category: 'Transform'
    },
    {
      name: 'Rotate',
      description: 'Rotation effects',
      icon: '🌀',
      category: 'Transform'
    },
    {
      name: 'Slide',
      description: 'Sliding transitions',
      icon: '➡️',
      category: 'Motion'
    },
    {
      name: 'Bounce',
      description: 'Spring animations',
      icon: '🏀',
      category: 'Motion'
    }
  ];

  const easingTypes = [
    { name: 'Linear', value: 'none' },
    { name: 'Ease In', value: 'power2.in' },
    { name: 'Ease Out', value: 'power2.out' },
    { name: 'Ease In-Out', value: 'power2.inOut' },
    { name: 'Bounce', value: 'bounce.out' },
    { name: 'Elastic', value: 'elastic.out' }
  ];

  const presets = [
    {
      name: 'Quick Fade',
      duration: '0.5s',
      type: 'Opacity',
      icon: '⚡'
    },
    {
      name: 'Smooth Scale',
      duration: '1.0s',
      type: 'Transform',
      icon: '🎯'
    },
    {
      name: 'Slide Entry',
      duration: '0.8s',
      type: 'Motion',
      icon: '🚀'
    }
  ];

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

          {/* Quick Presets */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Quick Presets</div>
            {presets.map((preset, index) => (
              <button
                key={index}
                className="w-full p-3 bg-purple-50 hover:bg-purple-100 rounded-lg text-left transition-colors border border-transparent hover:border-purple-200"
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{preset.icon}</span>
                    <div className="font-medium text-gray-700">{preset.name}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {preset.duration}
                  </span>
                </div>
                <div className="text-gray-600 text-xs ml-6">{preset.type}</div>
              </button>
            ))}
          </div>

          {/* Animation Types */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Animation Types</div>
            <div className="grid grid-cols-2 gap-2">
              {animationTypes.map((type, index) => (
                <div key={index} className="p-2 bg-white rounded border text-center">
                  <div className="text-lg mb-1">{type.icon}</div>
                  <div className="text-xs font-medium text-gray-700">{type.name}</div>
                  <div className="text-xs text-gray-500">{type.category}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Easing Functions */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Easing Functions</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              {easingTypes.map((easing, index) => (
                <div key={index} className="p-2 bg-white rounded border text-center">
                  <div className="font-medium text-gray-700">{easing.name}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Animation Controls */}
          <div className="p-3 bg-green-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Animation Controls</div>
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
            </div>
          </div>

          {/* Tips */}
          <div className="p-3 bg-gradient-to-r from-purple-100 to-pink-100 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Animation Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Use ease-out for natural feeling motion</div>
              <div>• Keep durations under 1 second for UI</div>
              <div>• Group related animations together</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 