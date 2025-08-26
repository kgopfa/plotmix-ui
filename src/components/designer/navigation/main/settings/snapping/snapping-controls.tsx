import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useSnappingState, useSnappingActions } from '@/stores/use-ui-store';
import { useSnappingPersistence } from '@/hooks/use-snapping-persistence';
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

  // Get persistence hook
  const { saveSnappingPreferences } = useSnappingPersistence();

  // Create toggle functions for the UI that also save to backend
  const toggleGridSnap = useCallback(async () => {
    updateGridConfig({ enabled: !gridConfig.enabled });
    await saveSnappingPreferences();
  }, [gridConfig.enabled, updateGridConfig, saveSnappingPreferences]);

  const toggleElementSnap = useCallback(async () => {
    updateElementSnapConfig({ enabled: !elementSnapConfig.enabled });
    await saveSnappingPreferences();
  }, [elementSnapConfig.enabled, updateElementSnapConfig, saveSnappingPreferences]);

  const toggleGuides = useCallback(async () => {
    updateElementSnapConfig({ showGuides: !elementSnapConfig.showGuides });
    await saveSnappingPreferences();
  }, [elementSnapConfig.showGuides, updateElementSnapConfig, saveSnappingPreferences]);

  const toggleSpacing = useCallback(async () => {
    updateElementSnapConfig({ enableSpacing: !elementSnapConfig.enableSpacing });
    await saveSnappingPreferences();
  }, [elementSnapConfig.enableSpacing, updateElementSnapConfig, saveSnappingPreferences]);

  const toggleDistribution = useCallback(async () => {
    updateElementSnapConfig({ enableDistribution: !elementSnapConfig.enableDistribution });
    await saveSnappingPreferences();
  }, [elementSnapConfig.enableDistribution, updateElementSnapConfig, saveSnappingPreferences]);

  // Handle grid size change with persistence
  const handleGridSizeChange = useCallback(async (size: number) => {
    updateGridConfig({ size });
    await saveSnappingPreferences();
  }, [updateGridConfig, saveSnappingPreferences]);

  // Handle snap threshold change with persistence
  const handleSnapThresholdChange = useCallback(async (threshold: number) => {
    updateElementSnapConfig({ snapThreshold: threshold });
    await saveSnappingPreferences();
  }, [updateElementSnapConfig, saveSnappingPreferences]);

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
          <path d="M3 3H5V5H3V3ZM7 3H9V5H7V3ZM11 3H13V5H11V3ZM15 3H17V5H15V3ZM19 3H21V5H19V3ZM3 7H5V9H3V7ZM7 7H9V9H7V7ZM11 7H13V9H11V7ZM15 7H17V9H15V7ZM19 7H21V9H19V7ZM3 11H5V13H3V11ZM7 11H9V13H7V11ZM11 11H13V9H11V11ZM15 11H17V13H15V11ZM19 11H21V13H19V11ZM3 15H5V17H3V15ZM7 15H9V17H7V15ZM11 15H13V17H11V15ZM15 15H17V17H15V15ZM19 15H21V17H19V17ZM3 19H5V21H3V19ZM7 19H9V21H7V19ZM11 19H13V21H11V19ZM15 19H17V21H15V19ZM19 19H21V21H19V19Z" fill="currentColor"/>
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

      {/* Test button to verify snapping state */}
      <button
        className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded"
        onClick={() => {
          console.log('Current snapping state:', {
            gridConfig,
            elementSnapConfig,
            isGridSnapTemporarilyDisabled,
            isElementSnapTemporarilyDisabled
          });
        }}
        title="Test snapping state"
      >
        Test
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
            onGridSizeChange={handleGridSizeChange}
            elementSnapConfig={elementSnapConfig}
            onToggleElementSnap={toggleElementSnap}
            onToggleGuides={toggleGuides}
            onToggleSpacing={toggleSpacing}
            onToggleDistribution={toggleDistribution}
            onSnapThresholdChange={handleSnapThresholdChange}
            isGridSnapTemporarilyDisabled={isGridSnapTemporarilyDisabled}
            isElementSnapTemporarilyDisabled={isElementSnapTemporarilyDisabled}
          />
        </div>
      )}
    </div>
  );
}; 