import { useEffect } from 'react';
import type { Container } from 'pixi.js';
import type { ViewportWrapper } from '@/components/designer/viewport/viewport-wrapper';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface UseViewportEmptyAreaClickProps {
  viewportRef: React.RefObject<ViewportWrapper | null>;
  tool: string;
  elements: AnimatedCanvasObject[];
  shapeRefs: React.MutableRefObject<Record<string, unknown>>;
  onEmptyAreaClick?: () => void;
}

export const useViewportEmptyAreaClick = ({
  viewportRef,
  tool,
  elements,
  shapeRefs,
  onEmptyAreaClick,
}: UseViewportEmptyAreaClickProps) => {
  useEffect(() => {
    if (!viewportRef.current) return;

    const viewport = viewportRef.current;
    
    const handleViewportClick = (e: { global: { x: number; y: number } }) => {
      // Handle empty area clicks on the viewport
      if (tool === 'select') {
        // Check if the click is not on any interactive element
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

        // If no element was hit, this is an empty area click
        if (!hitElement) {
          onEmptyAreaClick?.();
        }
      }
    };

    // Add the event listener to the viewport
    viewport.on('pointerdown', handleViewportClick);

    return () => {
      viewport.off('pointerdown', handleViewportClick);
    };
  }, [tool, elements, shapeRefs, onEmptyAreaClick, viewportRef]);
}; 