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
      let minX = Math.min(startX, endX);
      let maxX = Math.max(startX, endX);
      let minY = Math.min(startY, endY);
      let maxY = Math.max(startY, endY);
      
      // Include control point in bounding box calculation if it exists
      if (element.lineOptions.isCurved && element.lineOptions.controlPoint) {
        const controlX = element.lineOptions.controlPoint.x - element.x;
        const controlY = element.lineOptions.controlPoint.y - element.y;
        minX = Math.min(minX, controlX);
        maxX = Math.max(maxX, controlX);
        minY = Math.min(minY, controlY);
        maxY = Math.max(maxY, controlY);
      }
      
      // Draw hover rectangle around the line (without extending to handles, more transparent than selection)
      graphics.rect(minX, minY, maxX - minX, maxY - minY);
      graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.3 });
      
      // Draw the actual line for visual reference (subtle)
      if (element.lineOptions.isCurved && element.lineOptions.controlPoint) {
        // Draw curved line using bezier curves
        graphics.moveTo(startX, startY);
        graphics.quadraticCurveTo(
          element.lineOptions.controlPoint.x - element.x,
          element.lineOptions.controlPoint.y - element.y,
          endX,
          endY
        );
        graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });
      } else {
        // Draw true straight line using lineTo
        graphics.moveTo(startX, startY).lineTo(endX, endY);
        graphics.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });
      }
      
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
    
    // For other shapes, draw shape-specific hover outline
    if (element.type === 'circle') {
      // Draw circle outline
      const radius = element.height / 2;
      graphics.ellipse(0, 0, radius, radius);
    } else if (element.type === 'triangle') {
      // Draw triangle outline using actual width and height bounds
      const height = element.height;
      const width = element.width;
      const halfWidth = width / 2;
      const points = [
        { x: 0, y: -height/2 },                    // top point
        { x: -halfWidth, y: height/2 },            // bottom left
        { x: halfWidth, y: height/2 }              // bottom right
      ];
      graphics.poly(points);
    } else {
      // For rectangles and other shapes, draw rectangular hover outline
      graphics.roundRect(
        -element.width / 2,
        -element.height / 2,
        element.width,
        element.height,
        element.cornerRadius
      );
    }
    
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