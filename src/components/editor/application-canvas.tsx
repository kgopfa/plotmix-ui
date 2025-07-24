'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { DesignCanvas } from './canvas/design-canvas';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from './viewport';
import { useCanvasState } from '@/stores/use-ui-store';
import { ContextMenu } from './canvas/context-menu';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';

import type { SnapGuide } from '../../utils/element-snapping';
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
  handleGroupSelectionDragStart: (virtualElement: AnimatedCanvasObject, mouseX: number, mouseY: number, allElements?: AnimatedCanvasObject[]) => void;
  isTextGroupCharacter: (element: AnimatedCanvasObject) => boolean;
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
  onZoomChange?: (zoom: number) => void;
  canvasZoom?: number;
  onCanvasZoomChange?: (zoom: number) => void;
  // Snapping handlers
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSnapPoint?: (point: { x: number; y: number }, event?: { shiftKey?: boolean }) => { x: number; y: number };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
}

export interface ApplicationCanvasRef extends TimelineCanvasRef {
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
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string; targetType?: 'element' | 'group' } | null>(null);

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

    // Re-center canvas when dimensions change
    useEffect(() => {
      if (viewportRef.current && dimensions.width > 0 && dimensions.height > 0) {
        // Use responsive centering based on new screen dimensions
        centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight);
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
    }, [canvasZoom, canvasWidth, canvasHeight]);

    // Initialize viewport to center on design canvas with responsive positioning
    useEffect(() => {
      if (viewportRef.current) {
        // Use responsive centering based on screen dimensions
        centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight);
      } 
    }, [canvasWidth, canvasHeight, dimensions.width, dimensions.height]);

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

    const handleContextMenuAction = useCallback(() => {
      // Handle context menu actions
      setContextMenu(null);
    }, []);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => centerOnDesign(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      zoomToFit: () => zoomToFit(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      resetZoom: () => resetZoom(viewportRef.current, dimensions.width, dimensions.height, canvasWidth, canvasHeight),
      getShapeRefs: () => props.shapeRefs.current as Record<string, Container>,
      getGroupContainers: () => props.groupContainers.current as Record<string, Container>
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
            <DesignCanvas {...props} dimensions={dimensions} />
          </Viewport>
        </Application>

        {/* Context Menu */}
        <ContextMenu
          contextMenu={contextMenu}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      </div>
    );
  }
  );
  
ApplicationCanvas.displayName = 'ApplicationCanvas'; 