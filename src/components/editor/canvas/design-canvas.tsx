import React, { useRef, useEffect } from 'react';
import { SnapGuides } from './snap-guides';
import { LinePreview } from './line-preview';
import type { SnapGuide } from '../../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { Rectangle, Graphics, Container } from 'pixi.js';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import ElementSelect from './element-select';
import HoverOutline from './hover-outline';
import CenterHighlight from './center-highlight';
import RotationHandles from './rotation-handles';
import ResizeHandles from './resize-handles';
import RadiusHandles from './radius-handles';
import { AnimatedTextGroup } from './animated-text-group';
import { GroupSelection } from './group-selection';
import { useCanvasState } from '@/stores/use-ui-store';
import { useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useResponsiveCanvasPosition } from '@/hooks/use-responsive-canvas-position';
import { useElementDragging } from '@/hooks/use-element-dragging';
import { useElementPointerHandlers } from '@/hooks/use-element-pointer-handlers';

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
  isTextGroupCharacter: (element: AnimatedCanvasObject) => boolean;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
  // Snapping handlers
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSnapPoint?: (point: { x: number; y: number }, event?: { shiftKey?: boolean }) => { x: number; y: number };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
}

export const DesignCanvas = (props: DesignCanvasProps) => {
  // Get isPlaying state directly from timeline store
  const isPlaying = useTimelineStore(state => state.playback.isPlaying);

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
    isTextGroupCharacter,
    isElementInCustomOrPolygonGroup,
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
    isTextGroupCharacter,
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
      hitArea={new Rectangle(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight)}
      ref={(container) => {
        containerRef.current = container;
      }}
      onPointerDown={(e: FederatedPointerEvent) => {
        // Only call canvas click handler if no element was clicked
        // This prevents deselection when clicking on elements
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

        // Always call canvas click handler for shape creation, even when locked
        if (!hitElement) {
          props.handleCanvasClick(e);
        }
      }}
      onPointerMove={(e: FederatedPointerEvent) => {
        // Call the canvas pointer move handler for drawing and other interactions
        props.handleCanvasPointerMove(e);

      }}
      onPointerUp={() => {
        // Call the canvas pointer up handler
        props.handlePointerUp();
      }}
      onPointerUpOutside={() => {
        // Call the canvas pointer up handler
        props.handlePointerUp();
      }}
      onClick={(e: FederatedPointerEvent) => {
        console.log('[DesignCanvas] onClick called', { x: e.global.x, y: e.global.y });
        // Only call canvas click handler if no element was clicked
        // This prevents deselection when clicking on elements
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

        // Only call canvas click handler if no element was hit
        if (!hitElement) {
          props.handleCanvasClick(e);
        }
      }}
    >


      {/* Canvas frame background - positioned in center */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight);
          g.fill({ color: 0xFFFFFF, alpha: 1 });
          // Always use the default border color
          g.stroke({ color: 0xE2E8F0, width: 1 });
        }}
        interactive={false}
        eventMode="none"
      />

      {/* Render group containers first */}
      {groups.filter(group => !group.isDefaultGroup && (group.visible !== false)).map((group) => {
        const groupElements = elements.filter(el => el.groupId === group.id && (el.visible !== false));

        return (
          <pixiContainer
            key={`group-${group.id}`}
            x={group.x}
            y={group.y}
            rotation={(group.rotation || 0) * Math.PI / 180}
            ref={(node) => {
              if (node) groupContainers.current[group.id] = node;
            }}
          >
            {/* Render elements as children of the group container */}
            {groupElements.map((el) => {
              // Calculate element position relative to group center
              const relativeX = el.x - group.x;
              const relativeY = el.y - group.y;

              return (
                <pixiContainer
                  key={el.id}
                  x={relativeX}
                  y={relativeY}
                  pivot={{ x: 0, y: 0 }}
                  interactive={true}
                  eventMode="dynamic"
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
                    }
                    return undefined;
                  })()}
                  rotation={el.rotation || 0}
                  onPointerDown={handleElementPointerDown(el.id, el.x, el.y)}
                  onPointerUp={handlePointerUp}
                  onPointerUpOutside={handlePointerUp}
                  onPointerOver={handleElementMouseMove(el.id)}
                  onPointerOut={handleElementMouseLeave(el.id)}
                  ref={(node) => {
                    if (node) {
                      shapeRefs.current[el.id] = node;
                      // Apply shadow when container is created
                      applyShadowToContainer(node, el);
                    }
                  }}
                >
                  <pixiGraphics draw={(g) => drawShape(g, el)} />

                  {/* Render text separately for text elements */}
                  {el.type === 'text' && editingTextId !== el.id && (
                    <pixiText
                      text={el.text || 'Text'}
                      anchor={{ x: 0, y: 0 }}
                      x={-el.width / 2 + 8}
                      y={-el.height / 2 + 8}
                      alpha={el.opacity ?? 1}
                      style={{
                        fontFamily: el.fontFamily || 'Arial, sans-serif',
                        fontSize: el.fontSize || 16,
                        fontWeight: (el.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
                        fontStyle: (el.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
                        fill: el.fill || '#000000',
                        align: (el.textAlign as 'left' | 'center' | 'right') || 'left',
                        lineHeight: el.lineHeight || 1.2,
                        wordWrap: true,
                        wordWrapWidth: el.width - 16,
                      }}
                    />
                  )}

                  {/* Render individual characters for character elements */}
                  {el.type === 'character' && (
                    <pixiText
                      text={el.character || el.text || ' '}
                      anchor={{ x: 0.5, y: 0.5 }}
                      x={0}
                      y={0}
                      alpha={el.opacity ?? 1}
                      style={{
                        fontFamily: el.fontFamily || 'Arial, sans-serif',
                        fontSize: el.fontSize || 16,
                        fontWeight: (el.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
                        fontStyle: (el.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
                        fill: el.fill || '#000000',
                        align: 'center',
                      }}
                    />
                  )}

                  {/* Render textGroup elements using AnimatedTextGroup component */}
                  {el.type === 'textGroup' && editingTextId !== el.id && (
                    <AnimatedTextGroup element={el} />
                  )}

                  {/* Show hover outline when hovered but not selected (but not for textgroup characters or elements in custom/polygon groups) */}
                  {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
                    <HoverOutline element={el} />
                  )}

                  {/* Show selection outline for all selected elements (but not for textgroup characters or elements in custom/polygon groups) */}
                  {!isPlaying && selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
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

      {/* Render elements that are not in custom groups */}
      {elements.filter(el => {
        const group = groups.find(g => g.id === el.groupId);
        return (!group || group.isDefaultGroup) && (el.visible !== false);
      }).map((el) => {
        // Handle all element types consistently, including SVGs
        return (
          <pixiContainer
            key={el.id}
            x={el.x}
            y={el.y}
            pivot={{ x: 0, y: 0 }}
            interactive={true}
            eventMode="dynamic"
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
              }
              return undefined;
            })()}
            rotation={el.rotation || 0}
            onPointerDown={handleElementPointerDown(el.id, el.x, el.y)}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
            onPointerOver={handleElementMouseMove(el.id)}
            onPointerOut={handleElementMouseLeave(el.id)}
            ref={(node) => {
              if (node) {
                shapeRefs.current[el.id] = node;
                // Apply shadow when container is created
                applyShadowToContainer(node, el);
              }
            }}
          >
            <pixiGraphics draw={(g) => drawShape(g, el)} />

            {/* Render text separately for text elements */}
            {el.type === 'text' && editingTextId !== el.id && (
              <pixiText
                text={el.text || 'Text'}
                anchor={{ x: 0, y: 0 }}
                x={-el.width / 2 + 8}
                y={-el.height / 2 + 8}
                alpha={el.opacity ?? 1}
                style={{
                  fontFamily: el.fontFamily || 'Arial, sans-serif',
                  fontSize: el.fontSize || 16,
                  fontWeight: (el.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
                  fontStyle: (el.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
                  fill: el.fill || '#000000',
                  align: (el.textAlign as 'left' | 'center' | 'right') || 'left',
                  lineHeight: el.lineHeight || 1.2,
                  wordWrap: true,
                  wordWrapWidth: el.width - 16,
                }}
              />
            )}

            {/* Render individual characters for character elements */}
            {el.type === 'character' && (
              <pixiText
                text={el.character || el.text || ' '}
                anchor={{ x: 0.5, y: 0.5 }}
                x={0}
                y={0}
                alpha={el.opacity ?? 1}
                style={{
                  fontFamily: el.fontFamily || 'Arial, sans-serif',
                  fontSize: el.fontSize || 16,
                  fontWeight: (el.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
                  fontStyle: (el.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
                  fill: el.fill || '#000000',
                  align: 'center',
                }}
              />
            )}

            {/* Render textGroup elements using AnimatedTextGroup component */}
            {el.type === 'textGroup' && editingTextId !== el.id && (
              <AnimatedTextGroup element={el} />
            )}

            {/* Show hover outline when hovered but not selected (but not for textgroup characters or elements in custom/polygon groups) */}
            {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
              <HoverOutline element={el} />
            )}

            {/* Show selection outline for all selected elements (but not for textgroup characters or elements in custom/polygon groups) */}
            {!isPlaying && selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
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
          draw={(g) => {
            g.clear();
            if (currentPath.length > 1) {
              g.moveTo(currentPath[0].x + centerX, currentPath[0].y + centerY);
              currentPath.slice(1).forEach(point => {
                g.lineTo(point.x + centerX, point.y + centerY);
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
      <LinePreview
        tool={tool}
        lineStartPoint={lineStartPoint}
        mousePos={mousePos}
        isLineChaining={isLineChaining}
        chainedLineIds={chainedLineIds}
        elements={elements}
        centerX={centerX}
        centerY={centerY}
        canvasContainerRef={containerRef}
      />

      {/* Element handles - only for single selection and when not playing animations */}
      {!isPlaying && selectedIds.length === 1 && selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);
        
        if (!selectedElement) return null;

        return (
          <React.Fragment key={`handles-${selectedId}`}>
            {/* Resize Handles */}
            <ResizeHandles element={selectedElement} />
            
            {/* Radius Handles */}
            <RadiusHandles 
              element={selectedElement} 
              scaleFactor={canvasScaleFactor.current} 
            />
          </React.Fragment>
        );
      })}

      {/* Multi-selection rectangle for multiple selected elements */}
      {!isPlaying && selectedIds.length > 1 && (
        <GroupSelection
          selectedElements={elements.filter(el => selectedIds.includes(el.id))}
          scaleFactor={canvasScaleFactor.current}
          onGroupDragStart={handleGroupSelectionDragStart}
          allElements={elements}
          groups={groups}
        />
      )}

      {/* Rotation handles OUTSIDE the rotating containers (only for single selection and when not playing animations) */}
      {!isPlaying && selectedIds.length === 1 && (() => {
        const firstSelectedId = selectedIds[0];
        const selectedElement = elements.find(el => el.id === firstSelectedId);

        if (!selectedElement || selectedElement.type === 'line' || selectedElement.type === 'path') {
          return null;
        }

        return (
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
        );
      })()}

      {/* Snap guides - positioned relative to the design canvas frame */}
      <SnapGuides
        guides={snapGuides}
        canvasWidth={canvasFrameWidth}
        canvasHeight={canvasFrameHeight}
        canvasFrameX={-canvasFrameWidth / 2}
        canvasFrameY={-canvasFrameHeight / 2}
      />
    </pixiContainer>
  );
}; 