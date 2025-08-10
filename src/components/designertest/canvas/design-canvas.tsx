import React, { useRef } from 'react';
import { extend } from '@pixi/react';
import { RichTextRenderer } from '@/components/designer/helpers/rich-text-renderer';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { Rectangle, Graphics, Container } from 'pixi.js';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import { useCanvasState } from '@/stores/use-ui-store';
import { useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useResponsiveCanvasPosition } from '@/hooks/use-responsive-canvas-position';

// Extend PIXI components for React
extend({ Container, Graphics });

interface DesignCanvasProps {
  dimensions: { width: number; height: number };
  // Canvas state and operations
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedIds: string[];
  hoveredId: string | null;

  editingTextId: string | null;
  // Tool state
  tool: string;
  isPathMode: boolean;
  animationTarget: { elementId: string } | null;
  lineStartPoint: { x: number; y: number } | null;
  isLineChaining: boolean;
  chainedLineIds: string[];
  mousePos: { x: number; y: number } | null;
  currentPath: Array<{ x: number; y: number }>;
  isDrawing: boolean;
  // Refs
  shapeRefs: React.MutableRefObject<Record<string, unknown>>;
  groupContainers: React.MutableRefObject<Record<string, unknown>>;
  mainCanvasContainerRef: React.MutableRefObject<Container | null>;
  drawingRef: React.MutableRefObject<Graphics | null>;
  canvasScaleFactor: React.MutableRefObject<number>;
  // Handlers
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  handleCanvasPointerMove: (e: FederatedPointerEvent) => void;
  handlePointerUp: () => void;
  handleSelectElement: (id: string | null, isMultiSelect?: boolean) => void;
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  handlePointerDown: (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => void;
  handleElementMouseMove: (id: string) => (e: FederatedPointerEvent) => void;
  handleElementMouseLeave: (id: string) => () => void;
  onPathStartClick?: (elementId: string, x: number, y: number) => void;
  handleGroupSelectionDragStart: (virtualElement: AnimatedCanvasObject, mouseX: number, mouseY: number, allElements?: AnimatedCanvasObject[]) => void;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
  // Context menu handlers
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
  // Shift key state for constrained drawing
  shiftKey?: boolean;
  // Snapping state for alignment guides
  isSnappingEnabled?: boolean;
  // Visual customization (optional)
  canvasBackgroundColor?: number; // default 0xFFFFFF
  canvasBorderColor?: number; // default 0xE2E8F0
  canvasBorderWidth?: number; // default 1
}

export const DesignCanvas = (props: DesignCanvasProps) => {
  // Get isPlaying state directly from timeline store
  const isPlaying = useTimelineStore(state => state.playback.isPlaying);
  
  // Get selection store functions
  const { selectGroup } = useSelectionStore();

  const {
    elements,
    groups,
    selectedIds,
    tool,
    lineStartPoint,
    isLineChaining,
    chainedLineIds,
    mousePos,
    currentPath,
    shapeRefs,
    groupContainers,
    drawingRef,
    handlePointerUp,
    handleElementMouseMove,
    handleElementMouseLeave,
    shiftKey = false,
    isSnappingEnabled = true,
  } = props;

  // Get canvas size from UI store
  const canvasState = useCanvasState();

  // Get canvas operations and selection store
  const { moveElement, moveMultipleElements, updateElement } = useCanvasOperations();
  const { select: selectElement } = useSelectionStore();

  // Get current canvas size
  const currentSize = canvasState.currentSizeId === 'custom'
    ? canvasState.customSize
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  // Use current canvas size or fallback to default
  const canvasFrameWidth = currentSize?.width || 1280;
  const canvasFrameHeight = currentSize?.height || 720;

  // Use responsive canvas positioning hook
  const { x: centerX, y: centerY } = useResponsiveCanvasPosition(props.dimensions);

  // Canvas dragging state refs
  const containerRef = useRef<Container | null>(null);

  return (
    <pixiContainer
      x={centerX}
      y={centerY}
      interactive={true}
      eventMode="static"
      sortableChildren={true}
      data-pixi-container="design-canvas"
      hitArea={new Rectangle(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight)}
      ref={(container) => {
        containerRef.current = container;
        props.mainCanvasContainerRef.current = container;
      }}
      onPointerDown={(e: FederatedPointerEvent) => {
        // For draw tool, always call handleCanvasPointerDown to start drawing
        if (props.tool === 'draw') {
          props.handleCanvasPointerDown(e);
          return;
        }

        // Only check for hit elements when using select tool
        // For creation tools, elements are non-interactive so we can always create shapes
        if (props.tool === 'select') {
          const hitElement = props.elements.find(element => {
            const shapeRef = props.shapeRefs.current[element.id];
            if (!shapeRef) return false;

            // Check if the click point is within the element's bounds
            const bounds = (shapeRef as Container).getBounds();
            return e.global.x >= bounds.x &&
              e.global.x <= bounds.x + bounds.width &&
              e.global.y >= bounds.y &&
              e.global.y <= bounds.y + bounds.height;
          });

          // Also check for group hits
          const hitGroup = props.groups.find(group => {
            if (group.visible === false || group.isDefaultGroup) return false;
            
            const groupElements = props.elements.filter(el => el.groupId === group.id && el.visible !== false);
            if (groupElements.length === 0) return false;
            
            // Calculate group bounds
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            
            const isPolygonGroup = group.type === 'polygon' || groupElements.every(el => el.type === 'line');
            
            groupElements.forEach(el => {
              if (isPolygonGroup && el.type === 'line' && el.lineOptions?.points) {
                const { start, end } = el.lineOptions.points;
                minX = Math.min(minX, start.x, end.x);
                minY = Math.min(minY, start.y, end.y);
                maxX = Math.max(maxX, start.x, end.x);
                maxY = Math.max(maxY, start.y, end.y);
              } else {
                const left = el.x - el.width / 2;
                const right = el.x + el.width / 2;
                const top = el.y - el.height / 2;
                const bottom = el.y + el.height / 2;
                
                minX = Math.min(minX, left);
                minY = Math.min(minY, top);
                maxX = Math.max(maxX, right);
                maxY = Math.max(maxY, bottom);
              }
            });
            
            return e.global.x >= minX && e.global.x <= maxX && e.global.y >= minY && e.global.y <= maxY;
          });

          // Check if any group is currently selected
          const hasSelectedGroups = props.groups.some(group => 
            !group.isDefaultGroup && props.selectedIds.some(id => 
              props.elements.find(el => el.id === id)?.groupId === group.id
            )
          );

          // Only call canvas click handler if no element or group was hit AND no group is selected
          if (!hitElement && !hitGroup && !hasSelectedGroups) {
            props.handleCanvasClick(e);
          }
        } else {
          // For creation tools, always call canvas click handler since elements are non-interactive
          props.handleCanvasClick(e);
        }
      }}
      onPointerMove={(e: FederatedPointerEvent) => {}}
      onPointerUp={() => {}}
      onPointerUpOutside={() => {}}
      onClick={(e: FederatedPointerEvent) => {}}
    >
      {/* Canvas frame background - positioned in center */}
      <pixiGraphics
        zIndex={-1}
        draw={(g) => {
          g.clear();
          g.roundRect(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight, 14);
          g.fill({ color: props.canvasBackgroundColor ?? 0xFFFFFF, alpha: 1 });
          // Border customizable; draw only if width > 0
          const bw = props.canvasBorderWidth ?? 1;
          if (bw > 0) {
            g.stroke({ color: props.canvasBorderColor ?? 0xE2E8F0, width: bw });
          }
        }}
        interactive={false}
        eventMode="none"
      />

      {/* Render group containers first (excluding default groups) */}
      {groups.filter(group => (group.visible !== false) && !group.isDefaultGroup).map((group) => {
        const groupElements = elements
          .filter((el: AnimatedCanvasObject) => el.groupId === group.id && (el.visible !== false));

        // Check if this group is selected
        const isGroupSelected = selectedIds.some(id => 
          groupElements.some(el => el.id === id)
        );

        return (
          <pixiContainer
            key={`group-${group.id}`}
            x={group.x}
            y={group.y}
            rotation={group.rotation || 0}
            alpha={group.opacity ?? 1}
            zIndex={Math.max(...groupElements.map((el: AnimatedCanvasObject) => el.zIndex || 0))}
            interactive={tool === 'select'}
            eventMode={tool === 'select' ? 'dynamic' : 'none'}
            cursor={tool === 'select' ? 'move' : 'default'}
            onPointerDown={tool === 'select' ? (e: FederatedPointerEvent) => {
              e.stopPropagation();
              
              // Check if this is a right-click for context menu
              if (e.button === 2) {
                if (props.onGroupContextMenu) {
                  props.onGroupContextMenu(e, group.id);
                }
                return;
              }
              
              // Handle group selection - same approach as timeline
              const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
                (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;
              
              // Select the group directly (same as timeline)
              selectGroup(group, isMultiSelect);
              
              // Handle dragging if the group is already selected
              if (isGroupSelected && props.handleGroupSelectionDragStart) {
                // Create a virtual group element for dragging
                const virtualGroupElement: AnimatedCanvasObject = {
                  id: `group-${group.id}`,
                  type: 'rectangle',
                  name: group.name,
                  x: group.x,
                  y: group.y,
                  width: 100, // Will be calculated properly in the handler
                  height: 100,
                  rotation: group.rotation || 0,
                  fill: 'transparent',
                  stroke: '#2196F3',
                  strokeWidth: 2,
                  opacity: 1,
                  groupId: group.id,
                  animations: [],
                  zIndex: Math.max(...groupElements.map((el: AnimatedCanvasObject) => el.zIndex || 0))
                };
                
                props.handleGroupSelectionDragStart(virtualGroupElement, e.global.x, e.global.y, elements);
              }
            } : undefined}
            ref={(node) => {
              if (node) groupContainers.current[group.id] = node;
            }}
          >
            {/* Add a transparent hit area for the group container */}
            {tool === 'select' && (
              <pixiGraphics
                draw={(g) => {
                  g.clear();
                  // Calculate group bounds for hit area
                  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
                  
                  // Check if this is a polygon group (all elements are lines)
                  const isPolygonGroup = group.type === 'polygon' || groupElements.every(el => el.type === 'line');
                  
                  groupElements.forEach(el => {
                    if (isPolygonGroup && el.type === 'line' && el.lineOptions?.points) {
                      // For polygon groups, use the actual line endpoints
                      const { start, end } = el.lineOptions.points;
                      minX = Math.min(minX, start.x, end.x);
                      minY = Math.min(minY, start.y, end.y);
                      maxX = Math.max(maxX, start.x, end.x);
                      maxY = Math.max(maxY, start.y, end.y);
                    } else {
                      // For regular groups, use element bounds
                      const left = el.x - el.width / 2;
                      const right = el.x + el.width / 2;
                      const top = el.y - el.height / 2;
                      const bottom = el.y + el.height / 2;
                      
                      minX = Math.min(minX, left);
                      minY = Math.min(minY, top);
                      maxX = Math.max(maxX, right);
                      maxY = Math.max(maxY, bottom);
                    }
                  });
                  
                  const groupWidth = maxX - minX;
                  const groupHeight = maxY - minY;
                  const groupCenterX = (minX + maxX) / 2;
                  const groupCenterY = (minY + maxY) / 2;
                  
                  // Draw transparent hit area
                  g.rect(
                    groupCenterX - group.x - groupWidth / 2,
                    groupCenterY - group.y - groupHeight / 2,
                    groupWidth,
                    groupHeight
                  );
                  g.fill({ color: 0x000000, alpha: 0.01 }); // Nearly transparent
                }}
                interactive={true}
                eventMode="static"
                cursor="move"
                onPointerDown={(e: FederatedPointerEvent) => {
                  e.stopPropagation();
                  
                  // Check if this is a right-click for context menu
                  if (e.button === 2) {
                    if (props.onGroupContextMenu) {
                      props.onGroupContextMenu(e, group.id);
                    }
                    return;
                  }
                  
                  // Handle group selection
                  const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
                    (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;
                  
                  // Select the group directly (same as timeline)
                  selectGroup(group, isMultiSelect);
                  
                  // Handle dragging if the group is already selected
                  if (isGroupSelected && props.handleGroupSelectionDragStart) {
                    // Create a virtual group element for dragging
                    const virtualGroupElement: AnimatedCanvasObject = {
                      id: `group-${group.id}`,
                      type: 'rectangle',
                      name: group.name,
                      x: group.x,
                      y: group.y,
                      width: 100, // Will be calculated properly in the handler
                      height: 100,
                      rotation: group.rotation || 0,
                      fill: 'transparent',
                      stroke: '#2196F3',
                      strokeWidth: 2,
                      opacity: 1,
                      groupId: group.id,
                      animations: [],
                      zIndex: Math.max(...groupElements.map((el: AnimatedCanvasObject) => el.zIndex || 0))
                    };
                    
                    props.handleGroupSelectionDragStart(virtualGroupElement, e.global.x, e.global.y, elements);
                  }
                }}
              />
            )}
            
            {/* Render elements as children of the group container */}
            {groupElements.map((el: AnimatedCanvasObject) => {
              // Calculate element position relative to group center
              const relativeX = el.x - group.x;
              const relativeY = el.y - group.y;

              return (
                <pixiContainer
                  key={el.id}
                  x={relativeX}
                  y={relativeY}
                  pivot={{ x: 0, y: 0 }}
                  alpha={el.opacity ?? 1}
                  zIndex={el.zIndex || 0}
                  interactive={tool === 'select' || tool === 'draw'}
                  eventMode={tool === 'select' || tool === 'draw' ? 'dynamic' : 'none'}
                  hitArea={(() => {
                    if (el.type === 'line' && el.lineOptions?.points) {
                      // Calculate hit area based on actual line geometry
                      const { start, end } = el.lineOptions.points;
                      const startX = start.x - el.x;
                      const startY = start.y - el.y;
                      const endX = end.x - el.x;
                      const endY = end.y - el.y;

                      const minX = Math.min(startX, endX);
                      const maxX = Math.max(startX, endX);
                      const minY = Math.min(startY, endY);
                      const maxY = Math.max(startY, endY);

                      // Add some padding for easier interaction
                      const padding = 10;
                      return new Rectangle(
                        minX - padding,
                        minY - padding,
                        (maxX - minX) + (2 * padding),
                        (maxY - minY) + (2 * padding)
                      );
                    } else if (el.type === 'path' || el.type === 'image') {
                      return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                    } else if (el.type === 'text') {
                      // For text elements, use the element width consistently
                      const textWidth = el.width;
                      // Use a more generous height for text to accommodate wrapping
                      const textHeight = Math.max(el.height, 60); // Minimum 60px height for text
                      return new Rectangle(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
                    }
                    return undefined;
                  })()}
                  rotation={el.rotation || 0}
                  onPointerDown={tool === 'select' || tool === 'draw' ? (e: FederatedPointerEvent) => {
                    // If this element is part of a selected group, don't allow individual dragging
                    if (isGroupSelected) {
                      e.stopPropagation();
                      return;
                    }
                    // handleElementPointerDown(el.id, el.x, el.y)(e);
                  } : undefined}
                  onPointerUp={tool === 'select' || tool === 'draw' ? handlePointerUp : undefined}
                  onPointerUpOutside={tool === 'select' || tool === 'draw' ? handlePointerUp : undefined}
                  onPointerOver={tool === 'select' || tool === 'draw' ? handleElementMouseMove(el.id) : undefined}
                  onPointerOut={tool === 'select' || tool === 'draw' ? handleElementMouseLeave(el.id) : undefined}

                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[el.id] = node;
                      // Apply shadow when container is created (skip for text elements as they have their own drop shadow)
                      if (el.type !== 'text') {
                        applyShadowToContainer(node, el);
                      }
                    }
                  }}
                >
                  <pixiGraphics draw={(g) => drawShape(g, el)} />

                  {/* Render text separately for text elements */}
                  {el.type === 'text' && (
                    <RichTextRenderer key={`group-text-${el.id}`} element={el} isEditing={false} />
                  )}
                </pixiContainer>
              );
            })}
          </pixiContainer>
        );
      })}

      {/* Render elements that are not in any groups OR are in default groups */}
      {elements
        .filter((el: AnimatedCanvasObject) => {
          const group = groups.find(g => g.id === el.groupId);
          // Render elements that are not in any group OR are in default groups
          // This ensures elements in default groups are rendered in the ungrouped section
          return (!group || group.isDefaultGroup) && (el.visible !== false);
        })
        .map((el: AnimatedCanvasObject) => {
          // Handle all element types consistently, including SVGs
                  return (
          <pixiContainer
            key={el.id}
            x={el.x}
            y={el.y}
            pivot={{ x: 0, y: 0 }}
            alpha={el.opacity ?? 1}
            zIndex={el.zIndex || 0}
            interactive={tool === 'select' || tool === 'draw'}
            eventMode={tool === 'select' || tool === 'draw' ? 'dynamic' : 'none'}
              hitArea={(() => {
                if (el.type === 'line' && el.lineOptions?.points) {
                  // Calculate hit area based on actual line geometry
                  const { start, end } = el.lineOptions.points;
                  const startX = start.x - el.x;
                  const startY = start.y - el.y;
                  const endX = end.x - el.x;
                  const endY = end.y - el.y;

                  const minX = Math.min(startX, endX);
                  const maxX = Math.max(startX, endX);
                  const minY = Math.min(startY, endY);
                  const maxY = Math.max(startY, endY);

                  // Add some padding for easier interaction
                  const padding = 10;
                  return new Rectangle(
                    minX - padding,
                    minY - padding,
                    (maxX - minX) + (2 * padding),
                    (maxY - minY) + (2 * padding)
                  );
                } else if (el.type === 'path' || el.type === 'image') {
                  return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                } else if (el.type === 'text') {
                  // For text elements, use the element width consistently
                  const textWidth = el.width;
                  // Use a more generous height for text to accommodate wrapping
                  const textHeight = Math.max(el.height, 60); // Minimum 60px height for text
                  return new Rectangle(-textWidth / 2, -textHeight / 2, textWidth, textHeight);
                }
                return undefined;
              })()}
              rotation={el.rotation || 0}
              onPointerDown={tool === 'select' || tool === 'draw' ? (e: FederatedPointerEvent) => {
                // Check if this element is part of a selected group
                const elementGroup = groups.find(g => g.id === el.groupId && !g.isDefaultGroup);
                if (elementGroup) {
                  const groupElements = elements.filter(groupEl => groupEl.groupId === elementGroup.id);
                  const isGroupSelected = selectedIds.some(id => groupElements.some(groupEl => groupEl.id === id));
                  if (isGroupSelected) {
                    e.stopPropagation();
                    return;
                  }
                }
                // handleElementPointerDown(el.id, el.x, el.y)(e);
              } : undefined}
              onPointerUp={tool === 'select' || tool === 'draw' ? handlePointerUp : undefined}
              onPointerUpOutside={tool === 'select' || tool === 'draw' ? handlePointerUp : undefined}
              onPointerOver={tool === 'select' || tool === 'draw' ? handleElementMouseMove(el.id) : undefined}
              onPointerOut={tool === 'select' || tool === 'draw' ? handleElementMouseLeave(el.id) : undefined}

              ref={(node) => {
                if (node) {
                  shapeRefs.current[el.id] = node;
                  // Apply shadow when container is created (skip for text elements as they have their own drop shadow)
                  if (el.type !== 'text') {
                    applyShadowToContainer(node, el);
                  }
                }
              }}
            >
              <pixiGraphics draw={(g) => drawShape(g, el)} />

              {/* Render text separately for text elements */}
              {el.type === 'text' && (
                <RichTextRenderer key={`ungrouped-text-${el.id}`} element={el} isEditing={false} />
              )}
            </pixiContainer>
          );
        })}

      {/* Drawing preview layer */}
      {tool === 'draw' && (
        <pixiGraphics
          ref={drawingRef}
          zIndex={1000}
          draw={(g) => {
            g.clear();
            if (currentPath.length > 1) {
              g.moveTo(currentPath[0].x, currentPath[0].y);
              currentPath.slice(1).forEach(point => {
                g.lineTo(point.x, point.y);
              });
              g.stroke({
                width: 2,
                color: 0x000000,
                alpha: 1,
                cap: 'round',
                join: 'round'
              });
            }
          }}
        />
      )}
    </pixiContainer>
  );
}; 