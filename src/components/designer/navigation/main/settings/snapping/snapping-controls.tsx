import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSnappingState, useSnappingActions } from '@/stores/use-ui-store';
import { SnappingOptions } from './snap-options';

export const SnappingControls = () => {
  const [showSnappingOptions, setShowSnappingOptions] = useState(false);
  const snappingButtonRef = useRef<HTMLButtonElement>(null);
  const snappingMenuRef = useRef<HTMLDivElement>(null);

  // Get snapping state from UI store
  const snappingState = useSnappingState();
  const { gridConfig, elementSnapConfig, isGridSnapTemporarilyDisabled, isElementSnapTemporarilyDisabled } = snappingState;

  // Get snapping actions from UI store
  const {
    updateGridConfig,
    updateElementSnapConfig
  } = useSnappingActions();

  // Create toggle functions for the UI
  const toggleGridSnap = useCallback(() => {
    updateGridConfig({ enabled: !gridConfig.enabled });
  }, [gridConfig.enabled, updateGridConfig]);

  const toggleElementSnap = useCallback(() => {
    updateElementSnapConfig({ enabled: !elementSnapConfig.enabled });
  }, [elementSnapConfig.enabled, updateElementSnapConfig]);

  const toggleGuides = useCallback(() => {
    updateElementSnapConfig({ showGuides: !elementSnapConfig.showGuides });
  }, [elementSnapConfig.showGuides, updateElementSnapConfig]);

  const toggleSpacing = useCallback(() => {
    updateElementSnapConfig({ enableSpacing: !elementSnapConfig.enableSpacing });
  }, [elementSnapConfig.enableSpacing, updateElementSnapConfig]);

  const toggleDistribution = useCallback(() => {
    updateElementSnapConfig({ enableDistribution: !elementSnapConfig.enableDistribution });
  }, [elementSnapConfig.enableDistribution, updateElementSnapConfig]);

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
    <div className="relative border-l pl-2">
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
            onToggleGridSnap={toggleGridSnap}
            onGridSizeChange={(size: number) => updateGridConfig({ size })}
            elementSnapConfig={elementSnapConfig}
            onToggleElementSnap={toggleElementSnap}
            onToggleGuides={toggleGuides}
            onToggleSpacing={toggleSpacing}
            onToggleDistribution={toggleDistribution}
            onSnapThresholdChange={(threshold: number) => updateElementSnapConfig({ snapThreshold: threshold })}
            isGridSnapTemporarilyDisabled={isGridSnapTemporarilyDisabled}
            isElementSnapTemporarilyDisabled={isElementSnapTemporarilyDisabled}
          />
        </div>
      )}
    </div>
  );
}; 