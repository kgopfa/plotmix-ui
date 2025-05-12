'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import { useState } from 'react';

// Register PixiJS components with @pixi/react
extend({ Container, Graphics });

interface PixiCanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasElement[];
  selectedId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  onCanvasClick: (e: FederatedPointerEvent) => void;
}

export function PixiCanvas({
  dimensions,
  elements,
  selectedId,
  onElementSelect,
  onElementDragEnd,
  onCanvasClick,
}: PixiCanvasProps) {
  // Function to draw shapes based on element type
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
  

  const drawShape = (graphics: Graphics, shape: AnimatedCanvasElement) => {
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
      default:
        break;
    }

    graphics.fill(); // Apply the fill
  };

  const drawSelectionOutline = (graphics: Graphics, shape: AnimatedCanvasElement) => {
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

  return (
    <Application
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={0xFFFFFF}
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
        >
          <pixiGraphics draw={(g) => drawShape(g, el)} />
          {el.id === selectedId && (
            <pixiGraphics draw={(g) => drawSelectionOutline(g, el)} />
          )}
        </pixiContainer>
      ))}
    </Application>
  );
}
