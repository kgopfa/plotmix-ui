import React, { useState } from 'react';
import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faPlus } from '@fortawesome/free-solid-svg-icons';
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

  return (
    <>
      <Menu as="div" className="relative">
        <MenuButton className="flex items-center h-9 gap-2 px-3 py-1.5 text-gray-600 text-sm font-medium hover:bg-gray-100 border border-gray-200 rounded-md transition-colors">
          <span className="text-gray-600 font-medium">{displayText}</span>
          <FontAwesomeIcon icon={faChevronDown} className="mb-0.5 size-3 text-gray-600" />
        </MenuButton>

        <MenuItems
          transition
          className="absolute right-0 z-50 mt-2 w-64 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
        >
          {/* Standard Sizes */}
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
            Standard Sizes
          </div>
          
          {canvasState.availableSizes.map((size) => (
            <MenuItem key={size.id}>
              <button
                onClick={() => setCanvasSize(size.id)}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  canvasState.currentSizeId === size.id
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden'
                }`}
              >
                <div className="flex justify-between items-center">
                  <span>{size.name}</span>
                  <span className="text-xs text-gray-500">{size.width} × {size.height}</span>
                </div>
              </button>
            </MenuItem>
          ))}

          {/* Custom Size Option */}
          <div className="border-t border-gray-100 mt-1">
            <MenuItem>
              <button
                onClick={() => setShowCustomDialog(true)}
                className={`block w-full text-left px-4 py-2 text-sm transition-colors ${
                  canvasState.currentSizeId === 'custom'
                    ? 'bg-indigo-50 text-indigo-600 font-medium'
                    : 'text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faPlus} className="size-3" />
                  <span>Custom Size...</span>
                </div>
                {canvasState.currentSizeId === 'custom' && canvasState.customSize && (
                  <div className="text-xs text-gray-400 mt-0.5">
                    {canvasState.customSize.width} × {canvasState.customSize.height} (16:9)
                  </div>
                )}
              </button>
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
                    onClick={() => { setCustomWidth('1280'); setCustomHeight('720'); }}
                    className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                  >
                    1280×720
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
    </>
  );
}; 