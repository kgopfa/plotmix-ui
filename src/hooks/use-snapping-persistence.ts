import { useCallback } from 'react';
import { useSnappingState, useSnappingActions } from '@/stores/use-ui-store';
import { apiClient } from '@/lib/api-client';

export const useSnappingPersistence = () => {
  const snappingState = useSnappingState();
  const { updateGridConfig, updateElementSnapConfig } = useSnappingActions();

  // Save snapping preferences to backend
  const saveSnappingPreferences = useCallback(async () => {
    try {
      const preferences = {
        editor: {
          snapping: {
            grid: {
              enabled: snappingState.gridConfig.enabled,
              visible: snappingState.gridConfig.visible,
              size: snappingState.gridConfig.size,
              snapThreshold: snappingState.gridConfig.snapThreshold,
            },
            elements: {
              enabled: snappingState.elementSnapConfig.enabled,
              snapThreshold: snappingState.elementSnapConfig.snapThreshold,
              showGuides: snappingState.elementSnapConfig.showGuides,
              enableSpacing: snappingState.elementSnapConfig.enableSpacing,
              enableDistribution: snappingState.elementSnapConfig.enableDistribution,
            },
          },
        },
      };

      console.log('Saving snapping preferences:', preferences);
      await apiClient.post('/api/projects/preferences', { preferences });
      console.log('Snapping preferences saved successfully');
    } catch (error) {
      console.error('Failed to save snapping preferences:', error);
    }
  }, [snappingState]);

  // Load snapping preferences from backend configuration
  const loadSnappingPreferences = useCallback((configuration: Record<string, unknown>) => {
    console.log('Loading snapping preferences from configuration:', configuration);
    
    const editor = configuration?.editor as Record<string, unknown> | undefined;
    if (!editor || !editor.snapping) {
      console.log('No editor or snapping configuration found, using defaults');
      return;
    }

    const { snapping } = editor;
    console.log('Found snapping configuration:', snapping);

    // Load grid snapping settings
    if (snapping && typeof snapping === 'object' && 'grid' in snapping) {
      const grid = (snapping as Record<string, unknown>).grid as Record<string, unknown>;
      if (grid) {
        console.log('Loading grid config:', grid);
        updateGridConfig({
          enabled: (grid.enabled as boolean) ?? true,
          visible: (grid.visible as boolean) ?? true,
          size: (grid.size as number) ?? 10,
          snapThreshold: (grid.snapThreshold as number) ?? 8,
        });
      }
    }

    // Load element snapping settings
    if (snapping && typeof snapping === 'object' && 'elements' in snapping) {
      const elements = (snapping as Record<string, unknown>).elements as Record<string, unknown>;
      if (elements) {
        console.log('Loading element snap config:', elements);
        updateElementSnapConfig({
          enabled: (elements.enabled as boolean) ?? true,
          snapThreshold: (elements.snapThreshold as number) ?? 10,
          showGuides: (elements.showGuides as boolean) ?? true,
          enableSpacing: (elements.enableSpacing as boolean) ?? true,
          enableDistribution: (elements.enableDistribution as boolean) ?? true,
        });
      }
    }
  }, [updateGridConfig, updateElementSnapConfig]);

  return {
    saveSnappingPreferences,
    loadSnappingPreferences,
  };
};
