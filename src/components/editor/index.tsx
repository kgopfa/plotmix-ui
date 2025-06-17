// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TimeManager, type TimeManagerState } from '@/lib/time-manager';
import { TimelineManager } from '@/lib/timeline-manager';
import { TimelineState } from '@/types/timeline';
import { SelectionManager } from '@/lib/selection-manager';
import { GSAPTimelineManager } from '@/lib/gsap-timeline-manager';
import { SceneExplorer } from './panels/scene-explorer';
import { Inspector } from './panels/inspector';
import { Timeline } from './timeline';
import { Toolbar } from './canvas/toolbar';
import { MaskOverlay } from './canvas/mask-overlay';
import { AnimatedCanvasObject, ElementAnimation, CanvasGroup } from '@/types/canvas';
import { Canvas } from './canvas';
import { FederatedPointerEvent, Container } from 'pixi.js';
import type { CanvasRef } from './canvas';
import { createNewObject, createTextGroupWithCharacters } from '@/lib/canvas-object-factory';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ToolType } from '@/types/editor';
import { GroupManager } from '@/lib/group-manager';
import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { applyElementSnapping } from '@/utils/element-snapping';
import { OptionsBar } from './options';


export default function EditorCanvas() {
  const [canvasObjects, setCanvasObjects] = useState<AnimatedCanvasObject[]>([]);
  const [selectedObjects, setSelectedObjects] = useState<AnimatedCanvasObject[]>([]);
  const [selectedGroups, setSelectedGroups] = useState<CanvasGroup[]>([]);
  const [tool, setTool] = useState<ToolType>('select');
  const [maskPos, setMaskPos] = useState<{ x: number, y: number } | null>(null);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [isLineChaining, setIsLineChaining] = useState(false);
  // Track lines created during current chaining session for polygon creation
  const [chainedLineIds, setChainedLineIds] = useState<string[]>([]);
  const [timeState, setTimeState] = useState<TimeManagerState>({
    isPlaying: false,
    elapsedTime: 0
  });
  const [timelineState, setTimelineState] = useState<TimelineState>({
    tracks: [],
    trackData: [],
    duration: 10,
    scale: 100
  });
  const [isPathMode, setIsPathMode] = useState(false);
  const [animationTarget, setAnimationTarget] = useState<{
    animationId: string;
    elementId: string;
  } | null>(null);
    const [showPaths, setShowPaths] = useState(true);
  
  // Image import state
  const [pendingImageData, setPendingImageData] = useState<string | null>(null);

  // Panel state management
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default 320px (w-80)
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // Default 320px (w-80)
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const canvasRef = useRef<CanvasRef | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  const selectionManager = SelectionManager.getInstance();
  const groupManager = GroupManager.getInstance();
  
  // Grid snapping functionality
  const { 
    gridConfig, 
    setGridConfig, 
    toggleGrid, 
    toggleSnapEnabled, 
    snapPoint, 
    snapLine,
    isSnapTemporarilyDisabled 
  } = useGridSnapping({
    size: 10,
    enabled: true,
    visible: false,
    snapThreshold: 8
  });

  // Element snapping functionality
  const {
    config: elementSnapConfig,
    setConfig: setElementSnapConfig,
    toggleEnabled: toggleElementSnap,
    toggleGuides: toggleElementSnapGuides,
    toggleSpacing: toggleElementSpacing,
    toggleDistribution: toggleElementDistribution,
    snapElement,
    currentGuides: elementSnapGuides,
    setCurrentGuides: setElementSnapGuides,
    clearGuides: clearElementSnapGuides,
    isSnapTemporarilyDisabled: isElementSnapDisabled
  } = useElementSnapping({
    enabled: true,
    snapThreshold: 10,
    showGuides: true,
    enableSpacing: true,
    enableDistribution: true
  });

  // Panel resize handlers
  const handleMouseDown = useCallback((panel: 'left' | 'right') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(panel);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    if (isResizing === 'left') {
      const newWidth = Math.max(200, Math.min(600, e.clientX)); // Min 200px, max 600px
      setLeftPanelWidth(newWidth);
    } else if (isResizing === 'right') {
      const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX)); // Min 200px, max 600px
      setRightPanelWidth(newWidth);
    }
  }, [isResizing]);

  const handleMouseUp = useCallback(() => {
    setIsResizing(null);
  }, []);

  const handleElementRotate = (id: string, rotation: number) => {
    setCanvasObjects(prev => prev.map(el =>
      el.id === id
        ? { ...el, rotation }
        : el
    ));
  };

  const handleTextChange = (id: string, text: string) => {
    setCanvasObjects(prev => prev.map(el =>
      el.id === id
        ? { ...el, text }
        : el
    ));
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [isResizing, handleMouseMove, handleMouseUp]);
  const gsapManager = useMemo(() => new GSAPTimelineManager(), []);

  // Memoize the time manager instance
  const timeManager = useMemo(() => TimeManager.getInstance(), []);
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);

  // Use the canvas dimensions hook
  const { dimensions, containerRef } = useCanvasDimensions();

  // Canvas zoom state
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Auto-center the scroll view when dimensions are ready
  useEffect(() => {
    if (dimensions.width > 0 && dimensions.height > 0 && containerRef.current) {
      const container = containerRef.current;
      if (container) {
        const centerX = (container.scrollWidth - container.clientWidth) / 2;
        const centerY = (container.scrollHeight - container.clientHeight) / 2;
        // Set initial position immediately without animation to avoid visible scroll
        container.scrollTo(centerX, centerY);
      }
    }
  }, [dimensions, containerRef]);

  // Zoom and gesture handling
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let lastPinchDistance = 0;

    // Handle mouse wheel zoom (Cmd+scroll)
    const handleWheel = (e: WheelEvent) => {
      if (e.metaKey || e.ctrlKey) { // Cmd on Mac, Ctrl on Windows/Linux
        e.preventDefault();
        
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1; // Scroll down = zoom out, scroll up = zoom in
        const newZoom = Math.min(Math.max(canvasZoom * zoomFactor, 0.1), 5); // Clamp between 0.1x and 5x
        
        // Use the canvas's center-based zoom instead of just setting state
        if (canvasRef.current) {
          canvasRef.current.setZoom(newZoom);
        } else {
          setCanvasZoom(newZoom);
        }
      }
    };

    // Handle trackpad pinch gestures
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        lastPinchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault(); // Prevent default pinch behavior
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) + 
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );

        if (lastPinchDistance > 0) {
          const rawPinchScale = currentDistance / lastPinchDistance;
          // Dampen the pinch sensitivity - only apply 30% of the raw scale change
          const pinchScale = 1 + (rawPinchScale - 1) * 0.1;
          const newZoom = Math.min(Math.max(canvasZoom * pinchScale, 0.1), 5);
          
          // Use the canvas's center-based zoom instead of just setting state
          if (canvasRef.current) {
            canvasRef.current.setZoom(newZoom);
          } else {
            setCanvasZoom(newZoom);
          }
        }

        lastPinchDistance = currentDistance;
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastPinchDistance = 0;
      }
    };

    // Add event listeners
    container.addEventListener('wheel', handleWheel, { passive: false });
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd, { passive: false });

    // Cleanup
    return () => {
      container.removeEventListener('wheel', handleWheel);
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
    };
  }, [canvasZoom, containerRef]);

  // Handle keyboard shortcuts
  const handleDeleteElement = useCallback((elementId: string) => {
    setCanvasObjects(elements => elements.filter(el => el.id !== elementId));
    selectionManager.select(null);
  }, [selectionManager]);

  // Function to exit line chaining mode and optionally create polygon
  const exitLineChaining = useCallback((shouldCreatePolygon: boolean = true, lineIds?: string[]) => {
    const idsToUse = lineIds || chainedLineIds;
    
    if (shouldCreatePolygon && idsToUse.length >= 2) {
      // Get the lines that were created during this chaining session
      const chainedLines = canvasObjects.filter(obj => idsToUse.includes(obj.id));

      if (chainedLines.length >= 2) {
        // Create a polygon group using the existing group system
        const polygonGroup = groupManager.createGroup(chainedLines, 'Polygon');
        
        // Update the lines to belong to the polygon group
        setCanvasObjects(prev => 
          prev.map(obj => {
            if (idsToUse.includes(obj.id)) {
              return { ...obj, groupId: polygonGroup.id };
            }
            return obj;
          })
        );
        
        // Select the grouped lines
        selectionManager.select(chainedLines);
      }
    }

    setLineStartPoint(null);
    setIsLineChaining(false);
    setChainedLineIds([]); // Clear chained line IDs
    setTool('select');
    setMaskPos(null);
  }, [chainedLineIds, canvasObjects, groupManager, selectionManager]);

  const handleToolChange = useCallback((newTool: ToolType) => {
    // If we're in line chaining mode and switching away from line tool, exit chaining
    if (isLineChaining && newTool !== 'line') {
      exitLineChaining();
      return;
    }
    
    setTool(newTool);
    setMaskPos(null);
    
    // Clear pending image data if switching away from image tool
    if (newTool !== 'image') {
      setPendingImageData(null);
    }
  }, [isLineChaining, exitLineChaining]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const selectableElements = canvasObjects.filter(el => !el.isAnimationPath);
    selectionManager.selectAll(selectableElements);
  }, [canvasObjects, selectionManager]);

  useKeyboardShortcuts({
    selectedElements: selectedObjects,
    onDeleteElement: handleDeleteElement,
    onToolChange: handleToolChange,
    onSelectAll: handleSelectAll,
    isLineChaining,
    onExitLineChaining: exitLineChaining
  });

  useEffect(() => {
    gsapManager.setCanvasRef(canvasRef);

    // Cleanup on unmount
    return () => {
      gsapManager.clearTimeline();
    };
  }, [gsapManager]);

  useEffect(() => {
    if (dimensions.width > 0 && canvasObjects.length > 0 && gsapManager) {
      // Small delay to ensure canvas refs are ready
      setTimeout(() => {
        const allGroups = groupManager.getAllGroups();
        gsapManager.buildAnimationTimeline(canvasObjects, allGroups);
      }, 10);
    }
  }, [canvasObjects, dimensions, gsapManager, groupManager]);

  useEffect(() => {
    return timeManager.subscribe(({ isPlaying, elapsedTime }) => {
      gsapManager.updateTime(elapsedTime);
      gsapManager.handlePlayback(isPlaying, () => gsapManager.updateTime(timeManager.getState().elapsedTime));
    });
  }, [timeManager, gsapManager]);

  // Update timeline track data when elements or groups change
  useEffect(() => {
    const allGroups = groupManager.getAllGroups();
    timelineManager.setTrackData(canvasObjects, allGroups);
  }, [canvasObjects, timelineManager, groupManager]);



  // Clear snap guides when element selection changes or drag ends
  useEffect(() => {
    clearElementSnapGuides();
  }, [selectedObjects, clearElementSnapGuides]);

  const canvasClickHandler = (e: FederatedPointerEvent) => {
    const isEmptyClick = !(e.target && (e.target as Container).label === 'shape');

    if (isEmptyClick) {
      if (tool === 'line') {
        if (!lineStartPoint) {
          // First click - set start point with snapping
          const snappedStart = snapPoint({ x: e.global.x, y: e.global.y }, e);
          setLineStartPoint(snappedStart);
          setIsLineChaining(true);
          setChainedLineIds([]); // Reset chained line IDs for new session
        } else {
          // Second+ click - create line and continue chaining with snapping
          const snappedEnd = snapPoint({ x: e.global.x, y: e.global.y }, e);
          
          // Check if we're trying to close the shape by finding the original start point
          let originalStartPoint = null;
          
          if (chainedLineIds.length > 0) {
            // Find the first chained line to get the original start point
            const firstChainedLine = canvasObjects.find(obj => obj.id === chainedLineIds[0]);
            if (firstChainedLine?.lineOptions?.points?.start) {
              originalStartPoint = firstChainedLine.lineOptions.points.start;
            }
          }
          
          let isClosingShape = false;
          let finalEndPoint = snappedEnd;
          
          if (originalStartPoint) {
            const distanceToOriginalStart = Math.hypot(snappedEnd.x - originalStartPoint.x, snappedEnd.y - originalStartPoint.y);
            
            if (distanceToOriginalStart <= 20) { // Match the preview threshold
              isClosingShape = true;
              finalEndPoint = originalStartPoint; // Snap exactly to the original start point
            }
          }
          
          const { start: finalStart, end: finalEnd } = snapLine(lineStartPoint, finalEndPoint, e);
          
          const newElement = createNewObject('line', finalStart.x, finalStart.y, canvasObjects, undefined, isPathMode);
          // Update line end point
          newElement.lineOptions = {
            points: {
              start: finalStart,
              end: finalEnd
            },
            arrow: false,
            dotted: false
          };

          setCanvasObjects(prev => [...prev, newElement]);
          selectionManager.select(newElement);
          
          // Add this line to the chained lines (including the closing line)
          const updatedChainedLineIds = [...chainedLineIds, newElement.id];
          setChainedLineIds(updatedChainedLineIds);
          
          if (isClosingShape) {
            // Shape is closed - exit line chaining mode and create polygon
            // Pass the updated line IDs directly to avoid state timing issues
            exitLineChaining(true, updatedChainedLineIds);
          } else {
            // Continue chaining: set the end point as the new start point
            setLineStartPoint(finalEnd);
            // Keep the tool as 'line' and don't reset mask position to maintain preview
          }

          // If in path mode, exit after creating the path
          if (isPathMode) {
            addPathToAnimation(newElement);
            setIsPathMode(false);
            setAnimationTarget(null);
          }
        }
      } else if (tool === 'image' && pendingImageData) {
        // Create image element at click position
        const imageWidth = 100;
        const imageHeight = 100;
        
        try {
          const snappedPos = snapPoint({ x: e.global.x, y: e.global.y }, e);
          const imageElement = createNewObject(
            'image',
            snappedPos.x,
            snappedPos.y,
            canvasObjects,
            undefined,
            isPathMode,
            pendingImageData,
            imageWidth,
            imageHeight
          );
          
          setCanvasObjects(prev => [...prev, imageElement]);
          selectionManager.select(imageElement);
          setTool('select');
          setMaskPos(null);
          setPendingImageData(null); // Clear pending image data

          // If in path mode, exit after creating the path
          if (isPathMode) {
            addPathToAnimation(imageElement);
            setIsPathMode(false);
            setAnimationTarget(null);
          }
        } catch (error) {
          console.error('Error creating image element:', error);
        }
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
        const snappedPos = snapPoint({ x: e.global.x, y: e.global.y }, e);
        const newElement = createNewObject(tool, snappedPos.x, snappedPos.y, canvasObjects, undefined, isPathMode);
        setCanvasObjects(prev => [...prev, newElement]);
        selectionManager.select(newElement);
        setTool('select');
        setMaskPos(null);

        // If in path mode, exit after creating the path
        if (isPathMode) {
          addPathToAnimation(newElement);
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else if (tool === 'text') {
        const snappedPos = snapPoint({ x: e.global.x, y: e.global.y }, e);
        const newElement = createNewObject('text', snappedPos.x, snappedPos.y, canvasObjects, undefined, isPathMode);
        setCanvasObjects(prev => [...prev, newElement]);
        selectionManager.select(newElement);
        setTool('select');
        setMaskPos(null);

        // If in path mode, exit after creating the path
        if (isPathMode) {
          addPathToAnimation(newElement);
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else if (tool === 'textGroup') {
        const snappedPos = snapPoint({ x: e.global.x, y: e.global.y }, e);
        const { textGroup, characters } = createTextGroupWithCharacters(snappedPos.x, snappedPos.y, canvasObjects);
        
        // Add both the textGroup and all character elements to the canvas
        setCanvasObjects(prev => [...prev, textGroup, ...characters]);
        
        // Select the textGroup (parent element)
        selectionManager.select(textGroup);
        setTool('select');
        setMaskPos(null);

        // If in path mode, exit after creating the path
        if (isPathMode) {
          addPathToAnimation(textGroup);
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else {
        selectionManager.select(null);
      }
    }
  };

  // Helper function to add path shape to animation
  const addPathToAnimation = useCallback((pathShape: AnimatedCanvasObject) => {
    const target = animationTarget;
    if (!target) return;

    const { elementId, animationId } = target;

    setCanvasObjects(prev =>
      prev.map(el => {
        if (el.id !== elementId) return el;

        return {
          ...el,
          animations: el.animations.map(anim => {
            if (anim.id !== animationId) return anim;

            return {
              ...anim,
              properties: {
                ...anim.properties,
                pathElement: pathShape
              }
            };
          })
        };
      })
    );
  }, [animationTarget, setCanvasObjects]);

  // Update animations when their path element is modified
  const updateAnimationsForPathElement = useCallback((elements: AnimatedCanvasObject[], pathElement: AnimatedCanvasObject) => {
    let animationsUpdated = 0;

    const updatedElements = elements.map(element => {
      // Find animations that reference this path element
      const updatedAnimations = element.animations.map(animation => {
        if (animation.properties.pathElement?.id === pathElement.id) {
          animationsUpdated++;
          console.log(`Updating animation for element ${element.name}: old pathElement width=${animation.properties.pathElement.width}, new width=${pathElement.width}`);
          // Update the animation with the new path element data
          return {
            ...animation,
            properties: {
              ...animation.properties,
              pathElement: pathElement // Update with the new position/size
            }
          };
        }
        return animation;
      });

      // Return element with updated animations if any were changed
      if (updatedAnimations.some((anim, index) => anim !== element.animations[index])) {
        return { ...element, animations: updatedAnimations };
      }

      return element;
    });

    if (animationsUpdated > 0) {
      console.log(`Updated ${animationsUpdated} animation(s) for path element ${pathElement.name || pathElement.id}`);
    }

    return updatedElements;
  }, []);

  const handleElementDragEnd = (id: string, x: number, y: number) => {
    setCanvasObjects(prevElements => {
      const draggedElement = prevElements.find(el => el.id === id);
      if (!draggedElement) return prevElements;

      // Create a temporary element with the new position for snapping calculation
      const tempElement = { ...draggedElement, x, y };
      
      // Apply element snapping first (including grid centers), then grid snapping as fallback
      const elementSnapResult = snapElement(tempElement, prevElements, gridConfig);
      const snappedPos = snapPoint({ x: elementSnapResult.x, y: elementSnapResult.y });

      // Calculate the movement delta
      const dx = snappedPos.x - draggedElement.x;
      const dy = snappedPos.y - draggedElement.y;

      const updatedElements = prevElements.map((el) => {
        if (el.id === id) {
          // Update the dragged element
          if (el.type === 'line' && el.lineOptions?.points) {
            return {
              ...el,
              x: snappedPos.x,
              y: snappedPos.y,
              lineOptions: {
                ...el.lineOptions,
                points: {
                  start: {
                    x: el.lineOptions.points.start.x + dx,
                    y: el.lineOptions.points.start.y + dy
                  },
                  end: {
                    x: el.lineOptions.points.end.x + dx,
                    y: el.lineOptions.points.end.y + dy
                  }
                }
              }
            };
          }
          return { ...el, x: snappedPos.x, y: snappedPos.y };
        }

        // If the dragged element is a textGroup, also move its character children
        if (draggedElement.type === 'textGroup' && el.type === 'character' && el.parentTextGroupId === id) {
          return { ...el, x: el.x + dx, y: el.y + dy };
        }

        return el;
      });

      // If this is an animation path element, update related animations
      const movedElement = updatedElements.find(el => el.id === id);
      if (movedElement?.isAnimationPath) {
        const elementsWithUpdatedAnimations = updateAnimationsForPathElement(updatedElements, movedElement);
        // Rebuild timeline after animation path update
        setTimeout(() => gsapManager.buildAnimationTimeline(elementsWithUpdatedAnimations), 0);
        return elementsWithUpdatedAnimations;
      }

      return updatedElements;
    });

    // Rebuild timeline for regular element moves - use the updated elements
    setTimeout(() => {
      setCanvasObjects(currentElements => {
        gsapManager.buildAnimationTimeline(currentElements);
        return currentElements;
      });
    }, 0);
  };

  // Use a ref to track if we're currently dragging to avoid expensive operations
  const isGroupDraggingRef = useRef(false);
  const groupDragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleGroupDrag = (elementPositions: Array<{ id: string; x: number; y: number }>) => {
    isGroupDraggingRef.current = true;
    
    // Clear any existing timeout
    if (groupDragTimeoutRef.current) {
      clearTimeout(groupDragTimeoutRef.current);
    }

    // Apply snapping to the group movement
    let snappedPositions = elementPositions;
    
    if (elementPositions.length > 0) {
      // Create a virtual group element from the new positions for snapping calculation
      const selectedElements = canvasObjects.filter(el => 
        elementPositions.some(pos => pos.id === el.id)
      );
      
      if (selectedElements.length > 0) {
        // Calculate the new group center from the drag positions
        const positions = elementPositions.map(pos => ({ x: pos.x, y: pos.y }));
        const minX = Math.min(...positions.map(p => p.x));
        const maxX = Math.max(...positions.map(p => p.x));
        const minY = Math.min(...positions.map(p => p.y));
        const maxY = Math.max(...positions.map(p => p.y));
        const groupCenterX = (minX + maxX) / 2;
        const groupCenterY = (minY + maxY) / 2;
        
        // Note: We use the current dragged positions for snapping, not the original positions
        
        // Create a virtual group element for snapping
        const virtualGroupElement = {
          id: 'virtual-group-drag',
          type: 'rectangle' as const,
          name: 'Group Drag',
          x: groupCenterX,
          y: groupCenterY,
          width: maxX - minX,
          height: maxY - minY,
          rotation: 0,
          fill: 'transparent',
          stroke: '#2196F3',
          strokeWidth: 2,
          opacity: 1,
          groupId: 'virtual-group-drag',
          animations: [],
          cornerRadius: 0
        };
        
        // Apply element snapping to the virtual group using the lower-level function for more control
        const { x: snappedX, y: snappedY, guides } = applyElementSnapping(
          virtualGroupElement, 
          canvasObjects, 
          elementSnapConfig.snapThreshold,
          gridConfig,
          elementSnapConfig.enableSpacing,
          elementSnapConfig.enableDistribution
        );
        const snappedGroupPos = snapPoint({ x: snappedX, y: snappedY });
        
        // Update the guides if show guides is enabled and we have guides to show
        if (elementSnapConfig.showGuides && guides.length > 0) {
          setElementSnapGuides(guides);
        } else {
          clearElementSnapGuides();
        }
        
        // Calculate the offset from the original group center to the snapped position
        const offsetX = snappedGroupPos.x - groupCenterX;
        const offsetY = snappedGroupPos.y - groupCenterY;
        
        // Check if any actual snapping occurred
        const actuallySnapped = Math.abs(offsetX) > 0.5 || Math.abs(offsetY) > 0.5;
        
        if (actuallySnapped) {
          // Apply the offset to all element positions
          snappedPositions = elementPositions.map(pos => ({
            id: pos.id,
            x: pos.x + offsetX,
            y: pos.y + offsetY
          }));
        } else {
          // No snapping occurred, clear any existing guides
          clearElementSnapGuides();
          snappedPositions = elementPositions; // Use original positions
        }
      }
    }

    // Update positions immediately for responsive UI using snapped positions
    setCanvasObjects(prevElements => {
      return prevElements.map((el) => {
        const newPosition = snappedPositions.find(pos => pos.id === el.id);
        if (!newPosition) return el;

        // For lines, we need to update both position and points
        if (el.type === 'line' && el.lineOptions?.points) {
          const dx = newPosition.x - el.x;
          const dy = newPosition.y - el.y;
          return {
            ...el,
            x: newPosition.x,
            y: newPosition.y,
            lineOptions: {
              ...el.lineOptions,
              points: {
                start: {
                  x: el.lineOptions.points.start.x + dx,
                  y: el.lineOptions.points.start.y + dy
                },
                end: {
                  x: el.lineOptions.points.end.x + dx,
                  y: el.lineOptions.points.end.y + dy
                }
              }
            }
          };
        }

        // For other shapes, just update position
        return { ...el, x: newPosition.x, y: newPosition.y };
      });
    });

    // Delay expensive operations (animation updates) until drag ends
    groupDragTimeoutRef.current = setTimeout(() => {
      if (!isGroupDraggingRef.current) return;
      
      setCanvasObjects(currentElements => {
        // Check if any moved elements are animation paths and update related animations
        const hasAnimationPaths = elementPositions.some(pos => {
          const element = currentElements.find(el => el.id === pos.id);
          return element?.isAnimationPath;
        });

        if (hasAnimationPaths) {
          let elementsWithUpdatedAnimations = currentElements;
          elementPositions.forEach(pos => {
            const element = currentElements.find(el => el.id === pos.id);
            if (element?.isAnimationPath) {
              elementsWithUpdatedAnimations = updateAnimationsForPathElement(elementsWithUpdatedAnimations, element);
            }
          });
          // Rebuild timeline after animation path updates
          gsapManager.buildAnimationTimeline(elementsWithUpdatedAnimations);
          return elementsWithUpdatedAnimations;
        } else {
          // Rebuild timeline for group moves
          gsapManager.buildAnimationTimeline(currentElements);
        }

        return currentElements;
      });
      
      isGroupDraggingRef.current = false;
    }, 100); // Debounce expensive operations by 100ms
  };

  const handleAnimationChange = (
    elementId: string,
    animationId: string,
    update: Partial<ElementAnimation>
  ) => {
    setCanvasObjects(prev =>
      prev.map(el => {
        if (el.id !== elementId) return el;
        return {
          ...el,
          animations: el.animations.map(anim => {
            if (anim.id !== animationId) return anim;
            return {
              ...anim,
              ...update,
              properties: update.properties ? {
                ...anim.properties,
                ...update.properties
              } : anim.properties
            };
          })
        };
      })
    );
    // Use the updated elements for timeline rebuild
    setTimeout(() => {
      setCanvasObjects(currentElements => {
        gsapManager.buildAnimationTimeline(currentElements);
        return currentElements;
      });
    }, 0);
  };

  const handleGroupAnimationChange = (
    groupId: string,
    animationId: string,
    update: { startTime: number; duration: number }
  ) => {
    const group = groupManager.getGroup(groupId);
    if (group) {
      group.animations = group.animations.map(anim =>
        anim.id === animationId
          ? { ...anim, startTime: update.startTime, duration: update.duration }
          : anim
      );
      
      // Update timeline with groups
      const allGroups = groupManager.getAllGroups();
      setTimeout(() => {
        gsapManager.buildAnimationTimeline(canvasObjects, allGroups);
      }, 0);
    }
  };

  const handleInspectorChange = (
    prop: string,
    value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
      animationId: string;
      elementId: string;
    }
  ) => {
    if (prop === 'enterPathMode') {
      // Enter path mode to draw animation path
      const pathTarget = value as { animationId: string; elementId: string };
      setIsPathMode(true);
      setAnimationTarget(pathTarget);
      return;
    }

    const selectedObject = selectedObjects[0]; // Use first selected for inspector
    if (selectedObject) {
      let updatedElement: AnimatedCanvasObject | null = null;

      if (prop === 'animations') {
        setCanvasObjects(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedObject.id) {
              updatedElement = { ...el, animations: value as ElementAnimation[] };
              return updatedElement;
            }
            return el;
          });

          // Update the GSAP timeline after the state update
          setTimeout(() => {
            gsapManager.buildAnimationTimeline(newElements);
          }, 0);

          return newElements;
        });

        // Also update the selected element reference to ensure the inspector shows the latest values
        if (updatedElement) {
          selectionManager.select(updatedElement);
        }
      } else if (prop === 'lineOptions') {
        setCanvasObjects(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedObject.id) {
              updatedElement = {
                ...el,
                lineOptions: value as NonNullable<AnimatedCanvasObject['lineOptions']>
              };
              return updatedElement;
            }
            return el;
          });

          // Update the GSAP timeline after the state update
          setTimeout(() => {
            gsapManager.buildAnimationTimeline(newElements);
          }, 0);

          return newElements;
        });

        // Also update the selected element reference to ensure the inspector shows the latest values
        if (updatedElement) {
          selectionManager.select(updatedElement);
        }
      } else {
        // For regular property changes (width, height, colors, etc.)
        setCanvasObjects(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedObject.id) {
              updatedElement = { ...el, [prop]: value };
              return updatedElement;
            }
            return el;
          });

          return newElements;
        });

        // For visual properties, we need to ensure the inspector and canvas both show the updated values
        // This forces a selection update which triggers a re-render with the latest values
        if (updatedElement) {
          // Use setTimeout to ensure this happens after the state update
          setTimeout(() => {
            selectionManager.select(updatedElement);
          }, 0);
        }
      }
    }
  };

  // Subscribe to time updates
  useEffect(() => {
    return timeManager.subscribe(setTimeState);
  }, [timeManager]);

  // Subscribe to timeline updates
  useEffect(() => {
    return timelineManager.subscribe(setTimelineState);
  }, [timelineManager]);

  // Update tracks whenever elements change
  useEffect(() => {
    timelineManager.setTracks(canvasObjects);
  }, [canvasObjects, timelineManager]);

  // Subscribe to selection updates
  useEffect(() => {
    return selectionManager.subscribe((selectedElements, selectedGroups) => {
      setSelectedObjects(selectedElements);
      setSelectedGroups(selectedGroups);
    });
  }, [selectionManager]);

  const handleGroupInspectorChange = (
    groupId: string,
    prop: string,
    value: string | number | boolean | ElementAnimation[]
  ) => {
    if (prop === 'animations') {
      // Update group animations
      const group = groupManager.getGroup(groupId);
      if (group) {
        group.animations = value as ElementAnimation[];
        
        // Get all groups for the timeline rebuild
        const allGroups = groupManager.getAllGroups();
        
        // Update timeline track data
        timelineManager.setTrackData(canvasObjects, allGroups);
        
        // Rebuild timeline after group animation changes
        setTimeout(() => {
          gsapManager.buildAnimationTimeline(canvasObjects, allGroups);
        }, 0);
      }
    } else {
      // Handle other group property changes
      if (prop === 'name') {
        const group = groupManager.getGroup(groupId);
        if (group) {
          group.name = value as string;
        }
      } else if (prop === 'x' || prop === 'y' || prop === 'rotation') {
        if (prop === 'x' || prop === 'y') {
          groupManager.updateGroupPosition(groupId, 
            prop === 'x' ? value as number : groupManager.getGroup(groupId)?.x || 0,
            prop === 'y' ? value as number : groupManager.getGroup(groupId)?.y || 0
          );
        } else if (prop === 'rotation') {
          groupManager.updateGroupRotation(groupId, value as number);
        }
      }
    }
  };

  // Use a ref to access current elements to avoid dependency issues
  const elementsRef = useRef(canvasObjects);
  elementsRef.current = canvasObjects;

  // Listen for resize events from the Canvas component
  useEffect(() => {
    const handleElementResize = (e: CustomEvent) => {
      const { id, width, height, handle } = e.detail;
      console.log('Resize event:', { id, width, height, handle });

      setCanvasObjects(() => {
        // Use the ref to get current elements to avoid stale closure
        const currentElements = elementsRef.current;
        const updatedElements = currentElements.map((el) => {
          if (el.id !== id) return el;

          // Calculate position adjustments for certain resize handles
          // This keeps the shape anchored to the opposite corner during resize
          let x = el.x;
          let y = el.y;

          // Calculate position adjustments based on which handle is being dragged
          const deltaWidth = width - el.width;
          const deltaHeight = height - el.height;

          switch (handle) {
            case 'top-left':
              x = el.x + deltaWidth / 2;
              y = el.y + deltaHeight / 2;
              break;
            case 'top-right':
              x = el.x - deltaWidth / 2;
              y = el.y + deltaHeight / 2;
              break;
            case 'bottom-left':
              x = el.x + deltaWidth / 2;
              y = el.y - deltaHeight / 2;
              break;
            case 'bottom-right':
              x = el.x - deltaWidth / 2;
              y = el.y - deltaHeight / 2;
              break;
          }

          const updatedElement = {
            ...el,
            width,
            height,
            x: e.detail.x !== undefined ? e.detail.x : x,
            y: e.detail.y !== undefined ? e.detail.y : y
          };

          // For circles, update radius to match the height (as used in drawing)
          if (el.type === 'circle') {
            updatedElement.radius = height / 2;
          }

          // For triangles, update radius to match the height 
          if (el.type === 'triangle') {
            updatedElement.radius = height / 2;
          }

          return updatedElement;
        });

        // If this is an animation path element, update related animations
        const resizedElement = updatedElements.find(el => el.id === id);
        console.log('Resized element:', resizedElement?.name, 'isAnimationPath:', resizedElement?.isAnimationPath);

        if (resizedElement?.isAnimationPath) {
          console.log('Updating animations for resized path element');
          const elementsWithUpdatedAnimations = updateAnimationsForPathElement(updatedElements, resizedElement);

          // Force a state update first, then rebuild timeline
          setTimeout(() => {
            console.log('Rebuilding timeline with updated path element:', resizedElement.name, 'new width:', resizedElement.width);
            gsapManager.buildAnimationTimeline(elementsWithUpdatedAnimations);
          }, 10); // Small delay to ensure state is updated

          return elementsWithUpdatedAnimations;
        }

        return updatedElements;
      });
    };

    const handleBorderRadiusChange = (e: CustomEvent) => {
      const { id, cornerRadius } = e.detail;

      setCanvasObjects(prevElements =>
        prevElements.map(el =>
          el.id === id
            ? { ...el, cornerRadius }
            : el
        )
      );
    };

    // Add event listeners for both resize and border radius changes
    window.addEventListener('element-resize', handleElementResize as EventListener);
    window.addEventListener('element-border-radius-change', handleBorderRadiusChange as EventListener);

    // Clean up the event listeners when component unmounts
    return () => {
      window.removeEventListener('element-resize', handleElementResize as EventListener);
      window.removeEventListener('element-border-radius-change', handleBorderRadiusChange as EventListener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for draw completion events
  useEffect(() => {
    const handleDrawComplete = () => {
      // Exit draw mode when a path is completed
      setTool('select');
    };

    window.addEventListener('draw-complete', handleDrawComplete);

    return () => {
      window.removeEventListener('draw-complete', handleDrawComplete);
    };
  }, []);

  // Listen for animation path updates (from ShapeSelect component)
  useEffect(() => {
    const handleAnimationPathUpdate = (e: CustomEvent) => {
      const { pathElement } = e.detail;
      console.log('Animation path updated from ShapeSelect:', pathElement.name, 'new dimensions:', pathElement.width, 'x', pathElement.height);

      setCanvasObjects(prevElements => {
        const elementsWithUpdatedAnimations = updateAnimationsForPathElement(prevElements, pathElement);

        // Rebuild timeline after animation path update
        setTimeout(() => {
          console.log('Rebuilding timeline after path element resize via ShapeSelect');
          gsapManager.buildAnimationTimeline(elementsWithUpdatedAnimations);
        }, 10);

        return elementsWithUpdatedAnimations;
      });
    };

    window.addEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);

    const handleGroupDragEndEvent = () => {
      if (isGroupDraggingRef.current) {
        isGroupDraggingRef.current = false;
        if (groupDragTimeoutRef.current) {
          clearTimeout(groupDragTimeoutRef.current);
          groupDragTimeoutRef.current = null;
        }
        // Clear snap guides when group dragging ends
        clearElementSnapGuides();
      }
    };

    window.addEventListener('group-drag-end', handleGroupDragEndEvent);

    return () => {
      window.removeEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAnimationsForPathElement, gsapManager]);

  // Memoize the handleSelectElement function
  const handleSelectElement = useCallback((id: string | null, isMultiSelect = false) => {
    const element = id ? canvasObjects.find(e => e.id === id) || null : null;
    selectionManager.select(element, isMultiSelect);
  }, [canvasObjects, selectionManager]);

  // Memoize the handlePlayPause function
  const handlePlayPause = useCallback(() => {
    if (timeState.isPlaying) {
      timeManager.pause();
    } else {
      timeManager.play();
    }
  }, [timeState.isPlaying, timeManager]);

  // Memoize the handleStop function
  const handleStop = useCallback(() => {
    timeManager.stop();
  }, [timeManager]);

  const handleLineEndpointDrag = (id: string, endpoint: 'start' | 'end', x: number, y: number) => {
    setCanvasObjects(prevElements => {
      const updatedElements = prevElements.map((el) => {
        if (el.id !== id || el.type !== 'line' || !el.lineOptions?.points) return el;

        return {
          ...el,
          lineOptions: {
            ...el.lineOptions,
            points: {
              ...el.lineOptions.points,
              [endpoint]: { x, y }
            }
          }
        };
      });

      // If this is an animation path element, update related animations
      const modifiedElement = updatedElements.find(el => el.id === id);
      if (modifiedElement?.isAnimationPath) {
        const elementsWithUpdatedAnimations = updateAnimationsForPathElement(updatedElements, modifiedElement);
        // Rebuild timeline after animation path update
        setTimeout(() => gsapManager.buildAnimationTimeline(elementsWithUpdatedAnimations), 0);
        return elementsWithUpdatedAnimations;
      }

      return updatedElements;
    });
  };

  const handleAddElement = useCallback((element: AnimatedCanvasObject) => {
    setCanvasObjects(prev => [...prev, element]);
    selectionManager.select(element);

    if (isPathMode && element.type === 'path' && element.isAnimationPath) {
      addPathToAnimation(element);
      setIsPathMode(false);
      setAnimationTarget(null);
    }
  }, [selectionManager, isPathMode, addPathToAnimation, setIsPathMode, setAnimationTarget]);

  const handleImageImport = useCallback(async (file: File) => {
    try {
      console.log("Importing image:", file.name, file.type);

      // Check if it's an SVG file and needs text content
      if (file.type === 'image/svg+xml') {
        // Read SVG as text to preserve the XML content
        const svgData = await file.text();

        // Validate SVG by loading it
        const imgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
        const img = new Image();

        // Wait for image to load to validate
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error("Failed to load SVG"));
          img.src = imgUrl;
        });

        // Store SVG content and switch to placement mode
        setPendingImageData(svgData);
        setTool('image');

        // Clean up
        URL.revokeObjectURL(imgUrl);
      } else {
        // For other image types (PNG, JPG, etc.), create a data URL
        const reader = new FileReader();
        
        await new Promise<void>((resolve, reject) => {
          reader.onload = (e) => {
            if (e.target?.result) {
              const dataUrl = e.target.result as string;
              
              // Validate the image by loading it
              const img = new Image();
              img.onload = () => {
                // Store image data URL and switch to placement mode
                setPendingImageData(dataUrl);
                setTool('image');
                resolve();
              };
              img.onerror = () => reject(new Error("Failed to load image"));
              img.src = dataUrl;
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }
    } catch (error) {
      console.error("Error importing image:", error);
      alert("Failed to import image. Please try another file.");
    }
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Accept common image formats
      const validTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/bmp'];
      
      if (validTypes.includes(file.type)) {
        handleImageImport(file);
      } else {
        alert('Please select a valid image file (SVG, PNG, JPG, GIF, WebP, BMP)');
      }
      // Reset the input
      e.target.value = '';
    }
  };

  // Initialize groups for existing elements (migration) - only run when canvasObjects change
  useEffect(() => {
    if (canvasObjects.length > 0) {
      // Ensure all elements have groups created in the manager
      groupManager.initializeGroupsForElements(canvasObjects);
    }
  }, [canvasObjects, groupManager]);

  // Group/Ungroup handlers
  const handleGroupElements = useCallback(() => {
    if (!canvasObjects || canvasObjects.length === 0) {
      console.warn('Cannot group elements: no canvas objects available');
      return;
    }
    
    const newGroup = selectionManager.groupSelectedElements();
    if (newGroup) {
      // Update canvas objects with new group IDs
      setCanvasObjects(prev => 
        prev.map(el => {
          if (selectedObjects.some(selected => selected.id === el.id)) {
            return { ...el, groupId: newGroup.id };
          }
          return el;
        })
      );
    }
  }, [selectionManager, canvasObjects, selectedObjects]);

  const handleUngroupElements = useCallback(() => {
    if (!canvasObjects || canvasObjects.length === 0) {
      console.warn('Cannot ungroup elements: no canvas objects available');
      return;
    }
    
    const newGroups = selectionManager.ungroupSelectedElements(canvasObjects);
    if (newGroups.length > 0) {
      // Update canvas objects with new group IDs
      setCanvasObjects(prev => 
        prev.map(el => {
          const elementGroup = newGroups.find(g => g.elementIds.includes(el.id));
          if (elementGroup) {
            return { ...el, groupId: elementGroup.id };
          }
          return el;
        })
      );
    }
  }, [selectionManager, canvasObjects]);

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Options Bar */}
      <OptionsBar
        selectedObjects={selectedObjects}
        selectionManager={selectionManager}
        canvasZoom={canvasZoom}
        leftPanelVisible={leftPanelVisible}
        rightPanelVisible={rightPanelVisible}
        onToggleLeftPanel={() => setLeftPanelVisible(!leftPanelVisible)}
        onToggleRightPanel={() => setRightPanelVisible(!rightPanelVisible)}
        onImageImport={() => {
          if (imageFileInputRef.current) {
            imageFileInputRef.current.click();
          }
        }}
        onZoomIn={() => {
          if (canvasRef.current) {
            canvasRef.current.zoomIn();
          } else {
            setCanvasZoom(prev => Math.min(prev * 1.1, 5));
          }
        }}
        onZoomOut={() => {
          if (canvasRef.current) {
            canvasRef.current.zoomOut();
          } else {
            setCanvasZoom(prev => Math.max(prev * 0.9, 0.1));
          }
        }}
        onResetZoom={() => {
          if (canvasRef.current) {
            canvasRef.current.resetZoomToOneHundredPercent();
          }
        }}
        onGroupElements={handleGroupElements}
        onUngroupElements={handleUngroupElements}
        gridConfig={gridConfig}
        onToggleGrid={toggleGrid}
        onToggleGridSnap={toggleSnapEnabled}
        onGridSizeChange={(size: number) => setGridConfig({ size })}
        elementSnapConfig={elementSnapConfig}
        onToggleElementSnap={toggleElementSnap}
        onToggleGuides={toggleElementSnapGuides}
        onToggleSpacing={toggleElementSpacing}
        onToggleDistribution={toggleElementDistribution}
        onSnapThresholdChange={(threshold: number) => setElementSnapConfig({ snapThreshold: threshold })}
        isGridSnapTemporarilyDisabled={isSnapTemporarilyDisabled}
        isElementSnapTemporarilyDisabled={isElementSnapDisabled}
      />

      {/* Main Body - Full width canvas with floating panels */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scrollable Canvas Container */}
        <main
          ref={containerRef}
          className="absolute inset-0 bg-gray-100 overflow-auto"
          onMouseMove={e => {
            if (tool !== 'select') {
              const rect = e.currentTarget.getBoundingClientRect();
              const scrollLeft = e.currentTarget.scrollLeft;
              const scrollTop = e.currentTarget.scrollTop;
              setMaskPos({
                x: e.clientX - rect.left + scrollLeft,
                y: e.clientY - rect.top + scrollTop,
              });
            }
          }}
          onMouseLeave={() => setMaskPos(null)}
        >
                    {/* Full canvas area - clean infinite canvas */}
          <div 
            className="relative bg-white"
            style={{ 
              width: '300vw', // 3x viewport width for more space
              height: '300vh', // 3x viewport height for more space
              minWidth: '4000px', // Larger minimum size
              minHeight: '4000px'
            }}
          >
              {isPathMode && (
                <div className="absolute top-0 left-0 w-full py-2 px-4 bg-blue-100 text-blue-800 z-10 flex justify-between items-center">
                  <span>
                    <strong>Path Drawing Mode:</strong> Select a tool and draw a path that your element will follow.
                  </span>
                  <button
                    className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                    onClick={() => {
                      setIsPathMode(false);
                      setAnimationTarget(null);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}

          

          {/* Navigation and Path Controls */}
          <div 
            className="absolute bottom-4 z-20 flex flex-col gap-2 transition-all duration-300"
            style={{ right: `${rightPanelVisible ? rightPanelWidth + 16 : 16}px` }} // Adjust position based on panel visibility
          >
            {/* Path visibility toggle - only show if paths exist */}
            {canvasObjects.some(el => el.isAnimationPath) && (
              <button
                className={`px-3 py-1.5 rounded shadow flex items-center ${showPaths ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setShowPaths(!showPaths)}
                title={showPaths ? 'Hide Animation Paths' : 'Show Animation Paths'}
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                    fill={showPaths ? "white" : "currentColor"} />
                  <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                    fill={showPaths ? "white" : "currentColor"} />
                </svg>
                {showPaths ? 'Paths Visible' : 'Paths Hidden'}
              </button>
            )}
            
            {/* Navigation Help */}
            <div className="bg-black/75 text-white text-xs rounded p-2 max-w-[200px]">
              <div className="font-semibold mb-1">Navigation:</div>
              <div>• Drag to pan</div>
              <div>• Wheel to scroll up/down</div>
              <div>• Shift+Wheel for left/right</div>
              <div>• Ctrl+Wheel to zoom</div>
              <div>• Arrow keys to navigate</div>
              <div>• Spacebar to center</div>
            </div>
          </div>

                          {dimensions.width > 0 && dimensions.height > 0 && (
                <Canvas
                  ref={canvasRef}
                  dimensions={{
                    width: Math.max(dimensions.width * 3, 4000), // Canvas fills entire scrollable area
                    height: Math.max(dimensions.height * 3, 4000)
                  }}
                  elements={showPaths ? canvasObjects : canvasObjects.filter(el => !el.isAnimationPath)}
                  groups={groupManager.getAllGroups()}
                  selectedIds={selectedObjects.map(obj => obj.id)}
                  onElementSelect={handleSelectElement}
                  onElementDragEnd={handleElementDragEnd}
                  onGroupDrag={handleGroupDrag}
                  onCanvasClick={canvasClickHandler}
                  onLineEndpointDrag={handleLineEndpointDrag}
                  tool={tool}
                  onAddElement={handleAddElement}
                  isPathMode={isPathMode}
                  onElementRotate={handleElementRotate}
                  onTextChange={handleTextChange}
                  zoom={canvasZoom}
                  onZoomChange={setCanvasZoom}
                  gridConfig={gridConfig}
                  snapGuides={elementSnapGuides}
                  lineStartPoint={lineStartPoint}
                  isLineChaining={isLineChaining}
                />
              )}
            </div>
        </main>

        {/* Floating Toolbar - Fixed position outside scrollable area */}
        <div 
          className="absolute top-1/2 -translate-y-1/2 z-50 transition-all duration-300"
          style={{ left: `${leftPanelVisible ? leftPanelWidth + 16 : 16}px` }}
        >
          <Toolbar
            currentTool={tool}
            onToolChange={handleToolChange}
            isPathMode={isPathMode}
            onExitPathMode={() => {
              setIsPathMode(false);
              setAnimationTarget(null);
            }}
          />
        </div>

        {/* Mask Overlay - Fixed position relative to viewport */}
        <MaskOverlay
          tool={tool}
          maskPos={maskPos}
          maskOffsetX={MASK_OFFSET_X}
          maskOffsetY={MASK_OFFSET_Y}
        />

        {/* Floating Left Panel - Scene Explorer */}
        {leftPanelVisible && (
          <>
            <div
              className="absolute top-0 left-0 h-full bg-gray-50/95 backdrop-blur-sm border-r border-gray-200 overflow-y-auto z-30 shadow-lg transition-transform duration-300"
              style={{ width: `${leftPanelWidth}px` }}
            >
              <SceneExplorer elements={canvasObjects} selectionManager={selectionManager} />
            </div>
            
            {/* Left Resize Handle */}
            <div
              className="absolute top-0 h-full w-1 border-r border-gray-300 hover:bg-blue-500 cursor-col-resize z-40 transition-colors"
              style={{ left: `${leftPanelWidth}px` }}
              onMouseDown={handleMouseDown('left')}
            />
          </>
        )}

        {/* Floating Right Panel - Inspector */}
        {rightPanelVisible && (
          <>
            <div
              className="absolute top-0 right-0 h-full bg-gray-50/95 backdrop-blur-sm border-l border-gray-200 overflow-y-auto z-30 shadow-lg transition-transform duration-300"
              style={{ width: `${rightPanelWidth}px` }}
            >
              <Inspector
                selectedElement={selectedObjects[0] || null}
                selectedGroup={selectedGroups.length === 1 ? selectedGroups[0] : null}
                selectedElementsCount={selectedObjects.length}
                onInspectorChange={handleInspectorChange}
                onGroupInspectorChange={handleGroupInspectorChange}
              />
            </div>
            
            {/* Right Resize Handle */}
            <div
              className="absolute top-0 h-full w-1 border-l border-gray-300 hover:bg-blue-500 cursor-col-resize z-40 transition-colors"
              style={{ right: `${rightPanelWidth}px` }}
              onMouseDown={handleMouseDown('right')}
            />
          </>
        )}
      </div>

      {/* Timeline - positioned absolutely when collapsed to float on top */}
      <div className="relative">
        <Timeline
          elements={canvasObjects.filter(el => !el.isAnimationPath)}
          groups={groupManager.getAllGroups()}
          timelineState={timelineState}
          timeState={timeState}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onAnimationChange={handleAnimationChange}
          onGroupAnimationChange={handleGroupAnimationChange}
          selectionManager={selectionManager}
        />
      </div>
      
      {/* Hidden file input for image upload */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />
    </div>
  );
}
