import type { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';
import * as PIXI from 'pixi.js';

// Simple ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

// Helper function to get accurate character width using PIXI Text object
function getCharWidthPixi(char: string, fontSize: number = 16, fontFamily: string = 'Arial, sans-serif'): number {
  // Create a temporary Text object to measure the character
  const tempText = new PIXI.Text(char, {
    fontSize,
    fontFamily,
  });

  // Get the width from the text bounds
  const bounds = tempText.getBounds();

  // Clean up the temporary text object
  tempText.destroy();

  return bounds.width;
}

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line' | 'path' | 'image' | 'text' | 'textGroup' | 'character';

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
    line: 'Line',
    path: 'Path',
    image: 'Image',
    text: 'Text',
    textGroup: 'TextGroup',
    character: 'Character'
  };

  // Count existing elements of the same type to generate name
  const existingCount = elements.filter(el => el.type === type).length;
  const baseName = typeCountMap[type] || 'Shape';
  const name = `${baseName} ${existingCount + 1}`;

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

function createCharacter(props: BaseObjectProps & { character: string; characterIndex: number; parentTextGroupId: string }): AnimatedCanvasObject {
  const fontSize = 16;

  // Get accurate character width using PIXI measurement
  const charWidth = getCharWidthPixi(props.character, fontSize, 'Arial, sans-serif');

  const height = fontSize * 1.5;

  return {
    ...generateCommonAttributes('character', props),
    type: 'character',
    width: charWidth,
    height,
    x: props.x,
    y: props.y,
    fill: '#000000', // Override default white fill for text
    stroke: undefined, // Text typically doesn't have stroke
    strokeWidth: 0,
    text: props.character, // Store the character in text property for rendering
    character: props.character,
    characterIndex: props.characterIndex,
    parentTextGroupId: props.parentTextGroupId,
    fontSize,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'center',
    lineHeight: 1.2,
    lineOptions: undefined,
    pivotX: charWidth / 2,
    pivotY: height / 2,
    isAnimationPath: props.isPath || false,
    cornerRadius: 0,
  };
}

function createTextGroup(props: BaseObjectProps): AnimatedCanvasObject {
  const textContent = props.text || 'Hello World';
  const characters = textContent.split('');
  const fontSize = 16;
  const letterSpacing = 0;

  // Calculate accurate width using PIXI measurement
  let totalWidth = 0;
  characters.forEach((char) => {
    const charWidth = getCharWidthPixi(char, fontSize, 'Arial, sans-serif');
    totalWidth += charWidth + letterSpacing;
  });

  // Remove the last letter spacing since there's no spacing after the last character
  const width = Math.max(totalWidth - letterSpacing, fontSize);
  const height = fontSize * 1.5; // Leave some room for ascenders/descenders

  return {
    ...generateCommonAttributes('textGroup', props),
    type: 'textGroup',
    width,
    height,
    x: props.x,
    y: props.y,
    fill: '#000000', // Override default white fill for text
    stroke: undefined, // Text typically doesn't have stroke
    strokeWidth: 0,
    text: textContent,
    characters,
    fontSize,
    fontFamily: 'Arial, sans-serif',
    fontWeight: 'normal',
    fontStyle: 'normal',
    textAlign: 'left',
    lineHeight: 1.2,
    letterSpacing,
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
  text?: string
): AnimatedCanvasObject {
  const props: BaseObjectProps = { x, y, elements: canvasObjects, pathPoints, isPath, imageData, width, height, text };

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
    case 'textGroup':
      return createTextGroup(props);
    case 'character':
      throw new Error('Character elements should be created through createTextGroupWithCharacters function');
    default:
      throw new Error(`Unknown shape type: ${type}`);
  }
}

// New function to create a textGroup along with its individual character elements
export function createTextGroupWithCharacters(
  x: number,
  y: number,
  canvasObjects: AnimatedCanvasObject[],
  text?: string
): { textGroup: AnimatedCanvasObject; characters: AnimatedCanvasObject[] } {
  const textContent = text || 'Hello World';
  const characters = textContent.split('');
  const fontSize = 16;
  const letterSpacing = 0;

  // Create the main textGroup element first
  const textGroup = createTextGroup({ x, y, elements: canvasObjects, text: textContent });

  // Calculate positions for each character
  const characterElements: AnimatedCanvasObject[] = [];
  let currentX = x - textGroup.width / 2;

  characters.forEach((char, index) => {
    // Get accurate character width using PIXI measurement
    const charWidth = getCharWidthPixi(char, fontSize, 'Arial, sans-serif');

    // Position character at its center
    const charX = currentX + charWidth / 2;

    const characterElement = createCharacter({
      x: charX,
      y: y,
      elements: canvasObjects,
      character: char,
      characterIndex: index,
      parentTextGroupId: textGroup.id
    });

    // Set the same groupId as the textGroup so they're grouped together
    characterElement.groupId = textGroup.groupId;

    characterElements.push(characterElement);

    // Move to next character position
    currentX += charWidth + letterSpacing;
  });

  return { textGroup, characters: characterElements };
}