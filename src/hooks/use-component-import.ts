import { useCallback, useEffect } from 'react';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { createNewObject } from '@/lib/canvas-object-factory';
import { ComponentItem } from '@/data/components';

interface UseComponentImportReturn {
  handleComponentImport: (component: ComponentItem) => void;
}

export const useComponentImport = (): UseComponentImportReturn => {
  const { elements: canvasObjects, addElement } = useCanvasStore();
  const { select: selectElement } = useSelectionStore();

  // Helper function to handle component import
  const handleComponentImport = useCallback((component: ComponentItem) => {
    if (!component) return;

    // Create new SVG component element
    const newComponent = createNewObject(
      'image', // Use image type for SVG components
      0, // Center of canvas
      0, // Center of canvas
      canvasObjects,
      undefined, // pathPoints
      false, // isPath
      component.path, // Use the SVG path as imageData
      100, // default width
      100  // default height
    );

    // Update the name to match the component
    newComponent.name = component.name;

    // Add to canvas and select
    addElement(newComponent);
    selectElement([newComponent]);
  }, [canvasObjects, addElement, selectElement]);

  // Add event listener for component import from components tab
  useEffect(() => {
    const handleComponentImportEvent = (event: CustomEvent) => {
      const { component } = event.detail;
      if (component) {
        handleComponentImport(component);
      }
    };

    window.addEventListener('component-import', handleComponentImportEvent as EventListener);
    return () => {
      window.removeEventListener('component-import', handleComponentImportEvent as EventListener);
    };
  }, [handleComponentImport]);

  return {
    handleComponentImport,
  };
}; 