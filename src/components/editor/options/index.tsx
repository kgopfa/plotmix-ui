import React, { useRef, useState, useEffect, useCallback } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
// SelectionManager removed - now using state-based selection
import { SnappingOptions } from './snap-options';
import { GridConfig } from '@/utils/grid-utils';
import { ElementSnappingConfig } from '@/hooks/use-element-snapping';

interface OptionsBarProps {
  selectedObjects: AnimatedCanvasObject[];
  selectedGroups: CanvasGroup[];
  groups: CanvasGroup[];
  canvasZoom: number;
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  onToggleLeftPanel: () => void;
  onToggleRightPanel: () => void;
  onImageImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
  // Snapping props
  gridConfig: GridConfig;
  onToggleGrid: () => void;
  onToggleGridSnap: () => void;
  onGridSizeChange: (size: number) => void;
  elementSnapConfig: ElementSnappingConfig;
  onToggleElementSnap: () => void;
  onToggleGuides: () => void;
  onToggleSpacing: () => void;
  onToggleDistribution: () => void;
  onSnapThresholdChange: (threshold: number) => void;
  isGridSnapTemporarilyDisabled?: boolean;
  isElementSnapTemporarilyDisabled?: boolean;
  // Path mode props
  isPathMode?: boolean;
  onExitPathMode?: () => void;
}

export const OptionsBar: React.FC<OptionsBarProps> = ({
  selectedObjects,
  selectedGroups,
  canvasZoom,
  leftPanelVisible,
  rightPanelVisible,
  onToggleLeftPanel,
  onToggleRightPanel,
  onImageImport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onGroupElements,
  onUngroupElements,
  gridConfig,
  onToggleGrid,
  onToggleGridSnap,
  onGridSizeChange,
  elementSnapConfig,
  onToggleElementSnap,
  onToggleGuides,
  onToggleSpacing,
  onToggleDistribution,
  onSnapThresholdChange,
  isGridSnapTemporarilyDisabled = false,
  isElementSnapTemporarilyDisabled = false,
  isPathMode = false,
  onExitPathMode
}) => {
  const [showSnappingOptions, setShowSnappingOptions] = useState(false);
  const snappingButtonRef = useRef<HTMLButtonElement>(null);
  const snappingMenuRef = useRef<HTMLDivElement>(null);

  // Handle click outside to close snapping menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showSnappingOptions &&
        snappingMenuRef.current &&
        snappingButtonRef.current &&
        !snappingMenuRef.current.contains(event.target as Node) &&
        !snappingButtonRef.current.contains(event.target as Node)
      ) {
        setShowSnappingOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSnappingOptions]);

  // Handle escape key to close snapping menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showSnappingOptions) {
        setShowSnappingOptions(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showSnappingOptions]);

  const toggleSnappingOptions = useCallback(() => {
    setShowSnappingOptions(!showSnappingOptions);
  }, [showSnappingOptions]);

  return (
    <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow z-20">
      <div className="flex gap-2">
        <button className="btn">New Scene</button>
        <button className="btn">Save</button>
        <button className="btn">Revert</button>
        <button 
          className="btn"
          onClick={onImageImport}
          title="Import Image"
        >
          Import Image
        </button>

        {/* Path mode indicator */}
        {isPathMode && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm ml-2">
            <span className="font-medium">Drawing Animation Path</span>
            <button
              className="bg-white text-blue-500 px-2 py-0.5 rounded text-xs font-medium hover:bg-gray-100"
              onClick={onExitPathMode}
            >
              Cancel
            </button>
          </div>
        )}

        <div className="flex gap-1 ml-2 border-l pl-2">
          <button 
            className={`btn ${leftPanelVisible ? 'bg-blue-100' : ''}`}
            onClick={onToggleLeftPanel}
            title="Toggle Scene Explorer"
          >
            📋
          </button>
          <button 
            className={`btn ${rightPanelVisible ? 'bg-blue-100' : ''}`}
            onClick={onToggleRightPanel}
            title="Toggle Inspector"
          >
            🔧
          </button>
        </div>

        {/* Snapping Options Button */}
        <div className="relative ml-2 border-l pl-2">
          <button
            ref={snappingButtonRef}
            className={`btn flex items-center gap-1 ${showSnappingOptions ? 'bg-blue-100' : ''}`}
            onClick={toggleSnappingOptions}
            title="Snapping Options"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M3 3H5V5H3V3ZM7 3H9V5H7V3ZM11 3H13V5H11V3ZM15 3H17V5H15V3ZM19 3H21V5H19V3ZM3 7H5V9H3V7ZM7 7H9V9H7V7ZM11 7H13V9H11V7ZM15 7H17V9H15V7ZM19 7H21V9H19V7Z" fill="currentColor"/>
            </svg>
            <span className="text-sm font-medium">Snapping</span>
            <svg 
              className={`w-3 h-3 transition-transform ${showSnappingOptions ? 'rotate-180' : ''}`} 
              viewBox="0 0 12 12" 
              fill="none"
            >
              <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          {/* Floating Snapping Options Menu */}
          {showSnappingOptions && (
            <div
              ref={snappingMenuRef}
              className="absolute top-full left-0 mt-1 z-50"
              style={{ minWidth: '320px' }}
            >
              <SnappingOptions
                gridConfig={gridConfig}
                onToggleGrid={onToggleGrid}
                onToggleGridSnap={onToggleGridSnap}
                onGridSizeChange={onGridSizeChange}
                elementSnapConfig={elementSnapConfig}
                onToggleElementSnap={onToggleElementSnap}
                onToggleGuides={onToggleGuides}
                onToggleSpacing={onToggleSpacing}
                onToggleDistribution={onToggleDistribution}
                onSnapThresholdChange={onSnapThresholdChange}
                isGridSnapTemporarilyDisabled={isGridSnapTemporarilyDisabled}
                isElementSnapTemporarilyDisabled={isElementSnapTemporarilyDisabled}
              />
            </div>
          )}
        </div>

        {/* Multi-select indicator and grouping controls */}
        {selectedObjects.length > 0 && (
          <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-sm ml-2">
            <span className="text-blue-600 font-medium">
              {selectedObjects.length} object{selectedObjects.length !== 1 ? 's' : ''} selected
            </span>
            {selectedObjects.length > 1 && (
              <span className="text-blue-500 text-xs">
                Multi-select active
              </span>
            )}
            
            {/* Grouping buttons */}
            <div className="flex gap-1 ml-2 border-l pl-2">
              {selectedObjects.length > 1 && (
                <button
                  className="btn-sm bg-green-500 text-white hover:bg-green-600"
                  onClick={onGroupElements}
                  title="Group selected elements"
                >
                  📦 Group
                </button>
              )}
              {selectedGroups.length > 0 && selectedGroups.some(group => !group.isDefaultGroup) && (
                <button
                  className="btn-sm bg-orange-500 text-white hover:bg-orange-600"
                  onClick={onUngroupElements}
                  title="Ungroup selected group"
                >
                  📤 Ungroup
                </button>
              )}
            </div>
          </div>
        )}
      </div>
      
      <div className="flex gap-2 items-center">
        <button className="btn">Export ▼</button>
        <div className="flex gap-1 items-center border-r pr-2 mr-2">
          <button 
            className="btn" 
            onClick={onZoomOut}
          >
            −
          </button>
          <span className="text-xs text-gray-600 min-w-[40px] text-center">
            {Math.round(canvasZoom * 100)}%
          </span>
          <button 
            className="btn" 
            onClick={onZoomIn}
          >
            +
          </button>
          <button 
            className="btn ml-1" 
            onClick={onResetZoom}
            title="Reset to 100%"
          >
            100%
          </button>
        </div>
      </div>
    </div>
  );
}; 