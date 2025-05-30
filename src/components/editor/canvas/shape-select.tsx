import React, { useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';

extend({ Container, Graphics });

interface ShapeSelectProps {
  element: AnimatedCanvasElement;
  scaleFactor?: number;
}

const ShapeSelect: React.FC<ShapeSelectProps> = ({
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

      // Calculate line bounding box with padding for better selection
      const padding = 10;
      const minX = Math.min(startX, endX) - padding;
      const maxX = Math.max(startX, endX) + padding;
      const minY = Math.min(startY, endY) - padding;
      const maxY = Math.max(startY, endY) + padding;

      // Draw selection rectangle covering the entire line length
      g.rect(minX, minY, maxX - minX, maxY - minY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });

      // Draw the actual line for visual reference
      g.moveTo(startX, startY).lineTo(endX, endY);
      g.stroke({ width: 2, color: 0x74b9ff, alpha: 0.8 });

      // Draw endpoint markers
      const ENDPOINT_SIZE = 10;

      // Start point
      g.circle(startX, startY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

      // End point
      g.circle(endX, endY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

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

export default ShapeSelect;