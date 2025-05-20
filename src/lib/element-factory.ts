import type { AnimatedCanvasElement, ElementAnimation } from '@/types/canvas';

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'path' | 'svg';

interface BaseElementProps {
  x: number;
  y: number;
  elements: AnimatedCanvasElement[];
  pathPoints?: Array<{x: number, y: number}>;
  isPath?: boolean;
  svgData?: string;
  width?: number;
  height?: number;
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
  const width = 100;
  const height = 100;
  return {
    ...generateCommonAttributes('rectangle', props),
    type: 'rectangle',
    width,
    height,
    cornerRadius: 0,
    lineOptions: undefined,
    x: props.x,
    y: props.y,
    pivotX: width / 2,
    pivotY: height / 2,
    isPath: props.isPath || false,
  };
}

function createCircle(props: BaseElementProps): AnimatedCanvasElement {
  const width = 100;
  const height = 100;
  const radius = 50;
  return {
    ...generateCommonAttributes('circle', props),
    type: 'circle',
    width,
    height,
    radius,
    lineOptions: undefined,
    x: props.x,
    y: props.y,
    pivotX: width / 2,
    pivotY: height / 2,
    isPath: props.isPath || false,
  };
}

function createTriangle(props: BaseElementProps): AnimatedCanvasElement {
  const width = 100;
  const height = 100;
  const radius = 50;
  return {
    ...generateCommonAttributes('triangle', props),
    type: 'triangle',
    width,
    height,
    radius,
    lineOptions: undefined,
    x: props.x,
    y: props.y,
    pivotX: width / 2,
    pivotY: height / 2,
    isPath: props.isPath || false,
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
    isPath: props.isPath || false,
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
  
  // Calculate centerX and centerY relative to props.x and props.y
  // (which should now be the first point of the path)
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;
  
  // We'll center the element at the midpoint of the path's bounding box
  return {
    ...generateCommonAttributes('path', props),
    type: 'path',
    width,
    height,
    x: centerX,
    y: centerY,
    pathPoints: props.pathPoints.map(p => ({
      x: p.x - centerX,
      y: p.y - centerY
    })),
    lineOptions: undefined,
    isPath: props.isPath || false,
  };
}

function createSvg(props: BaseElementProps): AnimatedCanvasElement {
  if (!props.svgData) {
    throw new Error('SVG data is required');
  }

  const width = props.width || 100;
  const height = props.height || 100;

  return {
    ...generateCommonAttributes('svg', props),
    type: 'svg',
    width,
    height,
    x: props.x,
    y: props.y,
    svgData: props.svgData,
    lineOptions: undefined,
    pivotX: width / 2,
    pivotY: height / 2,
    isPath: props.isPath || false,
  };
}

export function createNewElement(
  type: ShapeType,
  x: number,
  y: number,
  elements: AnimatedCanvasElement[],
  pathPoints?: Array<{x: number, y: number}>,
  isPath?: boolean,
  svgData?: string,
  width?: number,
  height?: number
): AnimatedCanvasElement {
  const props: BaseElementProps = { x, y, elements, pathPoints, isPath, svgData, width, height };
  
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
    case 'svg':
      return createSvg(props);
  }
}