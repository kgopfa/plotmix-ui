/* eslint-disable @typescript-eslint/no-namespace */
'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Application, extend, useApplication, type ApplicationRef } from '@pixi/react';
import { Container, Graphics, type Application as PixiApplication } from 'pixi.js';
import { Viewport as BaseViewport, type IViewportOptions } from 'pixi-viewport';
import { DesignCanvas } from './canvas/design-canvas';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { GridConfig } from '../../utils/grid-utils';
import type { SnapGuide } from '../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics });

// Custom Viewport wrapper that properly integrates with @pixi/react
type ViewportProps = Omit<IViewportOptions, "events">;

class ViewportWrapper extends BaseViewport {
  constructor(options: ViewportProps & { app: PixiApplication }) {
    const { app, ...rest } = options;
    super({
      ...rest,
      events: app.renderer.events,
    });
    this.drag().pinch().wheel().decelerate()
      .clampZoom({
        minScale: 0.1,
        maxScale: 5
      })
      .clamp({
        direction: 'all',
        underflow: 'center'
      });
  }
}

extend({ ViewportWrapper });

const Viewport = React.forwardRef<ViewportWrapper, React.PropsWithChildren<ViewportProps>>(
  (props, ref) => {
    const { children, ...rest } = props;
    const { app } = useApplication();

    return (
      app?.renderer && (
        <pixiViewportWrapper ref={ref} app={app} {...rest}>
          {children}
        </pixiViewportWrapper>
      )
    );
  }
);

Viewport.displayName = 'Viewport';

// Type declarations for the custom pixi element
// eslint-disable-next-line @typescript-eslint/no-namespace
declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      pixiViewportWrapper: React.PropsWithChildren<{
        app: PixiApplication;
        screenWidth?: number;
        screenHeight?: number;
        worldWidth?: number | null;
        worldHeight?: number | null;
        stopPropagation?: boolean;
        ref?: React.Ref<ViewportWrapper>;
      }>;
    }
  }
}

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
  onZoomChange?: (zoom: number) => void;
}

export interface ApplicationCanvasRef {
  getApplication: () => ApplicationRef | null;
  getViewport: () => ViewportWrapper | null;
  centerOnDesign: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
}

export const ApplicationCanvas = forwardRef<ApplicationCanvasRef, ApplicationCanvasProps>(
  (props, ref) => {
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<ViewportWrapper | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);
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

    // Prevent browser zoom only within canvas area
    useEffect(() => {
      const container = canvasContainerRef.current;
      if (!container) return;

      // Prevent browser zoom gestures within the canvas area
      const preventBrowserZoom = (e: TouchEvent) => {
        // Prevent browser zoom for multi-touch gestures
        if (e.touches.length > 1) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const preventWheelZoom = (e: WheelEvent) => {
        // Prevent Ctrl+scroll zoom within canvas area
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();
          e.stopPropagation();
        }
      };

      const preventGestureZoom = (e: Event) => {
        // Prevent gesture-based zoom on Safari
        e.preventDefault();
        e.stopPropagation();
      };

      // Add event listeners to the canvas container
      container.addEventListener('touchstart', preventBrowserZoom, { passive: false });
      container.addEventListener('touchmove', preventBrowserZoom, { passive: false });
      container.addEventListener('wheel', preventWheelZoom, { passive: false });
      
      // Safari-specific gesture events
      container.addEventListener('gesturestart', preventGestureZoom, { passive: false });
      container.addEventListener('gesturechange', preventGestureZoom, { passive: false });
      container.addEventListener('gestureend', preventGestureZoom, { passive: false });

      return () => {
        container.removeEventListener('touchstart', preventBrowserZoom);
        container.removeEventListener('touchmove', preventBrowserZoom);
        container.removeEventListener('wheel', preventWheelZoom);
        container.removeEventListener('gesturestart', preventGestureZoom);
        container.removeEventListener('gesturechange', preventGestureZoom);
        container.removeEventListener('gestureend', preventGestureZoom);
      };
    }, []);

    // Configure PIXI canvas for custom touch handling
    useEffect(() => {
      // @ts-expect-error - @pixi/react doesn't expose the PIXI Application instance in types
      const pixiApp = appRef.current?.app;
      const canvas = pixiApp?.view;
      if (!canvas) return;

      // Allow PIXI viewport to handle all touch interactions
      canvas.style.touchAction = 'none';

      return () => {
        // Cleanup if needed
      };
    }, [appRef]);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => {
        if (viewportRef.current) {
          const designWidth = 1280;
          const designHeight = 720;
          const centerX = (dimensions.width - designWidth) / 2 + designWidth / 2;
          const centerY = (dimensions.height - designHeight) / 2 + designHeight / 2;
          viewportRef.current.moveCenter(centerX, centerY);
        }
      },
      zoomToFit: () => {
        if (viewportRef.current) {
          const designWidth = 1280;
          const designHeight = 720;
          const padding = 50;
          const scaleX = (dimensions.width - padding * 2) / designWidth;
          const scaleY = (dimensions.height - padding * 2) / designHeight;
          const scale = Math.min(scaleX, scaleY, 5);
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
      <div 
        ref={canvasContainerRef}
        className="absolute inset-0 bg-slate-100 canvas-area"
        style={{
          // Prevent browser zoom within this area
          touchAction: 'none',
          userSelect: 'none',
          WebkitUserSelect: 'none',
          WebkitTouchCallout: 'none'
        }}
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
            worldWidth={dimensions.width * 2}
            worldHeight={dimensions.height * 2}
            stopPropagation={true}
            ref={viewportRef}
          >
            <DesignCanvas {...props} dimensions={dimensions} />
          </Viewport>
        </Application>
      </div>
    );
  }
);

ApplicationCanvas.displayName = 'ApplicationCanvas'; 