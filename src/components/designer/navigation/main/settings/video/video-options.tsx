import React, { useState } from 'react';
import { Video, Monitor, Settings, Zap } from 'lucide-react';
import { useCanvasState, useCanvasActions } from '@/stores/use-ui-store';

interface CanvasSize {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

export const VideoOptions: React.FC = () => {
  const canvasState = useCanvasState();
  const { setCanvasSize } = useCanvasActions();

  // Local state for custom dimensions
  const [frameRate, setFrameRate] = useState(30);
  const [quality, setQuality] = useState('high');

  // Get current canvas size
  const currentSize = canvasState.currentSizeId === 'custom'
    ? canvasState.customSize
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  const frameRateOptions = [24, 30, 60];
  const qualityOptions = [
    { value: 'low', label: 'Low (720p)', description: 'Smaller file size' },
    { value: 'medium', label: 'Medium (1080p)', description: 'Balanced' },
    { value: 'high', label: 'High (1440p)', description: 'Better quality' },
    { value: 'ultra', label: 'Ultra (4K)', description: 'Best quality' }
  ];

  const handleSizeChange = (sizeId: string) => {
    setCanvasSize(sizeId);
  };

  return (
    <div className="bg-white shadow-2xl rounded-lg p-4 space-y-4 border border-gray-200 backdrop-blur-sm min-w-80">
      <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <Video className="w-4 h-4 mr-2 text-blue-600" />
        Video Settings
      </div>

      {/* Canvas Resolution Section */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Monitor className="w-3 h-3" />
          Canvas Resolution
        </div>

        {/* Current Resolution Display */}
        <div className="p-2 bg-blue-50 rounded-lg">
          <div className="text-sm font-medium text-blue-800">
            {currentSize ? `${currentSize.width} × ${currentSize.height}` : '1920 × 1080'}
          </div>
          <div className="text-xs text-blue-600">
            {canvasState.currentSizeId === 'custom'
              ? '16:9 • Custom'
              : `${(currentSize as CanvasSize)?.aspectRatio || '16:9'} • ${(currentSize as CanvasSize)?.name || 'Custom'}`
            }
          </div>
        </div>

        {/* Preset Sizes */}
        <div className="space-y-2">
          <div className="text-xs font-medium text-gray-600">Presets:</div>
          <div className="grid grid-cols-2 gap-1">
            {canvasState.availableSizes.map((size) => (
              <button
                key={size.id}
                onClick={() => handleSizeChange(size.id)}
                className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${canvasState.currentSizeId === size.id
                    ? 'bg-blue-500 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                  }`}
              >
                {size.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Frame Rate Section */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Zap className="w-3 h-3" />
          Frame Rate
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-800 font-medium">FPS</span>
          <span className="text-sm font-mono text-gray-700 bg-gray-100 px-2 py-1 rounded">{frameRate}</span>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {frameRateOptions.map((fps) => (
            <button
              key={fps}
              onClick={() => setFrameRate(fps)}
              className={`px-2 py-1.5 text-xs rounded transition-colors font-medium ${frameRate === fps
                  ? 'bg-green-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                }`}
            >
              {fps} FPS
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Quality Section */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide flex items-center gap-2">
          <Settings className="w-3 h-3" />
          Export Quality
        </div>

        <div className="space-y-2">
          {qualityOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setQuality(option.value)}
              className={`w-full text-left p-2 rounded transition-colors ${quality === option.value
                  ? 'bg-purple-50 border border-purple-200 text-purple-800'
                  : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'
                }`}
            >
              <div className="font-medium text-sm">{option.label}</div>
              <div className="text-xs text-gray-600">{option.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 