'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Application, extend, ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { Viewport } from 'pixi-viewport';
import { DesignCanvas } from './canvas/design-canvas';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { GridConfig } from '../../utils/grid-utils';
import type { SnapGuide } from '../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Viewport });



interface ApplicationCanvasProps {
  children?: React.ReactNode;
  // DesignCanvas props
  dimensions: { width: number; height: number };
  gridConfig?: GridConfig;
  snapGuides?: SnapGuide[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedIds: string[];
  hoveredId: string | null;
  isPlaying: boolean;
  editingTextId: string | null;
  tool: string;
  isPathMode: boolean;
  animationTarget: { elementId: string } | null;
  lineStartPoint: { x: number; y: number } | null;
  isLineChaining: boolean;
  chainedLineIds: string[];
  mousePos: { x: number; y: number } | null;
  currentPath: Array<{ x: number; y: number }>;
  isDrawing: boolean;
  shapeRefs: React.MutableRefObject<Record<string, unknown>>;
  groupContainers: React.MutableRefObject<Record<string, unknown>>;
  drawingRef: React.MutableRefObject<Graphics | null>;
  canvasScaleFactor: React.MutableRefObject<number>;
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
  isTextGroupCharacter: (element: AnimatedCanvasObject) => boolean;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
}

export interface ApplicationCanvasRef {
  getApplication: () => ApplicationRef | null;
  getViewport: () => Viewport | null;
  centerOnDesign: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
}

export const ApplicationCanvas = forwardRef<ApplicationCanvasRef, ApplicationCanvasProps>(
  (props, ref) => {
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<Viewport | null>(null);
    const [dimensions, setDimensions] = useState({ 
      width: typeof window !== 'undefined' ? window.innerWidth : 0, 
      height: typeof window !== 'undefined' ? window.innerHeight : 0 
    });

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

    // Set up viewport after application is created
    useEffect(() => {
      if (appRef.current) {
        // Access the PIXI Application instance through the ref
        // @ts-expect-error - @pixi/react doesn't expose the PIXI Application instance in types
        const pixiApp = appRef.current?.app;
        if (pixiApp && !viewportRef.current) {
          const viewport = new Viewport({
            screenWidth: dimensions.width,
            screenHeight: dimensions.height,
            worldWidth: dimensions.width * 2,
            worldHeight: dimensions.height * 2,
            events: pixiApp.renderer.events,
            stopPropagation: true // Stop event propagation to prevent browser zoom
          });
          
          viewportRef.current = viewport;
          
          // Configure viewport interactions
          viewport
            .drag() // Enable dragging
            .pinch() // Enable pinch-to-zoom
            .wheel() // Enable wheel zoom
            .decelerate() // Add deceleration for smooth movement
            .clampZoom({ // Set zoom limits
              minScale: 0.1,
              maxScale: 5
            })
            .clamp({ // Set drag boundaries (optional - can be removed for infinite pan)
              direction: 'all',
              underflow: 'center'
            });

          // Set initial zoom and position
          viewport.setZoom(1);
          
          // Center the viewport initially
          viewport.moveCenter(dimensions.width / 2, dimensions.height / 2);
          
          // Replace the stage's children with the viewport
          pixiApp.stage.removeChildren();
          pixiApp.stage.addChild(viewport);
          
          // Create a container for the design canvas and add it to the viewport
          const designContainer = new Container();
          viewport.addChild(designContainer);
          
          // Store the design container for later use
          // @ts-expect-error - Adding custom property to viewport
          viewport.designContainer = designContainer;
        }
      }
    }, [appRef.current, dimensions.width, dimensions.height]);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => {
        if (viewportRef.current) {
          // Center on the design area (assuming 1280x720 design area)
          const designWidth = 1280;
          const designHeight = 720;
          const centerX = (dimensions.width - designWidth) / 2 + designWidth / 2;
          const centerY = (dimensions.height - designHeight) / 2 + designHeight / 2;
          viewportRef.current.moveCenter(centerX, centerY);
        }
      },
      zoomToFit: () => {
        if (viewportRef.current) {
          // Fit the design area to the viewport
          const designWidth = 1280;
          const designHeight = 720;
          const padding = 50; // Add some padding around the design
          const scaleX = (dimensions.width - padding * 2) / designWidth;
          const scaleY = (dimensions.height - padding * 2) / designHeight;
          const scale = Math.min(scaleX, scaleY, 5); // Don't zoom in more than 5x
          viewportRef.current.setZoom(scale);
          viewportRef.current.moveCenter(dimensions.width / 2, dimensions.height / 2);
        }
      },
      resetZoom: () => {
        if (viewportRef.current) {
          viewportRef.current.setZoom(1);
          viewportRef.current.moveCenter(dimensions.width / 2, dimensions.height / 2);
        }
      }
    }));

    return (
      <div className="absolute inset-0 bg-slate-100">
        <Application
          ref={appRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={0xF1F5F9}
          antialias={true}
          resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
          autoDensity={true}
        >
          <DesignCanvas {...props} dimensions={dimensions} />
        </Application>
      </div>
    );
  }
);

ApplicationCanvas.displayName = 'ApplicationCanvas'; 