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
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
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
}: UseElementPointerHandlersProps) => {
  const textClickTimeRef = useRef<Map<string, number>>(new Map());

  // Enhanced handlePointerDown for element dragging
  const handleElementPointerDown = useCallback((id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    // Check for right-click (button 2) and show context menu
    if (e.button === 2) {
      e.stopPropagation();
      e.preventDefault();
      
      // Check if this is a group element
      const element = elements.find(el => el.id === id);
      if (element && element.groupId && onGroupContextMenu) {
        onGroupContextMenu(e, element.groupId);
      } else if (onElementContextMenu) {
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

    // Handle element selection
    selectElement([element], isMultiSelect);

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
        selectElement([element], isMultiSelect);
        return;
      }
      if (
        clickX >= end.x - halfSize &&
        clickX <= end.x + halfSize &&
        clickY >= end.y - halfSize &&
        clickY <= end.y + halfSize
      ) {
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
  }, [tool, isLineChaining, lineStartPoint, elements, selectedIds, selectElement, handleCanvasClick, handleCanvasPointerDown, startDragging, startEndpointDragging, onElementContextMenu, onGroupContextMenu]);

  return {
    handleElementPointerDown,
    textClickTimeRef,
  };
}; 