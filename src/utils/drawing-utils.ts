import { Graphics } from 'pixi.js';
import { DashLine } from '@/utils/dash-line';
import type { AnimatedCanvasElement } from '@/types/canvas';

export const parseColor = (color: string | number | undefined): number => {
  if (!color) return 0x000000;
  if (typeof color === 'number') return color;
  if (color.startsWith('#')) {
    return parseInt(color.slice(1), 16);
  }
  return parseInt(color, 16);
};

export const drawArrowhead = (
  graphics: Graphics,
  tipPoint: { x: number; y: number },
  fromPoint: { x: number; y: number },
  color: number
) => {
  const angle = Math.atan2(tipPoint.y - fromPoint.y, tipPoint.x - fromPoint.x);
  const arrowSize = 10;

  graphics
    .fill({ color })
    .moveTo(tipPoint.x, tipPoint.y)
    .lineTo(
      tipPoint.x - arrowSize * Math.cos(angle - Math.PI / 6),
      tipPoint.y - arrowSize * Math.sin(angle - Math.PI / 6)
    )
    .lineTo(
      tipPoint.x - arrowSize * Math.cos(angle + Math.PI / 6),
      tipPoint.y - arrowSize * Math.sin(angle + Math.PI / 6)
    )
    .closePath()
    .fill();
};

export const drawSmoothLine = (
  graphics: Graphics,
  start: { x: number; y: number },
  end: { x: number; y: number },
  color: number,
  width: number,
  alpha: number
) => {
  graphics
    .clear()
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke({ color, width, alpha });
};

export const drawDottedLine = (
  graphics: Graphics,
  start: { x: number; y: number },
  end: { x: number; y: number },
  color: number,
  width: number,
  alpha: number,
  dashPattern: [number, number] = [10, 5]
) => {
  graphics.clear();
  new DashLine(graphics, { dash: dashPattern, width, color, alpha })
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y);
};

export const drawLine = (
  graphics: Graphics,
  shape: AnimatedCanvasElement & {
    stroke?: string | number;
    strokeWidth?: number;
    lineOptions?: {
      points?: { start: { x: number; y: number }; end: { x: number; y: number } };
      dotted?: boolean;
      arrow?: boolean;
    };
  }
) => {
  if (shape.type !== 'line' || !shape.lineOptions?.points) return;

  const color = parseColor(shape.stroke || shape.fill);
  const width = shape.strokeWidth || 2;
  const alpha = shape.opacity ?? 1;
  
  const start = {
    x: shape.lineOptions.points.start.x - shape.x,
    y: shape.lineOptions.points.start.y - shape.y
  };
  
  const end = {
    x: shape.lineOptions.points.end.x - shape.x,
    y: shape.lineOptions.points.end.y - shape.y
  };

  if (shape.lineOptions.dotted) {
    drawDottedLine(graphics, start, end, color, width, alpha);
  } else {
    drawSmoothLine(graphics, start, end, color, width, alpha);
  }

  if (shape.lineOptions.arrow) {
    drawArrowhead(graphics, end, start, color);
  }
};

function drawShapePath(graphics: Graphics, shape: AnimatedCanvasElement) {
  switch (shape.type) {
    case 'rectangle':
      // Draw rectangle centered around origin
      graphics.rect(
        -shape.width / 2,
        -shape.height / 2,
        shape.width,
        shape.height
      );
      break;
      
    case 'circle':
      // Draw circle with radius = rectangle height / 2
      const radius = shape.height / 2;
      graphics.ellipse(0, 0, radius, radius);
      break;
      
    case 'triangle':
      // Draw equilateral triangle with height matching rectangle height
      const height = shape.height;
      // For an equilateral triangle, if h is height, then side length = 2h/√3
      const sideLength = (2 * height) / Math.sqrt(3);
      // Calculate the points for an equilateral triangle centered at origin
      const halfWidth = sideLength / 2;
      const points = [
        { x: 0, y: -height/2 },                    // top point
        { x: -halfWidth, y: height/2 },            // bottom left
        { x: halfWidth, y: height/2 }              // bottom right
      ];
      graphics.poly(points);
      break;
      
    case 'line':
      if (shape.lineOptions?.points) {
        const { start, end } = shape.lineOptions.points;
        graphics
          .moveTo(start.x - shape.x, start.y - shape.y)
          .lineTo(end.x - shape.x, end.y - shape.y);
      }
      break;

    case 'path':
      if (shape.pathPoints && shape.pathPoints.length > 1) {
        graphics.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
        for (let i = 1; i < shape.pathPoints.length; i++) {
          graphics.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
        }
      }
      break;
      
    case 'svg':
      graphics.rect(
        -shape.width / 2,
        -shape.height / 2,
        shape.width,
        shape.height
      );
      break;
  }
}

export function createShapeGraphics(shape: AnimatedCanvasElement, color?: string | number): Graphics {
  const graphics = new Graphics();
  const fillColor = color ?? shape.fill;
  
  if (shape.type === 'svg' && shape.svgData) {
    graphics.rect(
      -shape.width / 2,
      -shape.height / 2,
      shape.width,
      shape.height
    );
    graphics.fill({ color: 0xFFFFFF, alpha: 0 });
    
    return graphics;
  }
  
  if (shape.isPath) {
    const grayColor = 0x888888;
    
    if (shape.type === 'line' || shape.type === 'path') {
      drawShapePath(graphics, shape);
      const dashLine = new DashLine(graphics, {
        dash: [5, 3],
        width: 2,
        color: grayColor,
        alpha: 0.7
      });
      
      if (shape.type === 'line' && shape.lineOptions?.points) {
        const { start, end } = shape.lineOptions.points;
        dashLine
          .moveTo(start.x - shape.x, start.y - shape.y)
          .lineTo(end.x - shape.x, end.y - shape.y);
      } else if (shape.type === 'path' && shape.pathPoints && shape.pathPoints.length > 1) {
        dashLine.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
        for (let i = 1; i < shape.pathPoints.length; i++) {
          dashLine.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
        }
      }
    } else {
      drawShapePath(graphics, shape);
      graphics.fill({ color: fillColor, alpha: 0.15 });
      
      const dashLine = new DashLine(graphics, {
        dash: [5, 3],
        width: 2,
        color: grayColor,
        alpha: 0.7
      });
      
      switch (shape.type) {
        case 'rectangle':
          dashLine.drawRect(
            -shape.width / 2,
            -shape.height / 2,
            shape.width,
            shape.height
          );
          break;
          
        case 'circle':
          dashLine.drawCircle(
            0,
            0,
            shape.height / 2
          );
          break;
          
        case 'triangle':
          const height = shape.height;
          const sideLength = (2 * height) / Math.sqrt(3);
          const halfWidth = sideLength / 2;
          
          dashLine.moveTo(0, -height/2)
            .lineTo(halfWidth, height/2)
            .lineTo(-halfWidth, height/2)
            .closePath();
          break;
      }
    }
  } else {
    if (shape.type === 'line' || shape.type === 'path') {
      drawShapePath(graphics, shape);
      graphics.stroke({ 
        color: fillColor, 
        width: shape.strokeWidth || 2, 
        alpha: shape.opacity ?? 1 
      });
    } else {
      drawShapePath(graphics, shape);
      graphics.fill({ color: fillColor, alpha: shape.opacity ?? 1 });
    }
  }
  
  return graphics;
}

export function drawShape(graphics: Graphics, shape: AnimatedCanvasElement) {
  graphics.clear();
  
  // Skip SVG elements - they're handled directly in the Canvas component
  if (shape.type === 'svg') {
    // Just draw a bounding box
    graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
    graphics.fill({ color: 0xFFFFFF, alpha: 0.01 });
    graphics.stroke({ color: parseColor(shape.stroke || '#cccccc'), width: shape.strokeWidth || 1, alpha: 0.3 });
    return;
  }
  
  if (shape.isPath) {
    // For path elements, use a gray dotted line style
    const grayColor = 0x888888; // Light gray color
    
    // Draw the shape with special path styling
    drawShapePath(graphics, shape);
    
    if (shape.type === 'line') {
      // For line paths, use the dotted line directly
      if (shape.lineOptions?.points) {
        const { start, end } = shape.lineOptions.points;
        const startPoint = {
          x: start.x - shape.x,
          y: start.y - shape.y
        };
        
        const endPoint = {
          x: end.x - shape.x,
          y: end.y - shape.y
        };
        
        // Draw as dotted line with gray color
        drawDottedLine(
          graphics, 
          startPoint, 
          endPoint, 
          grayColor, 
          2, 
          0.7, // Slightly transparent
          [5, 3] // Smaller dash pattern for path elements
        );
      }
    } else if (shape.type === 'path') {
      // For free-drawn paths, use dotted line dash pattern
      if (shape.pathPoints && shape.pathPoints.length > 1) {
        const dashLine = new DashLine(graphics, { 
          dash: [5, 3], 
          width: 2, 
          color: grayColor, 
          alpha: 0.7 
        });
        
        dashLine.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
        for (let i = 1; i < shape.pathPoints.length; i++) {
          dashLine.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
        }
      }
    } else {
      // For other shapes (rectangle, circle, triangle), use dotted stroke and semi-transparent fill
      graphics.fill({ 
        color: shape.fill, 
        alpha: 0.15 // Very transparent fill
      });
      
      // Add dotted stroke with gray color
      const dashLine = new DashLine(graphics, { 
        dash: [5, 3], 
        width: 2, 
        color: grayColor, 
        alpha: 0.7
      });
      
      // Re-draw the shape outline as dotted
      switch (shape.type) {
        case 'rectangle':
          dashLine.drawRect(
            -shape.width / 2, 
            -shape.height / 2,
            shape.width,
            shape.height
          );
          break;
          
        case 'circle':
          dashLine.drawCircle(
            0, 
            0, 
            shape.height / 2
          );
          break;
          
        case 'triangle':
          const height = shape.height;
          const sideLength = (2 * height) / Math.sqrt(3);
          const halfWidth = sideLength / 2;
          
          dashLine.moveTo(0, -height/2)
            .lineTo(halfWidth, height/2)
            .lineTo(-halfWidth, height/2)
            .closePath();
          break;
      }
    }
  } else {
    // Regular drawing for non-path elements
    if (shape.type === 'line') {
      drawLine(graphics, shape);
    } else if (shape.type === 'path') {
      drawShapePath(graphics, shape);
      graphics.stroke({ 
        color: parseColor(shape.stroke || shape.fill), 
        width: shape.strokeWidth || 2, 
        alpha: shape.opacity ?? 1 
      });
    } else {
      drawShapePath(graphics, shape);
      graphics.fill({ color: shape.fill, alpha: shape.opacity });
      graphics.stroke({ color: shape.stroke, width: shape.strokeWidth, alpha: shape.opacity });
    }
  }
}

export const drawSelectionOutline = (graphics: Graphics, shape: AnimatedCanvasElement) => {
  graphics.clear();

  graphics.stroke({
    width: 3,
    color: 'cyan',
  });

  switch (shape.type) {
    case 'rectangle':
    case 'svg':
      graphics.roundRect(
        -shape.width / 2,
        -shape.height / 2,
        shape.width,
        shape.height,
        shape.cornerRadius || 0
      );
      break;
    case 'circle':
      const radius = shape.height / 2;
      graphics.ellipse(0, 0, radius, radius);
      break;
    case 'triangle':
      const height = shape.height;
      const sideLength = (2 * height) / Math.sqrt(3);
      const halfWidth = sideLength / 2;
      const points = [
        { x: 0, y: -height/2 },
        { x: -halfWidth, y: height/2 },
        { x: halfWidth, y: height/2 }
      ];
      graphics.poly(points);
      break;
    case 'line':
      if (shape.lineOptions?.points) {
        const { start, end } = shape.lineOptions.points;
        const startX = start.x - shape.x;
        const startY = start.y - shape.y;
        const endX = end.x - shape.x;
        const endY = end.y - shape.y;
        
        graphics
          .moveTo(startX, startY)
          .lineTo(endX, endY);

        const HANDLE_SIZE = 10;
        
        graphics.circle(startX, startY, HANDLE_SIZE / 2);
        graphics.fill({ color: 0x00ff00, alpha: 0.5 });
        graphics.stroke({ color: 'cyan', width: 3 });
        
        // End po int marker (red)
        graphics.circle(endX, endY, HANDLE_SIZE / 2);
        graphics.fill({ color: 0xff0000, alpha: 0.5 });
        graphics.stroke({ color: 'cyan', width: 3 });
      }
      break;
    case 'path':
      if (shape.pathPoints && shape.pathPoints.length > 1) {
        graphics.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
        for (let i = 1; i < shape.pathPoints.length; i++) {
          graphics.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
        }
      }
      break;
  }
};

export function calculateLineLength(points: { start: { x: number, y: number }, end: { x: number, y: number } }): number {
  const dx = points.end.x - points.start.x;
  const dy = points.end.y - points.start.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateLineAngle(points: { start: { x: number, y: number }, end: { x: number, y: number } }): number {
  return Math.atan2(points.end.y - points.start.y, points.end.x - points.start.x);
}

export function updateLineEndPoint(
  startPoint: { x: number, y: number },
  length: number,
  angle: number
): { x: number, y: number } {
  return {
    x: startPoint.x + length * Math.cos(angle),
    y: startPoint.y + length * Math.sin(angle)
  };
}

export function calculateNorthAngle(points: { start: { x: number, y: number }, end: { x: number, y: number } }): number {
  const mathAngle = calculateLineAngle(points);
  const northAngle = (450 - (mathAngle * 180 / Math.PI)) % 360;
  return northAngle;
}

export function updateLineFromLengthAndNorthAngle(
  startPoint: { x: number, y: number },
  length: number,
  northAngleDegrees: number
): { x: number, y: number } {
  const mathAngle = ((450 - northAngleDegrees) % 360) * Math.PI / 180;
  return updateLineEndPoint(startPoint, length, mathAngle);
} 