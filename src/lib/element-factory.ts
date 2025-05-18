import type { AnimatedCanvasElement, ElementAnimation } from '@/types/canvas';

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'path';

interface BaseElementProps {
  x: number;
  y: number;
  elements: AnimatedCanvasElement[];
  pathPoints?: Array<{x: number, y: number}>;
}

interface CommonElementAttributes {
  id: string;
  name: string;
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fill: string;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  animations: ElementAnimation[];
}

function generateCommonAttributes(
  type: ShapeType,
  { x, y, elements }: BaseElementProps
): CommonElementAttributes {
  const newId = `${type}-${elements.length + 1}`;
  const existingCount = elements.filter(el => el.type === type).length;
  const name = existingCount === 0
    ? type.charAt(0).toUpperCase() + type.slice(1)
    : `${type.charAt(0).toUpperCase() + type.slice(1)} (${existingCount})`;

  return {
    id: newId,
    name,
    x: x,
    y: y,
    stroke: 'black',
    strokeWidth: 1,
    opacity: 1,
    fill: '#ffffff',
    shadowEnabled: false,
    shadowColor: 'black',
    shadowBlur: 0,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.5,
    animations: [],
  };
}

function createRectangle(props: BaseElementProps): AnimatedCanvasElement {
  return {
    ...generateCommonAttributes('rectangle', props),
    type: 'rectangle',
    width: 100,
    height: 100,
    cornerRadius: 0,
    lineOptions: undefined,
  };
}

function createCircle(props: BaseElementProps): AnimatedCanvasElement {
  return {
    ...generateCommonAttributes('circle', props),
    type: 'circle',
    width: 100,
    height: 100,
    radius: 70,
    lineOptions: undefined,
  };
}

function createTriangle(props: BaseElementProps): AnimatedCanvasElement {
  return {
    ...generateCommonAttributes('triangle', props),
    type: 'triangle',
    width: 100,
    height: 100,
    radius: 70,
    lineOptions: undefined,
  };
}

function createLine(props: BaseElementProps): AnimatedCanvasElement {
  return {
    ...generateCommonAttributes('line', props),
    type: 'line',
    width: 100,
    height: 100,
    lineOptions: {
      points: { start: { x: props.x, y: props.y }, end: { x: props.x + 100, y: props.y + 100 } },
      arrow: false,
      dotted: false,
    },
  };
}

function createPath(props: BaseElementProps): AnimatedCanvasElement {
  if (!props.pathPoints || props.pathPoints.length < 2) {
    throw new Error('Path must have at least 2 points');
  }

  // Calculate bounding box
  const xs = props.pathPoints.map(p => p.x);
  const ys = props.pathPoints.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  return {
    ...generateCommonAttributes('path', props),
    type: 'path',
    width,
    height,
    x: minX,
    y: minY,
    pathPoints: props.pathPoints.map(p => ({
      x: p.x - minX,
      y: p.y - minY
    })),
    lineOptions: undefined,
  };
}

export function createNewElement(
  type: ShapeType,
  x: number,
  y: number,
  elements: AnimatedCanvasElement[],
  pathPoints?: Array<{x: number, y: number}>
): AnimatedCanvasElement {
  const props: BaseElementProps = { x, y, elements, pathPoints };
  
  switch (type) {
    case 'rectangle':
      return createRectangle(props);
    case 'circle':
      return createCircle(props);
    case 'triangle':
      return createTriangle(props);
    case 'line':
      return createLine(props);
    case 'path':
      return createPath(props);
  }
}