import React, { useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

extend({ Container, Graphics });

interface ElementSelectProps {
  element: AnimatedCanvasObject;
  scaleFactor?: number;
}

const ElementSelect: React.FC<ElementSelectProps> = ({
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
      const { controlPoint, isCurved } = element.lineOptions;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;

      const ENDPOINT_SIZE = 7;
      const halfSize = ENDPOINT_SIZE / 2;
      
      // Calculate line bounding box
      let minX = Math.min(startX, endX);
      let maxX = Math.max(startX, endX);
      let minY = Math.min(startY, endY);
      let maxY = Math.max(startY, endY);
      
      // Include control point in bounding box calculation if it exists
      if (isCurved && controlPoint) {
        const controlX = controlPoint.x - element.x;
        const controlY = controlPoint.y - element.y;
        minX = Math.min(minX, controlX);
        maxX = Math.max(maxX, controlX);
        minY = Math.min(minY, controlY);
        maxY = Math.max(maxY, controlY);
      }

      // Draw selection rectangle around the line
      g.rect(minX, minY, maxX - minX, maxY - minY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });

      // Draw the actual line for visual reference
      if (isCurved && controlPoint) {
        // Draw curved line
        g.moveTo(startX, startY);
        g.quadraticCurveTo(controlPoint.x - element.x, controlPoint.y - element.y, endX, endY);
        g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
      } else {
        // Draw straight line
        g.moveTo(startX, startY);
        g.lineTo(endX, endY);
        g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
      }

      // Draw endpoint markers (square handles like resize handles) - positioned to extend outside the selection rectangle
      // Start point - square handle
      g.rect(startX - halfSize, startY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
      g.fill({ color: 0xFFFFFF, alpha: 1 });
      g.stroke({ color: 0x74b9ff, width: 1, alpha: 0.8 });

      // End point - square handle  
      g.rect(endX - halfSize, endY - halfSize, ENDPOINT_SIZE, ENDPOINT_SIZE);
      g.fill({ color: 0xFFFFFF, alpha: 1 });
      g.stroke({ color: 0x74b9ff, width: 1, alpha: 0.8 });

      // Draw control point marker only for curved lines
      if (isCurved && controlPoint) {
        const CONTROL_SIZE = 6;
        const controlHalfSize = CONTROL_SIZE / 2;
        const controlX = controlPoint.x - element.x;
        const controlY = controlPoint.y - element.y;
        
        // Diamond shape for control point
        g.moveTo(controlX, controlY - controlHalfSize);
        g.lineTo(controlX + controlHalfSize, controlY);
        g.lineTo(controlX, controlY + controlHalfSize);
        g.lineTo(controlX - controlHalfSize, controlY);
        g.closePath();
        g.fill({ color: 0x4CAF50, alpha: 0.9 }); // Green fill
        g.stroke({ color: 0x2E7D32, width: 1, alpha: 1 }); // Darker green border
      }

      return; // Exit early for line elements
    }

    // Draw rectangular bounding box for all non-line elements first
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
      alpha: 0.4, // More transparent for bounding box
    });

    // Then draw shape-specific outlines on top for circles and triangles
    if (element.type === 'circle') {
      // Draw circle outline
      const radius = element.height / 2;
      g.ellipse(0, 0, radius, radius);
      g.stroke({
        width: 1,
        color: 0x74b9ff,
        alpha: 0.85,
      });
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
      g.poly(points);
      g.stroke({
        width: 1,
        color: 0x74b9ff,
        alpha: 0.85,
      });
    } else if (element.type === 'rectangle') {
      // For rectangles, enhance the existing outline
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
    }
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

export default ElementSelect;