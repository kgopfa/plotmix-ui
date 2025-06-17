import React, { useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

extend({ Container, Graphics });

interface ObjectSelectProps {
  element: AnimatedCanvasObject;
  scaleFactor?: number;
}

const ObjectSelect: React.FC<ObjectSelectProps> = ({
  element,
}) => {
  // State for tracking resize dimensions
  const [dimensions, setDimensions] = useState({
    width: element.width,
    height: element.height
  });
  
  // Draw only the selection outline
  const drawOutline = (g: PIXI.Graphics) => {
    g.clear();

    // For line type, draw custom selection outline
    if (element.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;

      const ENDPOINT_SIZE = 7;
      const halfSize = ENDPOINT_SIZE / 2;
      
      // Calculate line bounding box (just around the line itself)
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);

      // Draw selection rectangle around the line (without extending to handles)
      g.rect(minX, minY, maxX - minX, maxY - minY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });

      // Draw the actual line for visual reference
      g.moveTo(startX, startY).lineTo(endX, endY);
      g.stroke({ width: 2, color: 0x74b9ff, alpha: 0.8 });

      // Draw endpoint markers (square handles like resize handles) - positioned to extend outside the selection rectangle
      // Start point - square handle
      g.rect(startX - halfSize, startY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
      g.fill({ color: 0xFFFFFF, alpha: 1 });
      g.stroke({ color: 0x74b9ff, width: 1, alpha: 0.8 });

      // End point - square handle  
      g.rect(endX - halfSize, endY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
      g.fill({ color: 0xFFFFFF, alpha: 1 });
      g.stroke({ color: 0x74b9ff, width: 1, alpha: 0.8 });

      return; // Exit early for line elements
    }

    // Draw rectangular outline for non-line elements - NO HANDLES
    g.roundRect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height,
      element.cornerRadius
    );

    g.stroke({
      width: 1,
      color: 0x74b9ff,
      alpha: 0.85,
    });
  };

  // Update local dimensions when element props change
  useEffect(() => {
    setDimensions({
      width: element.width,
      height: element.height
    });

    if (element.isAnimationPath) {
      // Dispatch a custom event to trigger animation updates for path elements
      const animationPathUpdateEvent = new CustomEvent('animation-path-updated', {
        detail: {
          pathElement: element
        }
      });

      window.dispatchEvent(animationPathUpdateEvent);
    }
  }, [element.width, element.height, element]);

  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      {/* VISUAL ONLY: Selection outline - NO event handling */}
      <pixiGraphics
        draw={drawOutline}
        eventMode="passive"
      />
    </pixiContainer>
  );
};

export default ObjectSelect;