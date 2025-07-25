import React from 'react';
import { ElementSnappingConfig } from '../../../../hooks/use-element-snapping';

interface ElementSnapControlsProps {
  config: ElementSnappingConfig;
  onToggleEnabled: () => void;
  onToggleGuides: () => void;
  onToggleSpacing: () => void;
  onToggleDistribution: () => void;
  onThresholdChange: (threshold: number) => void;
  isSnapTemporarilyDisabled?: boolean;
}

export const ElementSnapControls: React.FC<ElementSnapControlsProps> = ({
  config,
  onToggleEnabled,
  onToggleGuides,
  onToggleSpacing,
  onToggleDistribution,
  onThresholdChange,
  isSnapTemporarilyDisabled = false
}) => {
  const thresholdOptions = [5, 8, 10, 15, 20];

  return (
    <div className="bg-white shadow-lg rounded-lg p-3 space-y-3">
      <div className="text-sm font-medium text-gray-700 mb-2">Element Snapping</div>
      
      {/* Snap to Elements Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">
          Snap to Elements
          {isSnapTemporarilyDisabled && (
            <span className="text-orange-500 ml-1">(⇧ disabled)</span>
          )}
        </span>
        <button
          onClick={onToggleEnabled}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            config.enabled && !isSnapTemporarilyDisabled ? 'bg-blue-500' : 'bg-gray-300'
          }`}
          title="Toggle snapping to other elements"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              config.enabled && !isSnapTemporarilyDisabled ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Show Snap Guides Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Show Guides</span>
        <button
          onClick={onToggleGuides}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            config.showGuides ? 'bg-green-500' : 'bg-gray-300'
          }`}
          title="Show alignment guides when snapping"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              config.showGuides ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Equal Spacing Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Equal Spacing</span>
        <button
          onClick={onToggleSpacing}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            config.enableSpacing ? 'bg-purple-500' : 'bg-gray-300'
          }`}
          title="Snap to maintain equal spacing between elements"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              config.enableSpacing ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Distribution Toggle */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-600">Distribution</span>
        <button
          onClick={onToggleDistribution}
          className={`w-10 h-6 rounded-full flex items-center transition-colors ${
            config.enableDistribution ? 'bg-orange-500' : 'bg-gray-300'
          }`}
          title="Snap to evenly distribute elements"
        >
          <div
            className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
              config.enableDistribution ? 'translate-x-5' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Snap Threshold */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-600">Snap Distance</span>
          <span className="text-xs font-mono text-gray-800">{config.snapThreshold}px</span>
        </div>
        <div className="grid grid-cols-5 gap-1">
          {thresholdOptions.map((threshold) => (
            <button
              key={threshold}
              onClick={() => onThresholdChange(threshold)}
              className={`px-2 py-1 text-xs rounded transition-colors ${
                config.snapThreshold === threshold
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {threshold}px
            </button>
          ))}
        </div>
      </div>

      {/* Alignment Types Info */}
              <div className="space-y-1 pt-1 border-t border-gray-200">
          <div className="text-xs font-medium text-gray-600">Snap Points:</div>
          <div className="grid grid-cols-1 gap-1 text-xs text-gray-500">
            <div>• Element edges to element edges (red solid lines)</div>
            <div>• Element centers to element centers (blue dotted lines)</div>
            <div>• Element edges to canvas edges (blue solid lines)</div>
            <div>• Element centers to canvas center/midpoints (teal/light blue dotted lines)</div>
            <div>• Grid centers (green lines)</div>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            <span className="inline-block w-2 h-2 bg-red-500 rounded mr-1"></span>Edge alignment
            <br />
            <span className="inline-block w-2 h-2 bg-blue-500 rounded mr-1" style={{ borderStyle: 'dashed', borderWidth: '1px' }}></span>Center alignment
            <br />
            <span className="inline-block w-2 h-2" style={{ backgroundColor: '#2E86AB' }}></span>Canvas edges
            <br />
            <span className="inline-block w-2 h-2" style={{ backgroundColor: '#4ECDC4' }}></span>Canvas center
            <br />
            <span className="inline-block w-2 h-2" style={{ backgroundColor: '#45B7D1' }}></span>Canvas midpoints
            <br />
            <span className="inline-block w-2 h-2 bg-green-500 rounded mr-1"></span>Grid center alignment
            <br />
            <span className="inline-block w-2 h-2 bg-purple-500 rounded mr-1"></span>Equal spacing
            <br />
            <span className="inline-block w-2 h-2 bg-orange-500 rounded mr-1"></span>Distribution
          </div>
        </div>

      {/* Info */}
      <div className="text-xs text-gray-500 pt-1 border-t border-gray-200">
        💡 Hold Shift to temporarily disable snapping
      </div>
    </div>
  );
}; 