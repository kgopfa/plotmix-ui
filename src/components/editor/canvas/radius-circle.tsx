import React, { useState, useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';

extend({ Container, Graphics });

interface RadiusCircleProps {
  x: number;
  y: number;
  onMove: (newX: number, newY: number) => void;  
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  scaleFactor?: number;
  corner: 'tl' | 'tr' | 'bl' | 'br'; // NEW: Specify which corner this circle represents
}

const RadiusCircle: React.FC<RadiusCircleProps> = ({
  x,
  y,
  onMove,
  bounds,
  scaleFactor = 1,
  corner
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const drawCircle = (g: PIXI.Graphics) => {
    g.clear();
    const RADIUS_HANDLE_SIZE = 7;
    
    g.circle(0, 0, RADIUS_HANDLE_SIZE / 2);
    g.fill({ color: 0xFFFFFF, alpha: 1 });
    g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.client.x - rect.left;
    const canvasY = e.client.y - rect.top;
    
    dragStartRef.current = {
      x: canvasX,
      y: canvasY,
      startX: x,
      startY: y
    };
    
    document.addEventListener('pointermove', handlePointerMove, { capture: true });
    document.addEventListener('pointerup', handlePointerUp, { capture: true });
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
    
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const deltaX = (canvasX - dragStartRef.current.x) / scaleFactor;
    const deltaY = (canvasY - dragStartRef.current.y) / scaleFactor;
    
    // CRITICAL: Calculate diagonal-constrained movement based on corner
    let newX = dragStartRef.current.startX;
    let newY = dragStartRef.current.startY;
    
    switch (corner) {
      case 'tl': // Top-left: diagonal down-right (positive X = positive Y)
        {
          const diagonalDelta = (deltaX + deltaY) / 2; // Average the deltas for smooth diagonal
          newX = dragStartRef.current.startX + diagonalDelta;
          newY = dragStartRef.current.startY + diagonalDelta;
        }
        break;
        
      case 'tr': // Top-right: anti-diagonal down-left (positive X = negative Y)
        {
          const antiDiagonalDelta = (deltaX - deltaY) / 2;
          newX = dragStartRef.current.startX + antiDiagonalDelta;
          newY = dragStartRef.current.startY - antiDiagonalDelta;
        }
        break;
        
      case 'bl': // Bottom-left: anti-diagonal up-right (positive X = negative Y)
        {
          const antiDiagonalDelta = (deltaX - deltaY) / 2;
          newX = dragStartRef.current.startX + antiDiagonalDelta;
          newY = dragStartRef.current.startY - antiDiagonalDelta;
        }
        break;
        
      case 'br': // Bottom-right: diagonal down-right (positive X = positive Y)
        {
          const diagonalDelta = (deltaX + deltaY) / 2;
          newX = dragStartRef.current.startX + diagonalDelta;
          newY = dragStartRef.current.startY + diagonalDelta;
        }
        break;
    }
    
    // Apply bounds
    const boundedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    
    onMove(boundedX, boundedY);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      
      document.removeEventListener('pointermove', handlePointerMove, { capture: true });
      document.removeEventListener('pointerup', handlePointerUp, { capture: true });
    }
  };

  const handleCirclePointerUp = (e: PIXI.FederatedPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const handleCirclePointerMove = (e: PIXI.FederatedPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  return (
    <pixiContainer
      x={x}
      y={y}
      interactive={true}
      eventMode="dynamic"
      cursor={isDragging ? 'grabbing' : 'grab'}
      onPointerDown={handlePointerDown}
      onPointerUp={handleCirclePointerUp}
      onPointerMove={handleCirclePointerMove}
      onPointerUpOutside={handleCirclePointerUp}
    >
      <pixiGraphics draw={drawCircle} />
    </pixiContainer>
  );
};

export default RadiusCircle;