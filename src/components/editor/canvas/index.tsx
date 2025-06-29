'use client';

import React from 'react';
import { Application, extend } from '@pixi/react';
import { Container, Graphics, Rectangle, Text } from 'pixi.js';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';
import { useImperativeHandle, forwardRef, useState, useRef, useEffect, useCallback } from 'react';
import { drawShape, applyShadowToContainer, updateShadowForContainer } from '@/utils/drawing-utils';
import { createNewObject } from '@/lib/canvas-object-factory';
import ElementSelect from './element-select';
import HoverOutline from './hover-outline';
import CenterHighlight from './center-highlight';
import RotationHandles from './rotation-handles';
import ResizeHandle from './resize-handle';
import RadiusHandle from './radius-handle';
import { TextEditor } from './text-editor';
import { TextGroupEditor } from './textgroup-editor';
import { AnimatedTextGroup } from './animated-text-group';
import { CanvasContent } from './canvas-content';
import { GroupSelection } from './group-selection';
import { ContextMenu } from './context-menu';
import { Viewport } from 'pixi-viewport';
import { GridOverlay } from './grid-overlay';
import { GridConfig } from '../../../utils/grid-utils';
import { SnapGuides } from './snap-guides';
import { SnapGuide } from '../../../utils/element-snapping';
import { eventManager } from '@/lib/event-manager';
import { contextMenuManager } from '@/lib/context-menu-manager';

// Import Zustand stores
import { useCanvasElements, useCanvasGroups, useCanvasOperations } from '@/stores/useCanvasStore';
import { useSelectionStore } from '@/stores/useSelectionStore';
import { useUIStore } from '@/stores/useUIStore';
import { useTimelineStore } from '@/stores/useTimelineStore';

extend({ Container, Graphics, Text });

interface ContextMenuPosition {
  x: number;
  y: number;
  targetId: string;
  targetType?: 'element' | 'group';
}

interface CanvasProps {
  dimensions: { width: number; height: number };
  zoom?: number; // External zoom control
  onZoomChange?: (zoom: number) => void; // Callback when zoom changes
  // Add grid configuration
  gridConfig?: GridConfig;
  // Add snap guides
  snapGuides?: SnapGuide[];
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
    zoom = 1,
    onZoomChange,
    gridConfig,
    snapGuides = [],
  },
  ref
) {
  // Get data from stores instead of props
  const elements = useCanvasElements();
  const groups = useCanvasGroups();
  const { addElement, updateElement, moveElement, resizeElement, rotateElement, moveMultipleElements } = useCanvasOperations();
  
  // Selection store
  const { 
    selectedElements, 
    select: selectElement, 
    clearSelections 
  } = useSelectionStore();
  const selectedIds = selectedElements.map(el => el.id);
  
  // UI store
  const toolState = useUIStore(state => state.tools);
  const { 
    activeTool: tool, 
    isPathMode, 
    animationTarget, 
    lineStartPoint, 
    isLineChaining, 
    chainedLineIds 
  } = toolState;

  // Animation playback state
  const isPlaying = useTimelineStore(state => state.playback.isPlaying);

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

  // Context menu state
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  // Helper function to check if an element is part of a custom or polygon group
  const isElementInCustomOrPolygonGroup = (element: AnimatedCanvasObject): boolean => {
    const group = groups.find(g => g.id === element.groupId);
    return !!(group && !group.isDefaultGroup && (group.type === 'custom' || group.type === 'polygon'));
  };

  // Helper function to check if an element is a textgroup character
  const isTextGroupCharacter = (element: AnimatedCanvasObject): boolean => {
    return element.type === 'character' && !!element.parentTextGroupId;
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

  // Canvas click handler - handles tool-specific actions
  const handleCanvasClick = useCallback((e: FederatedPointerEvent) => {
    const { setActiveTool, setMaskPos, setLineStartPoint, setLineChaining, addChainedLineId, setClosingShape } = useUIStore.getState();
    
    if (tool === 'select') {
      clearSelections();
      return;
    }

    // Handle line and polygon drawing with two-click system
    if (tool === 'line' || tool === 'simpleLine') {
      // Check if we're in polygon chaining mode and trying to close the shape
      if (isLineChaining && chainedLineIds.length > 0) {
        const firstLineId = chainedLineIds[0];
        const firstLine = elements.find(el => el.id === firstLineId);
        
        if (firstLine?.lineOptions?.points) {
          const startPoint = firstLine.lineOptions.points.start;
          const clickDistance = Math.hypot(e.global.x - startPoint.x, e.global.y - startPoint.y);
          
          if (clickDistance <= 30) { // Within 30px of start point - close the polygon
            // Create the final closing line from current position to the origin
            const finalLine = createNewObject(
              'line', 
              0, 0, // Position will be calculated in createLine
              elements,
              undefined, // pathPoints
              isPathMode, // isPath
              undefined, // imageData
              undefined, // width
              undefined, // height
              undefined, // text
              lineStartPoint!, // Start from current line start point
              startPoint // End at the polygon's origin point
            );
            
            // If in path mode, mark it as a path
            if (isPathMode) {
              finalLine.isAnimationPath = true;
            }

            addElement(finalLine);
            addChainedLineId(finalLine.id);
            
            // Now trigger polygon closure
            setClosingShape(true);
            return;
          }
        }
      }

      if (!lineStartPoint) {
        // First click: Set the start point
        setLineStartPoint({ x: e.global.x, y: e.global.y });
        if (tool === 'line') {
          setLineChaining(true);
        }
      } else {
        // Second click: Create the line from start to end point
        const startPoint = lineStartPoint;
        const endPoint = { x: e.global.x, y: e.global.y };
        
        const newElement = createNewObject(
          'line', 
          0, 0, // Position will be calculated in createLine
          elements,
          undefined, // pathPoints
          isPathMode, // isPath
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined, // text
          startPoint,
          endPoint
        );
        
        // If in path mode, mark it as a path
        if (isPathMode) {
          newElement.isAnimationPath = true;
        }

        addElement(newElement);
        selectElement([newElement]);

        // Handle line chaining for polygon creation
        if (tool === 'line') {
          addChainedLineId(newElement.id);
          // Set the end point as the new start point for the next line
          setLineStartPoint(endPoint);
          
          // If we're in path mode and this is the first line in the chain,
          // we need to potentially add it to the animation
          if (isPathMode && chainedLineIds.length === 0) {
            // This is the first line in a potential polygon chain
            // For now, we'll wait to see if more lines are added
            // The polygon completion logic will handle path mode exit
          }
        } else {
          // For simpleLine, complete the line and exit
          setLineStartPoint(null);
          setActiveTool('select');
          setMaskPos(null);
          
          // If we were in path mode, add the line to animation and exit path mode
          if (isPathMode) {
            // Fire an event to add the line to the animation path
            const pathEvent = new CustomEvent('add-path-to-animation', {
              detail: { pathElement: newElement }
            });
            window.dispatchEvent(pathEvent);
            
            // Fire an event to exit path mode
            const exitPathEvent = new CustomEvent('exit-path-mode', {
              detail: { source: 'line-complete' }
            });
            window.dispatchEvent(exitPathEvent);
          }
        }
      }
      return;
    }

    // Handle other creation tools (non-line tools)
    if (['rectangle', 'circle', 'triangle', 'arc', 'text', 'textGroup'].includes(tool)) {
      const newElement = createNewObject(tool as 'rectangle' | 'circle' | 'triangle' | 'arc' | 'text' | 'textGroup', e.global.x, e.global.y, elements);
      
      // If in path mode, mark it as a path
      if (isPathMode) {
        newElement.isAnimationPath = true;
      }

      addElement(newElement);
      selectElement([newElement]);
      
      // Switch to select tool after creating elements
      setActiveTool('select');
      setMaskPos(null);
    }
  }, [tool, isPathMode, isLineChaining, chainedLineIds, lineStartPoint, elements, addElement, selectElement, clearSelections]);

  // Element selection handler
  const onElementSelect = useCallback((id: string | null, isMultiSelect?: boolean) => {
    if (id) {
      const element = elements.find(e => e.id === id);
      if (element) {
        selectElement(isMultiSelect ? [element] : [element], isMultiSelect);
      }
    } else {
      clearSelections();
    }
  }, [elements, selectElement, clearSelections]);

  // Element drag end handler
  const onElementDragEnd = useCallback((id: string, x: number, y: number) => {
    moveElement(id, { x, y });
  }, [moveElement]);

  // Group drag handler
  const onGroupDrag = useCallback((elementPositions: Array<{ id: string; x: number; y: number }>) => {
    moveMultipleElements(elementPositions.map(pos => ({ id: pos.id, x: pos.x, y: pos.y })));
  }, [moveMultipleElements]);

  // Line endpoint drag handler
  const onLineEndpointDrag = useCallback((id: string, endpoint: 'start' | 'end', x: number, y: number) => {
    const element = elements.find(el => el.id === id);
    if (element?.lineOptions?.points) {
      const updatedPoints = {
        ...element.lineOptions.points,
        [endpoint]: { x, y }
      };
      updateElement(id, {
        lineOptions: {
          ...element.lineOptions,
          points: updatedPoints
        }
      });
    }
  }, [elements, updateElement]);

  // Element resize handler
  const onElementResize = useCallback((id: string, width: number, height: number) => {
    resizeElement(id, { width, height });
  }, [resizeElement]);

  // Element rotate handler
  const onElementRotate = useCallback((id: string, rotation: number) => {
    rotateElement(id, rotation);
  }, [rotateElement]);

  // Element radius change handler
  const onElementRadiusChange = useCallback((id: string, cornerRadius: number) => {
    updateElement(id, { cornerRadius });
  }, [updateElement]);

  // Text change handlers
  const onTextChange = useCallback((id: string, text: string) => {
    updateElement(id, { text });
  }, [updateElement]);

  const onTextGroupChange = useCallback((textGroupId: string, newText: string, characterElements: AnimatedCanvasObject[]) => {
    // Get the textGroup element to access its properties
    const textGroupElement = elements.find(el => el.id === textGroupId);
    if (!textGroupElement) return;
    
    // Calculate the new characters array and width
    const newCharacters = newText.split('');
    const fontSize = textGroupElement.fontSize || 16;
    const letterSpacing = textGroupElement.letterSpacing || 0;
    const fontFamily = textGroupElement.fontFamily || 'Arial, sans-serif';
    
    // Calculate total width using canvas measurement (matching TextGroupEditor logic)
    let totalWidth = 0;
    newCharacters.forEach((char) => {
      // Use canvas measurement for accurate width calculation
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (context) {
        context.font = `${fontSize}px ${fontFamily}`;
        const metrics = context.measureText(char);
        totalWidth += metrics.width + letterSpacing;
      } else {
        // Fallback
        totalWidth += fontSize * 0.6 + letterSpacing;
      }
      canvas.remove();
    });
    const newTextWidth = Math.max(totalWidth - letterSpacing, fontSize);
    
    // Update the textGroup element with all necessary properties
    updateElement(textGroupId, { 
      text: newText,
      characters: newCharacters,
      width: newTextWidth
    });
    
    // Update character elements
    characterElements.forEach(char => {
      updateElement(char.id, char);
    });
  }, [updateElement, elements]);

  // Path start click handler
  const onPathStartClick = useCallback((elementId: string, x: number, y: number) => {
    const { setLineStartPoint } = useUIStore.getState();
    setLineStartPoint({ x, y });
  }, []);

  // Context menu action handlers
  const onCopyElement = useCallback((elementId: string) => {
    const element = elements.find(el => el.id === elementId);
    if (element) {
      // Create a copy with new ID and offset position
      const copiedElement = {
        ...element,
        id: crypto.randomUUID(),
        name: `${element.name} Copy`,
        x: element.x + 20,
        y: element.y + 20,
      };
      addElement(copiedElement);
      selectElement([copiedElement]);
    }
  }, [elements, addElement, selectElement]);

  const onGroupElements = useCallback((elementIds: string[]) => {
    // This would need to be implemented with the group creation logic
    console.log('Group elements:', elementIds);
  }, []);

  const onMoveToFront = useCallback((elementId: string) => {
    // This would need to be implemented with z-index management
    console.log('Move to front:', elementId);
  }, []);

  const onMoveToBack = useCallback((elementId: string) => {
    // This would need to be implemented with z-index management
    console.log('Move to back:', elementId);
  }, []);

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
      if (onZoomChange) {
        onZoomChange(currentScale);
      }
    };

    // Listen for zoom changes from user interactions (wheel, pinch, etc.)
    viewport.on('zoomed', handleZoomChange);
    viewport.on('moved', handleZoomChange); // Also listen for viewport moves which can include zoom

    return () => {
      viewport.off('zoomed', handleZoomChange);
      viewport.off('moved', handleZoomChange);
    };
  }, [onZoomChange]);

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

  // Update shadows when element properties change
  useEffect(() => {
    elements.forEach((element) => {
      const container = shapeRefs.current[element.id];
      if (container) {
        updateShadowForContainer(container, element);
      }
    });
  }, [elements]); // Re-run when elements array changes (properties updated)

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
    // Check for right-click (button 2) and show context menu
    if (e.button === 2) {
      handleRightClick(e, id);
      return;
    }

    // When using creation tools (not select), call the canvas click handler directly
    // to create new objects on top of existing shapes
    // Exception: draw tool should allow drawing over existing elements
    if (tool !== 'select' && tool !== 'draw') {
      e.stopPropagation();
      handleCanvasClick(e);
      return;
    }

    // For draw tool, allow drawing to start on existing elements
    if (tool === 'draw') {
      // Let the drawing behavior happen, don't stop propagation
      // This allows the drawing to start at the element's position
      handleCanvasPointerDown(e);
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
        handleCanvasClick(e); // This will trigger the shape closing logic
        return;
      }
    }

    // Handle textgroup character clicks - redirect to parent textGroup with double-click support
    if (isTextGroupCharacter(element)) {
      const parentTextGroup = elements.find(el => el.id === element.parentTextGroupId);
      if (parentTextGroup) {
        // Check for double-click on character (which should be treated as double-click on textGroup)
        const currentTime = Date.now();
        const lastClickTime = textClickTimeRef.current.get(parentTextGroup.id) || 0;
        const timeDiff = currentTime - lastClickTime;

        console.log('Character click detected, redirecting to textGroup:', { 
          characterId: id, 
          textGroupId: parentTextGroup.id, 
          currentTime, 
          lastClickTime, 
          timeDiff 
        });

        if (timeDiff < 300) { // Double-click detected (within 300ms)
          console.log('Double-click on character detected, entering edit mode for textGroup:', parentTextGroup.id);
          setEditingTextId(parentTextGroup.id);
          selectElement([parentTextGroup], isMultiSelect);
          textClickTimeRef.current.delete(parentTextGroup.id); // Clear the click time
          return;
        } else {
          // Single click - store the time and continue with selection logic
          console.log('Single click on character detected, storing time for textGroup:', parentTextGroup.id);
          textClickTimeRef.current.set(parentTextGroup.id, currentTime);
        }

        // Select the parent textGroup instead of the character
        selectElement([parentTextGroup], isMultiSelect);
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
    if (element?.type === 'line' && element.lineOptions?.points) {
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
      } else if (tool === 'line' || tool === 'simpleLine') {
        setCursor(LINE_CURSOR);
      } else if (tool === 'text' || tool === 'textGroup') {
        setCursor(TEXT_CURSOR);
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || tool === 'arc') {
        setCursor(CROSS_CURSOR);
      } else {
        setCursor(DEFAULT_CURSOR);
      }
    }

    if (isDrawing) {
      if (currentPath.length > 1) {
        if (tool === 'draw') {
          // Create a new path element
          const newElement = createNewObject('path', 0, 0, elements, currentPath);

          // If in path mode, mark it as a path
          if (isPathMode) {
            newElement.isAnimationPath = true;
          }

          selectElement([newElement]);
          if (addElement) {
            addElement(newElement);

            // Signal to parent that drawing is complete and we should exit draw mode
            const customEvent = new CustomEvent('draw-complete', {
              detail: { 
                tool: 'draw',
                element: newElement,
                isPathMode: isPathMode 
              }
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
    if ((tool === 'line' && isLineChaining) || (tool === 'simpleLine' && lineStartPoint)) {
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
      
      // Initialize path state
      setCurrentPath([newPoint]);
    }
  };

  const handleCanvasPointerMove = (e: FederatedPointerEvent) => {
    // Always update mouse position for line preview and drawing tools
    setMousePos({ x: e.global.x, y: e.global.y });

    if (isDrawing && tool === 'draw') {
      const newPoint = { x: e.global.x, y: e.global.y };
      
      // Update React state for visual feedback - let the draw function handle rendering
      setCurrentPath(prev => {
        const lastPoint = prev[prev.length - 1];
        if (lastPoint) {
          const distance = Math.hypot(newPoint.x - lastPoint.x, newPoint.y - lastPoint.y);
          // Only add point if moved at least 1 pixel for smoother lines
          if (distance >= 1) {
            return [...prev, newPoint];
          }
        }
        return prev;
      });
    }
  };

  // Update handleElementMouseMove to manage hover state
  const handleElementMouseMove = (id: string) => (e: FederatedPointerEvent) => {
    // Always update mouse position during line chaining, even when hovering over elements
    if ((tool === 'line' && isLineChaining) || (tool === 'simpleLine' && lineStartPoint)) {
      setMousePos({ x: e.global.x, y: e.global.y });
    }

    // Skip hover effects for textgroup characters
    const hoveredElement = elements.find(el => el.id === id);
    if (hoveredElement && isTextGroupCharacter(hoveredElement)) {
      return;
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
      } else if (tool === 'line' || tool === 'simpleLine') {
        setCursor(LINE_CURSOR);
      } else if (tool === 'text' || tool === 'textGroup') {
        setCursor(TEXT_CURSOR);
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || tool === 'arc') {
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
  };

  const handleTextGroupChange = (textGroupId: string, newText: string, characterElements: AnimatedCanvasObject[]) => {
    if (onTextGroupChange) {
      onTextGroupChange(textGroupId, newText, characterElements);
    }
  };

  const handleTextEditEnd = () => {
    setEditingTextId(null);
  };

  // Context menu handlers
  const handleRightClick = (e: FederatedPointerEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only show context menu for shapes (not animation paths or characters)
    const element = elements.find(el => el.id === elementId);
    if (!element || element.isAnimationPath || isTextGroupCharacter(element)) {
      return;
    }

    // Get the canvas element to calculate proper screen coordinates
    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const screenX = rect.left + e.global.x;
    const screenY = rect.top + e.global.y;

    // Use context menu manager to ensure only one menu is shown
    const menuId = 'canvas-context-menu';
    contextMenuManager.openContextMenu(menuId);

    setContextMenu({
      x: screenX,
      y: screenY,
      targetId: elementId,
      targetType: 'element'
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const { targetId } = contextMenu;
    
    switch (action) {
      case 'copy':
        if (onCopyElement) {
          onCopyElement(targetId);
        }
        break;
      case 'group':
        if (onGroupElements) {
          onGroupElements([targetId]);
        }
        break;
      case 'moveToFront':
        if (onMoveToFront) {
          onMoveToFront(targetId);
        }
        break;
      case 'moveToBack':
        if (onMoveToBack) {
          onMoveToBack(targetId);
        }
        break;
    }
    
    setContextMenu(null);
  };

  // Close context menu on outside clicks and global close events
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      contextMenuManager.closeAllContextMenus();
    };
    
    const handleGlobalClose = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('close-context-menu', handleGlobalClose);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('close-context-menu', handleGlobalClose);
      };
    }
  }, [contextMenu]);

  // Disable browser context menu on canvas
  useEffect(() => {
    const handleContextMenu = (e: Event) => {
      e.preventDefault();
    };
    
    const canvas = document.querySelector('canvas');
    if (canvas) {
      canvas.addEventListener('contextmenu', handleContextMenu);
      return () => canvas.removeEventListener('contextmenu', handleContextMenu);
    }
  }, []);

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

  // Update the useEffect that manages global event listeners
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
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || tool === 'arc') {
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
        } else if (tool === 'line' || tool === 'simpleLine') {
          setCursor(LINE_CURSOR);
        } else if (tool === 'text') {
          setCursor(TEXT_CURSOR);
        } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || tool === 'arc') {
          setCursor(CROSS_CURSOR);
        } else {
          setCursor(DEFAULT_CURSOR);
        }
      }
    };

    // Create wrapper functions to properly handle event types with EventManager
    const handleGlobalPointerMoveWrapper = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => {
      if (event instanceof PointerEvent) {
        handleGlobalPointerMove(event);
      }
    };

    const handleGlobalPointerUpWrapper = () => {
      handleGlobalPointerUp();
    };

    // Use EventManager instead of direct event listeners
    eventManager.addListener('pointermove', handleGlobalPointerMoveWrapper);
    eventManager.addListener('pointerup', handleGlobalPointerUpWrapper);

    return () => {
      eventManager.removeListener('pointermove', handleGlobalPointerMoveWrapper);
      eventManager.removeListener('pointerup', handleGlobalPointerUpWrapper);
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
    } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle' || tool === 'arc') {
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

  const handleSelectElement = useCallback((id: string | null, isMultiSelect = false) => {
    if (id) {
      const element = elements.find(e => e.id === id);
      if (element) {
        selectElement(isMultiSelect ? [element] : [element], isMultiSelect);
      }
    } else {
      clearSelections();
    }
  }, [elements, selectElement, clearSelections]);

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
                handleSelectElement(null);
                handleCanvasClick(e);
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
                        } else if (el.type === 'path' || el.type === 'image') {
                          return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                        }
                        return undefined;
                      })()}
                      rotation={el.rotation || 0}
                      onPointerDown={handlePointerDown(el.id, el.x, el.y)}
                      onPointerUp={handlePointerUp}
                      onPointerUpOutside={handlePointerUp}
                      onPointerOver={handleElementMouseMove(el.id)}
                      onPointerOut={handleElementMouseLeave(el.id)}
                      ref={(node) => {
                        if (node) {
                          shapeRefs.current[el.id] = node;
                          // Apply shadow when container is created
                          applyShadowToContainer(node, el);
                        }
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

                {/* Render individual characters for character elements */}
                {el.type === 'character' && (
                  <pixiText
                    text={el.character || el.text || ' '}
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

                {/* Render textGroup elements using AnimatedTextGroup component */}
                {el.type === 'textGroup' && editingTextId !== el.id && (
                  <AnimatedTextGroup element={el} />
                )}

                                      {/* Show hover outline when hovered but not selected (but not for textgroup characters or elements in custom/polygon groups) */}
                {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
                  <HoverOutline element={el} />
                )}

                {/* Show selection outline for all selected elements (but not for textgroup characters or elements in custom/polygon groups) */}
                {!isPlaying && selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
                  <ElementSelect
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
                  } else if (el.type === 'path' || el.type === 'image') {
                    return new Rectangle(-el.width / 2, -el.height / 2, el.width, el.height);
                  }
                  return undefined;
                })()}
                rotation={el.rotation || 0}
                onPointerDown={handlePointerDown(el.id, el.x, el.y)}
                onPointerUp={handlePointerUp}
                onPointerUpOutside={handlePointerUp}
                onPointerOver={handleElementMouseMove(el.id)}
                onPointerOut={handleElementMouseLeave(el.id)}
                ref={(node) => {
                  if (node) {
                    shapeRefs.current[el.id] = node;
                    // Apply shadow when container is created
                    applyShadowToContainer(node, el);
                  }
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

                {/* Render individual characters for character elements */}
                {el.type === 'character' && (
                  <pixiText
                    text={el.character || el.text || ' '}
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

                {/* Render textGroup elements using AnimatedTextGroup component */}
                {el.type === 'textGroup' && editingTextId !== el.id && (
                  <AnimatedTextGroup element={el} />
                )}

                                      {/* Show hover outline when hovered but not selected (but not for textgroup characters or elements in custom/polygon groups) */}
                {!isPlaying && hoveredId === el.id && !selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
                  <HoverOutline element={el} />
                )}

                {/* Show selection outline for all selected elements (but not for textgroup characters or elements in custom/polygon groups) */}
                {!isPlaying && selectedIds.includes(el.id) && !isTextGroupCharacter(el) && !isElementInCustomOrPolygonGroup(el) && (
                  <ElementSelect
                    element={el}
                    scaleFactor={canvasScaleFactor.current}
                  />
                )}

                {/* Show center highlight when in path mode and this element is the animation target */}
                {isPathMode && animationTarget && animationTarget.elementId === el.id && (
                  <CenterHighlight
                    isVisible={true}
                    onCenterClick={() => {
                      if (onPathStartClick) {
                        onPathStartClick(el.id, el.x, el.y);
                      }
                    }}
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
                  g.stroke({ 
                    width: 2, 
                    color: 0x000000, 
                    alpha: 1,
                    cap: 'round',
                    join: 'round'
                  });
                }
              }}
            />
          )}

          {/* Line preview layer */}
          {(tool === 'line' || tool === 'simpleLine') && lineStartPoint && mousePos && (
            <pixiGraphics
              eventMode="none"
              draw={(g) => {
                g.clear();

                // Check if we're in chaining mode and if mouse is near a point that can close the shape
                let canCloseShape = false;
                let snapToPoint = mousePos;

                if (isLineChaining && chainedLineIds.length > 0) {
                  // Find the first line in the chain by its ID
                  const firstLineId = chainedLineIds[0];
                  const firstLine = elements.find(el => el.id === firstLineId);
                  
                  if (firstLine?.lineOptions?.points?.start) {
                    const originalStartPoint = firstLine.lineOptions.points.start;
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

          {/* Draggable corner squares - only for single selection and when not playing animations */}
          {!isPlaying && selectedIds.length === 1 && selectedIds.map(selectedId => {
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
          {!isPlaying && selectedIds.length > 1 && (
            <GroupSelection
              selectedElements={elements.filter(el => selectedIds.includes(el.id))}
              scaleFactor={canvasScaleFactor.current}
              onGroupDragStart={handleGroupSelectionDragStart}
              allElements={elements}
              gridConfig={gridConfig}
              groups={groups}
            />
          )}

          {/* Rotation handles OUTSIDE the rotating containers (only for single selection and when not playing animations) */}
          {!isPlaying && selectedIds.length === 1 && (() => {
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
      
      {/* Context Menu */}
      <ContextMenu
        contextMenu={contextMenu}
        onAction={handleContextMenuAction}
        onClose={() => setContextMenu(null)}
      />
      
      {/* Text Editor Overlay */}
      {editingTextId && (() => {
        const editingElement = elements.find(el => el.id === editingTextId);
        if (!editingElement) return null;

        if (editingElement.type === 'textGroup') {
          // Find all character elements that belong to this textGroup
          const characterElements = elements.filter(el => 
            el.type === 'character' && el.parentTextGroupId === editingTextId
          );
          
          return (
            <TextGroupEditor
              element={editingElement}
              characterElements={characterElements}
              onTextGroupChange={handleTextGroupChange}
              onTextEnd={handleTextEditEnd}
              canvasElement={canvasRef.current}
            />
          );
        } else {
          return (
            <TextEditor
              element={editingElement}
              onTextChange={handleTextChange}
              onTextEnd={handleTextEditEnd}
              canvasElement={canvasRef.current}
            />
          );
        }
      })()}
    </>
  );
});