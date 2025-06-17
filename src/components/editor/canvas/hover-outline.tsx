import React from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

extend({ Container, Graphics });

interface HoverOutlineProps {
  element: AnimatedCanvasObject;
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
      
      const ENDPOINT_SIZE = 7;
      const halfSize = ENDPOINT_SIZE / 2;
      
      // Calculate line bounding box (just around the line itself)
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);
      
      // Draw hover rectangle around the line (without extending to handles, more transparent than selection)
      graphics.rect(minX, minY, maxX - minX, maxY - minY);
      graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.3 });
      
      // Draw the actual line for visual reference (subtle)
      graphics.moveTo(startX, startY).lineTo(endX, endY);
      graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });
      
      // Draw endpoint markers (square handles like resize handles, more subtle than selection) - positioned to extend outside the hover rectangle
      // Start point - square handle (subtle blue)
      graphics.rect(startX - halfSize, startY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
      graphics.fill({ color: 0x74b9ff, alpha: 0.4 });
      graphics.stroke({ color: 0x74b9ff, width: 1, alpha: 0.5 });
      
      // End point - square handle (subtle blue)
      graphics.rect(endX - halfSize, endY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
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