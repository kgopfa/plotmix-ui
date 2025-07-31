'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from '../editor/viewport';
import { useCanvasState } from '@/stores/use-ui-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useResponsiveCanvasPosition } from '@/hooks/use-responsive-canvas-position';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import { RichTextRenderer } from '../editor/helpers/rich-text-renderer';

extend({ Container, Graphics });

interface PlaybackCanvasProps {
  children?: React.ReactNode;
}

export interface PlaybackCanvasRef extends TimelineCanvasRef {
  getApplication: () => ApplicationRef | null;
  getViewport: () => ViewportWrapper | null;
  centerOnDesign: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  sortChildren: () => void;
}

export const PlaybackCanvas = forwardRef<PlaybackCanvasRef, PlaybackCanvasProps>(
  (props, ref) => {
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<ViewportWrapper | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
    const shapeRefs = useRef<Record<string, unknown>>({});

    const [dimensions, setDimensions] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    // Get canvas state and elements
    const canvasState = useCanvasState();
    const { elements, groups } = useCanvasStore();

    // Get current canvas size
    const currentSize = canvasState.currentSizeId === 'custom'
      ? canvasState.customSize
      : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

    const canvasWidth = currentSize?.width || 1280;
    const canvasHeight = currentSize?.height || 720;

    // Use responsive canvas positioning
    const { x: centerX, y: centerY } = useResponsiveCanvasPosition(dimensions);

    // Update dimensions when window resizes
    useEffect(() => {
      const updateDimensions = () => {
        if (typeof window !== 'undefined') {
          setDimensions({
            width: window.innerWidth,
            height: window.innerHeight
          });
        }
      };

      updateDimensions();
      if (typeof window !== 'undefined') {
        window.addEventListener('resize', updateDimensions);
        return () => window.removeEventListener('resize', updateDimensions);
      }
    }, []);

    // Re-center canvas when dimensions change
    useEffect(() => {
      if (viewportRef.current && dimensions.width > 0 && dimensions.height > 0) {
        centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight);
      }
    }, [dimensions.width, dimensions.height, canvasWidth, canvasHeight]);

    // Configure PIXI canvas
    useEffect(() => {
      const pixiApp = appRef.current?.getApplication();
      const canvas = pixiApp?.view;
      if (!canvas) return;

      canvas.style.touchAction = 'none';
    }, [appRef]);

    // Prevent default pinch zoom
    useEffect(() => {
      const node = canvasContainerRef.current;
      if (!node) return;

      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          e.preventDefault();
        }
      };

      node.addEventListener('wheel', onWheel, { passive: false });
      return () => node.removeEventListener('wheel', onWheel);
    }, []);

    // Initialize viewport
    useEffect(() => {
      if (viewportRef.current) {
        centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight);
      }
    }, [canvasWidth, canvasHeight, dimensions.width, dimensions.height]);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      zoomToFit: () => zoomToFit(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      resetZoom: () => resetZoom(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      getShapeRefs: () => shapeRefs.current as Record<string, Container>,
      getGroupContainers: () => ({} as Record<string, Container>),
      getMainContainer: () => null,
      sortChildren: () => {
        // No-op for playback canvas
      }
    }));

    return (
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 bg-slate-100"
      >
        <Application
          ref={appRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={0xF1F5F9}
          antialias={true}
          resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
          autoDensity={true}
        >
          <Viewport
            screenWidth={dimensions.width}
            screenHeight={dimensions.height}
            worldWidth={canvasWidth * 3}
            worldHeight={canvasHeight * 3}
            stopPropagation={false}
            ref={viewportRef}
          >
            {/* Main canvas container */}
            <pixiContainer
              x={centerX}
              y={centerY}
              interactive={false}
              eventMode="none"
              sortableChildren={true}
              data-pixi-container="playback-canvas"
            >
              {/* Canvas frame background */}
              <pixiGraphics
                zIndex={-1}
                draw={(g) => {
                  g.clear();
                  g.rect(-canvasWidth / 2, -canvasHeight / 2, canvasWidth, canvasHeight);
                  g.fill({ color: 0xFFFFFF, alpha: 1 });
                  g.stroke({ color: 0xE2E8F0, width: 1 });
                }}
                interactive={false}
                eventMode="none"
              />

              {/* Render group containers */}
              {groups.filter(group => (group.visible !== false) && !group.isDefaultGroup).map((group) => {
                const groupElements = elements
                  .filter((el: AnimatedCanvasObject) => el.groupId === group.id && (el.visible !== false));

                return (
                  <pixiContainer
                    key={`group-${group.id}`}
                    x={group.x}
                    y={group.y}
                    rotation={group.rotation || 0}
                    zIndex={Math.max(...groupElements.map((el: AnimatedCanvasObject) => el.zIndex || 0))}
                    interactive={false}
                    eventMode="none"
                  >
                    {/* Render elements as children of the group container */}
                    {groupElements.map((el: AnimatedCanvasObject) => {
                      const relativeX = el.x - group.x;
                      const relativeY = el.y - group.y;

                      return (
                        <pixiContainer
                          key={el.id}
                          x={relativeX}
                          y={relativeY}
                          pivot={{ x: 0, y: 0 }}
                          zIndex={el.zIndex || 0}
                          interactive={false}
                          eventMode="none"
                          rotation={el.rotation || 0}
                          ref={(node) => {
                            if (node) {
                              shapeRefs.current[el.id] = node;
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

              {/* Render ungrouped elements */}
              {elements
                .filter((el: AnimatedCanvasObject) => {
                  const group = groups.find(g => g.id === el.groupId);
                  return (!group || group.isDefaultGroup) && (el.visible !== false);
                })
                .map((el: AnimatedCanvasObject) => (
                  <pixiContainer
                    key={el.id}
                    x={el.x}
                    y={el.y}
                    pivot={{ x: 0, y: 0 }}
                    zIndex={el.zIndex || 0}
                    interactive={false}
                    eventMode="none"
                    rotation={el.rotation || 0}
                    ref={(node) => {
                      if (node) {
                        shapeRefs.current[el.id] = node;
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
                ))}
            </pixiContainer>
          </Viewport>
        </Application>
      </div>
    );
  }
);

PlaybackCanvas.displayName = 'PlaybackCanvas'; 