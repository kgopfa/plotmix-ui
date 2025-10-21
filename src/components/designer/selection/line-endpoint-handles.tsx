import React, { useRef, useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { eventManager } from '@/lib/event-manager';
import { AnimatedCanvasObject } from '@/types/canvas';

extend({ Graphics });

interface LineEndpointHandlesProps {
  element: AnimatedCanvasObject;
  onEndpointDrag: (endpoint: 'start' | 'end', x: number, y: number) => void;
}

interface LineEndpointHandleProps {
  element: AnimatedCanvasObject;
  endpoint: 'start' | 'end';
  onEndpointDrag: (endpoint: 'start' | 'end', x: number, y: number) => void;
}

const LineEndpointHandle: React.FC<LineEndpointHandleProps> = ({ element, endpoint, onEndpointDrag }) => {
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const wrappersRef = useRef<{ move?: (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => void; up?: () => void }>({});

  if (!element.lineOptions?.points) return null;

  const point = endpoint === 'start' ? element.lineOptions.points.start : element.lineOptions.points.end;

  const [position, setPosition] = useState(point);

  // Update position when element properties change (unless we're dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPosition(point);
    }
  }, [point.x, point.y]);

  // Effect to call callback when position changes during drag
  useEffect(() => {
    if (!isDraggingRef.current) return;
    
    // Call the callback with the new position
    onEndpointDrag(endpoint, position.x, position.y);
  }, [position.x, position.y, endpoint, onEndpointDrag]);

  const drawHandle = (g: PIXI.Graphics) => {
    g.clear();
    
    const HANDLE_SIZE = 8;
    const halfSize = HANDLE_SIZE / 2;
    
    // Draw the endpoint handle square
    g.rect(-halfSize, -halfSize, HANDLE_SIZE, HANDLE_SIZE);
    g.fill({ color: 0xFFFFFF, alpha: 1 });
    g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    isDraggingRef.current = true;
    
    // Calculate offset from handle center to mouse position
    const globalPos = e.global;
    dragOffsetRef.current = {
      x: globalPos.x - position.x,
      y: globalPos.y - position.y
    };
    
    // Create wrapper functions to handle event type casting
    const pointerMoveWrapper = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => {
      if (event instanceof PointerEvent) {
        handleGlobalPointerMove(event);
      }
    };
    
    const pointerUpWrapper = () => {
      handleGlobalPointerUp();
    };
    
    // Store references for cleanup
    wrappersRef.current.move = pointerMoveWrapper;
    wrappersRef.current.up = pointerUpWrapper;
    
    // Use EventManager with wrapper functions
    eventManager.addListener('pointermove', pointerMoveWrapper, window);
    eventManager.addListener('pointerup', pointerUpWrapper, window);
    
    // Stop event propagation
    e.stopPropagation();
    e.preventDefault();
    e.stopImmediatePropagation();
  };

  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current) return;

    // Get canvas element and its bounding rect
    const canvas = document.querySelector('canvas');
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    
    // Convert screen coordinates to canvas coordinates
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    // Update position, accounting for the drag offset
    const newX = canvasX - dragOffsetRef.current.x;
    const newY = canvasY - dragOffsetRef.current.y;
    
    // This will trigger the useEffect above
    setPosition({ x: newX, y: newY });
  };

  const handleGlobalPointerUp = () => {
    if (!isDraggingRef.current) return;
    
    isDraggingRef.current = false;
    
    // Use EventManager to remove listeners
    if (wrappersRef.current.move && wrappersRef.current.up) {
      eventManager.removeListener('pointermove', wrappersRef.current.move, window);
      eventManager.removeListener('pointerup', wrappersRef.current.up, window);
      wrappersRef.current = {};
    }
  };

  return (
    <pixiGraphics
      x={position.x}
      y={position.y}
      draw={drawHandle}
      eventMode="static"
      interactive={true}
      cursor="move"
      onPointerDown={handlePointerDown}
      zIndex={2004}
    />
  );
};

const LineEndpointHandles: React.FC<LineEndpointHandlesProps> = ({ element, onEndpointDrag }) => {
  // Only render for line elements
  if (element.type !== 'line' || !element.lineOptions?.points) {
    return null;
  }

  return (
    <>
      <LineEndpointHandle element={element} endpoint="start" onEndpointDrag={onEndpointDrag} />
      <LineEndpointHandle element={element} endpoint="end" onEndpointDrag={onEndpointDrag} />
    </>
  );
};

export default LineEndpointHandles;

