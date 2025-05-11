'use client';

import { Stage, Layer, Rect, Circle, RegularPolygon, Transformer } from 'react-konva';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Rect as KonvaRect } from 'konva/lib/shapes/Rect';
import type { Circle as KonvaCircle } from 'konva/lib/shapes/Circle';
import type { RegularPolygon as KonvaRegularPolygon } from 'konva/lib/shapes/RegularPolygon';
import type { Transformer as KonvaTransformer } from 'konva/lib/shapes/Transformer';
import { useRef, useEffect } from 'react';

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  cornerRadius?: number;
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowEnabled?: boolean;
}

interface CanvasProps {
  elements: CanvasElement[];
  selectedId: string | null;
  dimensions: { width: number; height: number };
  onStageClick: (e: KonvaEventObject<MouseEvent>) => void;
  onElementSelect: (id: string) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
}

export default function Canvas({
  elements,
  selectedId,
  dimensions,
  onStageClick,
  onElementSelect,
  onElementDragEnd,
}: CanvasProps) {
  const transformerRef = useRef<KonvaTransformer>(null);
  const shapeRefs = useRef<Record<string, KonvaRect | KonvaCircle | KonvaRegularPolygon>>({});

  useEffect(() => {
    if (selectedId && transformerRef.current && shapeRefs.current[selectedId]) {
      transformerRef.current.nodes([shapeRefs.current[selectedId]]);
      transformerRef.current.getLayer()?.batchDraw();
    } else if (transformerRef.current) {
      // Detach transformer if nothing is selected
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer()?.batchDraw();
    }
  }, [selectedId]);

  const renderShape = (el: CanvasElement) => {
    const commonProps = {
      ref: (node: KonvaRect | KonvaCircle | KonvaRegularPolygon | null) => {
        if (node) {
          shapeRefs.current[el.id] = node;
        }
      },
      x: el.x,
      y: el.y,
      fill: el.fill,
      draggable: true,
      stroke: el.stroke,
      strokeWidth: el.strokeWidth,
      opacity: el.opacity,
      onClick: () => onElementSelect(el.id),
      onDragEnd: (e: KonvaEventObject<DragEvent>) => {
        onElementDragEnd(el.id, e.target.x(), e.target.y());
      },
    };

    const shadowProps = el.shadowEnabled
      ? {
          shadowColor: el.shadowColor,
          shadowBlur: el.shadowBlur,
          shadowOffset: { x: el.shadowOffsetX ?? 0, y: el.shadowOffsetY ?? 0 },
          shadowOpacity: el.shadowOpacity,
        }
      : {};

    switch (el.type) {
      case 'rectangle':
        return (
          <Rect
            key={el.id}
            {...commonProps}
            width={el.width}
            height={el.height}
            cornerRadius={el.cornerRadius ?? 0}
            {...shadowProps}
          />
        );
      case 'circle':
        return (
          <Circle
            key={el.id}
            {...commonProps}
            radius={el.radius ?? el.width / 2}
            {...shadowProps}
          />
        );
      case 'triangle':
        return (
          <RegularPolygon
            key={el.id}
            {...commonProps}
            sides={3}
            radius={el.radius ?? el.width / 2}
            {...shadowProps}
          />
        );
      default:
        return null;
    }
  };

  return (
    <Stage
      width={dimensions.width}
      height={dimensions.height}
      onMouseDown={onStageClick}
    >
      <Layer>
        {elements.map(renderShape)}
        <Transformer ref={transformerRef} />
      </Layer>
    </Stage>
  );
} 