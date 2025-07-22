import { useCallback, useRef } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface UseElementPointerHandlersProps {
  tool: string;
  isLineChaining: boolean;
  lineStartPoint: { x: number; y: number } | null;
  elements: AnimatedCanvasObject[];
  selectedIds: string[];
  selectElement: (elements: AnimatedCanvasObject[] | null, isMultiSelect?: boolean) => void;
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  startDragging: (id: string, offsetX: number, offsetY: number, isGroup?: boolean, groupOffsets?: Array<{ id: string; offsetX: number; offsetY: number }>) => void;
  startEndpointDragging: (id: string, endpoint: 'start' | 'end') => void;
  isTextGroupCharacter: (element: AnimatedCanvasObject) => boolean;
}

export const useElementPointerHandlers = ({
  tool,
  isLineChaining,
  lineStartPoint,
  elements,
  selectedIds,
  selectElement,
  handleCanvasClick,
  handleCanvasPointerDown,
  startDragging,
  startEndpointDragging,
  isTextGroupCharacter,
}: UseElementPointerHandlersProps) => {
  const textClickTimeRef = useRef<Map<string, number>>(new Map());

  // Enhanced handlePointerDown for element dragging
  const handleElementPointerDown = useCallback((id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    // Check for right-click (button 2) and show context menu
    if (e.button === 2) {
      // Handle right-click context menu if needed
      return;
    }

    // When using creation tools (not select), call the canvas click handler directly
    // to create new objects on top of existing shapes
    if (tool !== 'select' && tool !== 'draw') {
      e.stopPropagation();
      handleCanvasClick(e);
      return;
    }

    // For draw tool, allow drawing to start on existing elements
    if (tool === 'draw') {
      // Let the drawing behavior happen, don't stop propagation
      handleCanvasPointerDown(e);
      return;
    }

    e.stopPropagation();

    const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;

    // Also keep PIXI world coordinates for certain operations
    const pos = e.global;
    const element = elements.find(el => el.id === id);

    if (!element) return;

    // Check for shape closing during line chaining mode
    if (isLineChaining && lineStartPoint && element.type === 'line' && element.lineOptions?.points) {
      const { start } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;

      // Use larger click area for easier polygon closing - 15px instead of 7px
      const ENDPOINT_CLICK_SIZE = 15;
      const halfSize = ENDPOINT_CLICK_SIZE / 2;

      if (clickX >= start.x - halfSize && clickX <= start.x + halfSize &&
        clickY >= start.y - halfSize && clickY <= start.y + halfSize) {
        // Close the shape by connecting to the start point
        e.stopPropagation();
        handleCanvasClick(e); // This will trigger the shape closing logic
        return;
      }
    }

    // Handle textgroup character clicks - redirect to parent textGroup with double-click support
    if (isTextGroupCharacter(element)) {
      const parentTextGroup = elements.find(el => el.id === element.parentTextGroupId);
      if (parentTextGroup) {
        // Check for double-click on character (which should be treated as double-click on textGroup)
        const currentTime = Date.now();
        const lastClickTime = textClickTimeRef.current.get(parentTextGroup.id) || 0;
        const timeDiff = currentTime - lastClickTime;

        if (timeDiff < 300) { // Double-click detected (within 300ms)
          // Handle double-click for text editing
          textClickTimeRef.current.delete(parentTextGroup.id); // Clear the click time
          return;
        } else {
          // Single click - store the time and continue with selection logic
          textClickTimeRef.current.set(parentTextGroup.id, currentTime);
        }

        // Select the parent textGroup instead of the character
        selectElement([parentTextGroup], isMultiSelect);
        startDragging(parentTextGroup.id, pos.x - parentTextGroup.x, pos.y - parentTextGroup.y);
        return;
      }
    }

    // Handle element selection
    selectElement([element], isMultiSelect);

    // For text and textGroup elements, handle double-click to edit, single click to drag
    if (element.type === 'text' || element.type === 'textGroup') {
      // Check if this is a double-click
      const currentTime = Date.now();
      const lastClickTime = textClickTimeRef.current.get(id) || 0;
      const timeDiff = currentTime - lastClickTime;

      if (timeDiff < 300) { // Double-click detected (within 300ms)
        // Handle double-click for text editing
        textClickTimeRef.current.delete(id); // Clear the click time
        return;
      } else {
        // Single click - store the time and continue with dragging logic
        textClickTimeRef.current.set(id, currentTime);
        // Don't return here, let it fall through to normal drag handling
      }
    }

    // Then check for line endpoint handling
    if (element?.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;

      // Use larger click area for easier endpoint interaction - 12px instead of 7px
      const ENDPOINT_CLICK_SIZE = 12;
      const halfSize = ENDPOINT_CLICK_SIZE / 2;

      // Check if click is within start point square bounds
      if (clickX >= start.x - halfSize && clickX <= start.x + halfSize &&
        clickY >= start.y - halfSize && clickY <= start.y + halfSize) {
        startEndpointDragging(id, 'start');
        selectElement([element], isMultiSelect);
        return;
      }

      // Check if clicking near end point (larger click area for easier interaction)
      if (clickX >= end.x - halfSize && clickX <= end.x + halfSize &&
        clickY >= end.y - halfSize && clickY <= end.y + halfSize) {
        startEndpointDragging(id, 'end');
        selectElement([element], isMultiSelect);
        return;
      }
    }

    // Regular shape drag - check if multiple elements are selected for group dragging
    if (selectedIds.length > 1 && selectedIds.includes(id)) {
      // Group dragging: calculate offsets for all selected elements
      const offsets = selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (!selectedElement) return { id: selectedId, offsetX: 0, offsetY: 0 };

        return {
          id: selectedId,
          offsetX: pos.x - selectedElement.x,
          offsetY: pos.y - selectedElement.y
        };
      });

      startDragging(id, pos.x - shapeX, pos.y - shapeY, true, offsets);
      selectElement([element], isMultiSelect);
    } else {
      // Single element drag - use direct coordinates
      startDragging(id, pos.x - shapeX, pos.y - shapeY);
      selectElement([element], isMultiSelect);
    }
  }, [tool, isLineChaining, lineStartPoint, elements, selectedIds, selectElement, handleCanvasClick, handleCanvasPointerDown, startDragging, startEndpointDragging, isTextGroupCharacter]);

  return {
    handleElementPointerDown,
    textClickTimeRef,
  };
}; 