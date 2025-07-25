import React, { useRef, useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { eventManager } from '@/lib/event-manager';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { AnimatedCanvasObject } from '@/types/canvas';

extend({ Graphics });

interface ResizeHandleProps {
  elementX: number;
  elementY: number;
  elementWidth: number;
  elementHeight: number;
  elementRotation: number;
  corner: 'tl' | 'tr' | 'bl' | 'br';
  elementId: string;
}

const ResizeHandle: React.FC<ResizeHandleProps> = ({
  elementX,
  elementY,
  elementWidth,
  elementHeight,
  elementRotation,
  corner,
  elementId
}) => {
  const isDraggingRef = useRef(false);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeInProgressRef = useRef(false);
  const initialElementStateRef = useRef({ x: 0, y: 0, width: 0, height: 0, rotation: 0 });
  const wrappersRef = useRef<{ move?: (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => void; up?: () => void }>({});
  const shiftKeyRef = useRef(false);
  const { elements: canvasObjects } = useCanvasStore();

  // Calculate the rotated position of this corner handle
  const getRotatedCornerPosition = () => {
    // Get the local corner position relative to element center
    let localX, localY;
    
    switch (corner) {
      case 'tl': // top-left
        localX = -elementWidth / 2;
        localY = -elementHeight / 2;
        break;
      case 'tr': // top-right
        localX = elementWidth / 2;
        localY = -elementHeight / 2;
        break;
      case 'bl': // bottom-left
        localX = -elementWidth / 2;
        localY = elementHeight / 2;
        break;
      case 'br': // bottom-right
        localX = elementWidth / 2;
        localY = elementHeight / 2;
        break;
    }
    
    // Apply rotation
    const cos = Math.cos(elementRotation);
    const sin = Math.sin(elementRotation);
    
    const rotatedX = localX * cos - localY * sin;
    const rotatedY = localX * sin + localY * cos;
    
    // Add element center position
    return {
      x: elementX + rotatedX,
      y: elementY + rotatedY
    };
  };

  const [position, setPosition] = useState(getRotatedCornerPosition);

  // Update position when element properties change (unless we're dragging)
  useEffect(() => {
    if (!isDraggingRef.current) {
      setPosition(getRotatedCornerPosition());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elementX, elementY, elementWidth, elementHeight, elementRotation]);

  // Effect to watch position changes and trigger resize
  useEffect(() => {
    if (!isDraggingRef.current) return; // Only resize when actively dragging

    // Use the initial element state that was captured when dragging started
    const initialState = initialElementStateRef.current;
    
    // Calculate what the mouse movement means in terms of the shape's local coordinates
    // We need to work backwards from the current mouse position to determine the new size
    
    // First, get the initial corner position (where the handle was when drag started)
    let initialLocalX, initialLocalY;
    switch (corner) {
      case 'tl': 
        initialLocalX = -initialState.width / 2;
        initialLocalY = -initialState.height / 2;
        break;
      case 'tr':
        initialLocalX = initialState.width / 2;
        initialLocalY = -initialState.height / 2;
        break;
      case 'bl':
        initialLocalX = -initialState.width / 2;
        initialLocalY = initialState.height / 2;
        break;
      case 'br':
        initialLocalX = initialState.width / 2;
        initialLocalY = initialState.height / 2;
        break;
    }
    
    // Calculate the initial rotated corner position
    const cos = Math.cos(initialState.rotation);
    const sin = Math.sin(initialState.rotation);
    const initialCornerX = initialState.x + (initialLocalX * cos - initialLocalY * sin);
    const initialCornerY = initialState.y + (initialLocalX * sin + initialLocalY * cos);
    
    // Calculate how much the mouse has moved from the initial corner position
    const deltaX = position.x - initialCornerX;
    const deltaY = position.y - initialCornerY;
    
    // Convert this movement back to the shape's local coordinate system
    const localDeltaX = deltaX * cos + deltaY * sin;
    const localDeltaY = -deltaX * sin + deltaY * cos;
    
    let newWidth = initialState.width;
    let newHeight = initialState.height;
    let centerOffsetX = 0;
    let centerOffsetY = 0;
    
    // Circles should always scale from center since they're radially symmetric
    const isCircle = elementId && canvasObjects?.find((el: AnimatedCanvasObject) => el.id === elementId)?.type === 'circle';
    const shouldUseCenterScaling = shiftKeyRef.current || isCircle;
    
    if (shouldUseCenterScaling) {
      // Center-based scaling: scale proportionally from center
      // Calculate the scale factor based on the largest movement
      const scaleX = Math.abs(localDeltaX) / (initialState.width / 2);
      const scaleY = Math.abs(localDeltaY) / (initialState.height / 2);
      const scaleFactor = Math.max(scaleX, scaleY);
      
      // Determine if we're scaling up or down based on the corner being dragged
      // FIXED: Dragging outward (away from center) should scale up, dragging inward should scale down
      let isScalingUp = false;
      switch (corner) {
        case 'tl': // top-left: moving left/up (away from center) scales up
          isScalingUp = localDeltaX < 0 || localDeltaY < 0;
          break;
        case 'tr': // top-right: moving right/up (away from center) scales up
          isScalingUp = localDeltaX > 0 || localDeltaY < 0;
          break;
        case 'bl': // bottom-left: moving left/down (away from center) scales up
          isScalingUp = localDeltaX < 0 || localDeltaY > 0;
          break;
        case 'br': // bottom-right: moving right/down (away from center) scales up
          isScalingUp = localDeltaX > 0 || localDeltaY > 0;
          break;
      }
      
      const finalScaleFactor = isScalingUp ? (1 + scaleFactor) : (1 - scaleFactor);
      
      // Apply proportional scaling
      newWidth = initialState.width * finalScaleFactor;
      newHeight = initialState.height * finalScaleFactor;
      
      // Center position stays the same for center-based scaling
      centerOffsetX = 0;
      centerOffsetY = 0;
    } else {
      // Regular corner-based resizing
      switch (corner) {
        case 'tl': // top-left corner
          newWidth = initialState.width - localDeltaX;
          newHeight = initialState.height - localDeltaY;
          centerOffsetX = localDeltaX / 2;
          centerOffsetY = localDeltaY / 2;
          break;
        case 'tr': // top-right corner
          newWidth = initialState.width + localDeltaX;
          newHeight = initialState.height - localDeltaY;
          centerOffsetX = localDeltaX / 2;
          centerOffsetY = localDeltaY / 2;
          break;
        case 'bl': // bottom-left corner
          newWidth = initialState.width - localDeltaX;
          newHeight = initialState.height + localDeltaY;
          centerOffsetX = localDeltaX / 2;
          centerOffsetY = localDeltaY / 2;
          break;
        case 'br': // bottom-right corner
          newWidth = initialState.width + localDeltaX;
          newHeight = initialState.height + localDeltaY;
          centerOffsetX = localDeltaX / 2;
          centerOffsetY = localDeltaY / 2;
          break;
      }
    }
    
    // Ensure minimum size
    const minSize = 20;
    const finalWidth = Math.max(minSize, newWidth);
    const finalHeight = Math.max(minSize, newHeight);
    
    // Calculate the new center position in world coordinates
    const newCenterX = initialState.x + (centerOffsetX * cos - centerOffsetY * sin);
    const newCenterY = initialState.y + (centerOffsetX * sin + centerOffsetY * cos);
    
    console.log(`${corner} handle drag:`, { deltaX, deltaY, localDeltaX, localDeltaY });
    console.log(`Shift key:`, shiftKeyRef.current);
    console.log(`New dimensions:`, { width: finalWidth, height: finalHeight });
    console.log(`New center:`, { x: newCenterX, y: newCenterY });
    
    // Use a ref to prevent infinite loops
    if (!resizeInProgressRef.current) {
      resizeInProgressRef.current = true;
      
      // Dispatch resize event with both size and position changes
      const resizeEvent = new CustomEvent('element-resize', {
        detail: {
          id: elementId,
          width: finalWidth,
          height: finalHeight,
          x: newCenterX,
          y: newCenterY,
          handle: corner === 'tl' ? 'top-left' : corner === 'tr' ? 'top-right' : corner === 'bl' ? 'bottom-left' : 'bottom-right',
          shiftKey: shiftKeyRef.current
        }
      });
      
      window.dispatchEvent(resizeEvent);
      
      // Reset flag after a short delay
      setTimeout(() => {
        resizeInProgressRef.current = false;
      }, 16);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [position.x, position.y]);

  const drawHandle = (g: PIXI.Graphics) => {
    g.clear();
    
    const HANDLE_SIZE = 7;
    const halfSize = HANDLE_SIZE / 2;
    
    // Draw the resize handle square
    g.rect(-halfSize, -halfSize, HANDLE_SIZE, HANDLE_SIZE);
    g.fill({ color: 0xFFFFFF, alpha: 1 });
    g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    console.log(`Starting drag on ${corner} handle`);
    isDraggingRef.current = true;
    
    // Capture the initial element state when dragging starts
    initialElementStateRef.current = {
      x: elementX,
      y: elementY,
      width: elementWidth,
      height: elementHeight,
      rotation: elementRotation
    };
    
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

    // Update shift key state
    shiftKeyRef.current = e.shiftKey;

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
    
    console.log(`Finished dragging ${corner} handle`);
    isDraggingRef.current = false;
    
    // Use EventManager to remove listeners
    if (wrappersRef.current.move && wrappersRef.current.up) {
      eventManager.removeListener('pointermove', wrappersRef.current.move, window);
      eventManager.removeListener('pointerup', wrappersRef.current.up, window);
      wrappersRef.current = {};
    }
  };

  // Get cursor style based on corner position and rotation
  const getCursor = () => {
    // Calculate the effective resize direction after rotation
    // We need to determine which diagonal direction this handle represents in world coordinates
    
    // Get the local corner direction (relative to shape center)
    let localX, localY;
    switch (corner) {
      case 'tl': // top-left
        localX = -1;
        localY = -1;
        break;
      case 'tr': // top-right
        localX = 1;
        localY = -1;
        break;
      case 'bl': // bottom-left
        localX = -1;
        localY = 1;
        break;
      case 'br': // bottom-right
        localX = 1;
        localY = 1;
        break;
    }
    
    // Apply rotation to get the world direction
    const cos = Math.cos(elementRotation);
    const sin = Math.sin(elementRotation);
    
    const worldX = localX * cos - localY * sin;
    const worldY = localX * sin + localY * cos;
    
    // Determine which diagonal based on the world direction
    // We use the signs of worldX and worldY to determine the cursor
    
    if ((worldX > 0 && worldY > 0) || (worldX < 0 && worldY < 0)) {
      // Top-left to bottom-right diagonal
      return 'nwse-resize';
    } else {
      // Top-right to bottom-left diagonal  
      return 'nesw-resize';
    }
  };

  return (
    <pixiGraphics
      x={position.x}
      y={position.y}
      draw={drawHandle}
      eventMode="static"
      interactive={true}
      cursor={getCursor()}
      onPointerDown={handlePointerDown}
    />
  );
};

export default ResizeHandle;