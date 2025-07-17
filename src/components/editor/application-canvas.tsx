'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { DesignCanvas } from './canvas/design-canvas';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from './viewport';
import { useCanvasState } from '@/stores/use-ui-store';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { GridConfig } from '../../utils/grid-utils';
import type { SnapGuide } from '../../utils/element-snapping';
import type { FederatedPointerEvent } from 'pixi.js';


extend({ Container, Graphics });

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
  // Viewport zoom props
  canvasZoom?: number;
  onCanvasZoomChange?: (zoom: number) => void;
  // Lock state
  isLocked?: boolean;
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
    const canvasWidth = currentSize?.width || 1280;
    const canvasHeight = currentSize?.height || 720;

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

    // Handle canvas zoom changes from timeline
    useEffect(() => {
      if (viewportRef.current && canvasZoom !== undefined) {
        const currentZoom = viewportRef.current.scale.x;
        
        // Only update if the zoom values are significantly different to prevent infinite loops
        if (Math.abs(currentZoom - canvasZoom) > 0.001) {
          viewportRef.current.setZoom(canvasZoom, false);
          viewportRef.current.moveCenter(0, 0);
        }
      }
    }, [canvasZoom, canvasWidth, canvasHeight]);

    // Initialize viewport to center on design canvas
    useEffect(() => {
      if (viewportRef.current) {
        // Center the viewport on the design canvas at the origin
        viewportRef.current.moveCenter(0, 0);
      } 
    }, [canvasWidth, canvasHeight]);

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

    // Control viewport drag based on lock state
    useEffect(() => {
      if (viewportRef.current) {
        const viewport = viewportRef.current;
        if (props.isLocked) {
          // Disable viewport drag when locked
          viewport.plugins.remove('drag');
          console.log('[ApplicationCanvas] Disabled viewport drag due to lock');
        } else {
          // Enable viewport drag when unlocked
          viewport.drag();
          console.log('[ApplicationCanvas] Enabled viewport drag');
        }
      }
    }, [props.isLocked]);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => centerOnDesign(viewportRef.current),
      zoomToFit: () => zoomToFit(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      resetZoom: () => resetZoom(viewportRef.current)
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
            worldWidth={canvasWidth * 3}
            worldHeight={canvasHeight * 3}
            stopPropagation={true}
            ref={viewportRef}
          >
            <DesignCanvas {...props} dimensions={dimensions} isLocked={props.isLocked} />
          </Viewport>
        </Application>
      </div>
    );
  }
  );
  
ApplicationCanvas.displayName = 'ApplicationCanvas'; 