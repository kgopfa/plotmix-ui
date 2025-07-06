import React from 'react';
import { ProjectControls } from './project-controls';
import { PathModeIndicator } from './path-mode-indicator';
import { PanelToggleButtons } from './panel-toggle-buttons';
import { SnappingControls } from './snapping-controls';
import { SelectionIndicator } from './selection-indicator';

// Simplified interface - only for props that can't be accessed via stores
interface OptionsBarProps {
  canvasZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

export const OptionsBar: React.FC<OptionsBarProps> = ({
  onGroupElements,
  onUngroupElements
}) => {
  return (
    <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow z-[60]">
      <div className="flex items-center gap-2">
        <ProjectControls />
        <PathModeIndicator />
        <PanelToggleButtons />
        <SnappingControls />
        <SelectionIndicator 
          onGroupElements={onGroupElements}
          onUngroupElements={onUngroupElements}
        />
      </div>
    </div>
  );
}; 