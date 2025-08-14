import React, { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { ChevronDown, Plus, Monitor, Smartphone, Tablet } from 'lucide-react';
import { useCanvasState, useCanvasActions } from '@/stores/use-ui-store';

export const CanvasSizeSelector: React.FC = () => {
  const canvasState = useCanvasState();
  const { setCanvasSize, setCustomCanvasSize } = useCanvasActions();
  const [showCustomDialog, setShowCustomDialog] = useState(false);
  const [customWidth, setCustomWidth] = useState('1920');
  const [customHeight, setCustomHeight] = useState('1080');

  // Auto-calculate height when width changes to maintain 16:9
  const handleWidthChange = (newWidth: string) => {
    setCustomWidth(newWidth);
    const width = parseInt(newWidth);
    if (width > 0) {
      const height = Math.round(width / (16/9));
      setCustomHeight(height.toString());
    }
  };

  // Get current canvas size for display
  const currentSize = canvasState.currentSizeId === 'custom' 
    ? canvasState.customSize 
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  const handleCustomSizeSubmit = () => {
    const width = parseInt(customWidth);
    const height = parseInt(customHeight);
    
    if (width > 0 && height > 0) {
      // Ensure 16:9 aspect ratio (allow small tolerance for rounding)
      const aspectRatio = width / height;
      const target169 = 16 / 9;
      const tolerance = 0.01;
      
      if (Math.abs(aspectRatio - target169) > tolerance) {
        // Auto-adjust height to maintain 16:9
        const adjustedHeight = Math.round(width / target169);
        setCustomHeight(adjustedHeight.toString());
        setCustomCanvasSize(width, adjustedHeight);
      } else {
        setCustomCanvasSize(width, height);
      }
      setShowCustomDialog(false);
    }
  };

  const displayText = currentSize 
    ? `${currentSize.width} × ${currentSize.height}`
    : 'Unknown Size';

  // Get screen size icon based on canvas dimensions
  const getScreenIcon = (width: number, height: number) => {
    const aspectRatio = width / height;
    if (aspectRatio > 1.5) {
      return <Monitor className="w-4 h-4" />;
    } else if (aspectRatio > 0.8) {
      return <Tablet className="w-4 h-4" />;
    } else {
      return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center space-x-2 px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
          <span className="flex items-center space-x-1">
            {currentSize && getScreenIcon(currentSize.width, currentSize.height)}
            <span>{displayText}</span>
          </span>
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </MenuButton>

        <MenuItems className="absolute right-0 mt-2 w-56 bg-white rounded-md shadow-lg border border-gray-200 z-50">
          <div className="py-1">
            {canvasState.availableSizes.map((size) => (
              <MenuItem key={size.id}>
                {({ active }) => (
                  <button
                    onClick={() => setCanvasSize(size.id)}
                    className={`${
                      active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                    } group flex items-center w-full px-4 py-2 text-sm`}
                  >
                    <span className="flex items-center space-x-2">
                      {getScreenIcon(size.width, size.height)}
                      <span>{size.name}</span>
                      <span className="text-gray-500">({size.width}×{size.height})</span>
                    </span>
                  </button>
                )}
              </MenuItem>
            ))}
            
            <div className="border-t border-gray-200 my-1"></div>
            
            <MenuItem>
              {({ active }) => (
                <button
                  onClick={() => setShowCustomDialog(true)}
                  className={`${
                    active ? 'bg-gray-100 text-gray-900' : 'text-gray-700'
                  } group flex items-center w-full px-4 py-2 text-sm`}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Custom Size
                </button>
              )}
            </MenuItem>
          </div>
        </MenuItems>
      </Menu>

      {/* Custom Size Dialog */}
      {showCustomDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-80">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Custom Canvas Size</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Width (px)
                </label>
                <input
                  type="number"
                  value={customWidth}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  min="1"
                  max="8192"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Height (px) <span className="text-xs text-gray-500">- auto-calculated for 16:9</span>
                </label>
                <input
                  type="number"
                  value={customHeight}
                  onChange={(e) => setCustomHeight(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-gray-50"
                  min="1"
                  max="8192"
                  readOnly
                />
              </div>

              {/* Common 16:9 Presets */}
              <div>
                <div className="text-sm font-medium text-gray-700 mb-2">16:9 Presets:</div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => { setCustomWidth('1920'); setCustomHeight('1080'); }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    1920×1080
                  </button>
                  <button
                    onClick={() => { setCustomWidth('3840'); setCustomHeight('2160'); }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    3840×2160
                  </button>
                  <button
                    onClick={() => { setCustomWidth('2560'); setCustomHeight('1440'); }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    2560×1440
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => setShowCustomDialog(false)}
                className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCustomSizeSubmit}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 rounded-md transition-colors"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 