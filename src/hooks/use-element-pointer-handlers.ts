import { useCallback, useRef } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface UseElementPointerHandlersProps {
  tool: string;
  isLineChaining: boolean;
  lineStartPoint: { x: number; y: number } | null;
  elements: AnimatedCanvasObject[];
  selectedIds: string[];
  selectElement: (element: AnimatedCanvasObject | AnimatedCanvasObject[] | null, addToSelection?: boolean) => void;
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  startDragging: (id: string, offsetX: number, offsetY: number, isGroup?: boolean, groupOffsets?: Array<{ id: string; offsetX: number; offsetY: number }>) => void;
  startEndpointDragging: (id: string, endpoint: 'start' | 'end') => void;
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
}

interface UseElementPointerHandlersReturn {
  handleElementPointerDown: (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => void;
  handleElementPointerMove: (e: FederatedPointerEvent) => void;
  handleElementPointerUp: () => void;
  textClickTimeRef: React.MutableRefObject<Map<string, number>>;
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
  onElementContextMenu,
  onGroupContextMenu,
}: UseElementPointerHandlersProps): UseElementPointerHandlersReturn => {
  const textClickTimeRef = useRef<Map<string, number>>(new Map());
  const dragStartRef = useRef<{ id: string; x: number; y: number; shapeX: number; shapeY: number; isMultiSelect: boolean } | null>(null);

  // Enhanced handlePointerDown for element dragging
  const handleElementPointerDown = useCallback((id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    // Check for right-click (button 2) and show context menu
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      
      // Always treat elements as elements, not groups, for context menu
      // Components are elements, not groups, so they should use element context menu
      if (onElementContextMenu) {
        onElementContextMenu(e, id);
      }
      return;
    }

    // For draw tool, allow drawing to start on existing elements
    if (tool === 'draw') {
      // Let the drawing behavior happen, don't stop propagation
      handleCanvasPointerDown(e);
      return;
    }

    // Special case: shape closing during line chaining mode
    if (tool !== 'select' && tool !== 'draw') {
      // Only allow shape closing logic for lines
      const pos = e.global;
      const element = elements.find(el => el.id === id);
      if (
        isLineChaining &&
        lineStartPoint &&
        element &&
        element.type === 'line' &&
        element.lineOptions?.points
      ) {
        const { start } = element.lineOptions.points;
        const clickX = pos.x;
        const clickY = pos.y;
        const ENDPOINT_CLICK_SIZE = 15;
        const halfSize = ENDPOINT_CLICK_SIZE / 2;
        if (
          clickX >= start.x - halfSize &&
          clickX <= start.x + halfSize &&
          clickY >= start.y - halfSize &&
          clickY <= start.y + halfSize
        ) {
          e.stopPropagation();
          handleCanvasClick(e); // This will trigger the shape closing logic
          return;
        }
      }
      // For other tools, do nothing (do not call handleCanvasClick or select)
      return;
    }

    e.stopPropagation();

    const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;



    // Also keep PIXI world coordinates for certain operations
    const pos = e.global;
    const element = elements.find(el => el.id === id);
    if (!element) return;

    // Handle element selection first
    selectElement(element, isMultiSelect);

    // Store drag start information for potential dragging
    dragStartRef.current = {
      id,
      x: pos.x,
      y: pos.y,
      shapeX,
      shapeY,
      isMultiSelect
    };

    // Then check for line endpoint handling
    if (element?.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;
      const ENDPOINT_CLICK_SIZE = 12;
      const halfSize = ENDPOINT_CLICK_SIZE / 2;
      if (
        clickX >= start.x - halfSize &&
        clickX <= start.x + halfSize &&
        clickY >= start.y - halfSize &&
        clickY <= start.y + halfSize
      ) {
        startEndpointDragging(id, 'start');
        return;
      }
      if (
        clickX >= end.x - halfSize &&
        clickX <= end.x + halfSize &&
        clickY >= end.y - halfSize &&
        clickY <= end.y + halfSize
      ) {
        startEndpointDragging(id, 'end');
        return;
      }
    }

    // Don't start dragging immediately - wait for pointer move
    // The dragging will be started in the pointer move handler if the user actually moves the mouse
  }, [tool, isLineChaining, lineStartPoint, elements, selectedIds, selectElement, handleCanvasClick, handleCanvasPointerDown, startDragging, startEndpointDragging, onElementContextMenu, onGroupContextMenu]);

  // Handle pointer move to detect when dragging should start
  const handleElementPointerMove = useCallback((e: FederatedPointerEvent) => {
    if (!dragStartRef.current) return;

    const { id, x: startX, y: startY, shapeX, shapeY } = dragStartRef.current;
    const currentX = e.global.x;
    const currentY = e.global.y;

    // Check if mouse has moved enough to start dragging (threshold of 5 pixels)
    const distance = Math.sqrt(Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2));
    
    if (distance > 5) {
      const element = elements.find(el => el.id === id);
      if (!element) return;

      // Start dragging
      if (selectedIds.length > 1 && selectedIds.includes(id)) {
        // Group dragging: calculate offsets for all selected elements
        const offsets = selectedIds.map(selectedId => {
          const selectedElement = elements.find(el => el.id === selectedId);
          if (!selectedElement) return { id: selectedId, offsetX: 0, offsetY: 0 };
          return {
            id: selectedId,
            offsetX: currentX - selectedElement.x,
            offsetY: currentY - selectedElement.y
          };
        });
        startDragging(id, currentX - shapeX, currentY - shapeY, true, offsets);
      } else {
        // Single element drag
        startDragging(id, currentX - shapeX, currentY - shapeY);
      }

      // Clear drag start ref
      dragStartRef.current = null;
    }
  }, [elements, selectedIds, startDragging]);

  // Handle pointer up to clear drag start ref
  const handleElementPointerUp = useCallback(() => {
    dragStartRef.current = null;
  }, []);

  return {
    handleElementPointerDown,
    handleElementPointerMove,
    handleElementPointerUp,
    textClickTimeRef,
  };
}; 