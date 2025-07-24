import { useCallback, useState } from 'react';
import { FederatedPointerEvent, Container } from 'pixi.js';
import { createNewObject } from '@/lib/canvas-object-factory';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useUIStore } from '@/stores/use-ui-store';
import { convertPointerEventToDesignCanvasCoords } from '@/utils/coordinate-utils';

interface UseCanvasInteractionsProps {
  snapPoint: (point: { x: number; y: number }, event?: { shiftKey?: boolean }) => { x: number; y: number };
}

interface UseCanvasInteractionsReturn {
  // State
  hoveredId: string | null;
  isDrawing: boolean;
  currentPath: Array<{ x: number; y: number }>;
  mousePos: { x: number; y: number } | null;
  editingTextId: string | null;

  // Handlers
  handleCanvasClick: (e: FederatedPointerEvent) => void;
  handleSelectElement: (id: string | null, isMultiSelect?: boolean) => void;
  handleCanvasPointerDown: (e: FederatedPointerEvent) => void;
  handleCanvasPointerMove: (e: FederatedPointerEvent) => void;
  handlePointerUp: () => void;
  handlePointerDown: (id: string, shapeX: number, shapeY: number) => (e: FederatedPointerEvent) => void;
  handleElementMouseMove: (id: string) => (e: FederatedPointerEvent) => void;
  handleElementMouseLeave: (id: string) => () => void;

  // Setters
  setHoveredId: (id: string | null) => void;
  setIsDrawing: (drawing: boolean) => void;
  setCurrentPath: (path: Array<{ x: number; y: number }>) => void;
  setMousePos: (pos: { x: number; y: number } | null) => void;
}

export const useCanvasInteractions = ({ snapPoint }: UseCanvasInteractionsProps): UseCanvasInteractionsReturn => {
  const { elements: canvasObjects, addElement } = useCanvasStore();
  const { select: selectElement } = useSelectionStore();
  const toolState = useUIStore((state) => state.tools);
  const {
    setActiveTool,
    setMaskPos,
    setLineStartPoint,
    setLineChaining,
    addChainedLineId,
    setClosingShape,
    setShowAnimationsTab
  } = useUIStore();

  // Interactive state for canvas operations
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId] = useState<string | null>(null);

  // Canvas interaction handlers
  const handleCanvasClick = useCallback((e: FederatedPointerEvent) => {
    // Convert global coordinates to local coordinates within the design canvas
    // The event target is the design canvas container itself
    const designCanvasContainer = e.currentTarget as unknown as Container;
    if (!designCanvasContainer) {
      console.error('Design canvas container not found');
      return;
    }
    
    // Use the utility function for consistent coordinate conversion
    const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
    
    // Ensure we're getting valid coordinates
    if (isNaN(localPos.x) || isNaN(localPos.y)) {
      console.warn('[Canvas Click] Invalid coordinates:', localPos);
      return;
    }
    
    // Apply snapping to the click position for element creation
    const shiftKey = 'shiftKey' in e.nativeEvent ? e.nativeEvent.shiftKey : false;
    const snappedPos = snapPoint({ x: localPos.x, y: localPos.y }, { shiftKey });
    
    if (toolState.activeTool === 'select') {
      // Clear selections when clicking on empty canvas
      selectElement(null);
      setShowAnimationsTab(false);
      return;
    }

    // Handle line and polygon drawing with two-click system
    if (toolState.activeTool === 'line' || toolState.activeTool === 'simpleLine') {
      // Check if we're in polygon chaining mode and trying to close the shape
      if (toolState.isLineChaining && toolState.chainedLineIds.length > 0) {
        const firstLineId = toolState.chainedLineIds[0];
        const firstLine = canvasObjects.find(el => el.id === firstLineId);
        
        if (firstLine?.lineOptions?.points) {
          const startPoint = firstLine.lineOptions.points.start;
          const clickDistance = Math.hypot(snappedPos.x - startPoint.x, snappedPos.y - startPoint.y);
          
          if (clickDistance <= 30) { // Within 30px of start point - close the polygon
            // Create the final closing line from current position to the origin
            const finalLine = createNewObject(
              'line', 
              0, 0, // Position will be calculated in createLine
              canvasObjects,
              undefined, // pathPoints
              toolState.isPathMode, // isPath
              undefined, // imageData
              undefined, // width
              undefined, // height
              undefined, // text
              toolState.lineStartPoint!, // Start from current line start point
              startPoint // End at the polygon's origin point
            );
            
            // If in path mode, mark it as a path
            if (toolState.isPathMode) {
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

      if (!toolState.lineStartPoint) {
        // First click: Set the start point
        setLineStartPoint({ x: snappedPos.x, y: snappedPos.y });
        if (toolState.activeTool === 'line') {
          setLineChaining(true);
        }
      } else {
        // Second click: Create the line from start to end point
        const startPoint = toolState.lineStartPoint;
        const endPoint = { x: snappedPos.x, y: snappedPos.y };
        
        // Check if the line has sufficient length (minimum 5 pixels)
        const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        
        if (distance < 5) {
          return;
        }
        
        const newElement = createNewObject(
          'line', 
          0, 0, // Position will be calculated in createLine
          canvasObjects,
          undefined, // pathPoints
          toolState.isPathMode, // isPath
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined, // text
          startPoint,
          endPoint
        );
        
        // If in path mode, mark it as a path
        if (toolState.isPathMode) {
          newElement.isAnimationPath = true;
        }

        addElement(newElement);
        selectElement([newElement]);

        // Handle line chaining for polygon creation
        if (toolState.activeTool === 'line') {
          addChainedLineId(newElement.id);
          // Set the end point as the new start point for the next line
          setLineStartPoint(endPoint);
        } else {
          // For simpleLine, complete the line and exit
          setLineStartPoint(null);
          setActiveTool('select');
          setMaskPos(null);
        }
      }
      return;
    }

    // Handle other creation tools (non-line tools)
    if (['rectangle', 'circle', 'triangle', 'arc', 'text'].includes(toolState.activeTool)) {
      const newElement = createNewObject(toolState.activeTool as 'rectangle' | 'circle' | 'triangle' | 'arc' | 'text', snappedPos.x, snappedPos.y, canvasObjects);
      
      // If in path mode, mark it as a path
      if (toolState.isPathMode) {
        newElement.isAnimationPath = true;
      }

      addElement(newElement);
      selectElement([newElement]);
      
      // Switch to select tool after creating elements
      setActiveTool('select');
      setMaskPos(null);
    }
  }, [toolState, canvasObjects, addElement, selectElement, snapPoint, setActiveTool, setMaskPos, setLineStartPoint, setLineChaining, addChainedLineId, setClosingShape, setShowAnimationsTab]);

  const handleSelectElement = useCallback((id: string | null, isMultiSelect?: boolean) => {
    if (id) {
      const element = canvasObjects.find(e => e.id === id);
      if (element) {
        selectElement(isMultiSelect ? [element] : [element], isMultiSelect);
      }
    } else {
      selectElement(null);
      setShowAnimationsTab(false);
    }
  }, [canvasObjects, selectElement, setShowAnimationsTab]);

  const handleCanvasPointerDown = useCallback((e: FederatedPointerEvent) => {
    if (toolState.activeTool === 'select') {
      // Check if we clicked on an empty area (no element was hit)
      // This would need to be implemented with actual element bounds checking
      // For now, we'll just clear selection
      selectElement(null);
      setShowAnimationsTab(false);
      return;
    }
    
    if (toolState.activeTool === 'draw') {
      setIsDrawing(true);
      // Use the utility function for consistent coordinate conversion
      const designCanvasContainer = e.currentTarget as unknown as Container;
      if (designCanvasContainer) {
        const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
        const newPoint = { x: localPos.x, y: localPos.y };
        setCurrentPath([newPoint]);
      } else {
        // Fallback to global coordinates if container not found
        const newPoint = { x: e.global.x, y: e.global.y };
        setCurrentPath([newPoint]);
      }
    }
  }, [toolState.activeTool, selectElement, setShowAnimationsTab]);

  const handleCanvasPointerMove = useCallback((e: FederatedPointerEvent) => {
    setMousePos({ x: e.global.x, y: e.global.y });
    
    if (isDrawing && toolState.activeTool === 'draw') {
      // Use the utility function for consistent coordinate conversion
      const designCanvasContainer = e.currentTarget as unknown as Container;
      if (designCanvasContainer) {
        const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
        const newPoint = { x: localPos.x, y: localPos.y };
        setCurrentPath(prev => [...prev, newPoint]);
      } else {
        // Fallback to global coordinates if container not found
        const newPoint = { x: e.global.x, y: e.global.y };
        setCurrentPath(prev => [...prev, newPoint]);
      }
    }
  }, [isDrawing, toolState.activeTool]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing && toolState.activeTool === 'draw') {
      setIsDrawing(false);
      
      // Create a path element from the drawn path if we have enough points
      if (currentPath.length >= 2) {
        // Create a path element using the current path points
        const newPathElement = createNewObject(
          'path',
          0, 0, // Position will be calculated in createPath
          canvasObjects,
          currentPath, // Pass the path points
          toolState.isPathMode, // Mark as path if in path mode
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined  // text
        );
        
        // If in path mode, mark it as an animation path
        if (toolState.isPathMode) {
          newPathElement.isAnimationPath = true;
        }
        
        // Add the path element to the canvas
        addElement(newPathElement);
        
        // Select the new path element
        selectElement([newPathElement]);
        
        // Switch to select tool after creating the path
        setActiveTool('select');
      }
      
      // Clear the current path
      setCurrentPath([]);
    }
  }, [isDrawing, toolState.activeTool, currentPath, canvasObjects, addElement, selectElement, toolState.isPathMode, setActiveTool]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePointerDown = useCallback((id: string, _shapeX: number, _shapeY: number) => (e: FederatedPointerEvent) => {
    // Handle element pointer down
    const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;

    // Only handle selection for select/draw tools; do nothing for other tools
    if (toolState.activeTool === 'select' || toolState.activeTool === 'draw') {
      handleSelectElement(id, isMultiSelect);
    }
    // For other tools, do nothing (do not call handleCanvasClick)
  }, [toolState.activeTool, handleSelectElement]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElementMouseMove = useCallback((id: string) => (_e: FederatedPointerEvent) => {
    setHoveredId(id);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElementMouseLeave = useCallback((_id: string) => () => {
    setHoveredId(null);
  }, []);

  return {
    // State
    hoveredId,
    isDrawing,
    currentPath,
    mousePos,
    editingTextId,

    // Handlers
    handleCanvasClick,
    handleSelectElement,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handlePointerUp,
    handlePointerDown,
    handleElementMouseMove,
    handleElementMouseLeave,

    // Setters
    setHoveredId,
    setIsDrawing,
    setCurrentPath,
    setMousePos,
  };
}; 