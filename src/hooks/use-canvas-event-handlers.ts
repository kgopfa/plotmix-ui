import { useCallback } from 'react';
import type { FederatedPointerEvent } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface UseCanvasEventHandlersProps {
  elements: AnimatedCanvasObject[];
  shapeRefs: React.MutableRefObject<Record<string, unknown>>;
  onCanvasClick: (e: FederatedPointerEvent) => void;
  onCanvasPointerMove: (e: FederatedPointerEvent) => void;
  onPointerUp: () => void;
}

export const useCanvasEventHandlers = ({
  elements,
  shapeRefs,
  onCanvasClick,
  onCanvasPointerMove,
  onPointerUp,
}: UseCanvasEventHandlersProps) => {
  // Canvas pointer down handler
  const handleCanvasPointerDown = useCallback((e: FederatedPointerEvent) => {
    console.log('[DesignCanvas] onPointerDown called', { x: e.global.x, y: e.global.y });

    // Only call canvas click handler if no element was clicked
    // This prevents deselection when clicking on elements
    const hitElement = elements.find(element => {
      const shapeRef = shapeRefs.current[element.id];
      if (!shapeRef) return false;

      // Check if the click point is within the element's bounds
      const bounds = (shapeRef as Container).getBounds();
      return e.global.x >= bounds.x &&
        e.global.x <= bounds.x + bounds.width &&
        e.global.y >= bounds.y &&
        e.global.y <= bounds.y + bounds.height;
    });

    // Always call canvas click handler for shape creation, even when locked
    if (!hitElement) {
      onCanvasClick(e);
    }
  }, [elements, shapeRefs, onCanvasClick]);

  // Canvas pointer move handler
  const handleCanvasPointerMove = useCallback((e: FederatedPointerEvent) => {
    // Call the canvas pointer move handler for drawing and other interactions
    onCanvasPointerMove(e);
  }, [onCanvasPointerMove]);

  // Canvas click handler
  const handleCanvasClick = useCallback((e: FederatedPointerEvent) => {
    console.log('[DesignCanvas] onClick called', { x: e.global.x, y: e.global.y });
    // Only call canvas click handler if no element was clicked
    // This prevents deselection when clicking on elements
    const hitElement = elements.find(element => {
      const shapeRef = shapeRefs.current[element.id];
      if (!shapeRef) return false;

      // Check if the click point is within the element's bounds
      const bounds = (shapeRef as Container).getBounds();
      return e.global.x >= bounds.x &&
        e.global.x <= bounds.x + bounds.width &&
        e.global.y >= bounds.y &&
        e.global.y <= bounds.y + bounds.height;
    });

    // Only call canvas click handler if no element was hit
    if (!hitElement) {
      onCanvasClick(e);
    }
  }, [elements, shapeRefs, onCanvasClick]);

  return {
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handleCanvasClick,
    handlePointerUp: onPointerUp,
  };
}; 