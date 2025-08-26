import { useCallback, useRef } from 'react';
import type { FederatedPointerEvent, Container } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { ViewportWrapper } from '@/components/designer/viewport/viewport-wrapper';
import { convertPointerEventToDesignCanvasCoords } from '@/utils/coordinate-utils';

interface UseElementPointerHandlersProps {
  tool: string;
  isLineChaining: boolean;
  lineStartPoint: { x: number; y: number } | null;
  elements: AnimatedCanvasObject[];
  selectedIds: string[];
  selectElement: (element: AnimatedCanvasObject | null, addToSelection?: boolean) => void;
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  startDragging: (id: string, offsetX: number, offsetY: number, isGroupDrag?: boolean, groupOffsets?: Array<{ id: string; offsetX: number; offsetY: number }>) => void;
  startEndpointDragging: (id: string, endpoint: 'start' | 'end') => void;
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  viewportRef?: React.RefObject<ViewportWrapper | null>;
  canvasPosition?: { x: number; y: number };
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
  viewportRef,
  canvasPosition,
}: UseElementPointerHandlersProps): UseElementPointerHandlersReturn => {
  const textClickTimeRef = useRef<Map<string, number>>(new Map());
  const dragStartRef = useRef<{ id: string; x: number; y: number; isMultiSelect: boolean } | null>(null);

  // Use the EXACT same coordinate system as element placement
  const convertToDragCoordinates = useCallback((e: FederatedPointerEvent) => {
    // Use the EXACT same approach as element placement
    const designCanvasContainer = e.currentTarget as unknown as Container;
    if (!designCanvasContainer) {
      console.warn('Design canvas container not found in drag event');
      return { x: 0, y: 0 };
    }
    
    // Use the EXACT same coordinate conversion as element placement
    const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
    return localPos;
  }, []);

  // Helper function to calculate zoom-aware offset
  const calculateZoomAwareOffset = useCallback((dragCoords: { x: number; y: number }, element: AnimatedCanvasObject) => {
    const zoomFactor = viewportRef?.current?.scale.x || 1;
    // FIXED: Divide by zoom factor to get the correct visual offset
    // When zoomed out (zoom < 1), the offset should be smaller, not larger
    const offsetX = (dragCoords.x - element.x) / zoomFactor;
    const offsetY = (dragCoords.y - element.y) / zoomFactor;
    return { id: element.id, offsetX, offsetY }; // Return full object for groupOffsets compatibility
  }, [viewportRef]);

  // Enhanced handlePointerDown for element dragging
  const handleElementPointerDown = useCallback((id: string) => (e: FederatedPointerEvent) => {
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
        
        // Use a larger click area for shape closing to make it easier to close shapes
        const ENDPOINT_CLICK_SIZE = 20; // Increased from 15 for better UX
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
      isMultiSelect
    };

    // Then check for line endpoint handling
    if (element?.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;
      const ENDPOINT_CLICK_SIZE = 16; // Consistent with shape closing size
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
  }, [tool, isLineChaining, lineStartPoint, elements, selectElement, handleCanvasClick, handleCanvasPointerDown, startEndpointDragging, onElementContextMenu]);

  // Handle pointer move to detect when dragging should start
  const handleElementPointerMove = useCallback((e: FederatedPointerEvent) => {
    if (!dragStartRef.current) return;

    const { id, x: startX, y: startY } = dragStartRef.current;
    const currentX = e.global.x;
    const currentY = e.global.y;

    // Calculate the distance moved from the start point
    const deltaX = Math.abs(currentX - startX);
    const deltaY = Math.abs(currentY - startY);
    const totalDistance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    
    // Only start dragging if the mouse has moved more than the threshold
    // This prevents accidental dragging from tiny hand movements or system events
    const DRAG_THRESHOLD = 3; // 3 pixels threshold
    
    if (totalDistance < DRAG_THRESHOLD) {
      return; // Don't start dragging yet
    }

    // Start dragging after threshold is met
    const element = elements.find(el => el.id === id);
    if (!element) return;

    // Start dragging
    if (selectedIds.length > 1 && selectedIds.includes(id)) {
      // Group dragging: calculate offsets for all selected elements
      const offsets = selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (!selectedElement) return { id: selectedId, offsetX: 0, offsetY: 0 };
        
        // Convert coordinates to the same system used by dragging logic
        const dragCoords = convertToDragCoordinates(e);
        // Use zoom-aware offset calculation
        const offset = calculateZoomAwareOffset(dragCoords, selectedElement);
        return {
          id: selectedId,
          offsetX: offset.offsetX,
          offsetY: offset.offsetY
        };
      });
      
      // Convert coordinates for the main element - offset should be distance from mouse to element center
      const dragCoords = convertToDragCoordinates(e);
      // Use zoom-aware offset calculation for main element
      const mainOffset = calculateZoomAwareOffset(dragCoords, element);
      startDragging(id, mainOffset.offsetX, mainOffset.offsetY, true, offsets);
    } else {
      // Single element drag - offset should be distance from mouse to element center
      const dragCoords = convertToDragCoordinates(e);
      // Use zoom-aware offset calculation
      const offset = calculateZoomAwareOffset(dragCoords, element);
      startDragging(id, offset.offsetX, offset.offsetY);
    }

    // Clear drag start ref
    dragStartRef.current = null;
  }, [elements, selectedIds, startDragging, convertToDragCoordinates, calculateZoomAwareOffset]);

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