import { Graphics } from 'pixi.js';
import { DashLine } from '@/utils/dash-line';
import type { AnimatedCanvasElement } from '@/types/canvas';

export const parseColor = (color: string | number | undefined): number => {
  if (!color) return 0x000000;
  return typeof color === 'string' ? parseInt(color.replace('#', '0x')) : color;
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
    .stroke({ color, width, alpha })
    .moveTo(start.x, start.y)
    .lineTo(end.x, end.y)
    .stroke();
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

  const color = parseColor(shape.stroke);
  const width = shape.strokeWidth || 2;
  const alpha = shape.opacity ?? 1;
  
  // Calculate relative positions
  const start = {
    x: shape.lineOptions.points.start.x - shape.x,
    y: shape.lineOptions.points.start.y - shape.y
  };
  
  const end = {
    x: shape.lineOptions.points.end.x - shape.x,
    y: shape.lineOptions.points.end.y - shape.y
  };

  // Choose line drawing method
  if (shape.lineOptions.dotted) {
    drawDottedLine(graphics, start, end, color, width, alpha);
  } else {
    drawSmoothLine(graphics, start, end, color, width, alpha);
  }

  // Add arrowhead if requested
  if (shape.lineOptions.arrow) {
    drawArrowhead(graphics, end, start, color);
  }
};

export const drawShape = (graphics: Graphics, shape: AnimatedCanvasElement) => {
  graphics.clear();

  // Set fill style
  graphics.fill({ color: shape.fill, alpha: shape.opacity });

  switch (shape.type) {
    case 'rectangle':
      // Use roundRect for rectangles with optional corner radius
      graphics.roundRect(0, 0, shape.width, shape.height, shape.cornerRadius || 0);
      break;
    case 'circle':
      // Use ellipse for circles
      const radius = shape.radius || shape.width / 2;
      graphics.ellipse(radius, radius, radius, radius);
      break;
    case 'triangle':
      // Define points for an equilateral triangle
      const r = shape.radius || shape.width / 2;
      const points = [
        { x: 0, y: r * 2 },
        { x: r, y: 0 },
        { x: r * 2, y: r * 2 },
      ];
      graphics.poly(points);
      break;
    case 'line':
      drawLine(graphics, shape);
      break;
    default:
      break;
  }

  graphics.fill(); // Apply the fill
};

export const drawSelectionOutline = (graphics: Graphics, shape: AnimatedCanvasElement) => {
  graphics.clear();

  graphics.stroke({
    width: 3,
    color: 'cyan',
  });

  switch (shape.type) {
    case 'rectangle':
      graphics.roundRect(0, 0, shape.width, shape.height, shape.cornerRadius || 0);
      break;
    case 'circle':
      const radius = shape.radius || shape.width / 2;
      graphics.ellipse(radius, radius, radius, radius);
      break;
    case 'triangle':
      const r = shape.radius || shape.width / 2;
      const points = [
        { x: 0, y: r * 2 },
        { x: r, y: 0 },
        { x: r * 2, y: r * 2 },
      ];
      graphics.poly(points);
      break;
    default:
      break;
  }

  graphics.stroke(); // Apply the stroke
}; 