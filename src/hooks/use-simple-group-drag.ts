import { useCallback, useRef, useState } from 'react';
import type { FederatedPointerEvent, Container } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { ViewportWrapper } from '@/components/designer/viewport/viewport-wrapper';
import { convertPointerEventToDesignCanvasCoords } from '@/utils/coordinate-utils';

interface UseSimpleGroupDragProps {
  groups: CanvasGroup[];
  elements: AnimatedCanvasObject[];
  moveGroup: (id: string, position: { x: number; y: number }) => void;
  selectGroup: (group: CanvasGroup, addToSelection?: boolean) => void;
  viewportRef?: React.RefObject<ViewportWrapper | null>;
  designCanvasContainerRef?: React.RefObject<Container | null>;
  onSnapGroup?: (group: CanvasGroup, allGroups: CanvasGroup[], allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: any[] };
  onSetSnapGuides?: (guides: any[]) => void;
  onClearSnapGuides?: () => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
}

interface UseSimpleGroupDragReturn {
  handlePointerDown: (id: string) => (e: FederatedPointerEvent) => void;
  handlePointerMove: (e: FederatedPointerEvent) => void;
  handlePointerUp: () => void;
  isDragging: boolean;
  draggingId: string | null;
}

/**
 * Minimal, world-coordinate-based group dragging.
 * Mirrors the simple approach: on down inside bounds → record offset; on move → set position; on up → stop.
 */
export function useSimpleGroupDrag({
  groups,
  elements,
  moveGroup,
  selectGroup,
  viewportRef,
  designCanvasContainerRef,
  onSnapGroup,
  onSetSnapGuides,
  onClearSnapGuides,
  onGroupContextMenu,
}: UseSimpleGroupDragProps): UseSimpleGroupDragReturn {
  const [isDragging, setIsDragging] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const dragOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const getCanvasLocalFromEvent = useCallback((e: FederatedPointerEvent) => {
    // Prefer explicit design canvas container; fallback to currentTarget if it's a Container
    const container: Container | null =
      (designCanvasContainerRef?.current as Container | null) ||
      ((e.currentTarget as unknown) as Container | null) ||
      null;
    if (!container) return { x: 0, y: 0 };
    return convertPointerEventToDesignCanvasCoords(e, container);
  }, [designCanvasContainerRef]);

  const getGroupBounds = useCallback((group: CanvasGroup) => {
    // Get all elements in the group
    const groupElements = elements.filter(el => group.elementIds.includes(el.id));
    
    if (groupElements.length === 0) {
      // Fallback to group center with default size
      return {
        x: group.x - 50,
        y: group.y - 50,
        width: 100,
        height: 100,
        centerX: group.x,
        centerY: group.y
      };
    }

    // Calculate bounding box of all elements in the group
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    
    groupElements.forEach(el => {
      const halfW = el.width / 2;
      const halfH = el.height / 2;
      const left = el.x - halfW;
      const right = el.x + halfW;
      const top = el.y - halfH;
      const bottom = el.y + halfH;
      
      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    });

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
      centerX: group.x, // Use group's center position
      centerY: group.y
    };
  }, [elements]);

  const isPointInsideGroup = useCallback((point: { x: number; y: number }, group: CanvasGroup) => {
    const bounds = getGroupBounds(group);
    return point.x >= bounds.x && point.x <= bounds.x + bounds.width &&
           point.y >= bounds.y && point.y <= bounds.y + bounds.height;
  }, [getGroupBounds]);

  const handlePointerDown = useCallback((id: string) => (e: FederatedPointerEvent) => {
    const group = groups.find(g => g.id === id);
    if (!group) return;

    e.stopPropagation();

    // Check if this is a right-click for context menu
    if (e.button === 2) {
      if (onGroupContextMenu) {
        onGroupContextMenu(e, group.id);
      }
      return;
    }

    const localPos = getCanvasLocalFromEvent(e);

    if (isPointInsideGroup(localPos, group)) {
      // Handle group selection - same approach as timeline
      const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
        (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;

      // Select the group directly (same as timeline)
      selectGroup(group, isMultiSelect);

      // Start dragging
      setIsDragging(true);
      setDraggingId(id);
      dragOffsetRef.current = {
        x: localPos.x - group.x,
        y: localPos.y - group.y,
      };
      e.preventDefault?.();
    }
  }, [groups, getCanvasLocalFromEvent, isPointInsideGroup, selectGroup, onGroupContextMenu]);

  const handlePointerMove = useCallback((e: FederatedPointerEvent) => {
    if (!isDragging || !draggingId) return;
    const localPos = getCanvasLocalFromEvent(e);
    const { x: offX, y: offY } = dragOffsetRef.current;
    let targetX = localPos.x - offX;
    let targetY = localPos.y - offY;

    // Apply snapping if provided
    if (onSnapGroup) {
      const group = groups.find(g => g.id === draggingId);
      if (group) {
        const temp = { ...group, x: targetX, y: targetY } as CanvasGroup;
        const snap = onSnapGroup(temp, groups, elements);
        if (snap) {
          targetX = snap.x;
          targetY = snap.y;
          if (onSetSnapGuides) onSetSnapGuides(snap.guides || []);
        }
      }
    }

    moveGroup(draggingId, { x: targetX, y: targetY });
  }, [isDragging, draggingId, getCanvasLocalFromEvent, moveGroup, groups, elements, onSnapGroup, onSetSnapGuides]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setDraggingId(null);
    if (onClearSnapGuides) onClearSnapGuides();
  }, [isDragging, onClearSnapGuides]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    draggingId,
  };
}
