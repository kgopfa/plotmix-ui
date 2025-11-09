import { useCallback, useState, useRef, useEffect } from 'react';
import { FederatedPointerEvent, Container } from 'pixi.js';
import { createNewObject } from '@/lib/canvas-object-factory';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useUIStore } from '@/stores/use-ui-store';
import { convertPointerEventToDesignCanvasCoords, constrainToAxis } from '@/utils/coordinate-utils';
import { AnimatedCanvasObject } from '@/types/canvas';
import { applyLineEndpointSnapping } from '@/utils/line-edge-snapping';

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
  const groups = useCanvasStore((state) => state.groups);
  const { select: selectElement } = useSelectionStore();
  
  // Destructure only the specific tool properties we need to avoid unnecessary re-renders
  const {
    activeTool,
    isLineChaining,
    chainedLineIds,
    lineStartPoint,
    isPathMode,
    lineType,
    selectedFont,
    selectedFontWeight,
    isClosingShape
  } = useUIStore((state) => state.tools);
  
  const {
    setActiveTool,
    setMaskPos,
    setLineStartPoint,
    setLineChaining,
    addChainedLineId,
    setClosingShape,
    setShowAnimationsTab,
    clearChainedLineIds
  } = useUIStore();

  // Interactive state for canvas operations
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<Array<{ x: number; y: number }>>([]);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [editingTextId] = useState<string | null>(null);
  
  // Use ref to store current path during drawing to avoid state updates on every mouse move
  const currentPathRef = useRef<Array<{ x: number; y: number }>>([]);

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
    let snappedPos = snapPoint({ x: localPos.x, y: localPos.y }, { shiftKey });
    
    // For line tools, also apply edge snapping to snap to element/group edges
    if (activeTool === 'line' || activeTool === 'simpleLine') {
      const elementSnapConfig = useUIStore.getState().snapping.elementSnapConfig;
      const { point: edgeSnappedPoint } = applyLineEndpointSnapping(
        snappedPos,
        canvasObjects,
        groups,
        elementSnapConfig.snapThreshold || 30,
        [], // Don't exclude any elements for snapping
        elementSnapConfig.enabled // Use element snap config to enable/disable
      );
      snappedPos = edgeSnappedPoint;
    }
    
    if (activeTool === 'select') {
      // Clear selections when clicking on empty canvas
      selectElement(null);
      setShowAnimationsTab(false);
      return;
    }

    // Handle line and polygon drawing with two-click system
    if (activeTool === 'line' || activeTool === 'simpleLine') {
      // Check if we're in polygon chaining mode and trying to close the shape
      if (isLineChaining && chainedLineIds.length > 0) {
        const firstLineId = chainedLineIds[0];
        const firstLine = canvasObjects.find(el => el.id === firstLineId);
        
        if (firstLine?.lineOptions?.points) {
          const startPoint = firstLine.lineOptions.points.start;
          let endPoint = startPoint;
          
          // Apply shift constraint if shift key is held
          const shiftKey = 'shiftKey' in e.nativeEvent ? e.nativeEvent.shiftKey : false;
          if (shiftKey) {
            endPoint = constrainToAxis(lineStartPoint!, { x: snappedPos.x, y: snappedPos.y });
          }
          
          // Use the snap threshold from settings for consistent behavior
          const snapThreshold = 30; // Default threshold for shape closing
          const clickDistance = Math.hypot(snappedPos.x - startPoint.x, snappedPos.y - startPoint.y);
          
          if (clickDistance <= snapThreshold) { // Within snap threshold of start point - close the polygon
            // Create the final closing line from current position to the origin
            // For polygon drawing (line tool), always use smooth lines regardless of global lineType setting
            // For animated lines, pass 'straight' to createNewObject but enable dotted/animated after
            const createLineType = activeTool === 'line' ? 'straight' : (lineType === 'animated' ? 'straight' : lineType);
            
            const finalLine = createNewObject(
              'line',
              0, 0, // Position will be calculated in createLine
              canvasObjects,
              undefined, // pathPoints
              isPathMode, // isPath
              undefined, // imageData
              undefined, // width
              undefined, // height
              undefined, // text
              lineStartPoint!, // Start from current line start point
              endPoint, // End at the constrained or original point
              createLineType
            );
            
            // If lineType is 'animated', enable dotted and animated dots
            if (lineType === 'animated' && finalLine.lineOptions) {
              finalLine.lineOptions.dotted = true;
              finalLine.lineOptions.animatedDots = true;
              // Set default animated rectangle properties
              finalLine.lineOptions.animatedGap = 20;
              finalLine.lineOptions.animatedColor = finalLine.stroke || '#000000';
              finalLine.lineOptions.animatedOpacity = 1.0;
              finalLine.lineOptions.animatedLength = 8;
              finalLine.lineOptions.animatedThickness = 4;
            }
            
            // If in path mode, mark it as a path
            if (isPathMode) {
              finalLine.isAnimationPath = true;
            }

            addElement(finalLine);
            addChainedLineId(finalLine.id);
            
            // Now trigger polygon closure
            setClosingShape(true);
            
            // Note: Don't clear state here - let the polygon creation useEffect handle it
            // The useEffect will clean up the state after creating the polygon
            
            // Dispatch draw-complete event for path mode completion
            if (isPathMode) {
              const drawCompleteEvent = new CustomEvent('draw-complete', {
                detail: {
                  element: finalLine,
                  isPathMode: true,
                  isShapeClosed: true
                }
              });
              window.dispatchEvent(drawCompleteEvent);
            }
            
            return;
          }
        }
      }

      if (!lineStartPoint) {
        // First click: Set the start point
        setLineStartPoint({ x: snappedPos.x, y: snappedPos.y });
        if (activeTool === 'line') {
          setLineChaining(true);
        }
      } else {
        // Second click: Create the line from start to end point
        const startPoint = lineStartPoint;
        let endPoint = { x: snappedPos.x, y: snappedPos.y };
        
        // Apply shift constraint if shift key is held
        const shiftKey = 'shiftKey' in e.nativeEvent ? e.nativeEvent.shiftKey : false;
        if (shiftKey) {
          endPoint = constrainToAxis(startPoint, endPoint);
        }
        
        // Check if the line has sufficient length (minimum 5 pixels)
        const distance = Math.hypot(endPoint.x - startPoint.x, endPoint.y - startPoint.y);
        
        if (distance < 5) {
          return;
        }
        
        // For polygon drawing (line tool), always use smooth lines regardless of global lineType setting
        // For animated lines, pass 'straight' to createNewObject but enable dotted/animated after
        const createLineType = activeTool === 'line' ? 'straight' : (lineType === 'animated' ? 'straight' : lineType);
        
        const newElement = createNewObject(
          'line', 
          0, 0, // Position will be calculated in createLine
          canvasObjects,
          undefined, // pathPoints
          isPathMode, // isPath
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined, // text
          startPoint,
          endPoint,
          createLineType
        );
        
        // If lineType is 'animated', enable dotted and animated dots
        if (lineType === 'animated' && newElement.lineOptions) {
          newElement.lineOptions.dotted = true;
          newElement.lineOptions.animatedDots = true;
          // Set default animated rectangle properties
          newElement.lineOptions.animatedGap = 20;
          newElement.lineOptions.animatedColor = newElement.stroke || '#000000';
          newElement.lineOptions.animatedOpacity = 1.0;
          newElement.lineOptions.animatedLength = 8;
          newElement.lineOptions.animatedThickness = 4;
        }
        
        // If in path mode, mark it as a path
        if (isPathMode) {
          newElement.isAnimationPath = true;
        }

        addElement(newElement);
        selectElement([newElement]);

        // Handle line chaining for polygon creation
        if (activeTool === 'line') {
          addChainedLineId(newElement.id);
          // Set the end point as the new start point for the next line
          setLineStartPoint(endPoint);
        } else {
          // For simpleLine and animatedLine, complete the line and exit
          setLineStartPoint(null);
          setActiveTool('select');
          setMaskPos(null);
          
          // Dispatch draw-complete event for single line path mode completion
          if (isPathMode) {
            const drawCompleteEvent = new CustomEvent('draw-complete', {
              detail: {
                element: newElement,
                isPathMode: true
              }
            });
            window.dispatchEvent(drawCompleteEvent);
          }
        }
      }
      return;
    }

    // Handle polygon tool - start line chaining mode
    if (activeTool === 'polygon') {
      setLineChaining(true);
      setLineStartPoint({ x: snappedPos.x, y: snappedPos.y });
      return;
    }

    // Handle other creation tools (non-line tools)
    if (['rectangle', 'circle', 'triangle', 'arc', 'text', 'code-editor'].includes(activeTool)) {
      const newElement = createNewObject(
        activeTool as 'rectangle' | 'circle' | 'triangle' | 'arc' | 'text' | 'code-editor', 
        snappedPos.x, 
        snappedPos.y, 
        canvasObjects,
        undefined, // pathPoints
        undefined, // isPath
        undefined, // imageData
        undefined, // width
        undefined, // height
        (activeTool === 'text' || activeTool === 'code-editor') ? 'Double click text to edit' : undefined, // text
        undefined, // startPoint
        undefined, // endPoint
        undefined, // lineType
        (activeTool === 'text' || activeTool === 'code-editor') ? selectedFont : undefined, // fontFamily
        (activeTool === 'text' || activeTool === 'code-editor') ? selectedFontWeight : undefined // fontWeight
      );
      
      // If in path mode, mark it as a path
      if (isPathMode) {
        newElement.isAnimationPath = true;
      }

      addElement(newElement);
      selectElement([newElement]);
      
      // Switch to select tool after creating elements
      setActiveTool('select');
      setMaskPos(null);
      
      // Dispatch draw-complete event for path mode completion
      if (isPathMode) {
        const drawCompleteEvent = new CustomEvent('draw-complete', {
          detail: {
            element: newElement,
            isPathMode: true
          }
        });
        window.dispatchEvent(drawCompleteEvent);
      }
    }
  }, [activeTool, isLineChaining, chainedLineIds, lineStartPoint, isPathMode, lineType, selectedFont, selectedFontWeight, canvasObjects, addElement, selectElement, snapPoint, setActiveTool, setMaskPos, setLineStartPoint, setLineChaining, addChainedLineId, setClosingShape, setShowAnimationsTab]);

  const handleSelectElement = useCallback((id: string | null, isMultiSelect?: boolean) => {
    if (id) {
      const element = canvasObjects.find(e => e.id === id);
      if (element) {
        // For multi-select, pass the single element with addToSelection=true
        // For single select, pass the single element with addToSelection=false
        selectElement(element, isMultiSelect);
      }
    } else {
      selectElement(null);
      setShowAnimationsTab(false);
    }
  }, [canvasObjects, selectElement, setShowAnimationsTab]);

  const handleCanvasPointerDown = useCallback((e: FederatedPointerEvent) => {
    if (activeTool === 'select') {
      // Check if we clicked on an empty area (no element was hit)
      // This would need to be implemented with actual element bounds checking
      // For now, we'll just clear selection
      selectElement(null);
      setShowAnimationsTab(false);
      return;
    }
    
    if (activeTool === 'draw') {
      setIsDrawing(true);
      // Use the utility function for consistent coordinate conversion
      const designCanvasContainer = e.currentTarget as unknown as Container;
      if (designCanvasContainer) {
        const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
        const newPoint = { x: localPos.x, y: localPos.y };
        // Initialize both ref and state for the first point
        currentPathRef.current = [newPoint];
        setCurrentPath([newPoint]);
      } else {
        // Fallback to global coordinates if container not found
        const newPoint = { x: e.global.x, y: e.global.y };
        // Initialize both ref and state for the first point
        currentPathRef.current = [newPoint];
        setCurrentPath([newPoint]);
      }
    }
  }, [activeTool, selectElement, setShowAnimationsTab]);

  const handleCanvasPointerMove = useCallback((e: FederatedPointerEvent) => {
    setMousePos({ x: e.global.x, y: e.global.y });
    
    if (isDrawing && activeTool === 'draw') {
      // Use the utility function for consistent coordinate conversion
      const designCanvasContainer = e.currentTarget as unknown as Container;
      if (designCanvasContainer) {
        const localPos = convertPointerEventToDesignCanvasCoords(e, designCanvasContainer);
        const newPoint = { x: localPos.x, y: localPos.y };
        
        // Update the ref instead of state to avoid re-renders during drawing
        currentPathRef.current = [...currentPathRef.current, newPoint];
        
        // Only update the visual state occasionally to maintain responsiveness
        // Update every 5th point or when drawing stops
        if (currentPathRef.current.length % 5 === 0) {
          setCurrentPath([...currentPathRef.current]);
        }
      } else {
        // Fallback to global coordinates if container not found
        const newPoint = { x: e.global.x, y: e.global.y };
        currentPathRef.current = [...currentPathRef.current, newPoint];
        
        if (currentPathRef.current.length % 5 === 0) {
          setCurrentPath([...currentPathRef.current]);
        }
      }
    }
  }, [isDrawing, activeTool, canvasObjects, groups]);

  const handlePointerUp = useCallback(() => {
    if (isDrawing && activeTool === 'draw') {
      setIsDrawing(false);
      
      // Use the ref value for the final path
      const finalPath = currentPathRef.current;
      
      // Create a path element from the drawn path if we have enough points
      if (finalPath.length >= 2) {
        // Create a path element using the current path points
        const newPathElement = createNewObject(
          'path',
          0, 0, // Position will be calculated in createPath
          canvasObjects,
          finalPath, // Pass the final path points
          isPathMode, // Mark as path if in path mode
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined  // text
        );
        
        // If in path mode, mark it as an animation path
        if (isPathMode) {
          newPathElement.isAnimationPath = true;
        }
        
        // Add the path element to the canvas
        addElement(newPathElement);
        
        // Select the new path element
        selectElement([newPathElement]);
        
        // Switch to select tool after creating the path
        setActiveTool('select');
        
        // Dispatch draw-complete event for path mode completion
        if (isPathMode) {
          const drawCompleteEvent = new CustomEvent('draw-complete', {
            detail: {
              element: newPathElement,
              isPathMode: true
            }
          });
          window.dispatchEvent(drawCompleteEvent);
        }
      }
      
      // Clear both the ref and the state
      currentPathRef.current = [];
      setCurrentPath([]);
    }
  }, [isDrawing, activeTool, canvasObjects, addElement, selectElement, isPathMode, setActiveTool]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handlePointerDown = useCallback((id: string, _shapeX: number, _shapeY: number) => (e: FederatedPointerEvent) => {
    // Handle element pointer down
    const isMultiSelect = (e.nativeEvent && 'metaKey' in e.nativeEvent) ?
      (e.nativeEvent.metaKey || e.nativeEvent.ctrlKey) : false;

    // Only handle selection for select/draw tools; do nothing for other tools
    if (activeTool === 'select' || activeTool === 'draw') {
      handleSelectElement(id, isMultiSelect);
    }
    // For other tools, do nothing (do not call handleCanvasClick)
  }, [activeTool, handleSelectElement]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElementMouseMove = useCallback((id: string) => (_e: FederatedPointerEvent) => {
    setHoveredId(id);
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleElementMouseLeave = useCallback((_id: string) => () => {
    setHoveredId(null);
  }, []);

  // Handle polygon closure - create polygon element from chained lines
  // Only run this for non-path mode polygons (path mode uses the old group system)
  useEffect(() => {
    if (isClosingShape && chainedLineIds.length >= 3 && !isPathMode) {
      // Get all the chained line elements
      const lineElements = chainedLineIds.map(id => 
        canvasObjects.find(el => el.id === id)
      ).filter(Boolean) as AnimatedCanvasObject[];

      if (lineElements.length >= 3) {
        // Extract polygon points from the line elements in the correct order
        const polygonPoints: Array<{ x: number; y: number }> = [];
        
        // For a properly connected polygon, we need to trace the path
        // Start with the first line's start point
        if (lineElements[0]?.lineOptions?.points) {
          const firstLine = lineElements[0];
          const firstLineOptions = firstLine.lineOptions;
          if (firstLineOptions?.points) {
            polygonPoints.push(firstLineOptions.points.start);
            
            // Add the end point of the first line
            polygonPoints.push(firstLineOptions.points.end);
          }
          
          // For the remaining lines, only add the end point (since start should connect to previous end)
          for (let i = 1; i < lineElements.length; i++) {
            const line = lineElements[i];
            if (line?.lineOptions?.points) {
              polygonPoints.push(line.lineOptions.points.end);
            }
          }
        }
        
        // Remove duplicate points (the last point should connect back to the first)
        const uniquePoints = polygonPoints.filter((point, index, arr) => {
          if (index === 0) return true; // Always include first point
          if (index === arr.length - 1) {
            // Don't include last point if it's the same as the first (closing point)
            const firstPoint = arr[0];
            const distance = Math.hypot(point.x - firstPoint.x, point.y - firstPoint.y);
            return distance > 1; // Only include if more than 1 pixel away
          }
          return true;
        });

        // Only create polygon if we have enough unique points
        if (uniquePoints.length < 3) {
          console.warn('Not enough unique points to create polygon:', uniquePoints.length);
          setClosingShape(false);
          return;
        }

        // Create polygon element with the cleaned up points
        const polygonElement = createNewObject(
          'polygon',
          0, 0, // Position will be calculated in createPolygon
          canvasObjects,
          undefined, // pathPoints
          isPathMode, // isPath
          undefined, // imageData
          undefined, // width
          undefined, // height
          undefined, // text
          undefined, // startPoint
          undefined, // endPoint
          undefined, // lineType
          undefined, // fontFamily
          undefined, // fontWeight
          uniquePoints // Use cleaned up points
        );

        // If in path mode, mark it as an animation path
        if (isPathMode) {
          polygonElement.isAnimationPath = true;
        }

        // Add the polygon element to the canvas
        addElement(polygonElement);

        // Remove the individual line elements and clean up groups
        const canvasStore = useCanvasStore.getState();
        const { removeElement, removeGroup, groups: canvasGroups } = canvasStore;
        
        if (!removeElement || !removeGroup) {
          console.error('Required canvas store methods not found');
          return;
        }
        const groupsToRemove = new Set<string>();
        
        // Find groups that contain the line elements
        lineElements.forEach(line => {
          if (line.groupId) {
            const group = canvasGroups.find(g => g.id === line.groupId);
            if (group) {
              // Remove any group that contains these lines, not just polygon groups
              // This ensures we clean up any groups that were created during the drawing process
              groupsToRemove.add(group.id);
            }
          }
        });
        
        // Remove groups first (before removing elements)
        groupsToRemove.forEach(groupId => {
          try {
            removeGroup(groupId);
          } catch (error) {
            console.warn(`Failed to remove group ${groupId}:`, error);
          }
        });
        
        // Remove the individual line elements
        lineElements.forEach(line => {
          try {
            removeElement(line.id);
          } catch (error) {
            console.warn(`Failed to remove line element ${line.id}:`, error);
          }
        });

        // Clear any existing selection first
        selectElement(null);
        
        // Select the new polygon element
        selectElement(polygonElement);

        // Switch to select tool
        setActiveTool('select');

        // Clear the chained line state
        clearChainedLineIds();
        setLineChaining(false);
        setLineStartPoint(null);

        // Dispatch draw-complete event for path mode completion
        if (isPathMode) {
          const drawCompleteEvent = new CustomEvent('draw-complete', {
            detail: {
              element: polygonElement,
              isPathMode: true
            }
          });
          window.dispatchEvent(drawCompleteEvent);
        }
      }

      // Reset the closing shape state
      setClosingShape(false);
    }
  }, [isClosingShape, chainedLineIds, canvasObjects, isPathMode, addElement, selectElement, setActiveTool, clearChainedLineIds, setLineChaining, setLineStartPoint, setClosingShape]);

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