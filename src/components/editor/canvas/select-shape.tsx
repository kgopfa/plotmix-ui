import React, { useState, useEffect, useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';

extend({ Container, Graphics });

interface ShapeSelectProps {
  element: AnimatedCanvasElement;
  onResize: (newWidth: number, newHeight: number, handle?: string) => void;
  onResizeComplete: () => void;
  scaleFactor?: number; // Optional prop to account for canvas scaling
}

const ShapeSelect: React.FC<ShapeSelectProps> = ({ 
  element, 
  onResize, 
  onResizeComplete,
  scaleFactor = 1 // Default to 1 (no scaling) if not provided
}) => {
  // State for tracking resize dimensions
  const [dimensions, setDimensions] = useState({
    width: element.width,
    height: element.height
  });
  
  // Refs for tracking resize interaction
  const isDraggingRef = useRef(false);
  const activeHandleRef = useRef<string | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const startDimensionsRef = useRef({ width: 0, height: 0 });
  
  // Draw the selection outline with handles
  const drawOutline = (g: PIXI.Graphics) => {
    g.clear();
    
    // Draw rectangular outline
    g.rect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height
    );
    
    g.stroke({
      width: 1,
      color: 0x74b9ff,
      alpha: 0.85,
    });

    // Draw resize handles
    const HANDLE_SIZE = 8;
    const halfHandleSize = HANDLE_SIZE / 2;
    
    // Draw the four corner handles
    const corners = [
      { x: -dimensions.width / 2, y: -dimensions.height / 2, handle: 'tl' }, // top-left
      { x: dimensions.width / 2, y: -dimensions.height / 2, handle: 'tr' },  // top-right
      { x: -dimensions.width / 2, y: dimensions.height / 2, handle: 'bl' },  // bottom-left
      { x: dimensions.width / 2, y: dimensions.height / 2, handle: 'br' }    // bottom-right
    ];
    
    corners.forEach(corner => {
      g.rect(
        corner.x - halfHandleSize,
        corner.y - halfHandleSize,
        HANDLE_SIZE,
        HANDLE_SIZE
      );
      g.fill({ color: 0xFFFFFF, alpha: 1 });
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
    });
    
    // For line type, draw endpoint handles
    if (element.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;
      
      // Draw connecting line
      g.moveTo(startX, startY).lineTo(endX, endY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
      
      // Draw endpoint markers
      const ENDPOINT_SIZE = 10;
      
      // Start point (green)
      g.circle(startX, startY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x00ff00, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });
      
      // End point (red)
      g.circle(endX, endY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0xff0000, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });
    }
  };
  
  // Handle pointer down on resize handle
  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    // Get local position relative to the component's parent
    const localPos = e.getLocalPosition(e.currentTarget.parent);
    const { width, height } = dimensions;
    const HANDLE_SIZE = 8;
    
    // Check if we're clicking on a handle
    const halfW = width / 2;
    const halfH = height / 2;
    
    // Define handle hit areas
    const handles = {
      tl: { x: -halfW, y: -halfH },
      tr: { x: halfW, y: -halfH },
      bl: { x: -halfW, y: halfH },
      br: { x: halfW, y: halfH }
    };
    
    // Check if we clicked on a handle
    for (const [handle, pos] of Object.entries(handles)) {
      if (
        localPos.x >= pos.x - HANDLE_SIZE && 
        localPos.x <= pos.x + HANDLE_SIZE && 
        localPos.y >= pos.y - HANDLE_SIZE && 
        localPos.y <= pos.y + HANDLE_SIZE
      ) {
        isDraggingRef.current = true;
        activeHandleRef.current = handle;
        
        // Store client coordinates for tracking movement in screen space
        startPointRef.current = { 
          x: e.client.x, 
          y: e.client.y 
        };
        
        // Store initial dimensions for reference during resize
        startDimensionsRef.current = { width, height };
        
        // Add global listeners
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        
        // Prevent default to avoid text selection during drag
        e.preventDefault();
        e.stopPropagation();
        break;
      }
    }
  };
  
  // Handle pointer move during resize
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current || !activeHandleRef.current) return;
    
    const handle = activeHandleRef.current;
    
    // Calculate the mouse movement delta from the starting point
    // Apply scaling factor to convert screen coordinates to canvas coordinates
    const rawDeltaX = (e.clientX - startPointRef.current.x) / scaleFactor;
    const rawDeltaY = (e.clientY - startPointRef.current.y) / scaleFactor;
    
    // Constrain movement to diagonal directions based on the handle
    let deltaX = rawDeltaX;
    let deltaY = rawDeltaY;
    
    // For diagonal consistency, use the larger of the two deltas to determine movement
    const absDeltaX = Math.abs(rawDeltaX);
    const absDeltaY = Math.abs(rawDeltaY);
    const maxDelta = Math.max(absDeltaX, absDeltaY);
    
    switch (handle) {
      case 'tl': // top-left: both deltaX and deltaY should be negative
      case 'br': // bottom-right: both deltaX and deltaY should be positive
        // Constrain to main diagonal (same sign)
        deltaX = maxDelta * (rawDeltaX < 0 ? -1 : 1);
        deltaY = maxDelta * (rawDeltaY < 0 ? -1 : 1);
        
        // Ensure proper directional constraint
        if (handle === 'tl') {
          deltaX = -Math.abs(deltaX);
          deltaY = -Math.abs(deltaY);
        } else { // br
          deltaX = Math.abs(deltaX);
          deltaY = Math.abs(deltaY);
        }
        break;
        
      case 'tr': // top-right: deltaX positive, deltaY negative
      case 'bl': // bottom-left: deltaX negative, deltaY positive
        // Constrain to anti-diagonal (opposite signs)
        deltaX = maxDelta * (rawDeltaX < 0 ? -1 : 1);
        deltaY = maxDelta * (rawDeltaY < 0 ? -1 : 1);
        
        // Ensure proper directional constraint
        if (handle === 'tr') {
          deltaX = Math.abs(deltaX);
          deltaY = -Math.abs(deltaY);
        } else { // bl
          deltaX = -Math.abs(deltaX);
          deltaY = Math.abs(deltaY);
        }
        break;
    }
    
    // Calculate new dimensions
    let newWidth = startDimensionsRef.current.width;
    let newHeight = startDimensionsRef.current.height;
    
    // Apply the constrained deltas based on handle
    switch (handle) {
      case 'tl': // top-left
        newWidth = startDimensionsRef.current.width - deltaX;
        newHeight = startDimensionsRef.current.height - deltaY;
        break;
      case 'tr': // top-right
        newWidth = startDimensionsRef.current.width + deltaX;
        newHeight = startDimensionsRef.current.height - deltaY;
        break;
      case 'bl': // bottom-left
        newWidth = startDimensionsRef.current.width - deltaX;
        newHeight = startDimensionsRef.current.height + deltaY;
        break;
      case 'br': // bottom-right
        newWidth = startDimensionsRef.current.width + deltaX;
        newHeight = startDimensionsRef.current.height + deltaY;
        break;
    }
    
    // Enforce minimum dimensions
    newWidth = Math.max(10, newWidth);
    newHeight = Math.max(10, newHeight);
    
    // Update dimensions state
    setDimensions({ width: newWidth, height: newHeight });
    
    // Call the parent's onResize callback
    onResize(newWidth, newHeight, handle);
  };
  
  // Handle pointer up to complete resize
  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      activeHandleRef.current = null;
      
      // Remove global listeners
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      
      // Notify parent that resize is complete
      onResizeComplete();
    }
  };
  
  // Update local dimensions when element props change
  useEffect(() => {
    setDimensions({
      width: element.width,
      height: element.height
    });
  }, [element.width, element.height]);
  
  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      <pixiGraphics
        draw={drawOutline}
        eventMode="static"
        cursor="pointer"
        onPointerDown={handlePointerDown}
      />
    </pixiContainer>
  );
};

export default ShapeSelect; 