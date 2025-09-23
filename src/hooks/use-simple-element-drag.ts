import { useCallback, useRef, useState } from 'react';
import type { FederatedPointerEvent, Container } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { ViewportWrapper } from '@/components/designer/viewport/viewport-wrapper';
import { convertPointerEventToDesignCanvasCoords } from '@/utils/coordinate-utils';

interface UseSimpleElementDragProps {
  elements: AnimatedCanvasObject[];
  updateElementPosition: (id: string, position: { x: number; y: number }) => void;
  viewportRef?: React.RefObject<ViewportWrapper | null>;
  designCanvasContainerRef?: React.RefObject<Container | null>;
}

interface UseSimpleElementDragReturn {
  handlePointerDown: (id: string) => (e: FederatedPointerEvent) => void;
  handlePointerMove: (e: FederatedPointerEvent) => void;
  handlePointerUp: () => void;
  isDragging: boolean;
  draggingId: string | null;
}

/**
 * Minimal, world-coordinate-based element dragging.
 * Mirrors the simple approach: on down inside bounds → record offset; on move → set position; on up → stop.
 */
export function useSimpleElementDrag({
  elements,
  updateElementPosition,
  viewportRef,
  designCanvasContainerRef,
}: UseSimpleElementDragProps): UseSimpleElementDragReturn {
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

  const isPointInsideElement = useCallback((point: { x: number; y: number }, el: AnimatedCanvasObject) => {
    // Elements use center-based coordinates (x, y) with width/height
    const halfW = el.width / 2;
    const halfH = el.height / 2;
    const left = el.x - halfW;
    const right = el.x + halfW;
    const top = el.y - halfH;
    const bottom = el.y + halfH;
    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }, []);

  const handlePointerDown = useCallback((id: string) => (e: FederatedPointerEvent) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;

    const localPos = getCanvasLocalFromEvent(e);

    if (isPointInsideElement(localPos, element)) {
      setIsDragging(true);
      setDraggingId(id);
      dragOffsetRef.current = {
        x: localPos.x - element.x,
        y: localPos.y - element.y,
      };
      e.stopPropagation();
      e.preventDefault?.();
    }
  }, [elements, getCanvasLocalFromEvent, isPointInsideElement]);

  const handlePointerMove = useCallback((e: FederatedPointerEvent) => {
    if (!isDragging || !draggingId) return;
    const localPos = getCanvasLocalFromEvent(e);
    const { x: offX, y: offY } = dragOffsetRef.current;
    updateElementPosition(draggingId, {
      x: localPos.x - offX,
      y: localPos.y - offY,
    });
  }, [isDragging, draggingId, getCanvasLocalFromEvent, updateElementPosition]);

  const handlePointerUp = useCallback(() => {
    if (!isDragging) return;
    setIsDragging(false);
    setDraggingId(null);
  }, [isDragging]);

  return {
    handlePointerDown,
    handlePointerMove,
    handlePointerUp,
    isDragging,
    draggingId,
  };
}


