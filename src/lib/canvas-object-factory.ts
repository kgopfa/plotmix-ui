import type { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'path' | 'image' | 'text';

interface BaseObjectProps {
  x: number;
  y: number;
  elements: AnimatedCanvasObject[];
  pathPoints?: Array<{x: number, y: number}>;
  isPath?: boolean;
  imageData?: string;
  width?: number;
  height?: number;
  text?: string;
}

interface CommonObjectAttributes {
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
  { x, y, elements }: BaseObjectProps
): CommonObjectAttributes {
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
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    fill: '#ffffff',
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.5,
    animations: [],
  };
}

function createRectangle(props: BaseObjectProps): AnimatedCanvasObject {
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
    isAnimationPath: props.isPath || false,
  };
}

function createCircle(props: BaseObjectProps): AnimatedCanvasObject {
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
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createTriangle(props: BaseObjectProps): AnimatedCanvasObject {
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
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createLine(props: BaseObjectProps): AnimatedCanvasObject {
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
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createPath(props: BaseObjectProps): AnimatedCanvasObject {
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
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createImage(props: BaseObjectProps): AnimatedCanvasObject {
  if (!props.imageData) {
    throw new Error('Image data is required');
  }

  const width = props.width || 100;
  const height = props.height || 100;

  return {
    ...generateCommonAttributes('image', props),
    type: 'image',
    width,
    height,
    x: props.x,
    y: props.y,
    imageData: props.imageData,
    lineOptions: undefined,
    pivotX: width / 2,
    pivotY: height / 2,
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createText(props: BaseObjectProps): AnimatedCanvasObject {
  const width = props.width || 200;
  const height = props.height || 40;
  
  return {
    ...generateCommonAttributes('text', props),
    type: 'text',
    width,
    height,
    x: props.x,
    y: props.y,
    fill: '#000000', // Override default white fill for text
    stroke: undefined, // Text typically doesn't have stroke
    strokeWidth: 0,
    text: props.text || 'Double click to edit',
    fontSize: 16,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: 1.2,
    lineOptions: undefined,
    pivotX: width / 2,
    pivotY: height / 2,
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

export function createNewElement(
  type: ShapeType,
  x: number,
  y: number,
  elements: AnimatedCanvasObject[],
  pathPoints?: Array<{x: number, y: number}>,
  isPath?: boolean,
  imageData?: string,
  width?: number,
  height?: number,
  text?: string
): AnimatedCanvasObject {
  const props: BaseObjectProps = { x, y, elements, pathPoints, isPath, imageData, width, height, text };
  
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
    case 'image':
      return createImage(props);
    case 'text':
      return createText(props);
  }
}