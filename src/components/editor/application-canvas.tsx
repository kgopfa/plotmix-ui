'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { DesignCanvas } from './canvas/design-canvas';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from './viewport';
import { useCanvasState } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useUIStore } from '@/stores/use-ui-store';
import { SelectionMenu } from './canvas/selection-menu';
import { ContextMenu } from './canvas/context-menu';
import { contextMenuManager } from '@/lib/context-menu-manager';
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

    // Selection menu state
    const [selectionMenuPosition, setSelectionMenuPosition] = useState<{ x: number; y: number } | null>(null);
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string; targetType?: 'element' | 'group' } | null>(null);

    // Get selection and canvas data
    const { selectedElements, clearSelections } = useSelectionStore();
    const { removeElement } = useCanvasStore();
    const { setShowAnimationsTab } = useUIStore();


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

    // Calculate selection menu position when selection changes
    useEffect(() => {
      if (selectedElements.length === 0) {
        setSelectionMenuPosition(null);
        return;
      }

      // Calculate the center position of selected elements for menu positioning
      const bounds = selectedElements.reduce(
        (acc, element) => {
          const left = element.x - element.width / 2;
          const right = element.x + element.width / 2;
          const top = element.y - element.height / 2;
          const bottom = element.y + element.height / 2;

          return {
            left: Math.min(acc.left, left),
            right: Math.max(acc.right, right),
            top: Math.min(acc.top, top),
            bottom: Math.max(acc.bottom, bottom),
          };
        },
        { left: Infinity, right: -Infinity, top: Infinity, bottom: -Infinity }
      );

      // Convert canvas coordinates to screen coordinates
      const canvasElement = document.querySelector('canvas');
      if (canvasElement && viewportRef.current) {
        const rect = canvasElement.getBoundingClientRect();
        const viewport = viewportRef.current;
        
        // Convert world coordinates to screen coordinates using viewport transformation
        const centerX = (bounds.left + bounds.right) / 2;
        const centerY = bounds.top - 15; // Position above the selection outline
        
        // Apply viewport transformation
        const screenX = (centerX * viewport.scale.x) + viewport.x;
        const screenY = (centerY * viewport.scale.y) + viewport.y;

        setSelectionMenuPosition({
          x: rect.left + screenX,
          y: rect.top + screenY,
        });
      }
    }, [selectedElements]);

    // Selection menu handlers
    const handleSelectionMenuAnimate = useCallback(() => {
      if (selectedElements.length === 1) {
        // Show the animations tab (but don't switch right panel)
        setShowAnimationsTab(true);
      }
    }, [selectedElements, setShowAnimationsTab]);

    const handleSelectionMenuDelete = useCallback(() => {
      if (selectedElements.length > 0) {
        selectedElements.forEach(element => {
          removeElement(element.id);
        });
        // Add a small delay before clearing selections to keep menu visible briefly
        setTimeout(() => {
          clearSelections();
        }, 100);
      }
    }, [selectedElements, removeElement, clearSelections]);

    const handleSelectionMenuOptions = useCallback(() => {
      if (selectedElements.length > 0 && selectionMenuPosition) {
        // Use context menu manager to ensure only one menu is shown
        const menuId = 'selection-context-menu';
        contextMenuManager.openContextMenu(menuId);

        // Position the context menu near the selection menu
        setContextMenu({
          x: selectionMenuPosition.x,
          y: selectionMenuPosition.y + 20, // Position below the selection menu
          targetId: selectedElements[0].id, // Use first selected element as target
          targetType: 'element'
        });
      }
    }, [selectedElements, selectionMenuPosition]);

    const handleContextMenuAction = useCallback((action: string) => {
      // Handle context menu actions
      console.log('Context menu action:', action);
      setContextMenu(null);
    }, []);

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
        onMouseDown={(e) => {
          console.log('[ApplicationCanvas] Mouse down on container', { x: e.clientX, y: e.clientY });
        }}
        onClick={(e) => {
          console.log('[ApplicationCanvas] Click on container', { x: e.clientX, y: e.clientY });
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

        {/* Selection Menu */}
        {!props.isPlaying && selectionMenuPosition && selectedElements.length > 0 && (
          <SelectionMenu
            selectedElements={selectedElements}
            position={selectionMenuPosition}
            onAnimate={handleSelectionMenuAnimate}
            onDelete={handleSelectionMenuDelete}
            onOptions={handleSelectionMenuOptions}
          />
        )}
      </div>
    );
  }
  );
  
ApplicationCanvas.displayName = 'ApplicationCanvas'; 