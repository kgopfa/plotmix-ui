import React, { useCallback } from 'react';
import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { AnimatedCanvasObject } from '@/types/canvas';

extend({ Graphics });

interface CurveHandleProps {
  element: AnimatedCanvasObject;
  onControlPointDrag: (x: number, y: number) => void;
}

const CurveHandle: React.FC<CurveHandleProps> = ({ element, onControlPointDrag }) => {
  const handlePointerDown = useCallback((e: PIXI.FederatedPointerEvent) => {
    e.stopPropagation();
    // Start dragging the control point
    const startX = e.global.x;
    const startY = e.global.y;
    
    // Get the current control point or calculate midpoint
    const { start, end } = element.lineOptions!.points;
    const originalControlPoint = element.lineOptions!.controlPoint || {
      x: (start.x + end.x) / 2,
      y: (start.y + end.y) / 2
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;
      
      const newControlPoint = {
        x: originalControlPoint.x + deltaX,
        y: originalControlPoint.y + deltaY
      };
      
      onControlPointDrag(newControlPoint.x, newControlPoint.y);
    };

    const handlePointerUp = () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);
  }, [element.lineOptions, onControlPointDrag]);

  // Show for all line elements
  if (element.type !== 'line' || !element.lineOptions?.points) {
    return null;
  }

  // Calculate midpoint as control point (either existing or default)
  const { start, end } = element.lineOptions.points;
  const controlPoint = element.lineOptions.controlPoint || {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  };
  
  const controlX = controlPoint.x - element.x;
  const controlY = controlPoint.y - element.y;

  return (
    <pixiGraphics
      x={controlX}
      y={controlY}
      eventMode="static"
      cursor="pointer"
      onPointerDown={handlePointerDown}
      draw={(g: PIXI.Graphics) => {
        g.clear();
        
        // Draw control point handle (diamond shape)
        const size = 8;
        const halfSize = size / 2;
        
        // Lines are always curved by default
        const fillColor = 0x4CAF50; // Green for curved lines
        const strokeColor = 0x2E7D32; // Darker green
        
        // Diamond shape for control point
        g.moveTo(0, -halfSize);
        g.lineTo(halfSize, 0);
        g.lineTo(0, halfSize);
        g.lineTo(-halfSize, 0);
        g.closePath();
        
        g.fill({ color: fillColor, alpha: 0.9 });
        g.stroke({ color: strokeColor, width: 2, alpha: 1 });
        
        // Draw inner diamond
        g.moveTo(0, -halfSize + 2);
        g.lineTo(halfSize - 2, 0);
        g.lineTo(0, halfSize - 2);
        g.lineTo(-halfSize + 2, 0);
        g.closePath();
        
        g.fill({ color: 0xFFFFFF, alpha: 0.8 }); // White inner fill
      }}
    />
  );
};

export default CurveHandle; 