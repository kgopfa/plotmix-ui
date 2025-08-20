import { useCallback, useRef, useState } from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { SnapGuide } from '@/utils/element-snapping';
import { eventManager } from '@/lib/event-manager';
import { useUIStore } from '@/stores/use-ui-store';

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
  // Get zoom level from UI store
  const canvasZoom = useUIStore(state => state.canvasZoom);
  
  // Element dragging state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [elementDragOffset, setElementDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  const [isDraggingGroup, setIsDraggingGroup] = useState<boolean>(false);
  const [groupDragOffsets, setGroupDragOffsets] = useState<Array<{ id: string; offsetX: number; offsetY: number }>>([]);

  // Optimized coordinate conversion caching
  const coordinateCache = useRef<{
    canvasRect: DOMRect | null;
    lastUpdate: number;
    worldCenterX: number;
    worldCenterY: number;
    centerX: number;
    centerY: number;
    canvasElement: HTMLCanvasElement | null;
  }>({
    canvasRect: null,
    lastUpdate: 0,
    worldCenterX: 0,
    worldCenterY: 0,
    centerX: 0,
    centerY: 0,
    canvasElement: null,
  });

  // Cache coordinate conversions to avoid expensive recalculations
  const getOptimizedCoordinates = useCallback((e: PointerEvent) => {
    const now = performance.now();
    const cache = coordinateCache.current;
    
    // Update cache every 16ms (60fps) or when canvas rect changes
    if (!cache.canvasRect || now - cache.lastUpdate > 16) {
      // Cache canvas element reference to avoid repeated DOM queries
      if (!cache.canvasElement) {
        cache.canvasElement = document.querySelector('canvas');
      }
      
      if (cache.canvasElement) {
        const newRect = cache.canvasElement.getBoundingClientRect();
        
        // Only update if rect actually changed
        if (!cache.canvasRect || 
            cache.canvasRect.left !== newRect.left || 
            cache.canvasRect.top !== newRect.top ||
            cache.canvasRect.width !== newRect.width ||
            cache.canvasRect.height !== newRect.height) {
          
          cache.canvasRect = newRect;
          cache.lastUpdate = now;
          
          // Update world center calculations (these are static during dragging)
          const canvasWidth = 1920; // Default, could be made configurable
          const canvasHeight = 1080;
          cache.worldCenterX = canvasWidth * 1.5;
          cache.worldCenterY = canvasHeight * 1.5;
          
          // Calculate responsive center offsets (these are static during dragging)
          const screenAspectRatio = newRect.width / newRect.height;
          let verticalOffset = 0;
          if (screenAspectRatio > 2) {
            verticalOffset = Math.min(150, newRect.height * 0.15);
          } else if (screenAspectRatio > 1.5) {
            verticalOffset = Math.min(200, newRect.height * 0.18);
          } else {
            verticalOffset = Math.min(250, newRect.height * 0.22);
          }
          cache.centerX = 0;
          cache.centerY = -verticalOffset;
        }
      }
    }

    if (!cache.canvasRect) return { worldX: 0, worldY: 0 };

    // Fast coordinate conversion using cached values
    const canvasX = e.clientX - cache.canvasRect.left;
    const canvasY = e.clientY - cache.canvasRect.top;
    
    // Direct world coordinate calculation (no additional transformations)
    const worldX = canvasX;
    const worldY = canvasY;

    return { worldX, worldY };
  }, []);

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

    // Use optimized coordinate conversion
    const { worldX, worldY } = getOptimizedCoordinates(e);

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

      // Log coordinates and zoom for debugging drift issue
      if (draggingId && element) {
        console.log('Drag Debug:', {
          mouse: { x: e.clientX, y: e.clientY },
          world: { x: worldX, y: worldY },
          element: { x: newX, y: newY },
          zoom: canvasZoom,
          offset: elementDragOffset,
          timestamp: Date.now()
        });
      }

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
  }, [draggingId, isDraggingGroup, groupDragOffsets, onGroupDrag, elements, draggingEndpoint, onLineEndpointDrag, elementDragOffset, onElementDragEnd, onSnapElement, onSnapPoint, onSetSnapGuides, getOptimizedCoordinates, canvasZoom]);

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