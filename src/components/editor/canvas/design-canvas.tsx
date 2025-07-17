import React, { useRef } from 'react';
import { GridOverlay } from './grid-overlay';
import { SnapGuides } from './snap-guides';
import type { GridConfig } from '../../../utils/grid-utils';
import type { SnapGuide } from '../../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { Rectangle, Graphics, Container } from 'pixi.js';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import ElementSelect from './element-select';
import HoverOutline from './hover-outline';
import CenterHighlight from './center-highlight';
import RotationHandles from './rotation-handles';
import ResizeHandle from './resize-handle';
import RadiusHandle from './radius-handle';
import { AnimatedTextGroup } from './animated-text-group';
import { GroupSelection } from './group-selection';
import { useCanvasState } from '@/stores/use-ui-store';

interface DesignCanvasProps {
  dimensions: { width: number; height: number };
  gridConfig?: GridConfig;
  snapGuides?: SnapGuide[];
  // Canvas state and operations
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedIds: string[];
  hoveredId: string | null;
  isPlaying: boolean;
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
  handleGroupSelectionDragStart: (virtualElement: AnimatedCanvasObject, mouseX: number, mouseY: number, allElements?: AnimatedCanvasObject[], gridConfig?: GridConfig) => void;
  // Helper functions
  isTextGroupCharacter: (element: AnimatedCanvasObject) => boolean;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
}

export const DesignCanvas = (props: DesignCanvasProps) => {
  const { 
    gridConfig, 
    snapGuides = [],
    elements,
    groups,
    selectedIds,
    hoveredId,
    isPlaying,
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
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handlePointerUp,
    handleSelectElement,
    handleCanvasClick,
    handlePointerDown,
    handleElementMouseMove,
    handleElementMouseLeave,
    onPathStartClick,
    handleGroupSelectionDragStart,
    isTextGroupCharacter,
    isElementInCustomOrPolygonGroup
  } = props;

  // Get canvas size from UI store
  const canvasState = useCanvasState();
  
  // Get current canvas size
  const currentSize = canvasState.currentSizeId === 'custom' 
    ? canvasState.customSize 
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  // Use current canvas size or fallback to default
  const canvasFrameWidth = currentSize?.width || 1280;
  const canvasFrameHeight = currentSize?.height || 720;
  
  // Center position for the design canvas in world coordinates
  const centerX = (canvasFrameWidth * 3) / 2;
  const centerY = (canvasFrameHeight * 3) * 0.207; // Ratio to position close to (1875, 693)

  // Debug logging
  console.log('Design Canvas Debug:', {
    canvasFrameWidth,
    canvasFrameHeight,
    centerX,
    centerY,
    applicationDimensions: props.dimensions
  });

  // Drag state refs
  const isDragging = useRef(false);
  const dragData = useRef<FederatedPointerEvent['data'] | null>(null);

  return (
    <pixiContainer 
      x={centerX} 
      y={centerY}
      interactive={true}
      eventMode="static"
      ref={(container) => {
        if (container) {
          console.log('Design Canvas container position:', {
            x: container.x,
            y: container.y,
            centerX,
            centerY
          });
        }
      }}
      onPointerDown={(e: FederatedPointerEvent) => {
        console.log('Design Canvas clicked at:', e.global);
        console.log('Design Canvas position:', { x: centerX, y: centerY });
        console.log('Design Canvas drag start at:', e.global);
        isDragging.current = true;
        dragData.current = e.data;
      }}
      onPointerMove={(e: FederatedPointerEvent) => {
        if (isDragging.current && dragData.current) {
          const container = e.currentTarget as Container;
          const newPosition = dragData.current.getLocalPosition(container.parent);
          container.x = newPosition.x;
          container.y = newPosition.y;
          console.log('Design Canvas dragged to:', { x: container.x, y: container.y });
        }
      }}
      onPointerUp={(e: FederatedPointerEvent) => {
        if (isDragging.current) {
          const container = e.currentTarget as Container;
          console.log('Design Canvas drag end at:', { x: container.x, y: container.y });
          isDragging.current = false;
          dragData.current = null;
        }
      }}
      onPointerUpOutside={(e: FederatedPointerEvent) => {
        if (isDragging.current) {
          const container = e.currentTarget as Container;
          console.log('Design Canvas drag end outside at:', { x: container.x, y: container.y });
          isDragging.current = false;
          dragData.current = null;
        }
      }}
    >
      {/* Grid overlay */}
      {gridConfig && (
        <GridOverlay
          gridConfig={gridConfig}
          viewportBounds={{
            x: -canvasFrameWidth / 2,
            y: -canvasFrameHeight / 2,
            width: canvasFrameWidth,
            height: canvasFrameHeight
          }}
        />
      )}

      {/* Snap guides */}
      <SnapGuides
        guides={snapGuides}
        canvasWidth={canvasFrameWidth}
        canvasHeight={canvasFrameHeight}
      />

      {/* Canvas frame background - positioned in center */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight);
          g.fill({ color: 0xFFFFFF, alpha: 1 });
          // Add a subtle border to show the canvas boundaries
          g.stroke({ color: 0xE2E8F0, width: 1 });
        }}
        interactive={false}
        eventMode="none"
      />

      {/* Interactive layer for the canvas frame */}
      <pixiGraphics
        draw={(g) => {
          g.clear();
          g.rect(-canvasFrameWidth / 2, -canvasFrameHeight / 2, canvasFrameWidth, canvasFrameHeight);
          g.fill({ color: 0xFFFFFF, alpha: 0 });
        }}
        interactive={true}
        eventMode="static"
        onPointerDown={(e: FederatedPointerEvent) => {
          if (tool === 'draw') {
            handleCanvasPointerDown(e);
          } else {
            handleSelectElement(null);
            handleCanvasClick(e);
          }
        }}
        onPointerMove={handleCanvasPointerMove}
        onPointerUp={handlePointerUp}
        onPointerUpOutside={handlePointerUp}
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
                  onPointerDown={handlePointerDown(el.id, el.x, el.y)}
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
            onPointerDown={handlePointerDown(el.id, el.x, el.y)}
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
      {(tool === 'line' || tool === 'simpleLine') && lineStartPoint && mousePos && (
        <pixiGraphics
          eventMode="none"
          draw={(g) => {
            g.clear();

            // Check if we're in chaining mode and if mouse is near a point that can close the shape
            let canCloseShape = false;
            let snapToPoint = mousePos;

            if (isLineChaining && chainedLineIds.length > 0) {
              // Find the first line in the chain by its ID
              const firstLineId = chainedLineIds[0];
              const firstLine = elements.find(el => el.id === firstLineId);
              
              if (firstLine?.lineOptions?.points?.start) {
                const originalStartPoint = firstLine.lineOptions.points.start;
                const distanceToOriginalStart = Math.hypot(mousePos.x - originalStartPoint.x, mousePos.y - originalStartPoint.y);

                // Use same threshold as closing logic - 30px for easier polygon closing
                if (distanceToOriginalStart <= 30) {
                  canCloseShape = true;
                  snapToPoint = originalStartPoint;
                }
              }
            }

            // Manually draw dotted line for better control
            const dx = snapToPoint.x - lineStartPoint.x;
            const dy = snapToPoint.y - lineStartPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const dashLength = 8;
            const gapLength = 4;
            const totalDashLength = dashLength + gapLength;
            const numDashes = Math.floor(distance / totalDashLength);

            for (let i = 0; i <= numDashes; i++) {
              const startRatio = (i * totalDashLength) / distance;
              const endRatio = Math.min((i * totalDashLength + dashLength) / distance, 1);

              const startX = lineStartPoint.x + dx * startRatio + centerX;
              const startY = lineStartPoint.y + dy * startRatio + centerY;
              const endX = lineStartPoint.x + dx * endRatio + centerX;
              const endY = lineStartPoint.y + dy * endRatio + centerY;

              g.moveTo(startX, startY);
              g.lineTo(endX, endY);
              g.stroke({
                width: 2,
                color: canCloseShape ? 0x4CAF50 : 0x888888, // Green when can close shape
                alpha: 0.7,
                cap: 'round'
              });
            }

            // Show start point indicator ONLY for the very first line in the chain
            // For subsequent lines, the previous line's endpoint is already visible
            if (chainedLineIds.length === 0) {
              const HANDLE_SIZE = 7;
              const halfSize = HANDLE_SIZE / 2;
              g.rect(lineStartPoint.x - halfSize + centerX, lineStartPoint.y - halfSize + centerY, HANDLE_SIZE, HANDLE_SIZE);
              g.fill({ color: 0xFFFFFF, alpha: 1 });
              g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
            }

            // Draw end point indicator - special styling if can close shape
            if (canCloseShape) {
              // Draw a larger, green circle to indicate shape closing
              g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 8);
              g.fill({ color: 0x4CAF50, alpha: 0.8 });
              g.stroke({ color: 0x2E7D32, width: 2 });

              // Draw inner circle
              g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 4);
              g.fill({ color: 0xFFFFFF, alpha: 0.9 });
            } else {
              // Regular end point indicator
              g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 4);
              g.fill({ color: 0x888888, alpha: 0.7 });
            }
          }}
        />
      )}

      {/* Draggable corner squares - only for single selection and when not playing animations */}
      {!isPlaying && selectedIds.length === 1 && selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);

        if (!selectedElement || selectedElement.type === 'line' || selectedElement.type === 'path') {
          return null;
        }

        // Calculate radius handle positions (different for rectangles vs triangles)
        const getRadiusHandlePositions = () => {
          const baseDistance = 12;
          const radiusOffset = selectedElement.cornerRadius || 0;
          const totalDistance = baseDistance + radiusOffset;
          const rotation = selectedElement.rotation || 0;

          if (selectedElement.type === 'triangle') {
            // For triangles, place handle at the top corner only
            const height = selectedElement.height;

            // Calculate triangle top corner position relative to shape center
            const localPosition = { x: 0, y: -height / 2 + totalDistance };

            // Apply rotation transformation
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            return {
              top: {
                x: selectedElement.x + localPosition.x * cos - localPosition.y * sin + centerX,
                y: selectedElement.y + localPosition.x * sin + localPosition.y * cos + centerY
              }
            };
          } else {
            // For rectangles, use the existing 4-corner logic
            const localPositions = {
              tl: { x: -selectedElement.width / 2 + totalDistance, y: -selectedElement.height / 2 + totalDistance },
              tr: { x: selectedElement.width / 2 - totalDistance, y: -selectedElement.height / 2 + totalDistance },
              bl: { x: -selectedElement.width / 2 + totalDistance, y: selectedElement.height / 2 - totalDistance },
              br: { x: selectedElement.width / 2 - totalDistance, y: selectedElement.height / 2 - totalDistance }
            };

            // Apply rotation transformation
            const cos = Math.cos(rotation);
            const sin = Math.sin(rotation);

            return {
              tl: {
                x: selectedElement.x + localPositions.tl.x * cos - localPositions.tl.y * sin,
                y: selectedElement.y + localPositions.tl.x * sin + localPositions.tl.y * cos
              },
              tr: {
                x: selectedElement.x + localPositions.tr.x * cos - localPositions.tr.y * sin,
                y: selectedElement.y + localPositions.tr.x * sin + localPositions.tr.y * cos
              },
              bl: {
                x: selectedElement.x + localPositions.bl.x * cos - localPositions.bl.y * sin,
                y: selectedElement.y + localPositions.bl.x * sin + localPositions.bl.y * cos
              },
              br: {
                x: selectedElement.x + localPositions.br.x * cos - localPositions.br.y * sin,
                y: selectedElement.y + localPositions.br.x * sin + localPositions.br.y * cos
              }
            };
          }
        };

        const radiusPositions = getRadiusHandlePositions();

        return (
          <React.Fragment key={`handles-${selectedId}`}>
            {/* Resize Handles */}
            <ResizeHandle
              elementX={selectedElement.x}
              elementY={selectedElement.y}
              elementWidth={selectedElement.width}
              elementHeight={selectedElement.height}
              elementRotation={selectedElement.rotation || 0}
              corner="tl"
              elementId={selectedElement.id}
            />
            <ResizeHandle
              elementX={selectedElement.x}
              elementY={selectedElement.y}
              elementWidth={selectedElement.width}
              elementHeight={selectedElement.height}
              elementRotation={selectedElement.rotation || 0}
              corner="tr"
              elementId={selectedElement.id}
            />
            <ResizeHandle
              elementX={selectedElement.x}
              elementY={selectedElement.y}
              elementWidth={selectedElement.width}
              elementHeight={selectedElement.height}
              elementRotation={selectedElement.rotation || 0}
              corner="bl"
              elementId={selectedElement.id}
            />
            <ResizeHandle
              elementX={selectedElement.x}
              elementY={selectedElement.y}
              elementWidth={selectedElement.width}
              elementHeight={selectedElement.height}
              elementRotation={selectedElement.rotation || 0}
              corner="br"
              elementId={selectedElement.id}
            />

            {/* Radius Handles (only for rectangle/triangle) */}
            {selectedElement.type === 'rectangle' && radiusPositions.tl && (
              <>
                {/* Rectangle: 4 corner radius handles */}
                <RadiusHandle
                  x={radiusPositions.tl.x}
                  y={radiusPositions.tl.y}
                  scaleFactor={canvasScaleFactor.current}
                  corner="tl"
                  currentRadius={selectedElement.cornerRadius || 0}
                  onRadiusChange={(newRadius) => {
                    const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
                      detail: {
                        id: selectedElement.id,
                        cornerRadius: newRadius
                      }
                    });
                    window.dispatchEvent(radiusChangeEvent);
                  }}
                />

                <RadiusHandle
                  x={radiusPositions.tr.x}
                  y={radiusPositions.tr.y}
                  scaleFactor={canvasScaleFactor.current}
                  corner="tr"
                  currentRadius={selectedElement.cornerRadius || 0}
                  onRadiusChange={(newRadius) => {
                    const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
                      detail: {
                        id: selectedElement.id,
                        cornerRadius: newRadius
                      }
                    });
                    window.dispatchEvent(radiusChangeEvent);
                  }}
                />

                <RadiusHandle
                  x={radiusPositions.bl.x}
                  y={radiusPositions.bl.y}
                  scaleFactor={canvasScaleFactor.current}
                  corner="bl"
                  currentRadius={selectedElement.cornerRadius || 0}
                  onRadiusChange={(newRadius) => {
                    const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
                      detail: {
                        id: selectedElement.id,
                        cornerRadius: newRadius
                      }
                    });
                    window.dispatchEvent(radiusChangeEvent);
                  }}
                />

                <RadiusHandle
                  x={radiusPositions.br.x}
                  y={radiusPositions.br.y}
                  scaleFactor={canvasScaleFactor.current}
                  corner="br"
                  currentRadius={selectedElement.cornerRadius || 0}
                  onRadiusChange={(newRadius) => {
                    const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
                      detail: {
                        id: selectedElement.id,
                        cornerRadius: newRadius
                      }
                    });
                    window.dispatchEvent(radiusChangeEvent);
                  }}
                />
              </>
            )}

            {/* Triangle: Single radius handle at top corner */}
            {selectedElement.type === 'triangle' && radiusPositions.top && (
              <RadiusHandle
                x={radiusPositions.top.x}
                y={radiusPositions.top.y}
                scaleFactor={canvasScaleFactor.current}
                corner="top"
                currentRadius={selectedElement.cornerRadius || 0}
                onRadiusChange={(newRadius) => {
                  const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
                    detail: {
                      id: selectedElement.id,
                      cornerRadius: newRadius
                    }
                  });
                  window.dispatchEvent(radiusChangeEvent);
                }}
              />
            )}
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
          gridConfig={gridConfig}
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
    </pixiContainer>
  );
}; 