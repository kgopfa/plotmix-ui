import type { AnimatedCanvasElement } from '@/types/canvas';

type ShapeType = 'rectangle' | 'circle' | 'triangle';

export function createNewElement(
  type: ShapeType,
  x: number,
  y: number,
  elements: AnimatedCanvasElement[]
): AnimatedCanvasElement {
  const newId = `${type}-${elements.length + 1}`;
  const existingCount = elements.filter(el => el.type === type).length;

  return {
    id: newId,
    name:
      existingCount === 0
        ? type.charAt(0).toUpperCase() + type.slice(1)
        : `${type.charAt(0).toUpperCase() + type.slice(1)} (${existingCount})`,
    type,
    x: x - 50,
    y: y - 50,
    width: 100,
    height: 100,
    fill: '#ffa500',
    radius: type === 'circle' || type === 'triangle' ? 70 : undefined,
    stroke: 'black',
    strokeWidth: 1,
    cornerRadius: type === 'rectangle' ? 0 : undefined,
    opacity: 1,
    shadowEnabled: false,
    shadowColor: 'black',
    shadowBlur: 0,
    shadowOffsetX: 10,
    shadowOffsetY: 10,
    shadowOpacity: 0.5,
    animations: [],
  };
}