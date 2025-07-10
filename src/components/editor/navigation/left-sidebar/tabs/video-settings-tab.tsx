import React from 'react';
import { Video } from 'lucide-react';
import { useCanvasState } from '@/stores/use-ui-store';

export const VideoSettingsTab: React.FC = () => {
  const canvasState = useCanvasState();
  
  // Get current canvas size
  const currentSize = canvasState.currentSizeId === 'custom' 
    ? canvasState.customSize 
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Video className="w-5 h-5 text-blue-600" />
          <h3 className="font-semibold text-gray-900">Video Settings</h3>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 text-sm text-gray-600">
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-700 mb-1">Canvas Size</div>
            <div>
              {currentSize ? `${currentSize.width} × ${currentSize.height}` : '1920 × 1080'} (16:9)
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-700 mb-1">Frame Rate</div>
            <div>30 FPS</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-700 mb-1">Duration</div>
            <div>Auto (based on timeline)</div>
          </div>
          <div className="p-3 bg-gray-50 rounded">
            <div className="font-medium text-gray-700 mb-1">Export Format</div>
            <div>MP4, WebM, GIF</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 