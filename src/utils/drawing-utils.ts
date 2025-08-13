import { Graphics, Texture } from 'pixi.js';
import { DropShadowFilter } from 'pixi-filters';
import { AnimationPath } from '@/utils/animation-path';
import type { AnimatedCanvasObject } from '@/types/canvas';
import * as PIXI from 'pixi.js';

// Cache for loaded image textures to prevent reloading during drag operations
const imageTextureCache = new Map<string, Texture>();

// Utility function to calculate the correct width for an equilateral triangle based on height
export const calculateEquilateralTriangleWidth = (height: number): number => {
  // For an equilateral triangle, if h is height, then side length = 2h/√3
  // The width of an equilateral triangle equals its side length
  return (2 * height) / Math.sqrt(3);
};

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
  const trimmed = color.trim().toLowerCase();
  if (trimmed === 'none') return 0x000000;
  if (trimmed.startsWith('#')) {
    const hex = trimmed.slice(1);
    const num = parseInt(hex, 16);
    return Number.isNaN(num) ? 0x000000 : num;
  }
  // Fallback: accept plain hex without '#', else default to black
  const num = parseInt(trimmed, 16);
  return Number.isNaN(num) ? 0x000000 : num;
};

// Helper function to round coordinates to nearest pixel for crisp rendering
export const roundToPixel = (value: number): number => {
  const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
  return Math.round(value * devicePixelRatio) / devicePixelRatio;
};

// Helper function for smooth line positioning - allows sub-pixel positioning for anti-aliasing
export const smoothLinePosition = (value: number): number => {
  // For smooth lines, we want to allow sub-pixel positioning to enable anti-aliasing
  // Only apply minimal rounding to avoid floating point precision issues
  return Math.round(value * 100) / 100;
};

/**
 * Apply shadow filter to a PIXI container based on element shadow properties
 */
export const applyShadowToContainer = (container: PIXI.Container, element: AnimatedCanvasObject) => {
  if (!element.shadowEnabled) {
    // Remove existing shadow filter if shadows are disabled
    removeShadowFromContainer(container);
    return;
  }

  // Create or update drop shadow filter using pixi-filters
  const shadowFilter = new DropShadowFilter({
    color: parseColor(element.shadowColor || '#000000'),
    alpha: element.shadowOpacity || 0.5,
    blur: element.shadowBlur || 0,
    offset: {
      x: element.shadowOffsetX || 10,
      y: element.shadowOffsetY || 10
    },
    quality: 4, // Good balance between quality and performance
    shadowOnly: false // Show both the element and its shadow
  });

  // Apply or update the shadow filter
  const existingFilters = Array.isArray(container.filters) ? container.filters : (container.filters ? [container.filters] : []);
  const nonShadowFilters = existingFilters.filter((filter: PIXI.Filter) => !(filter instanceof DropShadowFilter));
  container.filters = [...nonShadowFilters, shadowFilter];
};

/**
 * Remove shadow filter from a PIXI container
 */
export const removeShadowFromContainer = (container: PIXI.Container) => {
  if (!container.filters) return;
  
  // Remove only DropShadowFilter instances, keep other filters
  const filtersArray = Array.isArray(container.filters) ? container.filters : [container.filters];
  const nonShadowFilters = filtersArray.filter((filter: PIXI.Filter) => !(filter instanceof DropShadowFilter));
  
  if (nonShadowFilters.length > 0) {
    container.filters = nonShadowFilters;
  } else {
    // @ts-expect-error: PIXI allows setting filters to null to clear them
    container.filters = null;
  }
};

/**
 * Update shadow properties for an existing container
 * This is optimized to avoid recreating filters unnecessarily
 */
export const updateShadowForContainer = (container: PIXI.Container, element: AnimatedCanvasObject) => {
  if (!element.shadowEnabled) {
    removeShadowFromContainer(container);
    return;
  }

  // Find existing shadow filter
  const filtersArray = Array.isArray(container.filters) ? container.filters : (container.filters ? [container.filters] : []);
  const existingShadowFilter = filtersArray.find((filter: PIXI.Filter) => filter instanceof DropShadowFilter) as DropShadowFilter;
  
  if (existingShadowFilter) {
    // Update existing filter properties
    existingShadowFilter.color = parseColor(element.shadowColor || '#000000');
    existingShadowFilter.alpha = element.shadowOpacity || 0.5;
    existingShadowFilter.blur = element.shadowBlur || 0;
    existingShadowFilter.offset.x = element.shadowOffsetX || 10;
    existingShadowFilter.offset.y = element.shadowOffsetY || 10;
  } else {
    // No existing filter, create new one
    applyShadowToContainer(container, element);
  }
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
  // Use smooth positioning to allow sub-pixel rendering for anti-aliasing
  const startX = smoothLinePosition(start.x);
  const startY = smoothLinePosition(start.y);
  const endX = smoothLinePosition(end.x);
  const endY = smoothLinePosition(end.y);

  graphics
    .clear()
    .moveTo(startX, startY)
    .lineTo(endX, endY)
    .stroke({
      color,
      width,
      alpha
    });
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

export const drawSmoothCurve = (
  graphics: Graphics,
  start: { x: number; y: number },
  controlPoint: { x: number; y: number },
  end: { x: number; y: number },
  color: number,
  width: number,
  alpha: number
) => {
  graphics
    .clear()
    .moveTo(start.x, start.y)
    .quadraticCurveTo(controlPoint.x, controlPoint.y, end.x, end.y)
    .stroke({
      color,
      width,
      alpha
    });
};

export const drawDottedCurve = (
  graphics: Graphics,
  start: { x: number; y: number },
  controlPoint: { x: number; y: number },
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
  
  // For dotted curves, we'll approximate with line segments
  // This is a simplified approach - for more precise dotted curves,
  // we'd need to sample points along the quadratic curve
  const steps = 20;
  const points: Array<{ x: number; y: number }> = [];
  
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const invT = 1 - t;
    const x = invT * invT * start.x + 2 * invT * t * controlPoint.x + t * t * end.x;
    const y = invT * invT * start.y + 2 * invT * t * controlPoint.y + t * t * end.y;
    points.push({ x, y });
  }
  
  // Use AnimationPath to draw the dotted curve
  const animationPath = new AnimationPath(graphics, { dash: dashPattern, width, color, alpha });
  animationPath.moveTo(points[0].x, points[0].y);
  
  for (let i = 1; i < points.length; i++) {
    animationPath.lineTo(points[i].x, points[i].y);
  }
};

export const drawLine = (
  graphics: Graphics,
  shape: AnimatedCanvasObject & {
    stroke?: string | number;
    strokeWidth?: number;
    lineOptions?: {
      points?: { start: { x: number; y: number }; end: { x: number; y: number } };
      controlPoint?: { x: number; y: number };
      dotted?: boolean;
      arrow?: boolean;
      isCurved?: boolean;
    };
  }
) => {
  if (shape.type !== 'line' || !shape.lineOptions?.points) return;

  // If stroke is explicitly 'none', don't draw the line
  if (shape.stroke === 'none') return;

  const color = parseColor(shape.stroke || shape.fill);
  const width = shape.strokeWidth || 2;
  const alpha = (shape.strokeOpacity ?? shape.opacity ?? 1);

  const start = {
    x: smoothLinePosition(shape.lineOptions.points.start.x - shape.x),
    y: smoothLinePosition(shape.lineOptions.points.start.y - shape.y)
  };

  const end = {
    x: smoothLinePosition(shape.lineOptions.points.end.x - shape.x),
    y: smoothLinePosition(shape.lineOptions.points.end.y - shape.y)
  };

  // Use provided control point when valid, otherwise fall back to midpoint for straight line
  const hasControl = !!shape.lineOptions.controlPoint &&
    typeof shape.lineOptions.controlPoint.x === 'number' &&
    typeof shape.lineOptions.controlPoint.y === 'number';
  const controlPoint = hasControl
    ? {
        x: smoothLinePosition(shape.lineOptions.controlPoint!.x - shape.x),
        y: smoothLinePosition(shape.lineOptions.controlPoint!.y - shape.y)
      }
    : {
        x: smoothLinePosition((start.x + end.x) / 2),
        y: smoothLinePosition((start.y + end.y) / 2)
      };

  if (shape.lineOptions.isCurved && hasControl) {
    if (shape.lineOptions.dotted) {
      drawDottedCurve(graphics, start, controlPoint, end, color, width, alpha);
    } else {
      drawSmoothCurve(graphics, start, controlPoint, end, color, width, alpha);
    }
  } else {
    // Straight line fallback when no valid controlPoint
    graphics
      .clear()
      .moveTo(start.x, start.y)
      .lineTo(end.x, end.y)
      .stroke({ color, width, alpha });
  }

  if (shape.lineOptions.arrow) {
    drawArrowhead(graphics, end, start, color);
  }
};

function drawElement(graphics: Graphics, shape: AnimatedCanvasObject) {
  switch (shape.type) {
    case 'rectangle':
      // Draw rectangle centered around origin with pixel-aligned coordinates
      const rectX = roundToPixel(-shape.width / 2);
      const rectY = roundToPixel(-shape.height / 2);
      const rectW = roundToPixel(shape.width);
      const rectH = roundToPixel(shape.height);
      graphics.roundRect(
        rectX,
        rectY,
        rectW,
        rectH,
        shape.cornerRadius
      );
      break;

    case 'circle':
      // Draw circle with radius = rectangle height / 2, pixel-aligned
      const radius = roundToPixel(shape.height / 2);
      graphics.ellipse(0, 0, radius, radius);
      break;

    case 'arc':
      if (shape.arcOptions) {
        // Constrained arc: endpoints at left/right edges, lowest point at bottom edge
        const halfWidth = roundToPixel(shape.width / 2);
        const halfHeight = roundToPixel(shape.height / 2);

        // Arc endpoints: left and right edges, top of element
        const startX = -halfWidth;
        const startY = -halfHeight;
        const endX = halfWidth;
        const endY = -halfHeight;

        // Arc curves downward to bottom edge
        // For the arc to touch the bottom edge, we need to calculate control points
        // such that the bezier curve's lowest point reaches y = halfHeight
        // Using symmetric control points that extend downward from the endpoints
        const control1X = startX;
        const control1Y = halfHeight; // Control point at bottom edge
        const control2X = endX;
        const control2Y = halfHeight; // Control point at bottom edge

        // Draw the bezier curve
        graphics.moveTo(startX, startY);
        graphics.bezierCurveTo(control1X, control1Y, control2X, control2Y, endX, endY);
      }
      break;

    case 'triangle':
      // Draw triangle to fit within the specified width and height bounds, pixel-aligned
      const height = roundToPixel(shape.height);
      const width = roundToPixel(shape.width);
      // Use the actual width specified in the shape, not the calculated equilateral width
      const halfWidth = roundToPixel(width / 2);
      const points = [
        { x: 0, y: roundToPixel(-height / 2) },                    // top point
        { x: -halfWidth, y: roundToPixel(height / 2) },            // bottom left
        { x: halfWidth, y: roundToPixel(height / 2) }              // bottom right
      ];
      graphics.poly(points);
      break;

    case 'line':
      if (shape.lineOptions?.points) {
        const { start, end } = shape.lineOptions.points;
        const { controlPoint } = shape.lineOptions;
        const startX = smoothLinePosition(start.x - shape.x);
        const startY = smoothLinePosition(start.y - shape.y);
        const endX = smoothLinePosition(end.x - shape.x);
        const endY = smoothLinePosition(end.y - shape.y);
        
        // Lines are always curved by default
        const controlX = smoothLinePosition(controlPoint!.x - shape.x);
        const controlY = smoothLinePosition(controlPoint!.y - shape.y);
        graphics
          .moveTo(startX, startY)
          .quadraticCurveTo(controlX, controlY, endX, endY);
      }
      break;

    case 'path':
      if (shape.pathPoints && shape.pathPoints.length > 1) {
        const firstPoint = shape.pathPoints[0];
        graphics.moveTo(roundToPixel(firstPoint.x), roundToPixel(firstPoint.y));
        for (let i = 1; i < shape.pathPoints.length; i++) {
          const point = shape.pathPoints[i];
          graphics.lineTo(roundToPixel(point.x), roundToPixel(point.y));
        }
      }
      break;
  }
}

function drawShapeAsPath(graphics: Graphics, shape: AnimatedCanvasObject) {
  const grayColor = 0xD3D3D3;

  if (shape.type === 'line' || shape.type === 'path') {
    graphics.clear(); // Make sure to clear before drawing
    drawElement(graphics, shape);
    const dashLine = new AnimationPath(graphics, {
      dash: [5, 3],
      width: 2,
      color: grayColor,
      alpha: 0.7
    });

    if (shape.type === 'line' && shape.lineOptions?.points) {
      const { start, end } = shape.lineOptions.points;
      const { controlPoint } = shape.lineOptions;
      
      // Lines are always curved by default
      const controlX = controlPoint!.x - shape.x;
      const controlY = controlPoint!.y - shape.y;
      
      // Approximate quadratic curve with multiple line segments
      const segments = 10;
      dashLine.moveTo(start.x - shape.x, start.y - shape.y);
      
      for (let i = 1; i <= segments; i++) {
        const t = i / segments;
        const x = (1 - t) * (1 - t) * (start.x - shape.x) + 2 * (1 - t) * t * controlX + t * t * (end.x - shape.x);
        const y = (1 - t) * (1 - t) * (start.y - shape.y) + 2 * (1 - t) * t * controlY + t * t * (end.y - shape.y);
        dashLine.lineTo(x, y);
      }

      // Make sure the line is actually drawn
      graphics.stroke({ color: grayColor, width: 2, alpha: 0.7 });
    } else if (shape.type === 'path' && shape.pathPoints && shape.pathPoints.length > 1) {
      dashLine.moveTo(shape.pathPoints[0].x, shape.pathPoints[0].y);
      for (let i = 1; i < shape.pathPoints.length; i++) {
        dashLine.lineTo(shape.pathPoints[i].x, shape.pathPoints[i].y);
      }
    }
  } else {
    drawElement(graphics, shape);
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
        const width = shape.width;
        const halfWidth = width / 2;

        dashLine.moveTo(0, -height / 2)
          .lineTo(halfWidth, height / 2)
          .lineTo(-halfWidth, height / 2)
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
    const imgX = roundToPixel(-shape.width / 2);
    const imgY = roundToPixel(-shape.height / 2);
    const imgW = roundToPixel(shape.width);
    const imgH = roundToPixel(shape.height);
    graphics.rect(imgX, imgY, imgW, imgH);
    // Make it slightly visible for selection/hover but mostly transparent
    graphics.fill({ color: 0xFFFFFF, alpha: 0.01 });

    return graphics;
  }

  if (shape.type === 'line' || shape.type === 'path') {
    drawElement(graphics, shape);
    // For path and line, use stroke if a valid stroke is provided
    if (shape.stroke && shape.stroke !== 'none') {
      graphics.stroke({
        color: fillColor,
        width: shape.strokeWidth || 2,
        alpha: (shape.strokeOpacity ?? shape.opacity ?? 1),
        alignment: 0.5, // Center the stroke on the path for consistent appearance
        cap: 'round',    // Smooth rounded line caps
        join: 'round'    // Smooth rounded line joins
      });
    }
  } else {
    drawElement(graphics, shape);
    if (shape.fill !== 'none') {
      graphics.fill({ color: fillColor, alpha: shape.opacity ?? 1 });
    }
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
      drawElement(graphics, shape);
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

        case 'arc':
          if (shape.arcOptions) {
            // Constrained arc animation path: endpoints at left/right edges, curves to bottom
            const halfWidth = shape.width / 2;
            const halfHeight = shape.height / 2;

            // Arc endpoints: left and right edges, top of element
            const startX = -halfWidth;
            const startY = -halfHeight;
            const endX = halfWidth;
            const endY = -halfHeight;

            // Arc curves downward to bottom edge
            // Control points positioned to make the arc touch the bottom edge
            const control1X = startX;
            const control1Y = halfHeight; // Control point at bottom edge
            const control2X = endX;
            const control2Y = halfHeight; // Control point at bottom edge

            // Use native graphics bezier curve with manual dash approximation
            graphics.moveTo(startX, startY);

            // Sample fewer points for better performance
            const steps = 20;

            for (let i = 1; i <= steps; i++) {
              const t = i / steps;

              // Cubic bezier formula
              const invT = 1 - t;
              const invT2 = invT * invT;
              const invT3 = invT2 * invT;
              const t2 = t * t;
              const t3 = t2 * t;

              const x = invT3 * startX +
                3 * invT2 * t * control1X +
                3 * invT * t2 * control2X +
                t3 * endX;
              const y = invT3 * startY +
                3 * invT2 * t * control1Y +
                3 * invT * t2 * control2Y +
                t3 * endY;

              // Draw dash pattern manually - alternate between drawing and skipping
              if (Math.floor(i / 2) % 2 === 0) {
                graphics.lineTo(x, y);
              } else {
                graphics.moveTo(x, y);
              }
            }

            graphics.stroke({
              color: grayColor,
              width: 2,
              alpha: 0.7
            });
          }
          break;

        case 'triangle':
          const height = shape.height;
          const width = shape.width;
          const halfWidth = width / 2;

          dashLine.moveTo(0, -height / 2)
            .lineTo(halfWidth, height / 2)
            .lineTo(-halfWidth, height / 2)
            .closePath();
          break;
      }
    }
  } else {
    if (shape.type === 'line') {
      drawLine(graphics, shape);
    } else {
      const width = shape.type === 'path' ? 2 : 1;
      drawElement(graphics, shape);

      if (shape.type !== 'path' && shape.fill !== 'none') {
        graphics.fill({ color: shape.fill, alpha: shape.opacity ?? 1 });
      }

      if (shape.stroke !== 'none') {
        graphics.stroke({
          color: parseColor(shape.stroke || shape.fill),
          width: shape.strokeWidth || width,
          alpha: (shape.strokeOpacity ?? shape.opacity ?? 1),
          alignment: 0.5, // Center the stroke on the path for consistent appearance
          cap: 'round',    // Smooth rounded line caps
          join: 'round'    // Smooth rounded line joins
        });
      }
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
        // Use cached texture immediately - no flashing! (pixel-aligned)
        const cachedImgX = roundToPixel(-shape.width / 2);
        const cachedImgY = roundToPixel(-shape.height / 2);
        const cachedImgW = roundToPixel(shape.width);
        const cachedImgH = roundToPixel(shape.height);
        graphics.rect(cachedImgX, cachedImgY, cachedImgW, cachedImgH);
        graphics.fill({
          texture: cachedTexture,
          alpha: shape.opacity ?? 1
        });
        return;
      }

      // Show placeholder only on first load with pixel-aligned coordinates
      const imgX = roundToPixel(-shape.width / 2);
      const imgY = roundToPixel(-shape.height / 2);
      const imgW = roundToPixel(shape.width);
      const imgH = roundToPixel(shape.height);
      graphics.rect(imgX, imgY, imgW, imgH);
      graphics.fill({ color: 0xF0F0F0, alpha: 0.8 }); // Light gray placeholder
      graphics.stroke({ color: 0xCCCCCC, width: 2, alignment: 0.5 }); // Gray border

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
            const loadedImgX = roundToPixel(-shape.width / 2);
            const loadedImgY = roundToPixel(-shape.height / 2);
            const loadedImgW = roundToPixel(shape.width);
            const loadedImgH = roundToPixel(shape.height);
            graphics.rect(loadedImgX, loadedImgY, loadedImgW, loadedImgH);
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
      // Enhanced fallback with better visual indication (pixel-aligned)
      const fallbackImgX = roundToPixel(-shape.width / 2);
      const fallbackImgY = roundToPixel(-shape.height / 2);
      const fallbackImgW = roundToPixel(shape.width);
      const fallbackImgH = roundToPixel(shape.height);
      graphics.rect(fallbackImgX, fallbackImgY, fallbackImgW, fallbackImgH);
      graphics.fill({ color: 0xFFEEEE, alpha: 0.8 });
      graphics.stroke({ color: 0xFF6666, width: 2, alignment: 0.5 });

      // Add "IMG" text indicator (basic fallback)
      // Note: This is a simple fallback - in a real app you might want to show more info
    }
    return;
  }
}
