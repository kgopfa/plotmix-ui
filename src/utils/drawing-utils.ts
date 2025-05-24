import { Graphics, Texture, Sprite } from 'pixi.js';
import { AnimationPath } from '@/utils/animation-path';
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
  dashPattern: [number, number] = [10, 5],
  shouldClear: boolean = true
) => {
  if (shouldClear) {
    graphics.clear();
  }
  new AnimationPath(graphics, { dash: dashPattern, width, color, alpha })
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
      graphics.roundRect(
        -shape.width / 2,
        -shape.height / 2,
        shape.width,
        shape.height,
        shape.cornerRadius
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
      graphics.roundRect(
        -shape.width / 2,
        -shape.height / 2,
        shape.width,
        shape.height
      );
      break;
  }
}

function drawShapeAsPath(graphics: Graphics, shape: AnimatedCanvasElement) {
  const grayColor = 0xD3D3D3;
  
  if (shape.type === 'line' || shape.type === 'path') {
    graphics.clear(); // Make sure to clear before drawing
    drawShapePath(graphics, shape);
    const dashLine = new AnimationPath(graphics, {
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
        
      // Make sure the line is actually drawn
      graphics.stroke({ color: grayColor, width: 2, alpha: 0.7 });
    } else if (shape.type === 'path' && shape.pathPoints && shape.pathPoints.length > 1) {
      dashLine.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
      for (let i = 1; i < shape.pathPoints.length; i++) {
        dashLine.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
      }
    }
  } else {
    drawShapePath(graphics, shape);
    graphics.fill({ color: '0xFFFFFF', alpha: 0.15 });
    
    const dashLine = new AnimationPath(graphics, {
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
}

export function createShapeGraphics(shape: AnimatedCanvasElement, color?: string | number): Graphics {
  const graphics = new Graphics();

  if (shape.isAnimationPath) {
    drawShapeAsPath(graphics, shape);
    return graphics;
  }

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
  
  return graphics;
}

export function drawShape(graphics: Graphics, shape: AnimatedCanvasElement) {
  graphics.clear();

  if (shape.type === 'svg' && shape.svgData) {
    try {
      // Create an image from the SVG
      const img = new Image();
      
      img.onload = () => {
        try {
          // Create a texture from the image
          const texture = Texture.from(img);
          
          // Clear and recreate the graphics with the texture
          graphics.clear();
          
          // Draw a rectangle with the SVG texture
          graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
          graphics.fill({
            texture: texture,
            alpha: shape.opacity ?? 1
          });
        } catch (textureError) {
          console.error("Error creating texture from SVG:", textureError);
          // Fallback to drawing a simple rectangle
          graphics.clear();
          graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
          graphics.fill({ color: 0xFFDDDD, alpha: 0.5 });
          graphics.stroke({ color: 0xFF0000, width: 1 });
        }
      };
      
      img.onerror = (error) => {
        console.error("Error loading SVG image:", error);
        // Fallback to drawing a simple rectangle
        graphics.clear();
        graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
        graphics.fill({ color: 0xFFDDDD, alpha: 0.5 });
        graphics.stroke({ color: 0xFF0000, width: 1 });
      };
      
      if (shape.svgData) {
        let svgContent = shape.svgData;
        
        // Set explicit dimensions for the SVG
        if (!svgContent.includes('width=') || !svgContent.includes('height=')) {
          // Extract SVG tag
          const svgTagMatch = svgContent.match(/<svg[^>]*>/);
          if (svgTagMatch) {
            const svgTag = svgTagMatch[0];
            // Create new tag with dimensions
            const newSvgTag = svgTag.replace('<svg', 
              `<svg width="${shape.width}" height="${shape.height}"`);
            // Replace in content
            svgContent = svgContent.replace(svgTag, newSvgTag);
          }
        }
        
        // Add viewBox for better scaling
        if (!svgContent.includes('viewBox=')) {
          // Extract SVG tag
          const svgTagMatch = svgContent.match(/<svg[^>]*>/);
          if (svgTagMatch) {
            const svgTag = svgTagMatch[0];
            // Create new tag with viewBox
            const newSvgTag = svgTag.replace('<svg', 
              `<svg viewBox="0 0 ${shape.width} ${shape.height}"`);
            // Replace in content
            svgContent = svgContent.replace(svgTag, newSvgTag);
          }
        }

        const base64 = window.btoa(unescape(encodeURIComponent(svgContent)));
        img.src = `data:image/svg+xml;base64,${base64}`;
      }
    } catch (error) {
      console.error("Error in SVG rendering setup:", error);
      // Fallback to drawing a simple rectangle
      graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
      graphics.fill({ color: 0xFFDDDD, alpha: 0.5 });
      graphics.stroke({ color: 0xFF0000, width: 1 });
    }
    return;
  }
  
  if (shape.isAnimationPath) {
    // For path elements, use a gray dotted line style
    const grayColor = 0x888888; // Light gray color
    
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
        
        // Draw as dotted line with gray color - don't clear graphics first since we already did
        drawDottedLine(
          graphics, 
          startPoint, 
          endPoint, 
          grayColor, 
          2, 
          0.7, // Slightly transparent
          [5, 3], // Smaller dash pattern for path elements
          false // Don't clear graphics since we already cleared at the start
        );
        
        // Don't add regular stroke - it overwrites the dotted line
      }
    } else if (shape.type === 'path') {
      // For free-drawn paths, use dotted line dash pattern
      if (shape.pathPoints && shape.pathPoints.length > 1) {
        const dashLine = new AnimationPath(graphics, { 
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
      drawShapePath(graphics, shape);
      graphics.fill({ 
        color: shape.fill, 
        alpha: 0.15 // Very transparent fill
      });
      
      // Add dotted stroke with gray color
      const dashLine = new AnimationPath(graphics, { 
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

// Add a new function for drawing the hover outline
export const drawHoverOutline = (graphics: Graphics, shape: AnimatedCanvasElement) => {
  graphics.clear();
  
  // Always draw a rectangular outline regardless of shape type
  graphics.roundRect(
    -shape.width / 2,
    -shape.height / 2,
    shape.width,
    shape.height,
    shape.cornerRadius
  );
  
  // Apply a light stroke for the hover effect
  graphics.stroke({
    width: 1,
    color: 0x74b9ff,
    alpha: 0.85, // More transparent than selection outline
  });
}; 