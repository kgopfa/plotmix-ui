import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { useProjectManager } from '@/hooks/use-project-manager';
import { SnappingOptions } from './snap-options';

// Simplified interface - only for props that can't be accessed via stores
interface OptionsBarProps {
  canvasZoom: number;
  onImageImport: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

// Project Management Controls
const ProjectControls = () => {
  const {
    loadFromFile,
    downloadProject,
    isLoading,
    error
  } = useProjectManager();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState('');

  const handleSave = () => {
    try {
      downloadProject(projectName || 'my-animation-project');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadFromFile(file);
        console.log('Project loaded successfully');
      } catch (error) {
        console.error('Load failed:', error);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };





  return (
    <div className="flex items-center gap-2 border-r pr-2 mr-2">
      {/* Project Name Input */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project name"
          className="px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-24"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="btn disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Save Project"
      >
        💾
      </button>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="btn disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Load Project"
      >
        📁
      </button>



      {/* Loading/Error Indicators */}
      {isLoading && (
        <div className="text-xs text-blue-600">
          Loading...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 max-w-24 truncate" title={error}>
          Error: {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};

// Sub-components for better organization
const FileActions = () => (
  <div className="flex gap-2">
    <button className="btn">New Scene</button>
  </div>
);

const ImageImportButton = ({ onImageImport }: { onImageImport: () => void }) => (
  <button 
    className="btn"
    onClick={onImageImport}
    title="Import Image"
  >
    Import Image
  </button>
);

const PathModeIndicator = () => {
  const isPathMode = useUIStore(state => state.tools.isPathMode);
  const togglePathMode = useUIStore(state => state.togglePathMode);
  const setAnimationTarget = useUIStore(state => state.setAnimationTarget);

  if (!isPathMode) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm ml-2">
      <span className="font-medium">Drawing Animation Path</span>
      <button
        className="bg-white text-blue-500 px-2 py-0.5 rounded text-xs font-medium hover:bg-blue-100"
        onClick={() => {
          togglePathMode();
          setAnimationTarget(null);
        }}
      >
        Cancel
      </button>
    </div>
  );
};

const PanelToggleButtons = () => {
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const panelButtonRef = useRef<HTMLButtonElement>(null);
  const panelMenuRef = useRef<HTMLDivElement>(null);

  const leftPanelVisible = useUIStore(state => state.panels.leftPanelVisible);
  const rightPanelVisible = useUIStore(state => state.panels.rightPanelVisible);
  const isTimelineCollapsed = useUIStore(state => state.panels.isTimelineCollapsed);
  const toggleLeftPanel = useUIStore(state => state.toggleLeftPanel);
  const toggleRightPanel = useUIStore(state => state.toggleRightPanel);
  const toggleTimelineCollapse = useUIStore(state => state.toggleTimelineCollapse);

  // Handle click outside to close panel menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPanelMenu &&
        panelMenuRef.current &&
        panelButtonRef.current &&
        !panelMenuRef.current.contains(event.target as Node) &&
        !panelButtonRef.current.contains(event.target as Node)
      ) {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanelMenu]);

  // Handle escape key to close panel menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPanelMenu) {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPanelMenu]);

  const togglePanelMenu = useCallback(() => {
    setShowPanelMenu(!showPanelMenu);
  }, [showPanelMenu]);

  return (
    <div className="relative ml-2 border-l pl-2">
      <button
        ref={panelButtonRef}
        className={`btn flex items-center gap-1 ${showPanelMenu ? 'bg-blue-100' : ''}`}
        onClick={togglePanelMenu}
        title="Panel Options"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H21V21H3V3ZM5 5V19H8V5H5ZM10 5V19H19V5H10Z" fill="currentColor"/>
        </svg>
        <span className="text-sm font-medium">Panels</span>
        <svg 
          className={`w-3 h-3 transition-transform ${showPanelMenu ? 'rotate-180' : ''}`} 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Panel Options Menu */}
      {showPanelMenu && (
        <div
          ref={panelMenuRef}
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg"
          style={{ minWidth: '200px' }}
        >
          <div className="p-3 space-y-3">
            <div className="font-medium text-sm text-gray-700 pb-2">Panel Visibility</div>
            
            {/* Left Panel Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-sm text-gray-700">Scene Explorer</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={leftPanelVisible}
                  onChange={toggleLeftPanel}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${leftPanelVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${leftPanelVisible ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Right Panel Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                <span className="text-sm text-gray-700">Inspector</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rightPanelVisible}
                  onChange={toggleRightPanel}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${rightPanelVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${rightPanelVisible ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Timeline Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <span className="text-sm text-gray-700">Timeline</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isTimelineCollapsed}
                  onChange={toggleTimelineCollapse}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${!isTimelineCollapsed ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${!isTimelineCollapsed ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SnappingControls = () => {
  const [showSnappingOptions, setShowSnappingOptions] = useState(false);
  const snappingButtonRef = useRef<HTMLButtonElement>(null);
  const snappingMenuRef = useRef<HTMLDivElement>(null);

  // Grid snapping hook
  const { 
    gridConfig, 
    setGridConfig, 
    toggleGrid, 
    toggleSnapEnabled,
    isSnapTemporarilyDisabled 
  } = useGridSnapping({
    size: 10,
    enabled: true,
    visible: false,
    snapThreshold: 8
  });

  // Element snapping hook
  const {
    config: elementSnapConfig,
    setConfig: setElementSnapConfig,
    toggleEnabled: toggleElementSnap,
    toggleGuides: toggleElementSnapGuides,
    toggleSpacing: toggleElementSpacing,
    toggleDistribution: toggleElementDistribution,
    isSnapTemporarilyDisabled: isElementSnapDisabled
  } = useElementSnapping({
    enabled: true,
    snapThreshold: 10,
    showGuides: true,
    enableSpacing: true,
    enableDistribution: true
  });

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
            onToggleGrid={toggleGrid}
            onToggleGridSnap={toggleSnapEnabled}
            onGridSizeChange={(size: number) => setGridConfig({ size })}
            elementSnapConfig={elementSnapConfig}
            onToggleElementSnap={toggleElementSnap}
            onToggleGuides={toggleElementSnapGuides}
            onToggleSpacing={toggleElementSpacing}
            onToggleDistribution={toggleElementDistribution}
            onSnapThresholdChange={(threshold: number) => setElementSnapConfig({ snapThreshold: threshold })}
            isGridSnapTemporarilyDisabled={isSnapTemporarilyDisabled}
            isElementSnapTemporarilyDisabled={isElementSnapDisabled}
          />
        </div>
      )}
    </div>
  );
};

const SelectionIndicator = ({ onGroupElements, onUngroupElements }: {
  onGroupElements: () => void;
  onUngroupElements: () => void;
}) => {
  const selectedObjects = useSelectionStore(state => state.selectedElements);
  const selectedGroups = useSelectionStore(state => state.selectedGroups);

  if (selectedObjects.length === 0) return null;

  return (
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
  );
};

const ZoomControls = ({ 
  canvasZoom, 
  onZoomIn, 
  onZoomOut, 
  onResetZoom 
}: {
  canvasZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
}) => (
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
);

export const OptionsBar: React.FC<OptionsBarProps> = ({
  canvasZoom,
  onImageImport,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onGroupElements,
  onUngroupElements
}) => {
  return (
    <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow z-20">
      <div className="flex gap-2">
        <ProjectControls />
        <FileActions />
        <ImageImportButton onImageImport={onImageImport} />
        <PathModeIndicator />
        <PanelToggleButtons />
        <SnappingControls />
        <SelectionIndicator 
          onGroupElements={onGroupElements}
          onUngroupElements={onUngroupElements}
        />
      </div>
      
      <div className="flex gap-2 items-center">
        <button className="btn">Export ▼</button>
        <ZoomControls 
          canvasZoom={canvasZoom}
          onZoomIn={onZoomIn}
          onZoomOut={onZoomOut}
          onResetZoom={onResetZoom}
        />
      </div>
    </div>
  );
}; 