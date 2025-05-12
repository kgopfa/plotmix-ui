'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';

// Register PixiJS components with @pixi/react
extend({ Container, Graphics });

interface PixiCanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasElement[];
  selectedId: string | null;
  onElementSelect: (id: string) => void;
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

  return (
    <Application
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={'blue'}
    >
      {/* Full-size transparent interactive layer to capture background clicks */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(0, 0, dimensions.width, dimensions.height);
          g.fill({ color: 0xFFFFFF, alpha: 0 });
        }}
        interactive={true}
        onPointerDown={onCanvasClick}
      />

      {elements.map((el) => (
        <pixiContainer
          key={el.id}
          x={el.x}
          y={el.y}
          interactive
          cursor="pointer"
          onPointerDown={() => onElementSelect(el.id)}
          onPointerUp={(e: FederatedPointerEvent) => {
            const { x, y } = e.currentTarget as Container;
            onElementDragEnd(el.id, x, y);
          }}
        >
          <pixiGraphics draw={(graphics) => drawShape(graphics, el)} />
        </pixiContainer>
      ))}
    </Application>
  );
}
