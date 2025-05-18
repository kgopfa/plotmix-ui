'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Texture, Sprite } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef } from 'react';
import { drawShape, drawSelectionOutline } from '@/utils/drawing-utils';
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
  
  // Create a map to track which SVGs have already been rendered
  // Value is an object with element ID and dimensions for tracking changes
  const svgRenderedMap = useRef(new WeakMap<Container, {id: string, width: number, height: number}>());

  useImperativeHandle(ref, () => ({
    getShapeRefs: () => shapeRefs.current,
  }));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);

  const handlePointerDown = (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    const pos = e.global;
    const element = elements.find(el => el.id === id);
    
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
    
    // Regular shape drag
    setDraggingId(id);
    onElementSelect(id);
    setDragOffset({ x: pos.x - shapeX, y: pos.y - shapeY });
  };

  const handlePointerUp = () => {
    setDraggingId(null);
    setDragOffset(null);
    setDraggingEndpoint(null);
    
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
    
    const pos = e.global;
    
    if (draggingEndpoint && onLineEndpointDrag) {
      // Handle endpoint dragging
      onLineEndpointDrag(id, draggingEndpoint, pos.x, pos.y);
    } else if (dragOffset) {
      // Handle regular shape dragging
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
        cursor={tool === 'draw' ? 'crosshair' : 'default'}
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
              cursor="move"
              onPointerDown={handlePointerDown(el.id, el.x, el.y)}
              onPointerUp={handlePointerUp}
              onPointerUpOutside={handlePointerUp}
              onPointerMove={handleDragMove(el.id)}
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
            cursor="move"
            onPointerDown={handlePointerDown(el.id, el.x, el.y)}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
            onPointerMove={handleDragMove(el.id)}
            ref={(node) => {
              if (node) shapeRefs.current[el.id] = node;
            }}
          >
            <pixiGraphics draw={(g) => drawShape(g, el)} />
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
