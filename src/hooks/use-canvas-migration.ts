import { useCallback } from 'react';
import { useCanvasStore } from '@/stores/useCanvasStore';
import { useShallow } from 'zustand/react/shallow';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

/**
 * Migration hook that provides backward compatibility
 * This bridges the gap between old setCanvasObjects/setGroups calls and new store operations
 */
export const useCanvasMigration = () => {
  const operations = useCanvasStore(
    useShallow(state => ({
      addElement: state.addElement,
      updateElement: state.updateElement,
      removeElement: state.removeElement,
      duplicateElement: state.duplicateElement,
      moveElement: state.moveElement,
      resizeElement: state.resizeElement,
      rotateElement: state.rotateElement,
      setElementVisibility: state.setElementVisibility,
      addGroup: state.addGroup,
      updateGroup: state.updateGroup,
      removeGroup: state.removeGroup,
      moveGroup: state.moveGroup,
      setGroupVisibility: state.setGroupVisibility,
      createGroupFromElements: state.createGroupFromElements,
      ungroupElements: state.ungroupElements,
      updateMultipleElements: state.updateMultipleElements,
      moveMultipleElements: state.moveMultipleElements,
      clearCanvas: state.clearCanvas,
      setElements: state.setElements,
      setGroups: state.setGroups
    }))
  );

  // Provide a setCanvasObjects-like interface that works with the store
  const setCanvasObjects = useCallback((updater: AnimatedCanvasObject[] | ((prev: AnimatedCanvasObject[]) => AnimatedCanvasObject[])) => {
    const currentElements = useCanvasStore.getState().elements;
    
    if (typeof updater === 'function') {
      const newElements = updater(currentElements);
      operations.setElements(newElements);
    } else {
      operations.setElements(updater);
    }
  }, [operations]);

  // Provide a setGroups-like interface that works with the store
  const setCanvasGroups = useCallback((updater: CanvasGroup[] | ((prev: CanvasGroup[]) => CanvasGroup[])) => {
    const currentGroups = useCanvasStore.getState().groups;
    
    if (typeof updater === 'function') {
      const newGroups = updater(currentGroups);
      operations.setGroups(newGroups);
    } else {
      operations.setGroups(updater);
    }
  }, [operations]);

  return {
    ...operations,
    setCanvasObjects,
    setGroups: setCanvasGroups,
    // Optimized operations that are commonly used
    updateElementPosition: useCallback((id: string, x: number, y: number) => {
      operations.updateElement(id, { x, y });
    }, [operations]),
    
    updateElementText: useCallback((id: string, text: string) => {
      operations.updateElement(id, { text });
    }, [operations]),
    
    updateElementRotation: useCallback((id: string, rotation: number) => {
      operations.updateElement(id, { rotation });
    }, [operations])
  };
}; 