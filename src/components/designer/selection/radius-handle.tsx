import React, { useState, useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { eventManager } from '@/lib/event-manager';

extend({ Container, Graphics });

interface RadiusHandleProps {
  x: number;
  y: number;
  scaleFactor?: number;
  corner: 'tl' | 'tr' | 'bl' | 'br' | 'top';
  onRadiusChange: (newRadius: number) => void;
  currentRadius: number;
}

const RadiusHandle: React.FC<RadiusHandleProps> = ({
  x,
  y,
  scaleFactor = 1,
  corner,
  onRadiusChange, // Updated callback name
  currentRadius
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, y: 0, startX: 0, startY: 0, initialRadius: 0 });
  const wrappersRef = useRef<{ move?: (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => void; up?: () => void }>({});

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
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    dragStartRef.current = {
      x: canvasX,
      y: canvasY,
      startX: x,
      startY: y,
      initialRadius: currentRadius
    };
    
    // Create wrapper functions to handle event type casting
    const pointerMoveWrapper = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => {
      if (event instanceof PointerEvent) {
        handlePointerMove(event);
      }
    };
    
    const pointerUpWrapper = () => {
      handlePointerUp();
    };
    
    // Store references for cleanup
    wrappersRef.current.move = pointerMoveWrapper;
    wrappersRef.current.up = pointerUpWrapper;
    
    // Use EventManager with wrapper functions
    eventManager.addListener('pointermove', pointerMoveWrapper, window);
    eventManager.addListener('pointerup', pointerUpWrapper, window);
    
    // CRITICAL: Stop propagation to prevent resize handles from activating
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;
    
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;
    
    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const deltaX = (canvasX - dragStartRef.current.x) / scaleFactor;
    const deltaY = (canvasY - dragStartRef.current.y) / scaleFactor;
    
    // For border radius control, we want to move inward/outward from the corner
    // Calculate the diagonal movement (average of x and y movement)
    let radiusDelta = 0;
    
    switch (corner) {
      case 'tl': // Top-left: positive delta means moving toward center (increasing radius)
        radiusDelta = (deltaX + deltaY) / 2;
        break;
      case 'tr': // Top-right: negative X, positive Y means toward center
        radiusDelta = (-deltaX + deltaY) / 2;
        break;
      case 'bl': // Bottom-left: positive X, negative Y means toward center
        radiusDelta = (deltaX + -deltaY) / 2;
        break;
      case 'br': // Bottom-right: negative delta means moving toward center
        radiusDelta = (-deltaX + -deltaY) / 2;
        break;
      case 'top': // Triangle top corner: moving down increases radius
        radiusDelta = deltaY;
        break;
    }
    
    // Calculate new radius
    const newRadius = Math.max(0, Math.min(50, dragStartRef.current.initialRadius + radiusDelta));
    

    
    // Call the radius change callback
    onRadiusChange(newRadius);
  };

  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      setIsDragging(false);
      
      // Remove using the stored wrapper references
      if (wrappersRef.current.move && wrappersRef.current.up) {
        eventManager.removeListener('pointermove', wrappersRef.current.move, window);
        eventManager.removeListener('pointerup', wrappersRef.current.up, window);
        wrappersRef.current = {};
      }
    }
  };

  return (
    <pixiGraphics
      x={x}
      y={y}
      draw={drawCircle}
      interactive={true}
      eventMode="static"
      cursor={isDragging ? 'grabbing' : 'grab'}
      onPointerDown={handlePointerDown}
    />
  );
};

export default RadiusHandle;