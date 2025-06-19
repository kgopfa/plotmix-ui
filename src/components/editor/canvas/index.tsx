'use client';

import React from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef, useEffect } from 'react';
import { drawShape } from '@/utils/drawing-utils';
import { createNewObject } from '@/lib/canvas-object-factory';
import ObjectSelect from './object-select';
import HoverOutline from './hover-outline';
import RotationHandles from './rotation-handles';
import ResizeHandle from './resize-handle';
import RadiusHandle from './radius-handle';
import { TextEditor } from './text-editor';
import { CanvasContent } from './canvas-content';
import { GroupSelection } from './group-selection';
import { Viewport } from 'pixi-viewport';
import { GridOverlay } from './grid-overlay';
import { GridConfig } from '../../../utils/grid-utils';
import { SnapGuides } from './snap-guides';
import { SnapGuide } from '../../../utils/element-snapping';


extend({ Container, Graphics, Text });

interface CanvasProps {
  dimensions: { width: number; height: number };
  elements: AnimatedCanvasObject[];
  groups?: CanvasGroup[];
  selectedIds: string[];
  onElementSelect: (id: string | null, isMultiSelect?: boolean) => void;
  onElementDragEnd: (id: string, x: number, y: number) => void;
  onCanvasClick: (e: FederatedPointerEvent) => void;
  onLineEndpointDrag?: (id: string, endpoint: 'start' | 'end', x: number, y: number) => void;
  onElementResize?: (id: string, width: number, height: number) => void;
  tool: string;
  onAddElement?: (element: AnimatedCanvasObject) => void;
  isPathMode?: boolean;
  onElementRotate?: (id: string, rotation: number) => void;
  onElementRadiusChange?: (id: string, cornerRadius: number) => void;
  onTextChange?: (id: string, text: string) => void;
  zoom?: number; // External zoom control
  onZoomChange?: (zoom: number) => void; // Callback when zoom changes
  // Add group drag handler
  onGroupDrag?: (elementPositions: Array<{ id: string; x: number; y: number }>) => void;
  // Add grid configuration
  gridConfig?: GridConfig;
  // Add snap guides
  snapGuides?: SnapGuide[];
  // Add line preview
  lineStartPoint?: { x: number; y: number } | null;
  // Add line chaining state
  isLineChaining?: boolean;
  // Add chained line IDs for polygon closing detection
  chainedLineIds?: string[];
}

export interface CanvasRef {
  getShapeRefs: () => Record<string, Container>;
  getGroupContainers: () => Record<string, Container>;
  zoomIn: () => void;
  zoomOut: () => void;
  getViewport: () => Viewport | null;
  centerOnElement: (id?: string) => void;
  zoomToFitElement: (id?: string) => void;
  getCurrentZoom: () => number;
  setZoom: (scale: number) => void;
  getViewportCenter: () => { x: number; y: number };
  resetToCenter: () => void;
  resetZoomToOneHundredPercent: () => void;
}

// Define resize handle positions
type ResizeHandle = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | null;

const DEFAULT_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 64 64\'%3E%3Cg id=\'_01_Cursor\' data-name=\'01 Cursor\'%3E%3Cpath d=\'m60.2373 22.2021-54.3813-20.2031a3.0174 3.0174 0 0 0 -3.857 3.857l20.2031 54.3813a3.0112 3.0112 0 0 0 5.6763-.15l7.4541-23.8794a1.3336 1.3336 0 0 1 .8745-.875l23.88-7.4541a3.0113 3.0113 0 0 0 .1503-5.6767zm-.7461 3.7671-23.88 7.4541a3.3371 3.3371 0 0 0 -2.1875 2.188l-7.4541 23.88a.9953.9953 0 0 1 -1.8921.05l-20.2035-54.3813c-.2335-1.0229.438-1.4758 1.286-1.286l54.381 20.2031a.9955.9955 0 0 1 -.0498 1.8921z\' fill=\'black\' stroke=\'black\' stroke-width=\'2\'/%3E%3C/g%3E%3C/svg%3E") 3 3, auto';

const LINE_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23000\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M12 19l7-7 3 3-7 7-3-3z\'/%3E%3Cpath d=\'M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z\'/%3E%3Cpath d=\'M2 2l7.586 7.586\'/%3E%3Ccircle cx=\'11\' cy=\'11\' r=\'2\'/%3E%3C/svg%3E") 3 3, auto';

const DRAW_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 512 512\'%3E%3Cpath d=\'M498.125,92.38l-78.505-78.506c-18.496-18.497-48.436-18.5-66.935,0C339.518,27.043,50.046,316.516,44.525,322.035c-2.182,2.182-3.725,4.918-4.46,7.915L0.502,491.068c-3.036,12.368,8.186,23.44,20.431,20.432c8.361-2.053,153.718-37.747,161.117-39.564c2.996-0.735,5.734-2.278,7.915-4.46c5.816-5.816,293.677-293.677,308.161-308.161C516.622,140.818,516.627,110.879,498.125,92.38zM39.957,472.043l1.612-6.562l4.951,4.951L39.957,472.043zM84.874,461.014l-33.887-33.887l14.736-60.009l79.16,79.16L84.874,461.014zM178.022,431.647l-97.668-97.668L332.559,81.773l97.668,97.668L178.022,431.647zM474.24,135.429l-19.508,19.507l-97.667-97.668l19.507-19.507c5.294-5.293,13.867-5.298,19.163,0l78.506,78.507C479.536,121.563,479.536,130.132,474.24,135.429z\' fill=\'black\'/%3E%3C/svg%3E") 0 20, auto';

const TEXT_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'20\' height=\'20\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 20c-4.418 0-8-3.582-8-8s3.582-8 8-8 8 3.582 8 8-3.582 8-8 8zm0-14c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6z\' fill=\'black\'/%3E%3C/svg%3E") 0 20, auto';

const CROSS_CURSOR = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'14\' height=\'14\' viewBox=\'0 0 24 24\'%3E%3Cpath d=\'M12 2v20M2 12h20\' stroke=\'black\' stroke-width=\'2\' stroke-linecap=\'round\'/%3E%3C/svg%3E") 12 12, crosshair';

const setCursor = (cursor: string) => {
  document.body.style.cursor = cursor;
};

export const Canvas = forwardRef<CanvasRef, CanvasProps>(function Canvas(
  {
    dimensions,
    elements,
    groups = [],
    selectedIds,
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
    zoom = 1,
    onZoomChange,
    onGroupDrag,
    gridConfig,
    snapGuides = [],
    lineStartPoint,
    isLineChaining = false,
    chainedLineIds = [],
  },
  ref
) {
  const shapeRefs = useRef<Record<string, Container>>({});
  const groupContainers = useRef<Record<string, Container>>({});
  const viewportRef = useRef<Viewport | null>(null);
  const HANDLE_SIZE = 10;
  const drawingRef = useRef<Graphics | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const textClickTimeRef = useRef<Map<string, number>>(new Map());
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);

  // Add hover state
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Helper function to check if a character's parent textGroup is selected
  const isCharacterParentSelected = (element: AnimatedCanvasObject): boolean => {
    if (element.type === 'character' && element.parentTextGroupId) {
      return selectedIds.includes(element.parentTextGroupId);
    }
    return false;
  };

  // Add mouse position for line preview
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);

  // Optional: Track zoom state for external components (like zoom indicators)
  const [currentZoom, setCurrentZoom] = useState(1);

  // Calculate the canvas scale factor based on device pixel ratio and any additional scaling
  const canvasScaleFactor = useRef(window.devicePixelRatio || 1);

  // Clean up group containers when groups are removed
  useEffect(() => {
    const currentGroupIds = new Set(groups.map(g => g.id));
    Object.keys(groupContainers.current).forEach(groupId => {
      if (!currentGroupIds.has(groupId)) {
        delete groupContainers.current[groupId];
      }
    });
  }, [groups]);

  useImperativeHandle(ref, () => ({
    getShapeRefs: () => shapeRefs.current,
    getGroupContainers: () => groupContainers.current,
    zoomIn: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const newScale = Math.min(viewport.scale.x * 1.1, 5); // Limit to 5x max zoom
      
      // Get the current center point of the viewport
      const currentCenter = viewport.center;
      
      // Use PIXI viewport's built-in center-based zoom
      viewport.setZoom(newScale, true);
      viewport.moveCenter(currentCenter);
      
      setCurrentZoom(newScale);
      if (onZoomChange) onZoomChange(newScale);
    },
    zoomOut: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const newScale = Math.max(viewport.scale.x * 0.9, 0.1); // Limit to 0.1x min zoom
      
      // Get the current center point of the viewport
      const currentCenter = viewport.center;
      
      // Use PIXI viewport's built-in center-based zoom
      viewport.setZoom(newScale, true);
      viewport.moveCenter(currentCenter);
      
      setCurrentZoom(newScale);
      if (onZoomChange) onZoomChange(newScale);
    },
    getCurrentZoom: () => currentZoom,
    setZoom: (scale: number) => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      const clampedScale = Math.min(Math.max(scale, 0.1), 5); // Limit between 0.1x and 5x
      
      // Get the current center point of the viewport
      const currentCenter = viewport.center;
      
      // Use PIXI viewport's built-in center-based zoom
      viewport.setZoom(clampedScale, true);
      viewport.moveCenter(currentCenter);
      
      setCurrentZoom(clampedScale);
      if (onZoomChange) onZoomChange(clampedScale);
    },
    getViewport: () => viewportRef.current,
    centerOnElement: (id?: string) => {
      const targetId = id || selectedIds[0];
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
      const targetId = id || selectedIds[0];
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
      if (onZoomChange) onZoomChange(1);
    },
    resetZoomToOneHundredPercent: () => {
      const viewport = viewportRef.current;
      if (!viewport) return;
      
      // Get the current center point of the viewport to maintain position
      const currentCenter = viewport.center;
      
      // Set zoom to exactly 1.0 (100%) while maintaining center
      viewport.setZoom(1, true);
      viewport.moveCenter(currentCenter);
      
      setCurrentZoom(1);
      if (onZoomChange) onZoomChange(1);
    }
  }));

  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(null);
  const [draggingEndpoint, setDraggingEndpoint] = useState<'start' | 'end' | null>(null);
  // Add state for resizing
  const [resizingHandle, setResizingHandle] = useState<ResizeHandle>(null);
  const [initialSize, setInitialSize] = useState<{ width: number; height: number } | null>(null);
  const [initialMouse, setInitialMouse] = useState<{ x: number; y: number } | null>(null);
  // Add state for group dragging
  const [isDraggingGroup, setIsDraggingGroup] = useState<boolean>(false);
  const [groupDragOffsets, setGroupDragOffsets] = useState<Array<{ id: string; offsetX: number; offsetY: number }>>([]);
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

  // Sync external zoom with viewport
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    // Apply external zoom to viewport
    if (Math.abs(viewport.scale.x - zoom) > 0.01) { // Only if there's a meaningful difference
      viewport.setZoom(zoom, true);
      setCurrentZoom(zoom);
    }
  }, [zoom]);

  // Sync zoom state with viewport's actual scale and notify parent
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleZoomChange = () => {
      const currentScale = viewport.scale.x;
      setCurrentZoom(currentScale);
      if (onZoomChange && Math.abs(currentScale - zoom) > 0.01) {
        onZoomChange(currentScale);
      }
    };

    // Listen for zoom changes from user interactions (wheel, pinch, etc.)
    viewport.on('zoomed', handleZoomChange);

    return () => {
      viewport.off('zoomed', handleZoomChange);
    };
  }, [zoom, onZoomChange]);

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
  const getResizeHandleAtPoint = (element: AnimatedCanvasObject, x: number, y: number): ResizeHandle => {
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
    // When using creation tools (not select), call the canvas click handler directly
    // to create new objects on top of existing shapes
    if (tool !== 'select') {
      e.stopPropagation();
      onCanvasClick(e);
      return;
    }
    
    e.stopPropagation();

    const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ? 
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;

    const pos = e.global;
    const element = elements.find(el => el.id === id);

    if (!element) return;

    // Check for shape closing during line chaining mode
    if (isLineChaining && lineStartPoint && element.type === 'line' && element.lineOptions?.points) {
      const { start } = element.lineOptions.points;
      const clickX = pos.x;
      const clickY = pos.y;
      
      // Use larger click area for easier polygon closing - 15px instead of 7px
      const ENDPOINT_CLICK_SIZE = 15;
      const halfSize = ENDPOINT_CLICK_SIZE / 2;
      
      if (clickX >= start.x - halfSize && clickX <= start.x + halfSize &&
          clickY >= start.y - halfSize && clickY <= start.y + halfSize) {
        // Close the shape by connecting to the start point
        e.stopPropagation();
        onCanvasClick(e); // This will trigger the shape closing logic
        return;
      }
    }

    // Special handling for characters when their parent textGroup is selected
    if (element.type === 'character' && element.parentTextGroupId && isCharacterParentSelected(element)) {
      // Find the parent textGroup
      const parentTextGroup = elements.find(el => el.id === element.parentTextGroupId);
      if (parentTextGroup) {
        // Delegate the drag operation to the parent textGroup
        // Don't change selection - keep the textGroup selected
        // But set up dragging for the textGroup instead
        setDraggingId(parentTextGroup.id);
        setDragOffset({ x: pos.x - parentTextGroup.x, y: pos.y - parentTextGroup.y });
        setIsDraggingGroup(false);
        return;
      }
    }

    onElementSelect(id, isMultiSelect);

    // For text and textGroup elements, handle double-click to edit, single click to drag
    if (element.type === 'text' || element.type === 'textGroup') {
      // Check if this is a double-click
      const currentTime = Date.now();
      const lastClickTime = textClickTimeRef.current.get(id) || 0;
      const timeDiff = currentTime - lastClickTime;

      console.log('Text click detected:', { id, currentTime, lastClickTime, timeDiff, type: element.type });

      if (timeDiff < 300) { // Double-click detected (within 300ms)
        console.log('Double-click detected, entering edit mode for:', id);
        setEditingTextId(id);
        onElementSelect(id, isMultiSelect);
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
    if (selectedIds.includes(id) && element.type !== 'line' && element.type !== 'path') {
      const handle = getResizeHandleAtPoint(element, pos.x, pos.y);

      if (handle) {
        setResizingHandle(handle);
        setDraggingId(id);
        setInitialSize({ width: element.width, height: element.height });
        setInitialMouse({ x: pos.x, y: pos.y });
        onElementSelect(id, isMultiSelect);

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

      // Use larger click area for easier endpoint interaction - 12px instead of 7px
      const ENDPOINT_CLICK_SIZE = 12;
      const halfSize = ENDPOINT_CLICK_SIZE / 2;
      
      // Check if click is within start point square bounds
      if (clickX >= start.x - halfSize && clickX <= start.x + halfSize &&
          clickY >= start.y - halfSize && clickY <= start.y + halfSize) {
        setDraggingEndpoint('start');
        setDraggingId(id);
        onElementSelect(id, isMultiSelect);
        return;
      }

      // Check if clicking near end point (larger click area for easier interaction)
      if (clickX >= end.x - halfSize && clickX <= end.x + halfSize &&
          clickY >= end.y - halfSize && clickY <= end.y + halfSize) {
        setDraggingEndpoint('end');
        setDraggingId(id);
        onElementSelect(id, isMultiSelect);
        return;
      }
    }

    // Regular shape drag - check if multiple elements are selected for group dragging
    if (selectedIds.length > 1 && selectedIds.includes(id)) {
      // Group dragging: calculate offsets for all selected elements
      const offsets = selectedIds.map(selectedId => {
        const selectedElement = elements.find(el => el.id === selectedId);
        if (!selectedElement) return { id: selectedId, offsetX: 0, offsetY: 0 };
        return {
          id: selectedId,
          offsetX: pos.x - selectedElement.x,
          offsetY: pos.y - selectedElement.y
        };
      });
      
      setGroupDragOffsets(offsets);
      setIsDraggingGroup(true);
      setDraggingId(id); // Still track the primary dragged element
      onElementSelect(id, isMultiSelect);
    } else {
      // Single element drag
      setDraggingId(id);
      onElementSelect(id, isMultiSelect);
      setDragOffset({ x: pos.x - shapeX, y: pos.y - shapeY });
      setIsDraggingGroup(false);
    }
  };

  // Update the handlePointerUp function
  const handlePointerUp = () => {
    // Reset all dragging and resizing state (except resize, which is handled by global handler)
    if (!resizingHandle) {
      setDraggingId(null);
      setDragOffset(null);
      setDraggingEndpoint(null);
      // Reset group dragging state
      setIsDraggingGroup(false);
      setGroupDragOffsets([]);
      
      // Reset the dragging flag for performance optimization
      const resetDragEvent = new CustomEvent('group-drag-end');
      window.dispatchEvent(resetDragEvent);

      // Reset cursor style based on current tool
      if (tool === 'draw') {
        setCursor(DRAW_CURSOR);
      } else if (tool === 'line') {
        setCursor(LINE_CURSOR);
      } else if (tool === 'text' || tool === 'textGroup') {
        setCursor(TEXT_CURSOR);
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
        setCursor(CROSS_CURSOR);
      } else {
        setCursor(DEFAULT_CURSOR);
      }
    }

    if (isDrawing) {
      if (currentPath.length > 1) {
        if (tool === 'draw') {
          // Create a new path element
          // Pass 0,0 as position since the element factory now calculates the correct center position
          const newElement = createNewObject('path', 0, 0, elements, currentPath);

          // If in path mode, mark it as a path
          if (isPathMode) {
            newElement.isAnimationPath = true;
          }

          onElementSelect(newElement.id, false);
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

  // Global pointer move handler for dragging operations and line chaining
  const handleGlobalPointerMove = (e: PointerEvent) => {
    // Always update mouse position for line chaining, even when hovering over elements
    if (tool === 'line' && isLineChaining) {
      const canvasElement = document.querySelector('canvas');
      if (canvasElement) {
        const rect = canvasElement.getBoundingClientRect();
        const canvasX = e.clientX - rect.left;
        const canvasY = e.clientY - rect.top;
        setMousePos({ x: canvasX, y: canvasY });
      }
    }

    if (!draggingId) return;

    // Get the canvas element to calculate proper coordinates
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;

    // Handle virtual group dragging first
    if (draggingId === 'virtual-group') {
      if (isDraggingGroup && groupDragOffsets.length > 0 && onGroupDrag) {
        // Handle group dragging: calculate new positions for all selected elements
        const newPositions = groupDragOffsets.map(offset => ({
          id: offset.id,
          x: canvasX - offset.offsetX,
          y: canvasY - offset.offsetY
        }));
        onGroupDrag(newPositions);
      }
      return;
    }

    // For individual element dragging, find the element
    const element = elements.find(el => el.id === draggingId);
    if (!element) return;

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
    // Always update mouse position for line preview, regardless of what's being hovered
    setMousePos({ x: e.global.x, y: e.global.y });

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
    // Always update mouse position during line chaining, even when hovering over elements
    if (tool === 'line' && isLineChaining) {
      setMousePos({ x: e.global.x, y: e.global.y });
    }

    // Update hover state
    if (hoveredId !== id) {
      setHoveredId(id);
    }

    // Only handle cursor change for selected elements that are not being dragged
    if (!selectedIds.includes(id) || draggingId) return;

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
      } else if (tool === 'text' || tool === 'textGroup') {
        setCursor(TEXT_CURSOR);
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
        setCursor(CROSS_CURSOR);
      } else {
        setCursor(DEFAULT_CURSOR);
      }
    }
  };

  const handleTextChange = (id: string, text: string) => {
    if (onTextChange) {
      onTextChange(id, text);
    }
    
    // For textGroup elements, we need to update the characters array
    const element = elements.find(el => el.id === id);
    if (element && element.type === 'textGroup') {
      // Dispatch a custom event to update the characters array
      const updateCharactersEvent = new CustomEvent('update-text-group-characters', {
        detail: {
          id,
          text,
          characters: text.split('')
        }
      });
      window.dispatchEvent(updateCharactersEvent);
    }
  };

  const handleTextEditEnd = () => {
    setEditingTextId(null);
  };

  // Handle drag start from the group selection area
  const handleGroupSelectionDragStart = (
    virtualElement: AnimatedCanvasObject, 
    mouseX: number, 
    mouseY: number,
    allElements?: AnimatedCanvasObject[],
    gridConfig?: GridConfig
  ) => {
    // Set up group dragging when user drags the group selection outline
    const offsets = selectedIds.map(selectedId => {
      const selectedElement = elements.find(el => el.id === selectedId);
      if (!selectedElement) return { id: selectedId, offsetX: 0, offsetY: 0 };
      return {
        id: selectedId,
        offsetX: mouseX - selectedElement.x,
        offsetY: mouseY - selectedElement.y
      };
    });
    
    // Store the virtual element and additional data for snapping
    setGroupDragOffsets(offsets);
    setIsDraggingGroup(true);
    setDraggingId('virtual-group'); // Use virtual group ID to distinguish from individual element drags
    
    // Store snapping context for group dragging
    if (allElements && gridConfig) {
      // Store these in state or refs if needed for the group drag handler
      // For now, we'll access them from the scope when needed
    }
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
        } else if (tool === 'text' || tool === 'textGroup') {
          setCursor(TEXT_CURSOR);
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
          setCursor(CROSS_CURSOR);
        } else {
          setCursor(DEFAULT_CURSOR);
        }
      }

      // Also handle other drag operations
      if (draggingId) {
        setDraggingId(null);
        setDragOffset(null);
        setDraggingEndpoint(null);
        // Reset group dragging state
        setIsDraggingGroup(false);
        setGroupDragOffsets([]);
        
        // Reset the dragging flag for performance optimization
        const resetDragEvent = new CustomEvent('group-drag-end');
        window.dispatchEvent(resetDragEvent);

        // Reset cursor style based on current tool
        if (tool === 'draw') {
          setCursor(DRAW_CURSOR);
        } else if (tool === 'line') {
          setCursor(LINE_CURSOR);
        } else if (tool === 'text' || tool === 'textGroup') {
          setCursor(TEXT_CURSOR);
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
          setCursor(CROSS_CURSOR);
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
  }, [draggingId, resizingHandle, initialSize, initialMouse, dragOffset, draggingEndpoint, isDraggingGroup, groupDragOffsets, elements, onElementDragEnd, onGroupDrag, onLineEndpointDrag, tool]);

  useEffect(() => {
    if (tool === 'draw') {
      setCursor(DRAW_CURSOR);
    } else if (tool === 'line') {
      setCursor(LINE_CURSOR);
    } else if (tool === 'text' || tool === 'textGroup') {
      setCursor(TEXT_CURSOR);
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
      setCursor(CROSS_CURSOR);
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
          {/* Grid overlay */}
          {gridConfig && (
            <GridOverlay
              gridConfig={gridConfig}
              viewportBounds={{
                x: 0,
                y: 0,
                width: dimensions.width,
                height: dimensions.height
              }}
              zoom={zoom}
            />
          )}
          
          {/* Snap guides */}
          <SnapGuides
            guides={snapGuides}
            canvasWidth={dimensions.width}
            canvasHeight={dimensions.height}
          />
          
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
                        } else if (el.type === 'path' || el.type === 'image' || el.type === 'textGroup') {
                          return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                        }
                        return undefined;
                      })()}
                      rotation={el.rotation || 0}
                                      onPointerDown={handlePointerDown(el.id, el.x, el.y)}
                onPointerUp={handlePointerUp}
                onPointerUpOutside={handlePointerUp}
                                              onPointerOver={el.type === 'character' && isCharacterParentSelected(el) ? undefined : handleElementMouseMove(el.id)}
                        onPointerOut={el.type === 'character' && isCharacterParentSelected(el) ? undefined : handleElementMouseLeave(el.id)}
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

                      {/* Render character elements */}
                      {el.type === 'character' && editingTextId !== el.id && (
                        <pixiText
                          text={el.character || el.text || 'A'}
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

                      {/* Note: textGroup elements don't render directly - only their child characters do */}

                      {/* Show hover outline when hovered but not selected (but not for characters when parent textGroup is selected) */}
                      {hoveredId === el.id && !selectedIds.includes(el.id) && !(el.type === 'character' && isCharacterParentSelected(el)) && (
                        <HoverOutline element={el} />
                      )}

                      {/* Show selection outline for all selected elements (but not for characters when parent textGroup is selected) */}
                      {selectedIds.includes(el.id) && !(el.type === 'character' && isCharacterParentSelected(el)) && (
                        <ObjectSelect
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
                    interactive={el.type === 'character' ? !isCharacterParentSelected(el) : true}
                    eventMode={el.type === 'character' && isCharacterParentSelected(el) ? "none" : "dynamic"}
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
                        } else if (el.type === 'path' || el.type === 'image' || el.type === 'textGroup') {
                          return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                        }
                        return undefined;
                      })()}
                    rotation={el.rotation || 0}
                    onPointerDown={handlePointerDown(el.id, el.x, el.y)}
                    onPointerUp={handlePointerUp}
                    onPointerUpOutside={handlePointerUp}
                    // REMOVED: onPointerMove handler - now handled globally
                    onPointerOver={el.type === 'character' && isCharacterParentSelected(el) ? undefined : handleElementMouseMove(el.id)}
                    onPointerOut={el.type === 'character' && isCharacterParentSelected(el) ? undefined : handleElementMouseLeave(el.id)}
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

                {/* Render character elements */}
                {el.type === 'character' && editingTextId !== el.id && (
                  <pixiText
                    text={el.character || el.text || 'A'}
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

                {/* Note: textGroup elements don't render directly - only their child characters do */}

                {/* Show hover outline when hovered but not selected (but not for characters when parent textGroup is selected) */}
                {hoveredId === el.id && !selectedIds.includes(el.id) && !(el.type === 'character' && isCharacterParentSelected(el)) && (
                  <HoverOutline element={el} />
                )}

                {/* Show selection outline for all selected elements (but not for characters when parent textGroup is selected) */}
                {selectedIds.includes(el.id) && !(el.type === 'character' && isCharacterParentSelected(el)) && (
                  <ObjectSelect
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

          {/* Line preview layer */}
          {tool === 'line' && lineStartPoint && mousePos && (
            <pixiGraphics
              eventMode="none"
              draw={(g) => {
                g.clear();
                
                // Check if we're in chaining mode and if mouse is near a point that can close the shape
                let canCloseShape = false;
                let snapToPoint = mousePos;
                
                if (isLineChaining) {
                  // Find the very first line created in this chain by looking for lines that start near our original starting point
                  // We need to find the actual first line in the chain to get the true original start point
                  const chainedLines = elements.filter(obj => obj.type === 'line' && obj.lineOptions?.points);
                  
                  // Find the line whose start point is closest to our original lineStartPoint
                  // This should be one of the first lines in our chain
                  let originalStartPoint = null;
                  let minDistance = Infinity;
                  
                  for (const line of chainedLines) {
                    if (line.lineOptions?.points?.start) {
                      const distance = Math.hypot(
                        line.lineOptions.points.start.x - lineStartPoint.x, 
                        line.lineOptions.points.start.y - lineStartPoint.y
                      );
                      if (distance < minDistance && distance < 10) {
                        minDistance = distance;
                        originalStartPoint = line.lineOptions.points.start;
                      }
                    }
                  }
                  
                  // If we couldn't find through chain, use first line
                  if (!originalStartPoint && chainedLines.length > 0) {
                    const firstLine = chainedLines[0];
                    if (firstLine.lineOptions?.points?.start) {
                      originalStartPoint = firstLine.lineOptions.points.start;
                    }
                  }
                  
                  if (originalStartPoint) {
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
                  
                  const startX = lineStartPoint.x + dx * startRatio;
                  const startY = lineStartPoint.y + dy * startRatio;
                  const endX = lineStartPoint.x + dx * endRatio;
                  const endY = lineStartPoint.y + dy * endRatio;
                  
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
                  g.rect(lineStartPoint.x - halfSize, lineStartPoint.y - halfSize, HANDLE_SIZE, HANDLE_SIZE);
                  g.fill({ color: 0xFFFFFF, alpha: 1 });
                  g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
                }
                
                // Draw end point indicator - special styling if can close shape
                if (canCloseShape) {
                  // Draw a larger, green circle to indicate shape closing
                  g.circle(snapToPoint.x, snapToPoint.y, 8);
                  g.fill({ color: 0x4CAF50, alpha: 0.8 });
                  g.stroke({ color: 0x2E7D32, width: 2 });
                  
                  // Draw inner circle
                  g.circle(snapToPoint.x, snapToPoint.y, 4);
                  g.fill({ color: 0xFFFFFF, alpha: 0.9 });
                } else {
                  // Regular end point indicator
                  g.circle(snapToPoint.x, snapToPoint.y, 4);
                  g.fill({ color: 0x888888, alpha: 0.7 });
                }
              }}
            />
          )}

          {/* Draggable corner squares - only for single selection */}
          {selectedIds.length === 1 && selectedIds.map(selectedId => {
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
                    x: selectedElement.x + localPosition.x * cos - localPosition.y * sin,
                    y: selectedElement.y + localPosition.x * sin + localPosition.y * cos
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
          <GroupSelection
            selectedElements={elements.filter(el => selectedIds.includes(el.id))}
            scaleFactor={canvasScaleFactor.current}
            onGroupDragStart={handleGroupSelectionDragStart}
            allElements={elements}
            gridConfig={gridConfig}
          />

          {/* Rotation handles OUTSIDE the rotating containers (only for single selection) */}
          {selectedIds.length === 1 && (() => {
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