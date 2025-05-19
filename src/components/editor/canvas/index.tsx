'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Texture, Sprite } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef, useEffect } from 'react';
import { drawShape, drawSelectionOutline, drawHoverOutline } from '@/utils/drawing-utils';
import { createNewElement } from '@/lib/element-factory';

extend({ Container, Graphics });

interface CanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasElement[];
  selectedId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  onCanvasClick: (e: FederatedPointerEvent) => void;
  onLineEndpointDrag?: (id: string, endpoint: 'start' | 'end', x: number, y: number) => void;
  tool: string;
  onAddElement?: (element: AnimatedCanvasElement) => void;
  isPathMode?: boolean;
}

export interface CanvasRef {
  getShapeRefs: () => Record<string, Container>;
}

// Define resize handle positions
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const DEFAULT_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 64 64\'%3E%3Cg id=\'_01_Cursor\' data-name=\'01 Cursor\'%3E%3Cpath d=\'m60.2373 22.2021-54.3813-20.2031a3.0174 3.0174 0 0 0 -3.857 3.857l20.2031 54.3813a3.0112 3.0112 0 0 0 5.6763-.15l7.4541-23.8794a1.3336 1.3336 0 0 1 .8745-.875l23.88-7.4541a3.0113 3.0113 0 0 0 .1503-5.6767zm-.7461 3.7671-23.88 7.4541a3.3371 3.3371 0 0 0 -2.1875 2.188l-7.4541 23.88a.9953.9953 0 0 1 -1.8921.05l-20.2035-54.3813c-.2335-1.0229.438-1.4758 1.286-1.286l54.381 20.2031a.9955.9955 0 0 1 -.0498 1.8921z\' fill=\'black\' stroke=\'black\' stroke-width=\'1\'/%3E%3C/g%3E%3C/svg%3E") 3 3, auto';

const DRAW_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'24\' height=\'24\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 2 22, auto';

const setCursor = (cursor: string) => {
  document.body.style.cursor = cursor;
};

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(
  {
    dimensions,
    elements,
    selectedId,
    onElementSelect,
    onElementDragEnd,
    onCanvasClick,
    onLineEndpointDrag,
    tool,
    onAddElement,
    isPathMode = false
  },
  ref
) {
  const shapeRefs = useRef<Record<string, Container>>({});
  const HANDLE_SIZE = 10;
  const drawingRef = useRef<Graphics | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  
  // Add hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  
  // Create a map to track which SVGs have already been rendered
  // Value is an object with element ID and dimensions for tracking changes
  const svgRenderedMap = useRef(new WeakMap<Container, {id: string, width: number, height: number}>());

  useImperativeHandle(ref, () => ({
    getShapeRefs: () => shapeRefs.current,
  }));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  // Add state for resizing
  const [resizingHandle, setResizingHandle] = useState<ResizeHandle>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [initialMouse, setInitialMouse] = useState<{ x: number; y: number } | null>(null);

  // After importing useEffect, also add:
  useEffect(() => {
    // Set default cursor when component mounts
    setCursor(DEFAULT_CURSOR);
    
    // Reset to default cursor when component unmounts
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  // Check if a point is within a resize handle
  const getResizeHandleAtPoint = (element: AnimatedCanvasElement, x: number, y: number): ResizeHandle => {
    if (!element) return null;
    
    const halfWidth = element.width / 2;
    const halfHeight = element.height / 2;
    const halfHandleSize = HANDLE_SIZE / 2;
    
    // Convert global coordinates to element-local coordinates
    const localX = x - element.x;
    const localY = y - element.y;
    
    // Check top-left handle
    if (
      localX >= -halfWidth - halfHandleSize && 
      localX <= -halfWidth + halfHandleSize &&
      localY >= -halfHeight - halfHandleSize && 
      localY <= -halfHeight + halfHandleSize
    ) {
      return 'top-left';
    }
    
    // Check top-right handle
    if (
      localX >= halfWidth - halfHandleSize && 
      localX <= halfWidth + halfHandleSize &&
      localY >= -halfHeight - halfHandleSize && 
      localY <= -halfHeight + halfHandleSize
    ) {
      return 'top-right';
    }
    
    // Check bottom-left handle
    if (
      localX >= -halfWidth - halfHandleSize && 
      localX <= -halfWidth + halfHandleSize &&
      localY >= halfHeight - halfHandleSize && 
      localY <= halfHeight + halfHandleSize
    ) {
      return 'bottom-left';
    }
    
    // Check bottom-right handle
    if (
      localX >= halfWidth - halfHandleSize && 
      localX <= halfWidth + halfHandleSize &&
      localY >= halfHeight - halfHandleSize && 
      localY <= halfHeight + halfHandleSize
    ) {
      return 'bottom-right';
    }
    
    return null;
  };

  // Update the getResizeCursor function
  const getResizeCursor = (handle: ResizeHandle): string => {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
      default:
        return DEFAULT_CURSOR;
    }
  };

  const handlePointerDown = (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    const pos = e.global;
    const element = elements.find(el => el.id === id);
    
    if (!element) return;
    
    // First, check if we're clicking on a resize handle (only for selected elements)
    if (id === selectedId && element.type !== 'line' && element.type !== 'path') {
      const handle = getResizeHandleAtPoint(element, pos.x, pos.y);
      
      if (handle) {
        setResizingHandle(handle);
        setDraggingId(id);
        setInitialSize({ width: element.width, height: element.height });
        setInitialMouse({ x: pos.x, y: pos.y });
        onElementSelect(id);
        
        // Set cursor for resize operation
        setCursor(getResizeCursor(handle));
        return;
      }
    }
    
    // Then check for line endpoint handling (same as before)
    if (element?.type === 'line' && element.lineOptions?.points && onLineEndpointDrag) {
      const { start, end } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;
      
      // Check if clicking near start point
      const startDist = Math.hypot(clickX - start.x, clickY - start.y);
      if (startDist <= HANDLE_SIZE) {
        setDraggingEndpoint('start');
        setDraggingId(id);
        onElementSelect(id);
        return;
      }
      
      // Check if clicking near end point
      const endDist = Math.hypot(clickX - end.x, clickY - end.y);
      if (endDist <= HANDLE_SIZE) {
        setDraggingEndpoint('end');
        setDraggingId(id);
        onElementSelect(id);
        return;
      }
    }
    
    // Regular shape drag (same as before)
    setDraggingId(id);
    onElementSelect(id);
    setDragOffset({ x: pos.x - shapeX, y: pos.y - shapeY });
  };

  // Update the handlePointerUp function
  const handlePointerUp = () => {
    // Reset all dragging and resizing state (except resize, which is handled by global handler)
    if (!resizingHandle) {
      setDraggingId(null);
      setDragOffset(null);
      setDraggingEndpoint(null);
      
      // Reset cursor style
      setCursor(DEFAULT_CURSOR);
    }
    
    if (isDrawing) {
      if (currentPath.length > 1) {
        if (tool === 'draw') {
          // Create a new path element
          const newElement = createNewElement('path', 0, 0, elements, currentPath);
          
          // If in path mode, mark it as a path
          if (isPathMode) {
            newElement.isPath = true;
          }
          
          onElementSelect(newElement.id);
          if (onAddElement) {
            onAddElement(newElement);
          }
        }
      }
      setIsDrawing(false);
      setCurrentPath([]);
    }
  };

  const handleDragMove = (id: string) => (e: FederatedPointerEvent) => {
    if (draggingId !== id) return;
    
    // Prevent event from propagating to stop interference with other handlers
    e.stopPropagation();
    
    const pos = e.global;
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    // Handle resizing - only if mouse button is pressed (buttons property > 0)
    if (resizingHandle && initialSize && initialMouse && e.buttons > 0) {
      // Calculate the delta from the initial mouse position
      const deltaX = pos.x - initialMouse.x;
      const deltaY = pos.y - initialMouse.y;
      
      let newWidth = initialSize.width;
      let newHeight = initialSize.height;
      
      // Calculate new dimensions based on the handle being dragged
      switch (resizingHandle) {
        case 'top-left':
          newWidth = Math.max(20, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(20, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
      }
      
      // Trigger a custom event that the parent component can listen to
      const resizeEvent = new CustomEvent('element-resize', { 
        detail: { 
          id,
          width: newWidth,
          height: newHeight,
          handle: resizingHandle,
          originalX: element.x,
          originalY: element.y
        }
      });
      
      window.dispatchEvent(resizeEvent);
      return;
    } else if (resizingHandle && e.buttons === 0) {
      // If mouse button is released during resize, exit resize mode
      setResizingHandle(null);
      setDraggingId(null);
      setInitialSize(null);
      setInitialMouse(null);
      setCursor(DEFAULT_CURSOR);
      return;
    }
    
    // Handle endpoint dragging (same as before)
    if (draggingEndpoint && onLineEndpointDrag) {
      onLineEndpointDrag(id, draggingEndpoint, pos.x, pos.y);
    } else if (dragOffset) {
      // Handle regular shape dragging (same as before)
      onElementDragEnd(id, pos.x - dragOffset.x, pos.y - dragOffset.y);
    }
  };

  const handleCanvasPointerDown = (e: FederatedPointerEvent) => {
    if (tool === 'draw') {
      setIsDrawing(true);
      const newPoint = { x: e.global.x, y: e.global.y };
      setCurrentPath([newPoint]);
      
      if (drawingRef.current) {
        const graphics = drawingRef.current;
        graphics.clear();
        graphics.moveTo(newPoint.x, newPoint.y);
        graphics.stroke({ width: 2, color: 0x000000, alpha: 1 });
      }
    }
  };

  const handleCanvasPointerMove = (e: FederatedPointerEvent) => {
    if (isDrawing && tool === 'draw') {
      const newPoint = { x: e.global.x, y: e.global.y };
      setCurrentPath(prev => [...prev, newPoint]);
      
      if (drawingRef.current) {
        const graphics = drawingRef.current;
        graphics.clear();
        graphics.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach(point => {
          graphics.lineTo(point.x, point.y);
        });
        graphics.lineTo(newPoint.x, newPoint.y);
        graphics.stroke({ width: 2, color: 0x000000, alpha: 1 });
      }
    }
  };

  // Update handleElementMouseMove to manage hover state
  const handleElementMouseMove = (id: string) => (e: FederatedPointerEvent) => {
    // Update hover state
    if (hoveredId !== id) {
      setHoveredId(id);
    }

    // Only handle cursor change for selected elements that are not being dragged
    if (id !== selectedId || draggingId) return;
    
    const element = elements.find(el => el.id === id);
    if (!element || element.type === 'line' || element.type === 'path') return;
    
    const handle = getResizeHandleAtPoint(element, e.global.x, e.global.y);
    if (handle) {
      setCursor(getResizeCursor(handle));
    } else {
      setCursor(DEFAULT_CURSOR);
    }
  };

  // Update handleElementMouseLeave to clear hover state
  const handleElementMouseLeave = (id: string) => () => {
    if (hoveredId === id) {
      setHoveredId(null);
    }
    
    if (!draggingId) {
      setCursor(DEFAULT_CURSOR);
    }
  };

  // Update the global pointer up handler
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (resizingHandle) {
        setResizingHandle(null);
        setDraggingId(null);
        setInitialSize(null);
        setInitialMouse(null);
        setCursor(DEFAULT_CURSOR);
      }
    };

    document.addEventListener('pointerup', handleGlobalPointerUp);
    return () => {
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
  }, [resizingHandle]);

  // Update the handleCanvasPointerMove function to set the appropriate cursor based on the tool
  useEffect(() => {
    if (tool === 'draw' || tool === 'line') {
      setCursor(DRAW_CURSOR);
    } else {
      setCursor(DEFAULT_CURSOR);
    }
  }, [tool]);

  return (
    <Application
      width={dimensions.width}
      height={dimensions.height}
      backgroundColor={0xFFFFFF}
      antialias={true}
      resolution={window.devicePixelRatio || 2}
      autoDensity={true}
    >
      {/* Full-size transparent interactive layer to capture background clicks */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.beginFill(0xFFFFFF, 0);
          g.drawRect(0, 0, dimensions.width, dimensions.height);
          g.endFill();
        }}
        interactive={true}
        eventMode="static"
        onPointerDown={(e: FederatedPointerEvent) => {
          if (tool === 'draw') {
            handleCanvasPointerDown(e);
          } else {
            onElementSelect(null);
            onCanvasClick(e);
          }
        }}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
      />

      {elements.map((el) => {
        // Special handling for SVG elements
        if (el.type === 'svg' && el.svgData) {
          return (
            <pixiContainer
              key={el.id}
              x={el.x}
              y={el.y}
              pivot={{ x: 0, y: 0 }}
              interactive={true}
              eventMode="dynamic"
              onPointerDown={handlePointerDown(el.id, el.x, el.y)}
              onPointerUp={handlePointerUp}
              onPointerUpOutside={handlePointerUp}
              onPointerMove={handleDragMove(el.id)}
              onPointerOver={handleElementMouseMove(el.id)}
              onPointerOut={handleElementMouseLeave(el.id)}
              ref={(node) => {
                if (node) {
                  // Store the container reference
                  shapeRefs.current[el.id] = node;
                  
                  // Check if we need to render or re-render the SVG
                  const needsRender = !svgRenderedMap.current.has(node);
                  const renderedInfo = svgRenderedMap.current.get(node);
                  const needsUpdate = renderedInfo && 
                    (renderedInfo.id !== el.id || 
                     renderedInfo.width !== el.width || 
                     renderedInfo.height !== el.height);
                  
                  // Clear existing if dimensions changed
                  if (needsUpdate) {
                    // Remove all children to redraw
                    while (node.children.length > 0) {
                      node.removeChild(node.children[0]);
                    }
                  }
                  
                  // Render SVG if it hasn't been rendered yet or needs update
                  if (needsRender || needsUpdate) {
                    try {
                      // Create a placeholder graphics while SVG is loading
                      const placeholder = new Graphics();
                      placeholder.rect(-el.width/2, -el.height/2, el.width, el.height);
                      placeholder.fill({ color: 0xEEEEEE, alpha: 0.5 });
                      placeholder.stroke({ color: 0xCCCCCC, width: 1, alpha: 0.8 });
                      node.addChild(placeholder);
                      
                      // Create the SVG image element
                      const img = document.createElement('img');
                      img.onload = () => {
                        if (!node.parent) return; // Container was removed
                        
                        try {
                          // Create a PIXI texture from the image
                          const texture = Texture.from(img);
                          
                          // Create a sprite from the texture
                          const sprite = new Sprite(texture);
                          
                          // Center the sprite
                          sprite.anchor.set(0.5, 0.5);
                          sprite.width = el.width;
                          sprite.height = el.height;
                          
                          // Remove the placeholder
                          node.removeChild(placeholder);
                          
                          // Add to container
                          node.addChild(sprite);
                          
                          // Mark as rendered in our map
                          svgRenderedMap.current.set(node, {id: el.id, width: el.width, height: el.height});
                          
                          // Add hover outline if needed (when hovered but not selected)
                          if (hoveredId === el.id && selectedId !== el.id) {
                            const hoverOutline = new Graphics();
                            drawHoverOutline(hoverOutline, el);
                            node.addChild(hoverOutline);
                          }
                          
                          // Add selection outline if needed
                          if (el.id === selectedId) {
                            const outline = new Graphics();
                            drawSelectionOutline(outline, el);
                            node.addChild(outline);
                          }
                        } catch (error) {
                          console.error('Error creating texture from SVG image:', error);
                        }
                      };
                      
                      img.onerror = () => {
                        console.error('Failed to load SVG as image');
                        // Update placeholder to show error
                        placeholder.clear();
                        placeholder.rect(-el.width/2, -el.height/2, el.width, el.height);
                        placeholder.fill({ color: 0xFFDDDD, alpha: 0.5 });
                        placeholder.stroke({ color: 0xFF0000, width: 1, alpha: 0.8 });
                        // Draw X to indicate error
                        placeholder.moveTo(-el.width/2, -el.height/2).lineTo(el.width/2, el.height/2);
                        placeholder.moveTo(el.width/2, -el.height/2).lineTo(-el.width/2, el.height/2);
                        placeholder.stroke({ color: 0xFF0000, width: 1, alpha: 0.8 });
                      };
                      
                      // Convert SVG to base64 data URL - ensure svgData is string
                      if (el.svgData) {
                        const base64 = window.btoa(unescape(encodeURIComponent(el.svgData)));
                        img.src = `data:image/svg+xml;base64,${base64}`;
                      }
                    } catch (error) {
                      console.error("Error in SVG rendering setup:", error);
                    }
                  }
                }
              }}
            />
          );
        }
        
        // Standard rendering for non-SVG elements
        return (
          <pixiContainer
            key={el.id}
            x={el.x}
            y={el.y}
            pivot={{ x: 0, y: 0 }}
            interactive={true}
            eventMode="dynamic"
            onPointerDown={handlePointerDown(el.id, el.x, el.y)}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
            onPointerMove={handleDragMove(el.id)}
            onPointerOver={handleElementMouseMove(el.id)}
            onPointerOut={handleElementMouseLeave(el.id)}
            ref={(node) => {
              if (node) shapeRefs.current[el.id] = node;
            }}
          >
            <pixiGraphics draw={(g) => drawShape(g, el)} />
            
            {/* Show hover outline when hovered but not selected */}
            {hoveredId === el.id && selectedId !== el.id && (
              <pixiGraphics draw={(g) => drawHoverOutline(g, el)} />
            )}
            
            {/* Show selection outline with corner handles when selected */}
            {el.id === selectedId && (
              <pixiGraphics draw={(g) => drawSelectionOutline(g, el)} />
            )}
          </pixiContainer>
        );
      })}

      {/* Drawing preview layer */}
      {tool === 'draw' && (
        <pixiGraphics
          ref={drawingRef}
          draw={(g) => {
            g.clear();
            if (currentPath.length > 1) {
              g.moveTo(currentPath[0].x, currentPath[0].y);
              currentPath.slice(1).forEach(point => {
                g.lineTo(point.x, point.y);
              });
              g.stroke({ width: 2, color: 0x000000, alpha: 1 });
            }
          }}
        />
      )}
    </Application>
  );
});
