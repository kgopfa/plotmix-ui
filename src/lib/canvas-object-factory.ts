import type { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';

// Simple ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'arc' | 'line' | 'path' | 'image' | 'text' | 'polygon';

interface BaseObjectProps {
  x: number;
  y: number;
  elements: AnimatedCanvasObject[];
  pathPoints?: Array<{ x: number, y: number }>;
  isPath?: boolean;
  imageData?: string;
  width?: number;
  height?: number;
  text?: string;
  fontFamily?: string; // Font family for text elements
}

interface CommonObjectAttributes {
  id: string;
  name: string;
  x: number;
  y: number;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  visible: boolean;
  fill: string;
  zIndex: number;
  shadowEnabled: boolean;
  shadowColor: string;
  shadowBlur: number;
  shadowOffsetX: number;
  shadowOffsetY: number;
  shadowOpacity: number;
  animations: ElementAnimation[];
  groupId: string;
}

function generateCommonAttributes(
  type: ShapeType,
  { x, y, elements }: BaseObjectProps
): CommonObjectAttributes {
  const id = generateId();
  const typeCountMap: { [key: string]: string } = {
    rectangle: 'Rectangle',
    circle: 'Circle',
    triangle: 'Triangle',
    arc: 'Arc',
    bezier: 'Bezier',
    line: 'Line',
    path: 'Path',
    image: 'Image',
    text: 'Text',
    polygon: 'Polygon'
  };

  // Count existing elements of the same type to generate name
  const existingCount = elements.filter(el => el.type === type).length;
  const baseName = typeCountMap[type] || 'Shape';
  const name = `${baseName} ${existingCount + 1}`;

  // Calculate default z-index based on existing elements
  const maxZIndex = elements.length > 0 ? Math.max(...elements.map(el => el.zIndex || 0)) : 0;
  const defaultZIndex = Math.max(0, maxZIndex + 1); // Ensure z-index is never below 0

  return {
    id,
    name,
    x: x,
    y: y,
    stroke: '#000000',
    strokeWidth: 1,
    opacity: 1,
    visible: true,
    fill: '#ffffff',
    zIndex: defaultZIndex, // Set default z-index to be above existing elements
    shadowEnabled: false,
    shadowColor: '#000000',
    shadowBlur: 0,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.5,
    animations: [],
    groupId: generateId(), // Each object gets its own default group
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
  const height = 100;
  // Calculate correct width for an equilateral triangle based on height
  const width = (2 * height) / Math.sqrt(3);
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

function createArc(props: BaseObjectProps): AnimatedCanvasObject {
  // Constrained arc: shape determined by element dimensions
  // Arc spans from left to right edge and curves to bottom edge
  const defaultWidth = 100;
  const defaultHeight = 80;
  
  return {
    ...generateCommonAttributes('arc', props),
    type: 'arc',
    width: defaultWidth,
    height: defaultHeight,
    radius: 50, // Keep for backward compatibility
    lineOptions: undefined,
    arcOptions: {}, // Empty object - shape determined by width/height
    x: props.x,
    y: props.y,
    pivotX: defaultWidth / 2,
    pivotY: defaultHeight / 2,
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createPolygon(props: BaseObjectProps & { polygonPoints?: Array<{ x: number; y: number }> }): AnimatedCanvasObject {
  if (!props.polygonPoints || props.polygonPoints.length < 3) {
    throw new Error('Polygon must have at least 3 points');
  }

  // Calculate bounding box
  const xs = props.polygonPoints.map(p => p.x);
  const ys = props.polygonPoints.map(p => p.y);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const width = maxX - minX;
  const height = maxY - minY;

  // Calculate center position
  const centerX = (minX + maxX) / 2;
  const centerY = (minY + maxY) / 2;

  // Create polygon without automatic group assignment to prevent empty groups
  const commonAttrs = generateCommonAttributes('polygon', props);
  return {
    ...commonAttrs,
    groupId: undefined, // Don't assign to a group automatically
    type: 'polygon',
    width,
    height,
    x: centerX,
    y: centerY,
    pivotX: width / 2,
    pivotY: height / 2,
    polygonOptions: {
      points: props.polygonPoints,
      isClosed: true,
    },
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createLine(props: BaseObjectProps & { startPoint?: { x: number; y: number }; endPoint?: { x: number; y: number }; lineType?: 'straight' | 'curved' }): AnimatedCanvasObject {
  // For line creation, we can have specific start and end points
  const startPoint = props.startPoint || { x: props.x, y: props.y };
  const endPoint = props.endPoint || { x: props.x + 100, y: props.y + 100 }; // Default endpoint if not specified

  // Calculate the bounding box for the line
  const minX = Math.min(startPoint.x, endPoint.x);
  const maxX = Math.max(startPoint.x, endPoint.x);
  const minY = Math.min(startPoint.y, endPoint.y);
  const maxY = Math.max(startPoint.y, endPoint.y);
  const width = Math.max(maxX - minX, 1); // Ensure minimum width of 1
  const height = Math.max(maxY - minY, 1); // Ensure minimum height of 1
  
  // Calculate center position
  const centerX = (startPoint.x + endPoint.x) / 2;
  const centerY = (startPoint.y + endPoint.y) / 2;

  // Determine if line should be curved based on props or default to curved
  const isCurved = props.lineType !== 'straight';
  
  // For straight lines, no control point is needed
  // For curved lines, use the current bezier implementation
  const controlPoint = isCurved ? {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2
  } : undefined;

  return {
    ...generateCommonAttributes('line', props),
    type: 'line',
    x: centerX,
    y: centerY,
    width,
    height,
    lineOptions: {
      points: { start: startPoint, end: endPoint },
      controlPoint,
      isCurved,
      arrow: false,
      dotted: props.isPath || false, // Make dotted if it's an animation path
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
  const width = props.width || 440; // Match the working example width
  const height = 200; // Increased default height for better text wrapping

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
    text: props.text || 'Double click text to edit',
    fontSize: 36, // Match working example font size
    fontFamily: props.fontFamily || 'Arial', // Use provided font family or default to Arial
    fontWeight: '400', // Normal weight (400 = normal, 700 = bold)
    fontStyle: 'normal', // Normal style instead of italic
    textAlign: 'left',
    lineHeight: 1.2,
    // Rich text properties - start with simple styling
    textStroke: undefined,
    textStrokeWidth: 0,
    textStrokeJoin: 'round',
    textDropShadow: undefined,
    textGradient: undefined,
    letterSpacing: 0,
    wordWrap: true,
    wordWrapWidth: width, // Ensure wordWrapWidth matches the element width
    lineOptions: undefined,
    pivotX: width / 2,
    pivotY: height / 2,
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

export function createNewObject(
  type: ShapeType,
  x: number,
  y: number,
  canvasObjects: AnimatedCanvasObject[],
  pathPoints?: Array<{ x: number, y: number }>,
  isPath?: boolean,
  imageData?: string,
  width?: number,
  height?: number,
  text?: string,
  startPoint?: { x: number; y: number },
  endPoint?: { x: number; y: number },
  lineType?: 'straight' | 'curved',
  fontFamily?: string,
  polygonPoints?: Array<{ x: number; y: number }>
): AnimatedCanvasObject {
  const props: BaseObjectProps = { x, y, elements: canvasObjects, pathPoints, isPath, imageData, width, height, text, fontFamily };

  switch (type) {
    case 'rectangle':
      return createRectangle(props);
    case 'circle':
      return createCircle(props);
    case 'triangle':
      return createTriangle(props);
    case 'arc':
      return createArc(props);
    case 'line':
      return createLine({ ...props, startPoint, endPoint, lineType });
    case 'path':
      return createPath(props);
    case 'image':
      return createImage(props);
    case 'text':
      return createText(props);
    case 'polygon':
      return createPolygon({ ...props, polygonPoints });
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
}