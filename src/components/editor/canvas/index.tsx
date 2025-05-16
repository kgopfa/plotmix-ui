'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef } from 'react';
import { drawShape, drawSelectionOutline } from '@/utils/drawing-utils';

extend({ Container, Graphics });

interface CanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasElement[];
  selectedId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  onCanvasClick: (e: FederatedPointerEvent) => void;
}

export interface CanvasRef {
  getShapeRefs: () => Record<string, Container>;
}

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(
  {
    dimensions,
    elements,
    selectedId,
    onElementSelect,
    onElementDragEnd,
    onCanvasClick,
  },
  ref
) {
  const shapeRefs = useRef<Record<string, Container>>({});

  useImperativeHandle(ref, () => ({
    getShapeRefs: () => shapeRefs.current,
  }));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);

  const handlePointerDown = (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    const pos = e.global;
    setDraggingId(id);
    onElementSelect(id);
    setDragOffset({ x: pos.x - shapeX, y: pos.y - shapeY });
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setDragOffset(null);
  };

  const handleDragMove = (id: string) => (e: FederatedPointerEvent) => {
    if (draggingId !== id || !dragOffset) return;
    const pos = e.global;
    onElementDragEnd(id, pos.x - dragOffset.x, pos.y - dragOffset.y);
  };

  return (
    <Application
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={0xFFFFFF}
      antialias={true}
    >
      {/* Full-size transparent interactive layer to capture background clicks */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(0, 0, dimensions.width, dimensions.height);
          g.fill({ color: 0xFFFFFF, alpha: 0 });
        }}
        interactive={true}
        eventMode="static"
        onPointerDown={(e: FederatedPointerEvent) => {
          onElementSelect(null);
          onCanvasClick(e);
        }}
        onPointerMove={handleDragMove(draggingId ?? '')}
      />

      {elements.map((el) => (
        <pixiContainer
          key={el.id}
          x={el.x}
          y={el.y}
          interactive={true}
          eventMode="dynamic"
          cursor="move"
          onPointerDown={handlePointerDown(el.id, el.x, el.y)}
          onPointerUp={handlePointerUp}
          onPointerUpOutside={handlePointerUp}
          onPointerMove={handleDragMove(el.id)}
          ref={(node) => {
            if (node) shapeRefs.current[el.id] = node;
          }}
        >
          <pixiGraphics draw={(g) => drawShape(g, el)} />
          {el.id === selectedId && (
            <pixiGraphics draw={(g) => drawSelectionOutline(g, el)} />
          )}
        </pixiContainer>
      ))}
    </Application>
  );
});
