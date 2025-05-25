import React from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';

extend({ Container, Graphics });

interface HoverOutlineProps {
  element: AnimatedCanvasElement;
}

const HoverOutline: React.FC<HoverOutlineProps> = ({ element }) => {
  const drawHoverOutline = (graphics: PIXI.Graphics) => {
    graphics.clear();
    
    // For line type, draw custom hover outline (same as selection but more subtle)
    if (element.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;
      
      // Calculate line bounding box with padding for hover indication
      const padding = 10;
      const minX = Math.min(startX, endX) - padding;
      const maxX = Math.max(startX, endX) + padding;
      const minY = Math.min(startY, endY) - padding;
      const maxY = Math.max(startY, endY) + padding;
      
      // Draw hover rectangle covering the entire line length (more transparent than selection)
      graphics.rect(minX, minY, maxX - minX, maxY - minY);
      graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.3 });
      
      // Draw the actual line for visual reference (subtle)
      graphics.moveTo(startX, startY).lineTo(endX, endY);
      graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });
      
      // Draw endpoint markers (more subtle than selection)
      const ENDPOINT_SIZE = 10;
      
      // Start point (subtle blue)
      graphics.circle(startX, startY, ENDPOINT_SIZE / 2);
      graphics.fill({ color: 0x74b9ff, alpha: 0.4 });
      graphics.stroke({ color: 0x74b9ff, width: 1, alpha: 0.5 });
      
      // End point (subtle blue)
      graphics.circle(endX, endY, ENDPOINT_SIZE / 2);
      graphics.fill({ color: 0x74b9ff, alpha: 0.4 });
      graphics.stroke({ color: 0x74b9ff, width: 1, alpha: 0.5 });
      
      return;
    }
    
    // For other shapes, draw rectangular hover outline
    graphics.roundRect(
      -element.width / 2,
      -element.height / 2,
      element.width,
      element.height,
      element.cornerRadius
    );
    
    // Apply a light stroke for the hover effect
    graphics.stroke({
      width: 1,
      color: 0x74b9ff,
      alpha: 0.5, // More transparent than selection outline
    });
  };

  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      <pixiGraphics
        draw={drawHoverOutline}
        eventMode="none"
        alpha={1}
      />
    </pixiContainer>
  );
};

export default HoverOutline; 