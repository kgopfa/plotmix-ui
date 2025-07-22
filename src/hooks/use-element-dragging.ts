import { useCallback, useState } from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { SnapGuide } from '@/utils/element-snapping';
import { eventManager } from '@/lib/event-manager';

interface UseElementDraggingProps {
  elements: AnimatedCanvasObject[];
  moveElement: (id: string, position: { x: number; y: number }) => void;
  moveMultipleElements: (positions: Array<{ id: string; x: number; y: number }>) => void;
  updateElement: (id: string, updates: Partial<AnimatedCanvasObject>) => void;
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSnapPoint?: (point: { x: number; y: number }) => { x: number; y: number };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
}

export const useElementDragging = ({
  elements,
  moveElement,
  moveMultipleElements,
  updateElement,
  onSnapElement,
  onSnapPoint,
  onSetSnapGuides,
  onClearSnapGuides,
}: UseElementDraggingProps) => {
  // Element dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [elementDragOffset, setElementDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState<boolean>(false);
  const [groupDragOffsets, setGroupDragOffsets] = useState<Array<{ id: string; offsetX: number; offsetY: number }>>([]);

  // Element drag end handler
  const onElementDragEnd = useCallback((id: string, x: number, y: number) => {
    moveElement(id, { x, y });
  }, [moveElement]);

  // Group drag handler
  const onGroupDrag = useCallback((elementPositions: Array<{ id: string; x: number; y: number }>) => {
    moveMultipleElements(elementPositions.map(pos => ({ id: pos.id, x: pos.x, y: pos.y })));
  }, [moveMultipleElements]);

  // Line endpoint drag handler
  const onLineEndpointDrag = useCallback((id: string, endpoint: 'start' | 'end', x: number, y: number) => {
    const element = elements.find(el => el.id === id);
    if (!element || !element.lineOptions?.points) return;

    const updatedPoints = {
      ...element.lineOptions.points,
      [endpoint]: { x, y }
    };

    // Update the element with new line points
    updateElement(id, {
      lineOptions: { ...element.lineOptions, points: updatedPoints }
    });
  }, [elements, updateElement]);

  // Global pointer move handler for element dragging
  const handleGlobalPointerMove = useCallback((e: PointerEvent) => {
    if (!draggingId) return;

    // Get the canvas element to calculate proper coordinates
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Use direct coordinates since zoom functionality removed
    const worldX = canvasX;
    const worldY = canvasY;

    // Handle virtual group dragging first
    if (draggingId === 'virtual-group') {
      if (isDraggingGroup && groupDragOffsets.length > 0 && onGroupDrag) {
        // Handle group dragging: calculate new positions for all selected elements using world coordinates
        const newPositions = groupDragOffsets.map(offset => ({
          id: offset.id,
          x: worldX - offset.offsetX,
          y: worldY - offset.offsetY
        }));
        onGroupDrag(newPositions);
      }
      return;
    }

    // For individual element dragging, find the element
    const element = elements.find(el => el.id === draggingId);
    if (!element) return;

    // Handle endpoint dragging
    if (draggingEndpoint && onLineEndpointDrag) {
      // Apply snapping to line endpoints
      const snappedPoint = onSnapPoint ? onSnapPoint({ x: worldX, y: worldY }) : { x: worldX, y: worldY };
      onLineEndpointDrag(draggingId, draggingEndpoint, snappedPoint.x, snappedPoint.y);
    } else if (elementDragOffset) {
      // Handle regular shape dragging with snapping
      const newX = worldX - elementDragOffset.x;
      const newY = worldY - elementDragOffset.y;

      if (onSnapElement && onSetSnapGuides) {
        // Create a temporary element with the new position for snapping calculation
        const tempElement = { ...element, x: newX, y: newY };
        const snapResult = onSnapElement(tempElement, elements);

        // Show guides if there are any alignment guides
        const hasAlignmentGuides = snapResult.guides.some(guide =>
          guide.alignmentType === 'left' || guide.alignmentType === 'right' ||
          guide.alignmentType === 'top' || guide.alignmentType === 'bottom' ||
          guide.alignmentType === 'centerX' || guide.alignmentType === 'centerY'
        );

        if (hasAlignmentGuides) {
          onSetSnapGuides(snapResult.guides);
        } else {
          onSetSnapGuides([]);
        }

        // Use snapped position
        onElementDragEnd(draggingId, snapResult.x, snapResult.y);
      } else {
        // Fallback to non-snapped dragging
        onElementDragEnd(draggingId, newX, newY);
      }
    }
  }, [draggingId, isDraggingGroup, groupDragOffsets, onGroupDrag, elements, draggingEndpoint, onLineEndpointDrag, elementDragOffset, onElementDragEnd, onSnapElement, onSnapPoint, onSetSnapGuides]);

  // Global pointer up handler for element dragging
  const handleGlobalPointerUp = useCallback(() => {
    if (draggingId) {
      setDraggingId(null);
      setElementDragOffset(null);
      setDraggingEndpoint(null);
      // Reset group dragging state
      setIsDraggingGroup(false);
      setGroupDragOffsets([]);

      // Clear snap guides when dragging ends
      if (onClearSnapGuides) {
        onClearSnapGuides();
      }
    } else {
      // Also clear guides when no dragging is happening
      if (onClearSnapGuides) {
        onClearSnapGuides();
      }
    }
  }, [draggingId, onClearSnapGuides]);

  // Set up global event listeners for element dragging
  const setupGlobalEventListeners = useCallback(() => {
    // Create wrapper functions to properly handle event types with EventManager
    const handleGlobalPointerMoveWrapper = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => {
      if (event instanceof PointerEvent) {
        handleGlobalPointerMove(event);
      }
    };

    const handleGlobalPointerUpWrapper = () => {
      handleGlobalPointerUp();
    };

    // Use EventManager instead of direct event listeners
    eventManager.addListener('pointermove', handleGlobalPointerMoveWrapper);
    eventManager.addListener('pointerup', handleGlobalPointerUpWrapper);

    return () => {
      eventManager.removeListener('pointermove', handleGlobalPointerMoveWrapper);
      eventManager.removeListener('pointerup', handleGlobalPointerUpWrapper);
    };
  }, [handleGlobalPointerMove, handleGlobalPointerUp]);

  // Start dragging an element
  const startDragging = useCallback((id: string, offsetX: number, offsetY: number, isGroup = false, groupOffsets: Array<{ id: string; offsetX: number; offsetY: number }> = []) => {
    setDraggingId(id);
    setElementDragOffset({ x: offsetX, y: offsetY });
    setIsDraggingGroup(isGroup);
    setGroupDragOffsets(groupOffsets);
    setDraggingEndpoint(null);
  }, []);

  // Start dragging a line endpoint
  const startEndpointDragging = useCallback((id: string, endpoint: 'start' | 'end') => {
    setDraggingId(id);
    setDraggingEndpoint(endpoint);
    setElementDragOffset(null);
    setIsDraggingGroup(false);
    setGroupDragOffsets([]);
  }, []);

  return {
    // State
    draggingId,
    elementDragOffset,
    draggingEndpoint,
    isDraggingGroup,
    groupDragOffsets,
    
    // Handlers
    handleGlobalPointerMove,
    handleGlobalPointerUp,
    setupGlobalEventListeners,
    startDragging,
    startEndpointDragging,
    
    // Setters
    setDraggingId,
    setElementDragOffset,
    setDraggingEndpoint,
    setIsDraggingGroup,
    setGroupDragOffsets,
  };
}; 