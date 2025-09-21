'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { DesignCanvas } from './design-canvas';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from '@/components/designer/viewport';
import { useCanvasState } from '@/stores/use-ui-store';
import { useViewportEmptyAreaClick } from '@/hooks';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import type { SnapGuide } from '../../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';

extend({ Container, Graphics });

interface ApplicationCanvasProps {
  children?: React.ReactNode;
  dimensions: { width: number; height: number };
  snapGuides?: SnapGuide[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedIds: string[];
  hoveredId: string | null;
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
  mainCanvasContainerRef: React.MutableRefObject<Container | null>;
  canvasScaleFactor: React.MutableRefObject<number>;
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  handleCanvasPointerMove: (e: FederatedPointerEvent) => void;
  handlePointerUp: () => void;
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
  canvasZoom?: number;
  onCanvasZoomChange?: (zoom: number) => void;
  // Deselection handler for empty area clicks
  onEmptyAreaClick?: () => void;
  // Context menu handlers
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
  // Shift key state for constrained drawing
  shiftKey?: boolean;
  // Snapping state for alignment guides
  isSnappingEnabled?: boolean;
  // Visual customization
  appBackgroundColor?: number; // default 0xF1F5F9
  designCanvasBackgroundColor?: number; // default 0xFFFFFF
  designCanvasBorderColor?: number; // default 0xE2E8F0
}

export interface ApplicationCanvasRef extends TimelineCanvasRef {
  getApplication: () => ApplicationRef | null;
  getViewport: () => ViewportWrapper | null;
  centerOnDesign: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
  sortChildren: () => void;
}

export const ApplicationCanvas = forwardRef<ApplicationCanvasRef, ApplicationCanvasProps>(
  (props, ref) => {
    const { canvasZoom, onCanvasZoomChange } = props;
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<ViewportWrapper | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);

    const [dimensions, setDimensions] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0
    });

    // Get current canvas size from UI store
    const canvasState = useCanvasState();
    const currentSize = canvasState.currentSizeId === 'custom'
      ? canvasState.customSize
      : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

    // Use current canvas size or fallback to default
    const canvasWidth = currentSize?.width || 1920;
    const canvasHeight = currentSize?.height || 1080;

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

    // Re-center canvas when dimensions change (debounced to prevent flickering)
    useEffect(() => {
      if (viewportRef.current && dimensions.width > 0 && dimensions.height > 0) {
        const timeoutId = setTimeout(() => {
          // Use responsive centering based on new screen dimensions
          centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight);
        }, 50); // Small delay to debounce rapid changes

        return () => clearTimeout(timeoutId);
      }
    }, [dimensions.width, dimensions.height, canvasWidth, canvasHeight]);

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

    // Prevent default pinch zoom on desktop browsers while allowing PIXI viewport zoom
    useEffect(() => {
      const node = canvasContainerRef.current;
      if (!node) return;

      const onWheel = (e: WheelEvent) => {
        if (e.ctrlKey) {
          // Only prevent default when pinch-zoom gesture detected
          e.preventDefault();
        }
      };

      node.addEventListener('wheel', onWheel, { passive: false });

      return () => node.removeEventListener('wheel', onWheel);
    }, []);

    // Handle canvas zoom changes from timeline
    useEffect(() => {
      if (viewportRef.current && canvasZoom !== undefined) {
        const currentZoom = viewportRef.current.scale.x;

        // Only update if the zoom values are significantly different to prevent infinite loops
        if (Math.abs(currentZoom - canvasZoom) > 0.001) {
          viewportRef.current.setZoom(canvasZoom, false);
          // Don't reset the center position during zoom changes to maintain user's view
          // viewportRef.current.moveCenter(0, 0);
        }
      }
    }, [canvasZoom]);


    // Listen for viewport zoom changes and sync back to timeline
    useEffect(() => {
      if (!viewportRef.current || !onCanvasZoomChange) return;

      const viewport = viewportRef.current;
      const handleZoomChange = () => {
        const currentZoom = viewport.scale.x; // PIXI viewport scale
        onCanvasZoomChange?.(currentZoom);
      };

      // Listen for zoom events from the viewport
      viewport.on('zoomed', handleZoomChange);
      viewport.on('zoomed-end', handleZoomChange);

      return () => {
        viewport.off('zoomed', handleZoomChange);
        viewport.off('zoomed-end', handleZoomChange);
      };
    }, [onCanvasZoomChange]);

    // Use custom hook for viewport empty area click handling
    useViewportEmptyAreaClick({
      viewportRef,
      tool: props.tool,
      elements: props.elements,
      shapeRefs: props.shapeRefs,
      onEmptyAreaClick: props.onEmptyAreaClick,
    });

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      zoomToFit: () => zoomToFit(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      resetZoom: () => resetZoom(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      getShapeRefs: () => props.shapeRefs.current as Record<string, Container>,
      getGroupContainers: () => props.groupContainers.current as Record<string, Container>,
      getMainContainer: () => props.mainCanvasContainerRef.current,
      sortChildren: () => {
        // Access the main canvas container and call sortChildren
        const mainContainer = props.mainCanvasContainerRef.current;
        if (mainContainer && mainContainer.sortChildren) {
          mainContainer.sortChildren();
        }
      }
    }));

    return (
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 bg-slate-100 canvas-area"
      >
        <Application
          ref={appRef}
          width={dimensions.width}
          height={dimensions.height}
          backgroundColor={props.appBackgroundColor ?? 0xF1F5F9}
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
            <DesignCanvas
              {...props}
              canvasBackgroundColor={props.designCanvasBackgroundColor}
              canvasBorderColor={props.designCanvasBorderColor}
              dimensions={dimensions}
            />
          </Viewport>
        </Application>
      </div>
    );
  }
);

ApplicationCanvas.displayName = 'ApplicationCanvas'; 