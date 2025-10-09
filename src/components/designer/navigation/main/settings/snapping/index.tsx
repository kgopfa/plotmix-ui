import React from 'react';
import { Move3D } from 'lucide-react';
import { GridConfig } from '../../../../../../utils/grid-utils';
import { ElementSnappingConfig } from '../../../../../../hooks/use-element-snapping';

interface SnappingOptionsProps {
  // Grid configuration
  gridConfig: GridConfig;
  onToggleGridSnap: () => void;
  
  // Element snapping configuration
  elementSnapConfig: ElementSnappingConfig;
  onToggleElementSnap: () => void;
  onToggleGuides: () => void;
  
  // Shared state
  isGridSnapTemporarilyDisabled?: boolean;
  isElementSnapTemporarilyDisabled?: boolean;
}

export const SnappingOptions: React.FC<SnappingOptionsProps> = ({
  gridConfig,
  onToggleGridSnap,
  elementSnapConfig,
  onToggleElementSnap,
  onToggleGuides,
  isGridSnapTemporarilyDisabled = false,
  isElementSnapTemporarilyDisabled = false
}) => {

  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl py-6 px-5 space-y-5 border border-gray-200/50 w-64">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200/50">
        <div className="p-1.5 bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg">
          <Move3D className="w-4 h-4 text-cyan-600" />
        </div>
        <div className="text-sm font-semibold text-gray-900">Snapping Options</div>
      </div>
      
      {/* Toggle Options */}
      <div className="space-y-3">
        {/* Grid Snap Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/50 hover:bg-gray-100 transition-colors">
          <span className="text-sm text-gray-900 font-medium">
            Snap to Grid
            {isGridSnapTemporarilyDisabled && (
              <span className="text-orange-600 ml-1 text-xs font-semibold">(⇧ disabled)</span>
            )}
          </span>
          <button
            onClick={onToggleGridSnap}
            className={`w-11 h-6 rounded-full flex items-center transition-all duration-200 ${
              gridConfig.enabled && !isGridSnapTemporarilyDisabled 
                ? 'bg-gradient-to-r from-green-500 to-green-600 shadow-sm' 
                : 'bg-gray-300'
            }`}
            title="Toggle grid snapping"
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                gridConfig.enabled && !isGridSnapTemporarilyDisabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
        
        {/* Element Snap Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/50 hover:bg-gray-100 transition-colors">
          <span className="text-sm text-gray-900 font-medium">
            Snap to Elements
            {isElementSnapTemporarilyDisabled && (
              <span className="text-orange-600 ml-1 text-xs font-semibold">(⇧ disabled)</span>
            )}
          </span>
          <button
            onClick={onToggleElementSnap}
            className={`w-11 h-6 rounded-full flex items-center transition-all duration-200 ${
              elementSnapConfig.enabled && !isElementSnapTemporarilyDisabled 
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-sm' 
                : 'bg-gray-300'
            }`}
            title="Toggle snapping to other elements"
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                elementSnapConfig.enabled && !isElementSnapTemporarilyDisabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Show Snap Guides Toggle */}
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200/50 hover:bg-gray-100 transition-colors">
          <span className="text-sm text-gray-900 font-medium">Show Guides</span>
          <button
            onClick={onToggleGuides}
            className={`w-11 h-6 rounded-full flex items-center transition-all duration-200 ${
              elementSnapConfig.showGuides 
                ? 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-sm' 
                : 'bg-gray-300'
            }`}
            title="Show alignment guides when snapping"
          >
            <div
              className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${
                elementSnapConfig.showGuides ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}; 