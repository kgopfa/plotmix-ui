import { Graphics, Texture } from 'pixi.js';
import { AnimationPath } from '@/utils/animation-path';
import type { AnimatedCanvasObject } from '@/types/canvas';

// Cache for loaded image textures to prevent reloading during drag operations
const imageTextureCache = new Map<string, Texture>();

// Function to clear texture cache (useful for memory management)
export function clearImageTextureCache() {
  imageTextureCache.forEach(texture => {
    if (texture && !texture.destroyed) {
      texture.destroy();
    }
  });
  imageTextureCache.clear();
}

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
  shape: AnimatedCanvasObject & {
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

function drawShapePath(graphics: Graphics, shape: AnimatedCanvasObject) {
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
  }
}

function drawShapeAsPath(graphics: Graphics, shape: AnimatedCanvasObject) {
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

export function createShapeGraphics(shape: AnimatedCanvasObject, color?: string | number): Graphics {
  const graphics = new Graphics();

  if (shape.isAnimationPath) {
    drawShapeAsPath(graphics, shape);
    return graphics;
  }

  const fillColor = color ?? shape.fill;
  
  if (shape.type === 'image' && shape.imageData) {
    graphics.rect(
      -shape.width / 2,
      -shape.height / 2,
      shape.width,
      shape.height
    );
    // Make it slightly visible for selection/hover but mostly transparent
    graphics.fill({ color: 0xFFFFFF, alpha: 0.01 });
    
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

export function drawShape(graphics: Graphics, shape: AnimatedCanvasObject) {
  graphics.clear();

  processImage(graphics, shape);
  
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
    if (shape.type === 'line') {
      drawLine(graphics, shape);
    } else {
      const width = shape.type === 'path' ? 2 : 1;
      drawShapePath(graphics, shape);

      if (shape.type !== 'path') {
        graphics.fill({ color: shape.fill, alpha: shape.opacity });
      }

      graphics.stroke({ 
        color: parseColor(shape.stroke || shape.fill), 
        width: shape.strokeWidth || width, 
        alpha: shape.opacity ?? 1 
      });
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

function processImage(graphics: Graphics, shape: AnimatedCanvasObject) {
  if (shape.type === 'image' && shape.imageData) {
    try {
      // Check if it's an SVG by looking for SVG content
      const isSVG = shape.imageData.includes('<svg') || shape.imageData.startsWith('data:image/svg+xml');
      
      let dataUrl = shape.imageData;
      
      if (isSVG && !shape.imageData.startsWith('data:')) {
        // Handle SVG content that needs to be converted to data URL
        let svgContent = shape.imageData;
        
        // Prepare SVG for high-quality rendering while maintaining correct dimensions
        const svgTagMatch = svgContent.match(/<svg[^>]*>/);
        if (svgTagMatch) {
          let svgTag = svgTagMatch[0];
          
          // Add high-quality rendering attributes without changing dimensions
          if (!svgTag.includes('shape-rendering=')) {
            svgTag = svgTag.replace('<svg', '<svg shape-rendering="geometricPrecision"');
          }
          if (!svgTag.includes('text-rendering=')) {
            svgTag = svgTag.replace('<svg', '<svg text-rendering="geometricPrecision"');
          }
          if (!svgTag.includes('image-rendering=')) {
            svgTag = svgTag.replace('<svg', '<svg image-rendering="optimizeQuality"');
          }
          
          // Set explicit dimensions for the SVG
          if (!svgContent.includes('width=') || !svgContent.includes('height=')) {
            svgTag = svgTag.replace('<svg', 
              `<svg width="${shape.width}" height="${shape.height}"`);
          }
          
          // Add viewBox for better scaling
          if (!svgContent.includes('viewBox=')) {
            svgTag = svgTag.replace('<svg', 
              `<svg viewBox="0 0 ${shape.width} ${shape.height}"`);
          }
          
          svgContent = svgContent.replace(svgTagMatch[0], svgTag);
        }

        // Create base64 data URL for SVG
        const base64 = window.btoa(unescape(encodeURIComponent(svgContent)));
        dataUrl = `data:image/svg+xml;base64,${base64}`;
      }
      
      // Create a cache key that includes image data and dimensions
      const cacheKey = `${dataUrl}_${shape.width}_${shape.height}`;
      
      // Check if we already have this texture cached
      const cachedTexture = imageTextureCache.get(cacheKey);
      if (cachedTexture && !cachedTexture.destroyed) {
        // Use cached texture immediately - no flashing!
        graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
        graphics.fill({
          texture: cachedTexture,
          alpha: shape.opacity ?? 1
        });
        return;
      }
      
      // Show placeholder only on first load
      graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
      graphics.fill({ color: 0xF0F0F0, alpha: 0.8 }); // Light gray placeholder
      graphics.stroke({ color: 0xCCCCCC, width: 2 }); // Gray border
      
      // Load image asynchronously only if not cached
      const img = new Image();
      img.onload = () => {
        try {
          // Check if the graphics object is still valid
          if (!graphics || graphics.destroyed) {
            console.warn("Graphics object no longer valid");
            return;
          }
          
          // Convert image to canvas to avoid PixiJS warning and improve compatibility
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          
          // Set canvas size to match the shape dimensions
          canvas.width = shape.width;
          canvas.height = shape.height;
          
          // Draw the image to canvas
          ctx.drawImage(img, 0, 0, shape.width, shape.height);
          
          // Create texture from canvas instead of image
          const texture = Texture.from(canvas);
          
          // Verify texture was created successfully
          if (texture && texture.source) {
            // Enable anti-aliasing and smooth scaling on the texture
            texture.source.scaleMode = 'linear'; // Use linear filtering for smoother scaling
            texture.source.antialias = true; // Enable anti-aliasing
            
            // Cache the texture for future use
            imageTextureCache.set(cacheKey, texture);
            
            graphics.clear();
            graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
            graphics.fill({
              texture: texture,
              alpha: shape.opacity ?? 1
            });
          } else {
            console.warn("Texture creation failed - invalid texture object");
          }
        } catch (asyncError) {
          console.error("Async image texture creation failed:", asyncError);
          // Keep the placeholder visible on error
        }
      };
      
      img.onerror = (error) => {
        console.error("Failed to load image:", error);
        // Keep the placeholder visible on error
      };
      
      img.src = dataUrl;
    } catch (error) {
      console.error("Error in image rendering setup:", error);
      // Enhanced fallback with better visual indication
      graphics.rect(-shape.width/2, -shape.height/2, shape.width, shape.height);
      graphics.fill({ color: 0xFFEEEE, alpha: 0.8 });
      graphics.stroke({ color: 0xFF6666, width: 2 });
      
      // Add "IMG" text indicator (basic fallback)
      // Note: This is a simple fallback - in a real app you might want to show more info
    }
    return;
  }
}
