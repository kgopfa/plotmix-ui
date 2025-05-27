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
}

const RadiusCircle: React.FC<RadiusCircleProps> = ({
  x,
  y,
  onMove,
  bounds,
  scaleFactor = 1
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0 });

  const drawCircle = (g: PIXI.Graphics) => {
    g.clear();
    const RADIUS_HANDLE_SIZE = 7;
    
    g.circle(0, 0, RADIUS_HANDLE_SIZE / 2);
    g.fill({ color: 0xFFFFFF, alpha: 1 });
    g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
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
    
    // CRITICAL: Use capture phase to intercept events before Canvas gets them
    document.addEventListener('pointermove', handlePointerMove, { capture: true });
    document.addEventListener('pointerup', handlePointerUp, { capture: true });
    
    // Stop all event propagation
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDragging) return;
    
    // CRITICAL: Stop event in capture phase before Canvas gets it
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
    
    const newX = dragStartRef.current.startX + deltaX;
    const newY = dragStartRef.current.startY + deltaY;
    
    // Apply bounds
    const boundedX = Math.max(bounds.minX, Math.min(bounds.maxX, newX));
    const boundedY = Math.max(bounds.minY, Math.min(bounds.maxY, newY));
    
    onMove(boundedX, boundedY);
  };

  const handlePointerUp = (e: PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      
      // CRITICAL: Stop event in capture phase
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