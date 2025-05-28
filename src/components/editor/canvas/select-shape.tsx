import React, { useState, useEffect, useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import RadiusCircle from './radius-circle';

extend({ Container, Graphics });

interface ShapeSelectProps {
  element: AnimatedCanvasElement;
  onResize: (newWidth: number, newHeight: number, handle?: string) => void;
  onResizeComplete: () => void;
  scaleFactor?: number;
}

const ShapeSelect: React.FC<ShapeSelectProps> = ({
  element,
  onResize,
  onResizeComplete,
  scaleFactor = 1
}) => {
  // State for tracking resize dimensions
  const [dimensions, setDimensions] = useState({
    width: element.width,
    height: element.height
  });

  // NEW: State for circle positions
  const [circlePositions, setCirclePositions] = useState({
    tl: { x: -dimensions.width / 2 + 12, y: -dimensions.height / 2 + 12 },
    tr: { x: dimensions.width / 2 - 12, y: -dimensions.height / 2 + 12 },
    bl: { x: -dimensions.width / 2 + 12, y: dimensions.height / 2 - 12 },
    br: { x: dimensions.width / 2 - 12, y: dimensions.height / 2 - 12 }
  });

  // Refs for tracking resize interaction
  const isDraggingRef = useRef(false);
  const activeHandleRef = useRef<string | null>(null);
  const startPointRef = useRef({ x: 0, y: 0 });
  const startDimensionsRef = useRef({ width: 0, height: 0 });
  const isShiftPressedRef = useRef(false);

  // UPDATED: Draw the selection outline with handles (NO CIRCLES HERE)
  const drawOutline = (g: PIXI.Graphics) => {
    g.clear();

    // For line type, draw custom selection outline
    if (element.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;

      // Calculate line bounding box with padding for better selection
      const padding = 10;
      const minX = Math.min(startX, endX) - padding;
      const maxX = Math.max(startX, endX) + padding;
      const minY = Math.min(startY, endY) - padding;
      const maxY = Math.max(startY, endY) + padding;

      // Draw selection rectangle covering the entire line length
      g.rect(minX, minY, maxX - minX, maxY - minY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });

      // Draw the actual line for visual reference
      g.moveTo(startX, startY).lineTo(endX, endY);
      g.stroke({ width: 2, color: 0x74b9ff, alpha: 0.8 });

      // Draw endpoint markers
      const ENDPOINT_SIZE = 10;

      // Start point (green)
      g.circle(startX, startY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

      // End point (red)
      g.circle(endX, endY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

      return; // Exit early for line elements
    }

    // Draw rectangular outline for non-line elements
    g.roundRect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height,
      element.cornerRadius
    );

    g.stroke({
      width: 1,
      color: 0x74b9ff,
      alpha: 0.85,
    });

    // Draw resize handles for non-line elements
    const HANDLE_SIZE = 7;
    const halfHandleSize = HANDLE_SIZE / 2;

    // Draw the four corner handles
    const corners = [
      { x: -dimensions.width / 2, y: -dimensions.height / 2, handle: 'tl' }, // top-left
      { x: dimensions.width / 2, y: -dimensions.height / 2, handle: 'tr' },  // top-right
      { x: -dimensions.width / 2, y: dimensions.height / 2, handle: 'bl' },  // bottom-left
      { x: dimensions.width / 2, y: dimensions.height / 2, handle: 'br' }    // bottom-right
    ];

    // Draw corner handles
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

    // REMOVED: No longer drawing circles here - they're separate components now
  };

  // NEW: Handler for when circles move
  const handleCircleMove = (corner: keyof typeof circlePositions, newX: number, newY: number) => {
    setCirclePositions(prev => ({
      ...prev,
      [corner]: { x: newX, y: newY }
    }));
  };

  // NEW: Calculate bounds for circles
  const getCircleBounds = () => ({
    minX: -dimensions.width / 2 + 7,
    maxX: dimensions.width / 2 - 7,
    minY: -dimensions.height / 2 + 7,
    maxY: dimensions.height / 2 - 7
  });

  // Handle pointer down on resize handle (UNCHANGED - only handles resize handles now)
  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    // Get local position relative to the component's parent
    const localPos = e.getLocalPosition(e.currentTarget.parent);
    const { width, height } = dimensions;
    const HANDLE_SIZE = 8;

    // Check if we're clicking on a handle
    const halfW = width / 2;
    const halfH = height / 2;

    // Define handle hit areas (corners and edges)
    const handles = {
      // Corner handles
      tl: { x: -halfW, y: -halfH },
      tr: { x: halfW, y: -halfH },
      bl: { x: -halfW, y: halfH },
      br: { x: halfW, y: halfH },
      // Edge handles
      t: { x: 0, y: -halfH },
      r: { x: halfW, y: 0 },
      b: { x: 0, y: halfH },
      l: { x: -halfW, y: 0 }
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

        // Get the canvas element to calculate proper coordinates
        const canvasElement = document.querySelector('canvas');
        if (!canvasElement) return;

        const rect = canvasElement.getBoundingClientRect();
        const canvasX = e.client.x - rect.left;
        const canvasY = e.client.y - rect.top;

        // Store canvas-relative coordinates for consistent tracking
        startPointRef.current = {
          x: canvasX,
          y: canvasY
        };

        // Store initial dimensions for reference during resize
        startDimensionsRef.current = { width, height };

        // Add global listeners
        window.addEventListener('pointermove', handlePointerMove);
        window.addEventListener('pointerup', handlePointerUp);
        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);

        // Prevent default to avoid text selection during drag
        e.preventDefault();
        e.stopPropagation();
        break;
      }
    }
  };

  // Handle key down for shift key detection (UNCHANGED)
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftPressedRef.current = true;
    }
  };

  // Handle key up for shift key detection (UNCHANGED)
  const handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      isShiftPressedRef.current = false;
    }
  };

  // Handle pointer move during resize (UNCHANGED)
  const handlePointerMove = (e: PointerEvent) => {
    if (!isDraggingRef.current || !activeHandleRef.current) return;

    const handle = activeHandleRef.current;

    // Get the canvas element to calculate proper coordinates
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Calculate the mouse movement delta from the starting point using canvas coordinates
    // Apply scaling factor to convert screen coordinates to canvas coordinates
    const deltaX = (canvasX - startPointRef.current.x) / scaleFactor;
    const deltaY = (canvasY - startPointRef.current.y) / scaleFactor;

    let newWidth = startDimensionsRef.current.width;
    let newHeight = startDimensionsRef.current.height;

    // If shift is pressed, use proportional scaling for any handle
    if (isShiftPressedRef.current) {
      // Use the larger absolute delta for consistent scaling
      const absDeltaX = Math.abs(deltaX);
      const absDeltaY = Math.abs(deltaY);
      const scaleMagnitude = Math.max(absDeltaX, absDeltaY);

      // Determine if movement is outward or inward based on handle
      let isOutward = false;

      switch (handle) {
        case 'tl': // top-left: outward = left AND up (negative X, negative Y)
          isOutward = deltaX < 0 && deltaY < 0;
          break;
        case 'tr': // top-right: outward = right AND up (positive X, negative Y)
          isOutward = deltaX > 0 && deltaY < 0;
          break;
        case 'bl': // bottom-left: outward = left AND down (negative X, positive Y)
          isOutward = deltaX < 0 && deltaY > 0;
          break;
        case 'br': // bottom-right: outward = right AND down (positive X, positive Y)
          isOutward = deltaX > 0 && deltaY > 0;
          break;
        case 't': // top edge: outward = up (negative Y)
          isOutward = deltaY < 0;
          break;
        case 'b': // bottom edge: outward = down (positive Y)
          isOutward = deltaY > 0;
          break;
        case 'l': // left edge: outward = left (negative X)
          isOutward = deltaX < 0;
          break;
        case 'r': // right edge: outward = right (positive X)
          isOutward = deltaX > 0;
          break;
      }

      // Apply the scale change: positive for outward (bigger), negative for inward (smaller)
      const scaleChange = isOutward ? scaleMagnitude : -scaleMagnitude;

      // Calculate new dimensions by applying the same scale change to both dimensions
      newWidth = Math.max(10, startDimensionsRef.current.width + scaleChange);
      newHeight = Math.max(10, startDimensionsRef.current.height + scaleChange);
    } else {
      // Normal resize behavior - only affect the relevant dimensions
      switch (handle) {
        // Corner handles - affect both dimensions
        case 'tl': // top-left
          newWidth = Math.max(10, startDimensionsRef.current.width - deltaX);
          newHeight = Math.max(10, startDimensionsRef.current.height - deltaY);
          break;
        case 'tr': // top-right
          newWidth = Math.max(10, startDimensionsRef.current.width + deltaX);
          newHeight = Math.max(10, startDimensionsRef.current.height - deltaY);
          break;
        case 'bl': // bottom-left
          newWidth = Math.max(10, startDimensionsRef.current.width - deltaX);
          newHeight = Math.max(10, startDimensionsRef.current.height + deltaY);
          break;
        case 'br': // bottom-right
          newWidth = Math.max(10, startDimensionsRef.current.width + deltaX);
          newHeight = Math.max(10, startDimensionsRef.current.height + deltaY);
          break;
        // Edge handles - affect only one dimension
        case 't': // top edge - only height
          newHeight = Math.max(10, startDimensionsRef.current.height - deltaY);
          break;
        case 'b': // bottom edge - only height
          newHeight = Math.max(10, startDimensionsRef.current.height + deltaY);
          break;
        case 'l': // left edge - only width
          newWidth = Math.max(10, startDimensionsRef.current.width - deltaX);
          break;
        case 'r': // right edge - only width
          newWidth = Math.max(10, startDimensionsRef.current.width + deltaX);
          break;
      }
    }

    // Update dimensions state
    setDimensions({ width: newWidth, height: newHeight });

    // Call the parent's onResize callback
    onResize(newWidth, newHeight, handle);
  };

  // Handle pointer up to complete resize (UNCHANGED)
  const handlePointerUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      activeHandleRef.current = null;
      isShiftPressedRef.current = false;

      // Remove global listeners
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);

      // Notify parent that resize is complete
      onResizeComplete();
    }
  };

  // Update local dimensions when element props change (UNCHANGED)
  useEffect(() => {
    setDimensions({
      width: element.width,
      height: element.height
    });

    if (element.isAnimationPath) {
      // Dispatch a custom event to trigger animation updates for path elements
      const animationPathUpdateEvent = new CustomEvent('animation-path-updated', {
        detail: {
          pathElement: element
        }
      });

      window.dispatchEvent(animationPathUpdateEvent);
    }
  }, [element.width, element.height, element]);

  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      {/* Selection outline and resize handles */}
      <pixiGraphics
        draw={drawOutline}
        eventMode="static"
        cursor="pointer"
        onPointerDown={handlePointerDown}
      />

      {/* Separate moveable circles - only for rectangle/triangle */}
      {(element.type === 'rectangle' || element.type === 'triangle') && (
        <>
          <RadiusCircle
            x={circlePositions.tl.x}
            y={circlePositions.tl.y}
            onMove={(newX, newY) => handleCircleMove('tl', newX, newY)}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="tl" // Top-left corner
          />
          <RadiusCircle
            x={circlePositions.tr.x}
            y={circlePositions.tr.y}
            onMove={(newX, newY) => handleCircleMove('tr', newX, newY)}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="tr" // Top-right corner
          />
          <RadiusCircle
            x={circlePositions.bl.x}
            y={circlePositions.bl.y}
            onMove={(newX, newY) => handleCircleMove('bl', newX, newY)}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="bl" // Bottom-left corner
          />
          <RadiusCircle
            x={circlePositions.br.x}
            y={circlePositions.br.y}
            onMove={(newX, newY) => handleCircleMove('br', newX, newY)}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="br" // Bottom-right corner
          />
        </>
      )}
    </pixiContainer>
  );
};

export default ShapeSelect;