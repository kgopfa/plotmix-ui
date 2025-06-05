'use client';

import { Application, extend } from '@pixi/react';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef, useEffect } from 'react';
import { drawShape } from '@/utils/drawing-utils';
import { createNewElement } from '@/lib/element-factory';
import ShapeSelect from './shape-select';
import HoverOutline from './hover-outline';
import RotationHandles from './rotation-handles';
import ResizeHandle from './resize-handle';
import RadiusHandle from './radius-handle';
import { TextEditor } from './text-editor';
import { CanvasContent } from './canvas-content';
import { Viewport } from 'pixi-viewport';

extend({ Container, Graphics, Text });

interface CanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasElement[];
  selectedId: string | null;
  onElementSelect: (id: string | null) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  onCanvasClick: (e: FederatedPointerEvent) => void;
  onLineEndpointDrag?: (id: string, endpoint: 'start' | 'end', x: number, y: number) => void;
  onElementResize?: (id: string, width: number, height: number) => void;
  tool: string;
  onAddElement?: (element: AnimatedCanvasElement) => void;
  isPathMode?: boolean;
  onElementRotate?: (id: string, rotation: number) => void;
  onElementRadiusChange?: (id: string, cornerRadius: number) => void;
  onTextChange?: (id: string, text: string) => void;
}

export interface CanvasRef {
  getShapeRefs: () => Record<string, Container>;
  zoomIn: () => void;
  zoomOut: () => void;
  getViewport: () => Viewport | null;
  centerOnElement: (id?: string) => void;
  zoomToFitElement: (id?: string) => void;
  getCurrentZoom: () => number;
  setZoom: (scale: number) => void;
  getViewportCenter: () => { x: number; y: number };
  resetToCenter: () => void;
}

// Define resize handle positions
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const DEFAULT_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 64 64\'%3E%3Cg id=\'_01_Cursor\' data-name=\'01 Cursor\'%3E%3Cpath d=\'m60.2373 22.2021-54.3813-20.2031a3.0174 3.0174 0 0 0 -3.857 3.857l20.2031 54.3813a3.0112 3.0112 0 0 0 5.6763-.15l7.4541-23.8794a1.3336 1.3336 0 0 1 .8745-.875l23.88-7.4541a3.0113 3.0113 0 0 0 .1503-5.6767zm-.7461 3.7671-23.88 7.4541a3.3371 3.3371 0 0 0 -2.1875 2.188l-7.4541 23.88a.9953.9953 0 0 1 -1.8921.05l-20.2035-54.3813c-.2335-1.0229.438-1.4758 1.286-1.286l54.381 20.2031a.9955.9955 0 0 1 -.0498 1.8921z\' fill=\'black\' stroke=\'black\' stroke-width=\'2\'/%3E%3C/g%3E%3C/svg%3E") 3 3, auto';

const LINE_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 3 3, auto';

const DRAW_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 512 512\'%3E%3Cpath d=\'M498.125,92.38l-78.505-78.506c-18.496-18.497-48.436-18.5-66.935,0C339.518,27.043,50.046,316.516,44.525,322.035c-2.182,2.182-3.725,4.918-4.46,7.915L0.502,491.068c-3.036,12.368,8.186,23.44,20.431,20.432c8.361-2.053,153.718-37.747,161.117-39.564c2.996-0.735,5.734-2.278,7.915-4.46c5.816-5.816,293.677-293.677,308.161-308.161C516.622,140.818,516.627,110.879,498.125,92.38zM39.957,472.043l1.612-6.562l4.951,4.951L39.957,472.043zM84.874,461.014l-33.887-33.887l14.736-60.009l79.16,79.16L84.874,461.014zM178.022,431.647l-97.668-97.668L332.559,81.773l97.668,97.668L178.022,431.647zM474.24,135.429l-19.508,19.507l-97.667-97.668l19.507-19.507c5.294-5.293,13.867-5.298,19.163,0l78.506,78.507C479.536,121.563,479.536,130.132,474.24,135.429z\' fill=\'black\'/%3E%3C/svg%3E") 0 20, auto';

const TEXT_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm0-14c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z\' fill=\'black\'/%3E%3C/svg%3E") 0 20, auto';

const setCursor = (cursor: string) => {
  document.body.style.cursor = cursor;
};

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(
  {
    dimensions,
    elements,
    selectedId,
    onElementSelect,
    onElementDragEnd,
    onCanvasClick,
    onLineEndpointDrag,
    onElementResize,
    tool,
    onAddElement,
    isPathMode = false,
    onElementRotate,
    onElementRadiusChange,
    onTextChange,
  },
  ref
) {
  const shapeRefs = useRef<Record<string, Container>>({});
  const viewportRef = useRef<Viewport | null>(null);
  const HANDLE_SIZE = 10;
  const drawingRef = useRef<Graphics | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textClickTimeRef = useRef<Map<string, number>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  // Add hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Optional: Track zoom state for external components (like zoom indicators)
  const [currentZoom, setCurrentZoom] = useState(1);

  // Calculate the canvas scale factor based on device pixel ratio and any additional scaling
  const canvasScaleFactor = useRef(window.devicePixelRatio || 1);

  useImperativeHandle(ref, () => ({
    getShapeRefs: () => shapeRefs.current,
    zoomIn: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const newScale = Math.min(viewport.scale.x * 1.1, 8); // maxScale updated for large canvas
      viewport.animate({ scale: newScale, time: 200 });
      setCurrentZoom(newScale);
    },
    zoomOut: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const newScale = Math.max(viewport.scale.x * 0.9, 0.1); // minScale updated for large canvas
      viewport.animate({ scale: newScale, time: 200 });
      setCurrentZoom(newScale);
    },
    getCurrentZoom: () => currentZoom,
    setZoom: (scale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const clampedScale = Math.min(Math.max(scale, 0.1), 8); // Updated min/max scale for large canvas
      viewport.animate({ scale: clampedScale, time: 200 });
      setCurrentZoom(clampedScale);
    },
    getViewport: () => viewportRef.current,
    centerOnElement: (id?: string) => {
      const targetId = id || selectedId;
      if (!targetId) return;
      
      const shape = shapeRefs.current[targetId];
      const viewport = viewportRef.current;
      if (!shape || !viewport) return;
  
      const bounds = shape.getBounds();
      viewport.animate({ 
        position: { 
          x: viewport.worldScreenWidth / 2 - (bounds.x + bounds.width / 2),
          y: viewport.worldScreenHeight / 2 - (bounds.y + bounds.height / 2)
        },
        time: 300
      });
    },
    zoomToFitElement: (id?: string) => {
      const targetId = id || selectedId;
      if (!targetId) return;
      
      const shape = shapeRefs.current[targetId];
      const viewport = viewportRef.current;
      if (!shape || !viewport) return;
  
      const bounds = shape.getBounds();
      
      // Handle edge cases where bounds might be 0
      if (bounds.width <= 0 || bounds.height <= 0) {
        console.warn('Element has invalid bounds for zoom to fit');
        return;
      }
      
      const margin = 40;
      const availableWidth = viewport.screenWidth - margin * 2;
      const availableHeight = viewport.screenHeight - margin * 2;
      
      // Ensure we don't divide by zero
      const scaleX = availableWidth > 0 ? availableWidth / bounds.width : 1;
      const scaleY = availableHeight > 0 ? availableHeight / bounds.height : 1;
      const scale = Math.min(Math.min(scaleX, scaleY), 8); // Respect maxScale updated for large canvas
      const clampedScale = Math.max(scale, 0.1); // Respect minScale updated for large canvas
  
      viewport.animate({
        scale: clampedScale,
        position: {
          x: viewport.screenWidth / 2 - (bounds.x + bounds.width / 2) * clampedScale,
          y: viewport.screenHeight / 2 - (bounds.y + bounds.height / 2) * clampedScale
        },
        time: 400
      });
      setCurrentZoom(clampedScale);
    },
    getViewportCenter: () => {
      const viewport = viewportRef.current;
      if (!viewport) return { x: 50000, y: 50000 }; // Default to world center
      
      // Get the center point of what's currently visible
      const centerX = viewport.center.x;
      const centerY = viewport.center.y;
      return { x: centerX, y: centerY };
    },
    resetToCenter: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      
      // Reset to center of the world with default zoom
      viewport.animate({
        position: { x: 0, y: 0 }, // This centers the viewport on world center
        scale: 1,
        time: 400
      });
      setCurrentZoom(1);
    }
  }));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  // Add state for resizing
  const [resizingHandle, setResizingHandle] = useState<ResizeHandle>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [initialMouse, setInitialMouse] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // After importing useEffect, also add:
  useEffect(() => {
    // Set default cursor when component mounts
    setCursor(DEFAULT_CURSOR);

    // Find the canvas element after mount
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvasRef.current = canvas;
      console.log('Canvas element found and set to canvasRef');
    } else {
      console.log('Canvas element not found');
    }

    // Reset to default cursor when component unmounts
    return () => {
      document.body.style.cursor = '';
    };
  }, []);

  // Sync zoom state with viewport's actual scale
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleZoomChange = () => {
      const currentScale = viewport.scale.x;
      setCurrentZoom(currentScale);
    };

    // Listen for zoom changes from user interactions (wheel, pinch, etc.)
    viewport.on('zoomed', handleZoomChange);

    return () => {
      viewport.off('zoomed', handleZoomChange);
    };
  }, [viewportRef.current]);

  // Add this useEffect in your Canvas component
  useEffect(() => {
    const handleCornerSquareResize = (e: CustomEvent) => {
      const { elementId, width, height } = e.detail;

      // Use your existing resize callback
      if (onElementResize) {
        onElementResize(elementId, width, height);
      }
    };

    window.addEventListener('corner-square-resize', handleCornerSquareResize as EventListener);

    return () => {
      window.removeEventListener('corner-square-resize', handleCornerSquareResize as EventListener);
    };
  }, [onElementResize]);

  // Check if a point is within a resize handle
  const getResizeHandleAtPoint = (element: AnimatedCanvasElement, x: number, y: number): ResizeHandle => {
    if (!element) return null;

    const halfWidth = element.width / 2;
    const halfHeight = element.height / 2;
    const halfHandleSize = HANDLE_SIZE / 2;

    // Convert global coordinates to element-local coordinates
    const localX = x - element.x;
    const localY = y - element.y;

    // Check top-left handle
    if (
      localX >= -halfWidth - halfHandleSize &&
      localX <= -halfWidth + halfHandleSize &&
      localY >= -halfHeight - halfHandleSize &&
      localY <= -halfHeight + halfHandleSize
    ) {
      return 'top-left';
    }

    // Check top-right handle
    if (
      localX >= halfWidth - halfHandleSize &&
      localX <= halfWidth + halfHandleSize &&
      localY >= -halfHeight - halfHandleSize &&
      localY <= -halfHeight + halfHandleSize
    ) {
      return 'top-right';
    }

    // Check bottom-left handle
    if (
      localX >= -halfWidth - halfHandleSize &&
      localX <= -halfWidth + halfHandleSize &&
      localY >= halfHeight - halfHandleSize &&
      localY <= halfHeight + halfHandleSize
    ) {
      return 'bottom-left';
    }

    // Check bottom-right handle
    if (
      localX >= halfWidth - halfHandleSize &&
      localX <= halfWidth + halfHandleSize &&
      localY >= halfHeight - halfHandleSize &&
      localY <= halfHeight + halfHandleSize
    ) {
      return 'bottom-right';
    }

    return null;
  };

  // Update the getResizeCursor function
  const getResizeCursor = (handle: ResizeHandle): string => {
    switch (handle) {
      case 'top-left':
      case 'bottom-right':
        return 'nwse-resize';
      case 'top-right':
      case 'bottom-left':
        return 'nesw-resize';
      default:
        return DEFAULT_CURSOR;
    }
  };

  const handlePointerDown = (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => {
    const pos = e.global;
    const element = elements.find(el => el.id === id);

    if (!element) return;

    // For text elements, handle double-click to edit, single click to drag
    if (element.type === 'text') {
      // Check if this is a double-click
      const currentTime = Date.now();
      const lastClickTime = textClickTimeRef.current.get(id) || 0;
      const timeDiff = currentTime - lastClickTime;

      console.log('Text click detected:', { id, currentTime, lastClickTime, timeDiff });

      if (timeDiff < 300) { // Double-click detected (within 300ms)
        console.log('Double-click detected, entering edit mode for:', id);
        setEditingTextId(id);
        onElementSelect(id);
        textClickTimeRef.current.delete(id); // Clear the click time
        return;
      } else {
        // Single click - store the time and continue with dragging logic
        console.log('Single click detected, storing time for:', id);
        textClickTimeRef.current.set(id, currentTime);
        // Don't return here, let it fall through to normal drag handling
      }
    }

    // First, check if we're clicking on a resize handle (only for selected elements)
    if (id === selectedId && element.type !== 'line' && element.type !== 'path') {
      const handle = getResizeHandleAtPoint(element, pos.x, pos.y);

      if (handle) {
        setResizingHandle(handle);
        setDraggingId(id);
        setInitialSize({ width: element.width, height: element.height });
        setInitialMouse({ x: pos.x, y: pos.y });
        onElementSelect(id);

        // Set cursor for resize operation
        setCursor(getResizeCursor(handle));
        return;
      }
    }

    // Then check for line endpoint handling (same as before)
    if (element?.type === 'line' && element.lineOptions?.points && onLineEndpointDrag) {
      const { start, end } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;

      // Check if clicking near start point
      const startDist = Math.hypot(clickX - start.x, clickY - start.y);
      if (startDist <= HANDLE_SIZE) {
        setDraggingEndpoint('start');
        setDraggingId(id);
        onElementSelect(id);
        return;
      }

      // Check if clicking near end point
      const endDist = Math.hypot(clickX - end.x, clickY - end.y);
      if (endDist <= HANDLE_SIZE) {
        setDraggingEndpoint('end');
        setDraggingId(id);
        onElementSelect(id);
        return;
      }
    }

    // Regular shape drag (same as before)
    setDraggingId(id);
    onElementSelect(id);
    setDragOffset({ x: pos.x - shapeX, y: pos.y - shapeY });
  };

  // Update the handlePointerUp function
  const handlePointerUp = () => {
    // Reset all dragging and resizing state (except resize, which is handled by global handler)
    if (!resizingHandle) {
      setDraggingId(null);
      setDragOffset(null);
      setDraggingEndpoint(null);

      // Reset cursor style based on current tool
      if (tool === 'draw') {
        setCursor(DRAW_CURSOR);
      } else if (tool === 'line') {
        setCursor(LINE_CURSOR);
      } else if (tool === 'text') {
        setCursor(TEXT_CURSOR);
      } else {
        setCursor(DEFAULT_CURSOR);
      }
    }

    if (isDrawing) {
      if (currentPath.length > 1) {
        if (tool === 'draw') {
          // Create a new path element
          // Pass 0,0 as position since the element factory now calculates the correct center position
          const newElement = createNewElement('path', 0, 0, elements, currentPath);

          // If in path mode, mark it as a path
          if (isPathMode) {
            newElement.isAnimationPath = true;
          }

          onElementSelect(newElement.id);
          if (onAddElement) {
            onAddElement(newElement);

            // Signal to parent that drawing is complete and we should exit draw mode
            const customEvent = new CustomEvent('draw-complete', {
              detail: { tool: 'draw' }
            });
            window.dispatchEvent(customEvent);
          }
        }
      }
      setIsDrawing(false);
      setCurrentPath([]);
    }
  };

  // Global pointer move handler for dragging operations
  const handleGlobalPointerMove = (e: PointerEvent) => {
    if (!draggingId) return;

    const element = elements.find(el => el.id === draggingId);
    if (!element) return;

    // Get the canvas element to calculate proper coordinates
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Handle resizing - only if mouse button is pressed (buttons property > 0)
    if (resizingHandle && initialSize && initialMouse && e.buttons > 0) {
      // Calculate the delta from the initial mouse position (using canvas coordinates)
      const initialCanvasX = initialMouse.x;
      const initialCanvasY = initialMouse.y;
      const deltaX = canvasX - initialCanvasX;
      const deltaY = canvasY - initialCanvasY;

      let newWidth = initialSize.width;
      let newHeight = initialSize.height;

      // Calculate new dimensions based on the handle being dragged
      switch (resizingHandle) {
        case 'top-left':
          newWidth = Math.max(20, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          break;
        case 'top-right':
          newWidth = Math.max(20, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height - deltaY);
          break;
        case 'bottom-left':
          newWidth = Math.max(20, initialSize.width - deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
        case 'bottom-right':
          newWidth = Math.max(20, initialSize.width + deltaX);
          newHeight = Math.max(20, initialSize.height + deltaY);
          break;
      }

      // Trigger a custom event that the parent component can listen to
      const resizeEvent = new CustomEvent('element-resize', {
        detail: {
          id: draggingId,
          width: newWidth,
          height: newHeight,
          handle: resizingHandle,
          originalX: element.x,
          originalY: element.y
        }
      });

      window.dispatchEvent(resizeEvent);
      return;
    } else if (resizingHandle && e.buttons === 0) {
      // If mouse button is released during resize, exit resize mode
      setResizingHandle(null);
      setDraggingId(null);
      setInitialSize(null);
      setInitialMouse(null);
      setCursor(DEFAULT_CURSOR);
      return;
    }

    // Handle endpoint dragging
    if (draggingEndpoint && onLineEndpointDrag) {
      onLineEndpointDrag(draggingId, draggingEndpoint, canvasX, canvasY);
    } else if (dragOffset) {
      // Handle regular shape dragging using canvas coordinates
      onElementDragEnd(draggingId, canvasX - dragOffset.x, canvasY - dragOffset.y);
    }
  };

  const handleCanvasPointerDown = (e: FederatedPointerEvent) => {
    if (tool === 'draw') {
      setIsDrawing(true);
      const newPoint = { x: e.global.x, y: e.global.y };
      setCurrentPath([newPoint]);

      if (drawingRef.current) {
        const graphics = drawingRef.current;
        graphics.clear();
        graphics.moveTo(newPoint.x, newPoint.y);
        graphics.stroke({ width: 2, color: 0x000000, alpha: 1 });
      }
    }
  };

  const handleCanvasPointerMove = (e: FederatedPointerEvent) => {
    if (isDrawing && tool === 'draw') {
      const newPoint = { x: e.global.x, y: e.global.y };
      setCurrentPath(prev => [...prev, newPoint]);

      if (drawingRef.current) {
        const graphics = drawingRef.current;
        graphics.clear();
        graphics.moveTo(currentPath[0].x, currentPath[0].y);
        currentPath.forEach(point => {
          graphics.lineTo(point.x, point.y);
        });
        graphics.lineTo(newPoint.x, newPoint.y);
        graphics.stroke({ width: 2, color: 0x000000, alpha: 1 });
      }
    }
  };

  // Update handleElementMouseMove to manage hover state
  const handleElementMouseMove = (id: string) => (e: FederatedPointerEvent) => {
    // Update hover state
    if (hoveredId !== id) {
      setHoveredId(id);
    }

    // Only handle cursor change for selected elements that are not being dragged
    if (id !== selectedId || draggingId) return;

    const element = elements.find(el => el.id === id);
    if (!element) return;

    // Skip resize handle detection for line and path types
    if (element.type !== 'line' && element.type !== 'path') {
      const handle = getResizeHandleAtPoint(element, e.global.x, e.global.y);
      if (handle) {
        setCursor(getResizeCursor(handle));
        return;
      }
    }

    setCursor(DEFAULT_CURSOR);
  };

  // Update handleElementMouseLeave to clear hover state
  const handleElementMouseLeave = (id: string) => () => {
    if (hoveredId === id) {
      setHoveredId(null);
    }

    if (!draggingId) {
      if (tool === 'draw') {
        setCursor(DRAW_CURSOR);
      } else if (tool === 'line') {
        setCursor(LINE_CURSOR);
      } else if (tool === 'text') {
        setCursor(TEXT_CURSOR);
      } else {
        setCursor(DEFAULT_CURSOR);
      }
    }
  };

  const handleTextChange = (id: string, text: string) => {
    if (onTextChange) {
      onTextChange(id, text);
    }
  };

  const handleTextEditEnd = () => {
    setEditingTextId(null);
  };

  // Debug effect to track editingTextId changes
  useEffect(() => {
    console.log('editingTextId changed to:', editingTextId);
  }, [editingTextId]);

  useEffect(() => {
    const handleElementRadiusChange = (e: CustomEvent) => {
      const { id, cornerRadius } = e.detail;

      // Find the element to update
      const elementToUpdate = elements.find(el => el.id === id);
      if (!elementToUpdate) return;

      // You'll need to add an onElementRadiusChange callback prop to Canvas
      // and pass it from the parent component to handle the radius update
      if (onElementRadiusChange) {
        onElementRadiusChange(id, cornerRadius);
      }
    };

    window.addEventListener('element-radius-change', handleElementRadiusChange as EventListener);

    return () => {
      window.removeEventListener('element-radius-change', handleElementRadiusChange as EventListener);
    };
  }, [elements, onElementRadiusChange]);

  // Global event handlers for pointer capture
  useEffect(() => {
    const handleGlobalPointerUp = () => {
      if (resizingHandle) {
        setResizingHandle(null);
        setDraggingId(null);
        setInitialSize(null);
        setInitialMouse(null);

        // Set cursor based on current tool
        if (tool === 'draw') {
          setCursor(DRAW_CURSOR);
        } else if (tool === 'line') {
          setCursor(LINE_CURSOR);
        } else if (tool === 'text') {
          setCursor(TEXT_CURSOR);
        } else {
          setCursor(DEFAULT_CURSOR);
        }
      }

      // Also handle other drag operations
      if (draggingId) {
        setDraggingId(null);
        setDragOffset(null);
        setDraggingEndpoint(null);

        // Reset cursor style based on current tool
        if (tool === 'draw') {
          setCursor(DRAW_CURSOR);
        } else if (tool === 'line') {
          setCursor(LINE_CURSOR);
        } else if (tool === 'text') {
          setCursor(TEXT_CURSOR);
        } else {
          setCursor(DEFAULT_CURSOR);
        }
      }
    };

    // Add global event listeners for pointer capture
    document.addEventListener('pointermove', handleGlobalPointerMove);
    document.addEventListener('pointerup', handleGlobalPointerUp);

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draggingId, resizingHandle, initialSize, initialMouse, dragOffset, draggingEndpoint, elements, onElementDragEnd, onLineEndpointDrag, tool]);

  useEffect(() => {
    if (tool === 'draw') {
      setCursor(DRAW_CURSOR);
    } else if (tool === 'line') {
      setCursor(LINE_CURSOR);
    } else {
      setCursor(DEFAULT_CURSOR);
    }
  }, [tool]);

  useEffect(() => {
    const handleElementResize = (e: CustomEvent) => {
      // Extract details from the event
      const { id, width, height } = e.detail;

      // Find the element to update
      const elementToResize = elements.find(el => el.id === id);
      if (!elementToResize) return;

      // Call the resize callback if provided
      if (onElementResize) {
        onElementResize(id, width, height);
      }
    };

    // Add the event listener
    window.addEventListener('element-resize', handleElementResize as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('element-resize', handleElementResize as EventListener);
    };
  }, [elements, onElementResize]);

  useEffect(() => {
    const handleElementRotation = (e: CustomEvent) => {
      // Extract details from the event
      const { id, rotation } = e.detail;

      // Find the element to update
      const elementToRotate = elements.find(el => el.id === id);
      if (!elementToRotate) return;

      // Call the rotation callback if provided (you'll need to add this prop)
      if (onElementRotate) {
        onElementRotate(id, rotation);
      }
    };

    // Add the event listener
    window.addEventListener('element-rotation-change', handleElementRotation as EventListener);

    // Clean up
    return () => {
      window.removeEventListener('element-rotation-change', handleElementRotation as EventListener);
    };
  }, [elements, onElementRotate]);

  return (
    <>
      <Application
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={0xFFFFFF}
        antialias={true}
        resolution={window.devicePixelRatio || 2}
        autoDensity={true}
      >
        <CanvasContent ref={viewportRef}>
          {/* Full-size transparent interactive layer to capture background clicks */}
          <pixiGraphics
            draw={(g) => {
              g.clear();
              g.rect(0, 0, dimensions.width, dimensions.height);
              g.fill({ color: 0xFFFFFF, alpha: 0 });
            }}
            interactive={true}
            eventMode="static"
            onPointerDown={(e: FederatedPointerEvent) => {
              if (tool === 'draw') {
                handleCanvasPointerDown(e);
              } else {
                onElementSelect(null);
                onCanvasClick(e);
              }
            }}
            onPointerMove={handleCanvasPointerMove}
            onPointerUp={handlePointerUp}
            onPointerUpOutside={handlePointerUp}
          />

          {elements.map((el) => {
            // Handle all element types consistently, including SVGs
            return (
              <pixiContainer
                key={el.id}
                x={el.x}
                y={el.y}
                pivot={{ x: 0, y: 0 }}
                interactive={true}
                eventMode="dynamic"
                hitArea={(el.type === 'path' || el.type === 'line' || el.type === 'svg')
                  ? new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height)
                  : undefined
                }
                rotation={el.rotation || 0}
                onPointerDown={handlePointerDown(el.id, el.x, el.y)}
                onPointerUp={handlePointerUp}
                onPointerUpOutside={handlePointerUp}
                // REMOVED: onPointerMove handler - now handled globally
                onPointerOver={handleElementMouseMove(el.id)}
                onPointerOut={handleElementMouseLeave(el.id)}
                ref={(node) => {
                  if (node) shapeRefs.current[el.id] = node;
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

                {/* Show hover outline when hovered but not selected */}
                {hoveredId === el.id && selectedId !== el.id && (
                  <HoverOutline element={el} />
                )}

                {el.id === selectedId && (
                  <ShapeSelect
                    element={el}
                    scaleFactor={canvasScaleFactor.current}
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
                  g.moveTo(currentPath[0].x, currentPath[0].y);
                  currentPath.slice(1).forEach(point => {
                    g.lineTo(point.x, point.y);
                  });
                  g.stroke({ width: 2, color: 0x000000, alpha: 1 });
                }
              }}
            />
          )}

          {/* Draggable corner squares - completely independent of shapes */}
          {selectedId && elements.find(el => el.id === selectedId) &&
            elements.find(el => el.id === selectedId)?.type !== 'line' &&
            elements.find(el => el.id === selectedId)?.type !== 'path' && (
              (() => {
                const selectedElement = elements.find(el => el.id === selectedId)!;

                // Calculate radius handle positions (similar to ShapeSelect logic)
                const getRadiusHandlePositions = () => {
                  const baseDistance = 12;
                  const radiusOffset = selectedElement.cornerRadius || 0;
                  const totalDistance = baseDistance + radiusOffset;
                  const rotation = selectedElement.rotation || 0;

                  // Calculate local positions relative to shape center
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
                };

                const radiusPositions = getRadiusHandlePositions();

                return (
                  <>
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
                    {(selectedElement.type === 'rectangle' || selectedElement.type === 'triangle') && (
                      <>
                        {/* Top-left radius handle */}
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

                        {/* Top-right radius handle */}
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

                        {/* Bottom-left radius handle */}
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

                        {/* Bottom-right radius handle */}
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

                  </>
                );
              })()
            )}

          {/* Rotation handles OUTSIDE the rotating containers */}
          {selectedId && elements.find(el => el.id === selectedId) &&
            elements.find(el => el.id === selectedId)?.type !== 'line' &&
            elements.find(el => el.id === selectedId)?.type !== 'path' && (
              <RotationHandles
                element={elements.find(el => el.id === selectedId)!}
                onRotate={(newRotation) => {
                  const rotationEvent = new CustomEvent('element-rotation-change', {
                    detail: {
                      id: selectedId,
                      rotation: newRotation
                    }
                  });
                  window.dispatchEvent(rotationEvent);
                }}
              />
            )}
        </CanvasContent>
      </Application>
      {/* Text Editor Overlay */}
      {editingTextId && (
        <TextEditor
          element={elements.find(el => el.id === editingTextId)!}
          onTextChange={handleTextChange}
          onTextEnd={handleTextEditEnd}
          canvasElement={canvasRef.current}
        />
      )}
    </>
  );
});