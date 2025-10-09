import React from 'react';
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
    <div className="bg-white shadow-2xl rounded-lg py-8 px-6 space-y-4 border border-gray-200 backdrop-blur-sm w-64">
      <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <svg className="w-4 h-4 mr-2 text-blue-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H5V5H3V3ZM7 3H9V5H7V3ZM11 3H13V5H11V3ZM15 3H17V5H15V3ZM19 3H21V5H19V3ZM3 7H5V9H3V7ZM7 7H9V9H7V7ZM11 7H13V9H11V7ZM15 7H17V9H15V7ZM19 7H21V9H19V7ZM3 11H5V13H3V11ZM7 11H9V13H7V11ZM11 11H13V9H11V11ZM15 11H17V13H15V11ZM19 11H21V13H19V11ZM3 15H5V17H3V15ZM7 15H9V17H7V15ZM11 15H13V17H11V15ZM15 15H17V17H15V15ZM19 15H21V17H19V17ZM3 19H5V21H3V19ZM7 19H9V21H7V19ZM11 19H13V21H11V19ZM15 19H17V21H15V19ZM19 19H21V21H19V19Z" fill="currentColor"/>
        </svg>
        Snapping Options
      </div>
      
      {/* Grid Section (visibility toggle removed) */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Grid</div>

        {/* Grid Snap Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-800 font-normal">
            Snap to Grid
            {isGridSnapTemporarilyDisabled && (
              <span className="text-orange-600 ml-1 text-xs font-semibold">(⇧ disabled)</span>
            )}
          </span>
          <button
            onClick={onToggleGridSnap}
            className={`w-11 h-6 rounded-full flex items-center transition-colors ${
              gridConfig.enabled && !isGridSnapTemporarilyDisabled ? 'bg-green-500' : 'bg-gray-300'
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
      </div>

      {/* Divider */}
      <div className="border-t border-gray-200"></div>

      {/* Element Snapping Section */}
      <div className="space-y-3">
        <div className="text-xs font-semibold text-gray-700 uppercase tracking-wide">Element Snapping</div>
        
        {/* Element Snap Toggle */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-800 font-normal">
            Snap to Elements
            {isElementSnapTemporarilyDisabled && (
              <span className="text-orange-600 ml-1 text-xs font-semibold">(⇧ disabled)</span>
            )}
          </span>
          <button
            onClick={onToggleElementSnap}
            className={`w-11 h-6 rounded-full flex items-center transition-colors ${
              elementSnapConfig.enabled && !isElementSnapTemporarilyDisabled ? 'bg-blue-500' : 'bg-gray-300'
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
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-800 font-normal">Show Guides</span>
          <button
            onClick={onToggleGuides}
            className={`w-11 h-6 rounded-full flex items-center transition-colors ${
              elementSnapConfig.showGuides ? 'bg-green-500' : 'bg-gray-300'
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