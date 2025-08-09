import React, { useRef, useEffect } from 'react';
import { extend } from '@pixi/react';
import { SnapGuides } from './snap-guides';
import { LinePreview } from '../helpers/line-preview';
import { RichTextRenderer } from '../helpers/rich-text-renderer';
import type { SnapGuide } from '../../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { Rectangle, Graphics, Container } from 'pixi.js';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import ElementSelect from '../selection/element-select';
import HoverOutline from './hover-outline';
import CenterHighlight from './center-highlight';
import RotationHandles from '../selection/rotation-handles';
import ResizeHandles from '../selection/resize-handles';
import ResizeHandle from '../selection/resize-handle';
import RadiusHandles from '../selection/radius-handles';
import CurveHandle from '../selection/curve-handle';
import { GroupSelection } from '../selection/group-selection';

import { useCanvasState } from '@/stores/use-ui-store';
import { useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useResponsiveCanvasPosition } from '@/hooks/use-responsive-canvas-position';
import { useElementDragging } from '@/hooks/use-element-dragging';
import { useElementPointerHandlers } from '@/hooks/use-element-pointer-handlers';

// Extend PIXI components for React
extend({ Container, Graphics });

interface DesignCanvasProps {
  dimensions: { width: number; height: number };
  snapGuides?: SnapGuide[];
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
  // Snapping handlers
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSnapPoint?: (point: { x: number; y: number }, event?: { shiftKey?: boolean }) => { x: number; y: number };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
  // Context menu handlers
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
  // Shift key state for constrained drawing
  shiftKey?: boolean;
  // Snapping state for alignment guides
  isSnappingEnabled?: boolean;
}

export const DesignCanvas = (props: DesignCanvasProps) => {
  // Get isPlaying state directly from timeline store
  const isPlaying = useTimelineStore(state => state.playback.isPlaying);
  
  // Get selection store functions
  const { selectGroup } = useSelectionStore();

  const {
    snapGuides = [],
    elements,
    groups,
    selectedIds,
    hoveredId,
    editingTextId,
    tool,
    isPathMode,
    animationTarget,
    lineStartPoint,
    isLineChaining,
    chainedLineIds,
    mousePos,
    currentPath,
    shapeRefs,
    groupContainers,
    drawingRef,
    canvasScaleFactor,
    handlePointerUp,
    handleElementMouseMove,
    handleElementMouseLeave,
    onPathStartClick,
    handleGroupSelectionDragStart,
    isElementInCustomOrPolygonGroup,
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

  // Use element dragging hook
  const {
    setupGlobalEventListeners,
    startDragging,
    startEndpointDragging,
  } = useElementDragging({
    elements,
    moveElement,
    moveMultipleElements,
    updateElement,
    onSnapElement: props.onSnapElement,
    onSnapPoint: props.onSnapPoint,
    onSetSnapGuides: props.onSetSnapGuides,
    onClearSnapGuides: props.onClearSnapGuides,
  });

  // Use element pointer handlers hook
  const {
    handleElementPointerDown,
    handleElementPointerMove,
    handleElementPointerUp,
  } = useElementPointerHandlers({
    tool,
    isLineChaining,
    lineStartPoint,
    elements,
    selectedIds,
    selectElement,
    handleCanvasClick: props.handleCanvasClick,
    handleCanvasPointerDown: props.handleCanvasPointerDown,
    startDragging,
    startEndpointDragging,
    onElementContextMenu: props.onElementContextMenu,
    onGroupContextMenu: props.onGroupContextMenu,
  });

  // Set up global event listeners for element dragging
  useEffect(() => {
    return setupGlobalEventListeners();
  }, [setupGlobalEventListeners]);

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
      onPointerMove={(e: FederatedPointerEvent) => {
        // Call the element pointer move handler for drag detection
        handleElementPointerMove(e);
        // Call the canvas pointer move handler for drawing and other interactions
        props.handleCanvasPointerMove(e);
      }}
      onPointerUp={() => {
        // Clear the drag flag when pointer up occurs
        // hasDraggedRef.current = false; // Removed
        // Call the element pointer up handler
        handleElementPointerUp();
        // Call the canvas pointer up handler
        props.handlePointerUp();
      }}
      onPointerUpOutside={() => {
        // Clear the drag flag when pointer up occurs
        // hasDraggedRef.current = false; // Removed
        // Call the element pointer up handler
        handleElementPointerUp();
        // Call the canvas pointer up handler
        props.handlePointerUp();
      }}
      onClick={(e: FederatedPointerEvent) => {
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
    >
      {/* Canvas frame background - positioned in center */}
      <pixiGraphics
        zIndex={-1}
        draw={(g) => {
          g.clear();
          g.roundRect(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight, 14);
          g.fill({ color: 0xFFFFFF, alpha: 1 });
          // Always use the default border color
          g.stroke({ color: 0xE2E8F0, width: 1 });
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
                    handleElementPointerDown(el.id, el.x, el.y)(e);
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
                  {el.type === 'text' && editingTextId !== el.id && (
                    <RichTextRenderer key={`group-text-${el.id}`} element={el} isEditing={false} />
                  )}

                  {/* Show hover outline when hovered but not selected */}
                  {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isElementInCustomOrPolygonGroup(el) && (
                    <HoverOutline element={el} />
                  )}

                  {/* Show selection outline for elements only if they're not part of a selected group */}
                  {!isPlaying && selectedIds.includes(el.id) && !isElementInCustomOrPolygonGroup(el) && !isGroupSelected && (
                    <ElementSelect
                      element={el}
                      scaleFactor={canvasScaleFactor.current}
                    />
                  )}
                </pixiContainer>
              );
            })}
          </pixiContainer>
        );
      })}

      {/* Render group outlines for selected groups */}
      {!isPlaying && groups.filter(group => (group.visible !== false) && !group.isDefaultGroup).map((group) => {
        const groupElements = elements.filter((el: AnimatedCanvasObject) => el.groupId === group.id && (el.visible !== false));
        const isGroupSelected = selectedIds.some(id => groupElements.some(el => el.id === id));
        
        if (!isGroupSelected) return null;
        
        // Calculate group bounds
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
        
        // Create virtual group element for outline
        const virtualGroupElement: AnimatedCanvasObject = {
          id: `group-outline-${group.id}`,
          type: 'rectangle',
          name: group.name,
          x: groupCenterX,
          y: groupCenterY,
          width: groupWidth,
          height: groupHeight,
          rotation: group.rotation || 0,
          fill: 'transparent',
          stroke: '#2196F3',
          strokeWidth: 2,
          opacity: group.opacity ?? 1,
          groupId: group.id,
          animations: [],
          cornerRadius: 0
        };
        
        return (
          <React.Fragment key={`group-outline-${group.id}`}>
            <pixiContainer
              x={groupCenterX}
              y={groupCenterY}
              rotation={group.rotation || 0}
              zIndex={2000}
            >
              <ElementSelect
                element={virtualGroupElement}
                scaleFactor={canvasScaleFactor.current}
              />
            </pixiContainer>
            
            {/* Resize handles for group */}
            <ResizeHandle
              elementX={groupCenterX}
              elementY={groupCenterY}
              elementWidth={groupWidth}
              elementHeight={groupHeight}
              elementRotation={group.rotation || 0}
              corner="tl"
              elementId={`group-outline-${group.id}`}
            />
            <ResizeHandle
              elementX={groupCenterX}
              elementY={groupCenterY}
              elementWidth={groupWidth}
              elementHeight={groupHeight}
              elementRotation={group.rotation || 0}
              corner="tr"
              elementId={`group-outline-${group.id}`}
            />
            <ResizeHandle
              elementX={groupCenterX}
              elementY={groupCenterY}
              elementWidth={groupWidth}
              elementHeight={groupHeight}
              elementRotation={group.rotation || 0}
              corner="bl"
              elementId={`group-outline-${group.id}`}
            />
            <ResizeHandle
              elementX={groupCenterX}
              elementY={groupCenterY}
              elementWidth={groupWidth}
              elementHeight={groupHeight}
              elementRotation={group.rotation || 0}
              corner="br"
              elementId={`group-outline-${group.id}`}
            />
          </React.Fragment>
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
                handleElementPointerDown(el.id, el.x, el.y)(e);
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
              {el.type === 'text' && editingTextId !== el.id && (
                <RichTextRenderer key={`ungrouped-text-${el.id}`} element={el} isEditing={false} />
              )}

              {/* Show hover outline when hovered but not selected */}
              {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isElementInCustomOrPolygonGroup(el) && (
                <HoverOutline element={el} />
              )}

              {/* Show selection outline for elements only if they're not part of a selected group */}
              {!isPlaying && selectedIds.includes(el.id) && !isElementInCustomOrPolygonGroup(el) && (() => {
                // Check if this element is part of a selected group
                const elementGroup = groups.find(g => g.id === el.groupId && !g.isDefaultGroup);
                if (elementGroup) {
                  const groupElements = elements.filter(groupEl => groupEl.groupId === elementGroup.id);
                  const isGroupSelected = selectedIds.some(id => groupElements.some(groupEl => groupEl.id === id));
                  return !isGroupSelected; // Only show outline if group is not selected
                }
                return true; // Show outline for ungrouped elements
              })() && (
                <ElementSelect
                  element={el}
                  scaleFactor={canvasScaleFactor.current}
                />
              )}

              {/* Show center highlight when in path mode and this element is the animation target */}
              {isPathMode && animationTarget && animationTarget.elementId === el.id && (
                <CenterHighlight
                  isVisible={true}
                  onCenterClick={() => {
                    if (onPathStartClick) {
                      onPathStartClick(el.id, el.x, el.y);
                    }
                  }}
                />
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

      {/* Line preview layer */}
      <pixiContainer zIndex={1001}>
        <LinePreview
          tool={tool}
          lineStartPoint={lineStartPoint}
          mousePos={mousePos}
          isLineChaining={isLineChaining}
          chainedLineIds={chainedLineIds}
          elements={elements}
          canvasContainerRef={containerRef}
          shiftKey={shiftKey}
          canvasWidth={canvasFrameWidth}
          canvasHeight={canvasFrameHeight}
          isSnappingEnabled={isSnappingEnabled}
        />
      </pixiContainer>

      {/* Element handles - only for single selection and when not playing animations */}
      {!isPlaying && selectedIds.length === 1 && selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);

        if (!selectedElement) return null;

        return (
          <React.Fragment key={`handles-${selectedId}`}>
            {/* Resize Handles */}
            <pixiContainer zIndex={2000}>
              <ResizeHandles element={selectedElement} />
            </pixiContainer>

            {/* Radius Handles */}
            <pixiContainer zIndex={2001}>
              <RadiusHandles
                element={selectedElement}
                scaleFactor={canvasScaleFactor.current}
              />
            </pixiContainer>

            {/* Curve Handle - only for line elements */}
            <pixiContainer zIndex={2002}>
              <CurveHandle
                element={selectedElement}
                onControlPointDrag={(x, y) => {
                  const controlPointEvent = new CustomEvent('line-control-point-drag', {
                    detail: {
                      id: selectedId,
                      x,
                      y
                    }
                  });
                  window.dispatchEvent(controlPointEvent);
                }}
              />
            </pixiContainer>
          </React.Fragment>
        );
      })}

      {/* Group selection for multiple selected elements */}
      {!isPlaying && selectedIds.length > 1 && (() => {
        // Check if this is a group selection
        const selectedGroupIds = new Set();
        const elementsInGroups = selectedIds.filter(id => {
          const element = elements.find(el => el.id === id);
          if (element?.groupId) {
            const group = groups.find(g => g.id === element.groupId && !g.isDefaultGroup);
            if (group) {
              selectedGroupIds.add(group.id);
              return true;
            }
          }
          return false;
        });
        
        // If all selected elements are part of the same group, don't show group selection outline
        // (groups will show their own group selection outlines)
        if (selectedGroupIds.size === 1 && elementsInGroups.length === selectedIds.length) {
          return null;
        }
        
        // Get the selected elements
        const selectedElements = selectedIds
          .map(id => elements.find(el => el.id === id))
          .filter((el): el is AnimatedCanvasObject => el !== undefined);
        
        if (selectedElements.length === 0) return null;
        
        return (
          <pixiContainer zIndex={2002}>
            <GroupSelection
              selectedElements={selectedElements}
              scaleFactor={canvasScaleFactor.current}
              onGroupDragStart={handleGroupSelectionDragStart}
              allElements={elements}
              groups={groups}
            />
          </pixiContainer>
        );
      })()}

      {/* Rotation handles OUTSIDE the rotating containers (only for single selection and when not playing animations) */}
      {!isPlaying && selectedIds.length === 1 && (() => {
        const firstSelectedId = selectedIds[0];
        const selectedElement = elements.find(el => el.id === firstSelectedId);

        if (!selectedElement || selectedElement.type === 'line' || selectedElement.type === 'path') {
          return null;
        }

        return (
          <pixiContainer zIndex={2003}>
            <RotationHandles
              element={selectedElement}
              onRotate={(newRotation) => {
                const rotationEvent = new CustomEvent('element-rotation-change', {
                  detail: {
                    id: firstSelectedId,
                    rotation: newRotation
                  }
                });
                window.dispatchEvent(rotationEvent);
              }}
            />
          </pixiContainer>
        );
      })()}

      {/* Snap guides - positioned relative to the design canvas frame */}
      <pixiContainer zIndex={3000}>
        <SnapGuides
          guides={snapGuides}
          canvasWidth={canvasFrameWidth}
          canvasHeight={canvasFrameHeight}
          canvasFrameX={-canvasFrameWidth / 2}
          canvasFrameY={-canvasFrameHeight / 2}
        />
      </pixiContainer>
    </pixiContainer>
  );
}; 