import React from 'react';
import { GridConfig } from '../../../utils/grid-utils';

interface GridControlsProps {
  gridConfig: GridConfig;
  onToggleGrid: () => void;
  onToggleSnap: () => void;
  onGridSizeChange: (size: number) => void;
  isSnapTemporarilyDisabled?: boolean;
}

export const GridControls: React.FC<GridControlsProps> = ({
  gridConfig,
  onToggleGrid,
  onToggleSnap,
  onGridSizeChange,
  isSnapTemporarilyDisabled = false
}) => {
  const gridSizes = [5, 10, 15, 20, 25, 50];

  return (
    <div className="bg-white shadow-lg rounded-lg p-3 space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Grid & Snap</div>
      
      {/* Grid Visibility Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Show Grid</span>
        <button
          onClick={onToggleGrid}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            gridConfig.visible ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          title="Toggle grid visibility"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              gridConfig.visible ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Snap Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Snap to Grid
          {isSnapTemporarilyDisabled && (
            <span className="text-orange-500 ml-1">(⇧ disabled)</span>
          )}
        </span>
        <button
          onClick={onToggleSnap}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            gridConfig.enabled && !isSnapTemporarilyDisabled ? 'bg-green-500' : 'bg-gray-300'
          }`}
          title="Toggle grid snapping (Hold Shift to temporarily disable)"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              gridConfig.enabled && !isSnapTemporarilyDisabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Grid Size */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Grid Size</span>
          <span className="text-xs font-mono text-gray-800">{gridConfig.size}px</span>
        </div>
        <div className="grid grid-cols-3 gap-1">
          {gridSizes.map((size) => (
            <button
              key={size}
              onClick={() => onGridSizeChange(size)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                gridConfig.size === size
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {size}px
            </button>
          ))}
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
        💡 Hold Shift to temporarily disable snapping
      </div>
    </div>
  );
}; 