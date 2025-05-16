import type { AnimatedCanvasElement, ElementAnimation } from '@/types/canvas';

type ShapeType = 'rectangle' | 'circle' | 'triangle' | 'line';

interface BaseElementProps {
  x: number;
  y: number;
  elements: AnimatedCanvasElement[];
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
    x: x - 50,
    y: y - 50,
    stroke: 'black',
    strokeWidth: 1,
    opacity: 1,
    fill: '#ffa500',
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

export function createNewElement(
  type: ShapeType,
  x: number,
  y: number,
  elements: AnimatedCanvasElement[]
): AnimatedCanvasElement {
  const props: BaseElementProps = { x, y, elements };
  
  switch (type) {
    case 'rectangle':
      return createRectangle(props);
    case 'circle':
      return createCircle(props);
    case 'triangle':
      return createTriangle(props);
    case 'line':
      return createLine(props);
  }
}