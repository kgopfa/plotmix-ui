'use client';

import React, { forwardRef, useImperativeHandle, useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { Application, extend, type ApplicationRef } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import { DesignCanvas } from './canvas/design-canvas';
import { Pencil, X } from 'lucide-react';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from './viewport';
import { useCanvasState, useUIStore } from '@/stores/use-ui-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { RightClickOptions } from './panels/right-click-options';
import { contextMenuManager } from '@/lib/context-menu-manager';
import { useViewportEmptyAreaClick, useContainerEmptyAreaClick } from '@/hooks';
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
  mainCanvasContainerRef: React.MutableRefObject<Container | null>;
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
  isElementInCustomOrPolygonGroup: (element: AnimatedCanvasObject) => boolean;
  onZoomChange?: (zoom: number) => void;
  canvasZoom?: number;
  onCanvasZoomChange?: (zoom: number) => void;
  // Snapping handlers
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSnapPoint?: (point: { x: number; y: number }, event?: { shiftKey?: boolean }) => { x: number; y: number };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
  // Deselection handler for empty area clicks
  onEmptyAreaClick?: () => void;
  // Context menu handlers
  onElementContextMenu?: (e: FederatedPointerEvent, elementId: string) => void;
  onGroupContextMenu?: (e: FederatedPointerEvent, groupId: string) => void;
  // Shift key state for constrained drawing
  shiftKey?: boolean;
  // Snapping state for alignment guides
  isSnappingEnabled?: boolean;
  // Grid configuration
  gridConfig?: { size: number; enabled: boolean; visible: boolean; snapThreshold: number };
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
    // Read and write zoom from the UI store instead of props
    const canvasZoom = useUIStore(state => state.canvasZoom);
    const setCanvasZoom = useUIStore(state => state.setCanvasZoom);
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<ViewportWrapper | null>(null);
    const canvasContainerRef = useRef<HTMLDivElement | null>(null);

    const [dimensions, setDimensions] = useState({
      width: typeof window !== 'undefined' ? window.innerWidth : 0,
      height: typeof window !== 'undefined' ? window.innerHeight : 0
    });
    const [contextMenu, setContextMenu] = useState<{ x: number; y: number; targetId: string; targetType?: 'element' | 'group' } | null>(null);

    // Local text editing state (overrides incoming prop when active)
    const [activeEditingTextId, setActiveEditingTextId] = useState<string | null>(null);
    const [activeEditingValue, setActiveEditingValue] = useState<string>('');
    const [overlayRerenderTick, setOverlayRerenderTick] = useState<number>(0);
    const [dismissedEditButtons, setDismissedEditButtons] = useState<Set<string>>(new Set());

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
      // Prevent scroll chaining and browser history swipe gestures when interacting with the canvas
      // Safari/Chromium handle this differently; combine CSS and JS listeners for reliability
      canvas.style.overscrollBehavior = 'none';

      // Prevent default browser scroll/zoom/navigation behaviors while over the canvas
      const preventWheel = (e: WheelEvent) => {
        e.preventDefault();
      };
      const preventGesture = (e: Event) => {
        // Safari pinch/gesture events
        e.preventDefault();
      };
      canvas.addEventListener('wheel', preventWheel, { passive: false });
      canvas.addEventListener('gesturestart', preventGesture as EventListener, { passive: false } as AddEventListenerOptions);
      canvas.addEventListener('gesturechange', preventGesture as EventListener, { passive: false } as AddEventListenerOptions);
      canvas.addEventListener('gestureend', preventGesture as EventListener, { passive: false } as AddEventListenerOptions);

      return () => {
        canvas.removeEventListener('wheel', preventWheel as EventListener);
        canvas.removeEventListener('gesturestart', preventGesture as EventListener);
        canvas.removeEventListener('gesturechange', preventGesture as EventListener);
        canvas.removeEventListener('gestureend', preventGesture as EventListener);
      };
    }, [appRef]);

    // Prevent default wheel (including pinch-zoom and horizontal swipe) while allowing PIXI viewport to handle it
    useEffect(() => {
      const node = canvasContainerRef.current;
      if (!node) return;

      const onWheel = (e: WheelEvent) => {
        // Always prevent default on wheel within canvas area to avoid page scroll/back-forward navigation
        e.preventDefault();
      };

      node.addEventListener('wheel', onWheel, { passive: false });

      return () => node.removeEventListener('wheel', onWheel);
    }, []);

    // Apply zoom changes coming from the UI store
    useEffect(() => {
      if (viewportRef.current && canvasZoom !== viewportRef.current.scale.x) {
        viewportRef.current.setZoom(canvasZoom, false);
        // Don't reset the center position during zoom changes to maintain user's view
      }
    }, [canvasZoom]);

    // Add touch event listeners for pinch gestures
    useEffect(() => {
      const canvas = canvasContainerRef.current;
      if (!canvas) return;

      let initialDistance = 0;
      let initialZoom = 1;

      const handleTouchStart = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          initialDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );
          initialZoom = viewportRef.current?.scale.x ?? 1;
        }
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (e.touches.length === 2) {
          const touch1 = e.touches[0];
          const touch2 = e.touches[1];
          const currentDistance = Math.sqrt(
            Math.pow(touch2.clientX - touch1.clientX, 2) +
            Math.pow(touch2.clientY - touch1.clientY, 2)
          );

          if (initialDistance > 0) {
            const scale = currentDistance / initialDistance;
            const newZoom = initialZoom * scale;

            // Update the store directly for pinch gestures
            if (Math.abs(newZoom - (viewportRef.current?.scale.x ?? 1)) > 0.01) {
              setCanvasZoom(newZoom);
            }
          }
        }
      };

      const handleTouchEnd = (e: TouchEvent) => {
        if (e.touches.length < 2) {
          initialDistance = 0;
        }
      };

      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });

      return () => {
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
      };
    }, [setCanvasZoom]);

    // Add a robust zoom monitoring mechanism
    useEffect(() => {
      let monitoringInterval: NodeJS.Timeout | null = null;

      const startMonitoring = () => {
        if (monitoringInterval) return;

        monitoringInterval = setInterval(() => {
          const viewport = viewportRef.current;
          if (viewport && Math.abs(viewport.scale.x - canvasZoom) > 0.001) {
            setCanvasZoom(viewport.scale.x);
          }
        }, 10); // Check every 10ms for very responsive detection
      };

      const stopMonitoring = () => {
        if (monitoringInterval) {
          clearInterval(monitoringInterval);
          monitoringInterval = null;
        }
      };

      // Start monitoring when viewport is ready
      if (viewportRef.current) {
        startMonitoring();

        // Log initial viewport state once
        const viewport = viewportRef.current;
      } else {
        // Wait for viewport to be ready
        const checkViewport = setInterval(() => {
          if (viewportRef.current) {
            clearInterval(checkViewport);
            startMonitoring();
          }
        }, 100);
      }

      return stopMonitoring;
    }, [canvasZoom, setCanvasZoom]);

    // Trigger overlay re-position updates when viewport moves/zooms
    useEffect(() => {
      if (!viewportRef.current) return;
      const vp = viewportRef.current;
      const forceUpdate = () => setOverlayRerenderTick(t => t + 1);
      vp.on('moved', forceUpdate);
      vp.on('zoomed', forceUpdate);
      vp.on('zoomed-end', forceUpdate);
      return () => {
        vp.off('moved', forceUpdate);
        vp.off('zoomed', forceUpdate);
        vp.off('zoomed-end', forceUpdate);
      };
    }, []);

    // Reset dismissed edit buttons when selection changes
    useEffect(() => {
      setDismissedEditButtons(new Set());
    }, [props.selectedIds.join(',')]);

    // Initialize viewport to center on the actual design canvas container position
    // Delay to ensure PIXI application, viewport world, and container refs are mounted

    // Listen for viewport zoom changes and sync back to store (attach after ref is ready)
    useEffect(() => {
      let attached = false;
      let vp: ViewportWrapper | null = null;
      let intervalId: NodeJS.Timeout | null = null;
      let lastKnownZoom = canvasZoom;

      const handleZoomChange = () => {
        const current = vp?.scale.x ?? viewportRef.current?.scale.x;
        if (typeof current === 'number' && current !== lastKnownZoom) {
          lastKnownZoom = current;
          setCanvasZoom(current);
        }
      };

      const attach = () => {
        vp = viewportRef.current;
        if (!vp) return false;

        // Listen for all zoom-related events
        vp.on('zoomed', () => {
          handleZoomChange();
        });
        vp.on('zoomed-end', () => {
          handleZoomChange();
        });

        // Also listen for pinch and other gesture events that might affect zoom
        vp.on('pinch', () => {
          handleZoomChange();
        });
        vp.on('pinch-end', () => {
          handleZoomChange();
        });

        // Listen for scale changes directly
        vp.on('scale', () => {
          handleZoomChange();
        });

        // Use a more aggressive approach - also check zoom on any viewport change
        vp.on('moved', () => {
          handleZoomChange();
        });
        vp.on('frame-end', () => {
          handleZoomChange();
        });

        // Add a more frequent check for pinch gestures
        intervalId = setInterval(() => {
          if (vp && vp.scale.x !== lastKnownZoom) {
            handleZoomChange();
          }
        }, 16); // Check every 16ms (60fps) for very responsive pinch detection

        attached = true;
        return true;
      };

      const rafId = requestAnimationFrame(() => {
        if (!attach()) setTimeout(attach, 50);
      });

      return () => {
        cancelAnimationFrame(rafId);
        if (intervalId) {
          clearInterval(intervalId);
        }
        if (attached && vp) {
          vp.off('zoomed', handleZoomChange);
          vp.off('zoomed-end', handleZoomChange);
          vp.off('pinch', handleZoomChange);
          vp.off('pinch-end', handleZoomChange);
          vp.off('scale', handleZoomChange);
          vp.off('moved', handleZoomChange);
          vp.off('frame-end', handleZoomChange);
        }
      };
    }, [setCanvasZoom, canvasZoom]);

    // Use custom hook for viewport empty area click handling
    useViewportEmptyAreaClick({
      viewportRef,
      tool: props.tool,
      elements: props.elements,
      shapeRefs: props.shapeRefs,
      onEmptyAreaClick: props.onEmptyAreaClick,
    });

    const handleContextMenuAction = useCallback((action: string) => {
      if (!contextMenu) return;

      const { targetId, targetType } = contextMenu;

      switch (action) {
        case 'animate':
          if (targetType === 'element') {
            // Find and select the element
            const element = props.elements.find(el => el.id === targetId);
            if (element) {
              props.handleSelectElement(element.id);

              // Show the animations tab
              const { setShowAnimationsTab } = useUIStore.getState();
              setShowAnimationsTab(true);
            }
          }
          break;
        case 'delete':
          if (targetType === 'element') {
            // Find and remove the element
            const elementToDelete = props.elements.find(el => el.id === targetId);
            if (elementToDelete) {
              const { removeElement } = useCanvasStore.getState();
              removeElement(targetId);
            }
          } else if (targetType === 'group') {
            // Find and remove the group
            const groupToDelete = props.groups.find(g => g.id === targetId);
            if (groupToDelete) {
              const { removeGroup } = useCanvasStore.getState();
              removeGroup(targetId);
            }
          } else if (targetType === 'component') {
            // Handle component deletion (similar to group deletion)
            const componentToDelete = props.groups.find(g => g.id === targetId);
            if (componentToDelete) {
              const { removeGroup } = useCanvasStore.getState();
              removeGroup(targetId);
            }
          }
          break;
        case 'copy':
          // TODO: Implement copy functionality
          break;
        case 'group':
          if (targetType === 'element') {
            // TODO: Implement group functionality
          }
          break;
        case 'moveToFront':
          if (targetType === 'element') {
            const { bringElementToFront } = useCanvasStore.getState();
            bringElementToFront(targetId);
          } else if (targetType === 'group') {
            const { bringGroupToFront } = useCanvasStore.getState();
            bringGroupToFront(targetId);
          }
          break;
        case 'moveToBack':
          if (targetType === 'element') {
            const { sendElementToBack } = useCanvasStore.getState();
            sendElementToBack(targetId);
          } else if (targetType === 'group') {
            const { sendGroupToBack } = useCanvasStore.getState();
            sendGroupToBack(targetId);
          }
          break;
      }

      setContextMenu(null);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [contextMenu, props.elements, props.handleSelectElement]);

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

    // Use custom hook for container empty area click handling
    const handleApplicationCanvasClick = useContainerEmptyAreaClick({
      tool: props.tool,
      onEmptyAreaClick: props.onEmptyAreaClick,
    });

    // Context menu handlers
    const handleElementContextMenu = useCallback((e: FederatedPointerEvent, elementId: string) => {
      e.stopPropagation();
      e.preventDefault();

      // Use context menu manager to ensure only one menu is shown
      const menuId = 'canvas-element-context-menu';
      contextMenuManager.openContextMenu(menuId);

      setContextMenu({
        x: e.global.x,
        y: e.global.y,
        targetId: elementId,
        targetType: 'element'
      });
    }, []);

    const handleGroupContextMenu = useCallback((e: FederatedPointerEvent, groupId: string) => {
      e.stopPropagation();
      e.preventDefault();

      // Use context menu manager to ensure only one menu is shown
      const menuId = 'canvas-group-context-menu';
      contextMenuManager.openContextMenu(menuId);

      setContextMenu({
        x: e.global.x,
        y: e.global.y,
        targetId: groupId,
        targetType: 'group'
      });
    }, []);



    // Compute candidates for showing Edit buttons (hovered or selected text elements)
    const editButtonTargets = useMemo(() => {
      if (props.tool !== 'select') return [] as string[];
      const ids = new Set<string>();
      props.selectedIds.forEach(id => {
        const el = props.elements.find(e => e.id === id);
        if (el && (el.type === 'text' || el.type === 'code-editor')) ids.add(id);
      });
      return Array.from(ids);
    }, [props.selectedIds, props.elements, overlayRerenderTick]);

    // Helper to compute screen-space bounds for an element's container
    const getElementBounds = useCallback((elementId: string) => {
      const node = props.shapeRefs.current[elementId] as Container | undefined;
      // getBounds returns in world/screen pixels relative to renderer canvas
      const bounds = node?.getBounds();
      if (!bounds) return null;
      return bounds;
    }, [props.shapeRefs]);

    // Save edited text
    const commitTextEdit = useCallback((save: boolean) => {
      if (!activeEditingTextId) {
        setActiveEditingTextId(null);
        setActiveEditingValue('');
        return;
      }
      if (save) {
        const { updateElement } = useCanvasStore.getState();
        updateElement(activeEditingTextId, { text: activeEditingValue });
      }
      setActiveEditingTextId(null);
      setActiveEditingValue('');
    }, [activeEditingTextId, activeEditingValue]);

    // Live update text on each keystroke while editing, without committing selection state
    useEffect(() => {
      if (!activeEditingTextId) return;
      const { updateElement } = useCanvasStore.getState();
      updateElement(activeEditingTextId, { text: activeEditingValue });
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [activeEditingTextId, activeEditingValue]);

    return (
      <div
        ref={canvasContainerRef}
        className="absolute inset-0 bg-slate-100 canvas-area overscroll-none"
        onClick={handleApplicationCanvasClick}
        onContextMenu={(e) => {
          // Prevent browser's default context menu from appearing
          e.preventDefault();
          e.stopPropagation();
        }}
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
              gridConfig={props.gridConfig}
              onElementContextMenu={handleElementContextMenu}
              onGroupContextMenu={handleGroupContextMenu}
              // When editing text, disable interaction for that text element
              editingTextId={activeEditingTextId ?? props.editingTextId}
              viewportRef={viewportRef}
            />
          </Viewport>
        </Application>

        {/* Edit buttons for text elements (hover or selected) */}
        {editButtonTargets.map((id) => {
          if (dismissedEditButtons.has(id)) return null;
          const bounds = getElementBounds(id);
          if (!bounds) return null;
          const buttonTop = bounds.y + bounds.height + 8; // 8px below element
          const buttonLeft = bounds.x + bounds.width / 2; // center
          const isActive = activeEditingTextId === id;
          return (
            <div
              key={`edit-btn-${id}`}
              className="absolute z-[70]"
              style={{
                top: `${buttonTop}px`,
                left: `${buttonLeft}px`,
                transform: 'translate(-50%, 0)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {!isActive && (
                <div
                  className="inline-flex items-center rounded-full bg-white/95 backdrop-blur border border-gray-200/60 shadow-md hover:bg-white hover:shadow-lg transition"
                  role="group"
                >
                  <button
                    className="px-2.5 py-1.5 text-xs text-gray-700 flex items-center gap-1 transition rounded-l-full"
                    onClick={() => {
                      const el = props.elements.find(e => e.id === id);
                      setActiveEditingTextId(id);
                      setActiveEditingValue(el?.text || '');
                    }}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    {props.elements.find(e => e.id === id)?.type === 'code-editor' ? 'Edit code' : 'Edit text'}
                  </button>
                  <div className="h-4 w-px bg-gray-200/80" />
                  <button
                    className="px-2 py-1 text-[11px] leading-none text-gray-400 hover:text-gray-600 rounded-r-full"
                    title="Hide button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setDismissedEditButtons(prev => {
                        const next = new Set(prev);
                        next.add(id);
                        return next;
                      });
                    }}
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Inline text editor overlay */}
        {activeEditingTextId && (() => {
          const bounds = getElementBounds(activeEditingTextId);
          if (!bounds) return null;
          const top = bounds.y + bounds.height + 8; // place under element
          const width = Math.max(200, Math.floor(bounds.width));
          const viewportW = typeof window !== 'undefined' ? window.innerWidth : 0;
          const rawLeft = bounds.x;
          const left = Math.max(8, Math.min(rawLeft, Math.max(8, viewportW - width - 8)));

          const editingElement = props.elements.find(e => e.id === activeEditingTextId);
          const isCodeEditor = editingElement?.type === 'code-editor';

          return (
            <div
              key={`text-editor-${activeEditingTextId}`}
              className="absolute z-[80]"
              style={{ top: `${top}px`, left: `${left}px`, width: `${width}px` }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className={`${isCodeEditor ? 'bg-gray-900/95 border-gray-700/60' : 'bg-white/95 border-gray-200/60'} backdrop-blur-sm border rounded-xl shadow-xl p-2.5`}>
                <div className="flex items-center justify-between pb-1">
                  <span className={`text-xs tracking-wide ${isCodeEditor ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isCodeEditor ? 'Edit code' : 'Edit text'}
                  </span>
                  <button
                    className={`p-1 rounded-md ${isCodeEditor ? 'text-gray-400 hover:text-gray-300 hover:bg-gray-800' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'}`}
                    onMouseDown={(e) => { e.preventDefault(); commitTextEdit(false); }}
                    title="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <textarea
                  autoFocus
                  className={`w-full text-sm outline-none resize-vertical rounded-md border focus:border-blue-400 focus:ring-1 focus:ring-blue-300 p-2 ${isCodeEditor
                      ? 'text-gray-200 border-gray-600 bg-gray-800/90 font-mono'
                      : 'text-gray-800 border-gray-200 bg-white/90'
                    }`}
                  rows={Math.min(6, Math.max(2, Math.round((bounds.height || 40) / 18)))}
                  value={activeEditingValue}
                  onChange={(e) => setActiveEditingValue(e.target.value)}
                  onKeyDown={(e) => {
                    if ((e.key === 'Enter' && (e.metaKey || e.ctrlKey))) {
                      e.preventDefault();
                      commitTextEdit(true);
                    } else if (e.key === 'Escape') {
                      e.preventDefault();
                      commitTextEdit(false);
                    }
                  }}
                  onBlur={() => commitTextEdit(true)}
                  style={{
                    fontFamily: isCodeEditor ? 'Monaco, Consolas, "Courier New", monospace' : 'inherit',
                    fontSize: isCodeEditor ? `${editingElement?.fontSize || 14}px` : 'inherit',
                    lineHeight: '1.5',
                  }}
                />
                <div className="flex justify-end gap-2 mt-2">
                  <button
                    className={`px-2.5 py-1 text-xs rounded-md border ${isCodeEditor
                        ? 'border-gray-600 text-gray-300 hover:bg-gray-800'
                        : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                      }`}
                    onMouseDown={(e) => { e.preventDefault(); commitTextEdit(false); }}
                  >
                    Cancel
                  </button>
                  <button
                    className={`px-3 py-1.5 text-xs rounded-md text-white shadow-md transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 ${isCodeEditor
                        ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30'
                        : 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30'
                      }`}
                    onMouseDown={(e) => { e.preventDefault(); commitTextEdit(true); }}
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Context Menu */}
        <RightClickOptions
          contextMenu={contextMenu}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
      </div>
    );
  }
);

ApplicationCanvas.displayName = 'ApplicationCanvas'; 