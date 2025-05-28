import React, { useState, useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';

extend({ Container, Graphics });

interface RadiusCircleProps {
  x: number;
  y: number;
  bounds: { minX: number, maxX: number, minY: number, maxY: number };
  scaleFactor?: number;
  corner: 'tl' | 'tr' | 'bl' | 'br';
  onSyncMove: (corner: 'tl' | 'tr' | 'bl' | 'br', inwardDistance: number) => void;
  shapeCenter: { x: number, y: number };
}

const RadiusCircle: React.FC<RadiusCircleProps> = ({
  x,
  y,
  bounds,
  scaleFactor = 1,
  corner,
  onSyncMove,
  shapeCenter
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, initialDistance: 0 });

  const drawCircle = (g: PIXI.Graphics) => {
    g.clear();
    const RADIUS_HANDLE_SIZE = 7;
    
    g.circle(0, 0, RADIUS_HANDLE_SIZE / 2);
    g.fill({ color: 0xFFFFFF, alpha: 1 });
    g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
  };

  // Calculate distance from shape center to circle position
  const getDistanceFromCenter = (circleX: number, circleY: number) => {
    const dx = circleX - shapeCenter.x;
    const dy = circleY - shapeCenter.y;
    return Math.sqrt(dx * dx + dy * dy);
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    isDraggingRef.current = true;
    setIsDragging(true);
    
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.client.x - rect.left;
    const canvasY = e.client.y - rect.top;
    
    // Calculate initial distance from center
    const initialDistance = getDistanceFromCenter(x, y);
    
    dragStartRef.current = {
      x: canvasX,
      y: canvasY,
      startX: x,
      startY: y,
      initialDistance
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
    
    // For border radius control, move circles along the diagonal from corner to center
    // This gives a more intuitive feel for adjusting border radius
    const diagonalDelta = (deltaX + deltaY) / 2; // Average of both movements
    
    let newX = dragStartRef.current.startX;
    let newY = dragStartRef.current.startY;
    
    switch (corner) {
      case 'tl': // Top-left: move diagonally toward center
        newX = dragStartRef.current.startX + diagonalDelta;
        newY = dragStartRef.current.startY + diagonalDelta;
        break;
        
      case 'tr': // Top-right: move diagonally toward center
        newX = dragStartRef.current.startX - diagonalDelta;
        newY = dragStartRef.current.startY + diagonalDelta;
        break;
        
      case 'bl': // Bottom-left: move diagonally toward center
        newX = dragStartRef.current.startX + diagonalDelta;
        newY = dragStartRef.current.startY - diagonalDelta;
        break;
        
      case 'br': // Bottom-right: move diagonally toward center
        newX = dragStartRef.current.startX - diagonalDelta;
        newY = dragStartRef.current.startY - diagonalDelta;
        break;
    }
    
    // Apply bounds
    const boundedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    
    // Calculate how far inward/outward this circle moved
    const newDistance = getDistanceFromCenter(boundedX, boundedY);
    const inwardDistance = dragStartRef.current.initialDistance - newDistance;
    
    // Sync all circles to move the same inward distance
    onSyncMove(corner, inwardDistance);
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