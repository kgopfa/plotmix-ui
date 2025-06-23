// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TimeManager, type TimeManagerState } from '@/lib/time-manager';
import { TimelineManager } from '@/lib/timeline-manager';
import { TimelineState } from '@/types/timeline';
import { useSelectionStore } from '@/stores/useSelectionStore';
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

import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { applyElementSnapping } from '@/utils/element-snapping';
import { OptionsBar } from './options';


export default function EditorCanvas() {
  const [canvasObjects, setCanvasObjects] = useState<AnimatedCanvasObject[]>([]);
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  
  // Use Zustand store for selection state
  const {
    selectedElements: selectedObjects,
    selectedGroups,
    select: selectElement,
    selectGroup,
    selectAll,
    clearSelections,
    updateSelectedGroups
  } = useSelectionStore();
  
  const [tool, setTool] = useState<ToolType>('select');
  const [maskPos, setMaskPos] = useState<{ x: number, y: number } | null>(null);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [isLineChaining, setIsLineChaining] = useState(false);
  // Track lines created during current chaining session for polygon creation
  const [chainedLineIds, setChainedLineIds] = useState<string[]>([]);
  const [isClosingShape, setIsClosingShape] = useState(false);
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
  const [timelineHeight, setTimelineHeight] = useState(240); // Default 240px (h-60)
  const [isTimelineCollapsed, setIsTimelineCollapsed] = useState(false);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | 'timeline' | null>(null);

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const canvasRef = useRef<CanvasRef | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Selection manager now handled by React state above
  
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
  const handleMouseDown = useCallback((panel: 'left' | 'right' | 'timeline') => (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(panel);
  }, []);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing) return;

    // Use requestAnimationFrame for smooth resizing
    requestAnimationFrame(() => {
      if (isResizing === 'left') {
        const newWidth = Math.max(200, Math.min(600, e.clientX)); // Min 200px, max 600px
        setLeftPanelWidth(newWidth);
      } else if (isResizing === 'right') {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX)); // Min 200px, max 600px
        setRightPanelWidth(newWidth);
      } else if (isResizing === 'timeline') {
        const maxHeight = window.innerHeight * 0.8; // 80% of viewport height
        const minHeight = 32; // Can collapse to just the controls bar
        const newHeight = Math.max(minHeight, Math.min(maxHeight, window.innerHeight - e.clientY)); // Dynamic max height
        setTimelineHeight(newHeight);
      }
    });
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

  const handleTextGroupChange = (textGroupId: string, newText: string, characterElements: AnimatedCanvasObject[]) => {
    // Update the textGroup element with new text and characters
    setCanvasObjects(prev => {
      const updatedElements = prev.map(el => {
        if (el.id === textGroupId) {
          // Update the textGroup element
          return {
            ...el,
            text: newText,
            characters: newText.split(''),
            width: characterElements.length > 0 ? Math.max(...characterElements.map(char => char.x)) - Math.min(...characterElements.map(char => char.x)) + (characterElements[0]?.width || 0) : el.width
          };
        }
        return el;
      });

      // Remove old character elements that belong to this textGroup
      const withoutOldCharacters = updatedElements.filter(el => 
        !(el.type === 'character' && el.parentTextGroupId === textGroupId)
      );

      // Add new character elements
      return [...withoutOldCharacters, ...characterElements];
    });
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isResizing === 'timeline' ? 'row-resize' : 'col-resize';
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

  // Update groups when groups array changes
  useEffect(() => {
    updateSelectedGroups(groups);
  }, [groups, updateSelectedGroups]);

  // Helper functions removed - using direct state management

  // Handle keyboard shortcuts
  const handleDeleteElement = useCallback((elementId: string) => {
    setCanvasObjects(elements => elements.filter(el => el.id !== elementId));
    selectElement(null);
  }, [selectElement]);

  // Function to exit line chaining mode (for ESC key or tool changes)
  const exitLineChaining = useCallback(() => {
    setLineStartPoint(null);
    setIsLineChaining(false);
    setChainedLineIds([]); // Clear chained line IDs
    setIsClosingShape(false);
    setTool('select');
    setMaskPos(null);
  }, []);

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
    
    // Clear selection when switching to creation tools to prevent drag conflicts
    // This allows placing new objects on top of previously selected shapes
    if (newTool !== 'select') {
      selectElement(null);
    }
  }, [isLineChaining, exitLineChaining, selectElement]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const selectableElements = canvasObjects.filter(el => !el.isAnimationPath);
    selectAll(selectableElements);
  }, [canvasObjects, selectAll]);

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
        gsapManager.buildAnimationTimeline(canvasObjects, groups);
      }, 10);
    }
  }, [canvasObjects, groups, dimensions, gsapManager]);

  // Subscribe to time updates
  useEffect(() => {
    return timeManager.subscribe(setTimeState);
  }, [timeManager]);

  // Subscribe to timeline updates
  useEffect(() => {
    return timelineManager.subscribe(setTimelineState);
  }, [timelineManager]);

  // Separate effect for GSAP timeline synchronization - only sync time, not playback state
  useEffect(() => {
    return timeManager.subscribe(({ elapsedTime }) => {
      gsapManager.updateTime(elapsedTime);
    });
  }, [timeManager, gsapManager]);

  // Separate effect for GSAP playback state management - only call when isPlaying changes
  useEffect(() => {
    gsapManager.handlePlayback(timeState.isPlaying, () => {
      const currentTime = timeManager.getState().elapsedTime;
      gsapManager.updateTime(currentTime);
    });
  }, [timeState.isPlaying, gsapManager, timeManager]);

  // Helper function for calculating element bounds - wrapped in useCallback to avoid dependency issues
  const calculateBounds = useCallback((elements: AnimatedCanvasObject[]): { x: number; y: number; width: number; height: number } => {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      const left = element.x - element.width / 2;
      const right = element.x + element.width / 2;
      const top = element.y - element.height / 2;
      const bottom = element.y + element.height / 2;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }, []);

  // Unified group management system
  interface GroupCreationOptions {
    elements: AnimatedCanvasObject[];
    type: 'custom' | 'text' | 'polygon';
    name?: string;
    additionalProperties?: Partial<CanvasGroup>;
    autoSelect?: boolean;
    customId?: string; // For text groups that need specific IDs
  }

  // Create group using the unified system
  const createGroup = useCallback(({ elements, type, name, additionalProperties = {}, autoSelect = true, customId }: GroupCreationOptions): CanvasGroup | null => {
    if (!elements || elements.length === 0) {
      console.warn('Cannot create group: no elements provided');
      return null;
    }

    const bounds = calculateBounds(elements);
    const groupId = customId || `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const groupName = name || (() => {
      switch (type) {
        case 'custom':
          const customGroupCount = groups.filter(g => !g.isDefaultGroup && g.type === 'custom').length;
          return `Custom Group ${customGroupCount + 1}`;
        case 'polygon':
          const polygonGroupCount = groups.filter(g => !g.isDefaultGroup && g.type === 'polygon').length;
          return `Polygon ${polygonGroupCount + 1}`;
        default:
          return 'Group';
      }
    })();

    const newGroup: CanvasGroup = {
      id: groupId,
      name: groupName,
      elementIds: elements.map(el => el.id),
      type: type,
      isDefaultGroup: false,
      x: bounds.x,
      y: bounds.y,
      rotation: 0,
      animations: [],
      ...additionalProperties
    };

    // Update elements to have group IDs
    setCanvasObjects(prevElements => 
      prevElements.map(el => {
        if (elements.some(groupEl => groupEl.id === el.id)) {
          return { ...el, groupId: groupId };
        }
        return el;
      })
    );

    // Add group to groups state
    setGroups(prevGroups => [...prevGroups, newGroup]);

    // Auto-select the group if requested
    if (autoSelect) {
      selectAll(elements);
      selectGroup(newGroup);
    }

    return newGroup;
  }, [groups, calculateBounds]);

  const createPolygonGroup = useCallback((lineElements: AnimatedCanvasObject[], isClosed: boolean = false): CanvasGroup | null => {
    return createGroup({
      elements: lineElements,
      type: 'polygon',
      additionalProperties: { isClosed }
    });
  }, [createGroup]);

  // Update timeline track data when elements or groups change
  useEffect(() => {
    timelineManager.setTrackData(canvasObjects, groups);
  }, [canvasObjects, groups, timelineManager]);



  // Clear snap guides when element selection changes or drag ends
  useEffect(() => {
    clearElementSnapGuides();
  }, [selectedObjects, clearElementSnapGuides]);

  // Handle polygon closure when isClosingShape becomes true
  useEffect(() => {
    if (!isClosingShape || chainedLineIds.length === 0) return;

    // Find the chained lines including the last one
    const chainedLines = canvasObjects.filter(obj => chainedLineIds.includes(obj.id));
    
    if (chainedLines.length >= 2) {
      // Check if any of the lines in the polygon are dotted (indicating path mode)
      const isPolygonPath = chainedLines.some(line => line.lineOptions?.dotted === true);
      
      // Create a polygon group using the typed group system
      // Note: createPolygonGroup already handles all state updates including setGroups and setCanvasObjects
      const polygonGroup = createPolygonGroup(chainedLines, true); // true = closed polygon
      
      // If this polygon was created in path mode, mark the group as an animation path and exit path mode
      if (isPolygonPath && polygonGroup) {
        setGroups(prevGroups => 
          prevGroups.map(group => 
            group.id === polygonGroup.id 
              ? { ...group, isAnimationPath: true }
              : group
          )
        );
        
        // Add the polygon group to the animation and exit path mode
        addPathToAnimation(polygonGroup as unknown as AnimatedCanvasObject);
        setIsPathMode(false);
        setAnimationTarget(null);
      }
    }
    
    // Clean up line chaining state
    setLineStartPoint(null);
    setIsLineChaining(false);
    setChainedLineIds([]);
    setIsClosingShape(false);
    setTool('select');
    setMaskPos(null);
  }, [isClosingShape, chainedLineIds, canvasObjects, createPolygonGroup]);

  const canvasClickHandler = (e: FederatedPointerEvent) => {
    const isEmptyClick = !(e.target && (e.target as Container).label === 'shape');
    
    // Allow object creation when using creation tools, even on top of existing shapes
    const isCreationTool = tool !== 'select';
    const shouldCreateObject = isEmptyClick || isCreationTool;

    if (shouldCreateObject) {
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
          
          let shouldCloseShape = false;
          let finalEndPoint = snappedEnd;
          
          if (originalStartPoint) {
            const distanceToOriginalStart = Math.hypot(snappedEnd.x - originalStartPoint.x, snappedEnd.y - originalStartPoint.y);
            
            // Use a larger threshold for easier polygon closing - 30px instead of 20px
            if (distanceToOriginalStart <= 30) {
              shouldCloseShape = true;
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
            dotted: isPathMode
          };

          // Add this line to the chained lines (including the closing line)
          const updatedChainedLineIds = [...chainedLineIds, newElement.id];
          setChainedLineIds(updatedChainedLineIds);
          
            setCanvasObjects(prev => [...prev, newElement]);
            selectElement([newElement]);
            updateSelectedGroups([]);
          
          if (shouldCloseShape) {
            // Shape is closed - trigger polygon creation via useEffect
            setIsClosingShape(true);
          } else {
            // Continue chaining: set the end point as the new start point
            setLineStartPoint(finalEnd);
            // Keep the tool as 'line' and don't reset mask position to maintain preview
          }

          // Note: For polygon lines in path mode, we don't add individual lines to the animation path
          // Instead, the complete polygon group will be added when the shape is closed
        }
      } else if (tool === 'simpleLine') {
        if (!lineStartPoint) {
          // First click - set start point with snapping
          const snappedStart = snapPoint({ x: e.global.x, y: e.global.y }, e);
          setLineStartPoint(snappedStart);
        } else {
          // Second click - create line and exit (no chaining)
          const snappedEnd = snapPoint({ x: e.global.x, y: e.global.y }, e);
          const { start: finalStart, end: finalEnd } = snapLine(lineStartPoint, snappedEnd, e);
          
          const newElement = createNewObject('line', finalStart.x, finalStart.y, canvasObjects, undefined, isPathMode);
          // Update line end point
          newElement.lineOptions = {
            points: {
              start: finalStart,
              end: finalEnd
            },
            arrow: false,
            dotted: isPathMode
          };
          
          setCanvasObjects(prev => [...prev, newElement]);
          selectElement([newElement]);
          updateSelectedGroups([]);
          
          // Reset line start point and switch to select tool
          setLineStartPoint(null);
          setTool('select');
          setMaskPos(null);

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
          selectElement([imageElement]);
          updateSelectedGroups([]);
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
        selectElement([newElement]);
        updateSelectedGroups([]);
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
        selectElement([newElement]);
        updateSelectedGroups([]);
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
        const { textGroup, characters } = createTextGroupWithCharacters(
          snappedPos.x, 
          snappedPos.y, 
          canvasObjects
        );
        
        // Add both the textGroup and its character elements to the canvas
        setCanvasObjects(prev => [...prev, textGroup, ...characters]);
        
        setTool('select');
        setMaskPos(null);

        // If in path mode, exit after creating the path
        if (isPathMode) {
          addPathToAnimation(textGroup);
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else {
        clearSelections();
      }
    } else {
      // When clicking on existing shapes with select tool, just clear selection
      // This maintains the existing behavior for selection mode
      clearSelections();
    } 
  };

  // Helper function to add path shape to animation
  const addPathToAnimation = useCallback((pathShape: AnimatedCanvasObject | CanvasGroup) => {
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
                pathElement: pathShape, // Use the original pathShape (could be group or single element)
                isPolygonPath: 'elementIds' in pathShape // Mark as polygon if it came from a group
              }
            };
          })
        };
      })
    );
  }, [animationTarget, setCanvasObjects, canvasObjects]);



  // Update animations when their path element is modified
  const updateAnimationsForPathElement = useCallback((elements: AnimatedCanvasObject[], pathElement: AnimatedCanvasObject) => {
    let animationsUpdated = 0;

    const updatedElements = elements.map(element => {
      // Find animations that reference this path element
      const updatedAnimations = element.animations.map(animation => {
        if (animation.properties.pathElement?.id === pathElement.id) {
          animationsUpdated++;
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

        // If this is a textGroup, also move all its character children
        if (draggedElement.type === 'textGroup') {
          const characterChildren = prevElements.filter(child => 
            child.type === 'character' && child.parentTextGroupId === draggedElement.id
          );
          
          // Check if this element is a character child of the dragged textGroup
          if (characterChildren.some(child => child.id === el.id)) {
            return { ...el, x: el.x + dx, y: el.y + dy };
          }
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
        if (!newPosition) {
          // Check if this element is a character child of a textGroup being moved
          const parentTextGroup = prevElements.find(parent => 
            parent.type === 'textGroup' && 
            el.type === 'character' && 
            el.parentTextGroupId === parent.id &&
            snappedPositions.some(pos => pos.id === parent.id)
          );
          
          if (parentTextGroup) {
            const parentNewPosition = snappedPositions.find(pos => pos.id === parentTextGroup.id);
            if (parentNewPosition) {
              const dx = parentNewPosition.x - parentTextGroup.x;
              const dy = parentNewPosition.y - parentTextGroup.y;
              return { ...el, x: el.x + dx, y: el.y + dy };
            }
          }
          
          return el;
        }

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
    setGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            animations: group.animations.map(anim =>
              anim.id === animationId
                ? { ...anim, startTime: update.startTime, duration: update.duration }
                : anim
            )
          };
        }
        return group;
      });
      
      // Update timeline with groups
      setTimeout(() => {
        gsapManager.buildAnimationTimeline(canvasObjects, updatedGroups);
      }, 0);
      
      return updatedGroups;
    });
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
          selectElement([updatedElement]);
          updateSelectedGroups([]);
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
          selectElement([updatedElement]);
          updateSelectedGroups([]);
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
            selectElement([updatedElement!]);
            updateSelectedGroups([]);
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

  // Separate effect for GSAP timeline synchronization - only sync time, not playback state
  useEffect(() => {
    return timeManager.subscribe(({ elapsedTime }) => {
      gsapManager.updateTime(elapsedTime);
    });
  }, [timeManager, gsapManager]);

  // Separate effect for GSAP playback state management - only call when isPlaying changes
  useEffect(() => {
    gsapManager.handlePlayback(timeState.isPlaying, () => {
      const currentTime = timeManager.getState().elapsedTime;
      gsapManager.updateTime(currentTime);
    });
  }, [timeState.isPlaying, gsapManager, timeManager]);

  // Subscribe to selection updates (REMOVED - now using React state)
  // useEffect(() => {
  //   return selectionManager.subscribe((selectedElements, selectedGroups) => {
  //     setSelectedObjects(selectedElements);
  //     setSelectedGroups(selectedGroups);
  //   });
  // }, [selectionManager]);

  // Update selected groups when groups state changes (REMOVED - handled by state)
  // useEffect(() => {
  //   selectionManager.updateSelectedGroups(groups);
  // }, [groups, selectionManager]);

  const handleGroupInspectorChange = (
    groupId: string,
    prop: string,
    value: string | number | boolean | ElementAnimation[]
  ) => {
    setGroups(prevGroups => {
      const updatedGroups = prevGroups.map(group => {
        if (group.id === groupId) {
          if (prop === 'animations') {
            return { ...group, animations: value as ElementAnimation[] };
          } else if (prop === 'name') {
            return { ...group, name: value as string };
          } else if (prop === 'x') {
            return { ...group, x: value as number };
          } else if (prop === 'y') {
            return { ...group, y: value as number };
          } else if (prop === 'rotation') {
            return { ...group, rotation: value as number };
          }
        }
        return group;
      });

      if (prop === 'animations') {
        // Update timeline track data
        timelineManager.setTrackData(canvasObjects, updatedGroups);
        
        // Rebuild timeline after group animation changes
        setTimeout(() => {
          gsapManager.buildAnimationTimeline(canvasObjects, updatedGroups);
        }, 0);
      }

      return updatedGroups;
    });
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

          // For triangles, maintain equilateral proportions and update radius
          if (el.type === 'triangle') {
            // Calculate correct width for an equilateral triangle based on height
            const correctWidth = (2 * height) / Math.sqrt(3);
            updatedElement.width = correctWidth;
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
  const handleSelectElement = useCallback((id: string | null) => {
    if (id) {
      const element = canvasObjects.find(e => e.id === id);
      if (element) {
        selectElement([element]);
        updateSelectedGroups([]);
      }
    } else {
      clearSelections();
    }
  }, [canvasObjects]);

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

  // Simplified element addition handler
  const handleAddElement = useCallback((element: AnimatedCanvasObject) => {
    setCanvasObjects(prev => [...prev, element]);
    selectElement([element]);
    updateSelectedGroups([]);

    // textGroup functionality removed

    if (isPathMode && element.type === 'path' && element.isAnimationPath) {
      addPathToAnimation(element);
      setIsPathMode(false);
      setAnimationTarget(null);
    }
  }, [isPathMode, addPathToAnimation, setIsPathMode, setAnimationTarget]);

  // Simplified group management handlers - now using unified createGroup
  const handleGroupElements = useCallback(() => {
    if (!canvasObjects || canvasObjects.length === 0 || selectedObjects.length < 2) {
      console.warn('Cannot group elements: need at least 2 selected elements');
      return;
    }
    
    createGroup({
      elements: selectedObjects,
      type: 'custom'
    });
  }, [canvasObjects, selectedObjects, createGroup]);

  const handleUngroupElements = useCallback(() => {
    if (!canvasObjects || canvasObjects.length === 0 || selectedGroups.length !== 1) {
      console.warn('Cannot ungroup elements: need exactly one group selected');
      return;
    }
    
    const groupToUngroup = selectedGroups[0];
    
    // Remove the group
    setGroups(prev => prev.filter(g => g.id !== groupToUngroup.id));
    
    // Update canvas objects to remove group IDs
    setCanvasObjects(prev => 
      prev.map(el => {
        if (groupToUngroup.elementIds.includes(el.id)) {
          return { ...el, groupId: undefined };
        }
        return el;
      })
    );
  }, [canvasObjects, selectedGroups]);

  // Update group selection whenever groups or selected objects change
  useEffect(() => {
    // Auto-detect group selection when all elements in a group are selected
    if (selectedObjects.length === 0) {
      updateSelectedGroups([]);
      return;
    }

    const groupIds = new Set(selectedObjects.map(el => el.groupId).filter(Boolean));
    const candidateGroups = groups.filter(group => groupIds.has(group.id));
    
    const detectedGroups = candidateGroups.filter(group => {
      if (group.isDefaultGroup) return false;
      const selectedElementIds = new Set(selectedObjects.map(el => el.id));
      return group.elementIds.every(elementId => selectedElementIds.has(elementId));
    });

    updateSelectedGroups(detectedGroups);
  }, [selectedObjects, groups]);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Options Bar */}
      <OptionsBar
        selectedObjects={selectedObjects}
        selectedGroups={selectedGroups}
        groups={groups}
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
        isPathMode={isPathMode}
        onExitPathMode={() => {
          setIsPathMode(false);
          setAnimationTarget(null);
        }}
      />

      {/* Main Body - Full height canvas with floating panels */}
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
                  groups={groups}
                  selectedIds={selectedObjects.map(obj => obj.id)}
                  onElementSelect={handleSelectElement}
                  onElementDragEnd={handleElementDragEnd}
                  onGroupDrag={handleGroupDrag}
                  onCanvasClick={canvasClickHandler}
                  tool={tool}
                  onAddElement={handleAddElement}
                  isPathMode={isPathMode}
                  animationTarget={animationTarget}
                  onPathStartClick={(elementId, x, y) => {
                    // Start the line drawing from the center of the element
                    setLineStartPoint({ x, y });
                    setTool('line');
                  }}
                  onElementRotate={handleElementRotate}
                  onTextChange={handleTextChange}
                  onTextGroupChange={handleTextGroupChange}
                  zoom={canvasZoom}
                  onZoomChange={setCanvasZoom}
                  gridConfig={gridConfig}
                  snapGuides={elementSnapGuides}
                  lineStartPoint={lineStartPoint}
                  isLineChaining={isLineChaining}
                  chainedLineIds={chainedLineIds}
                  isPlaying={timeState.isPlaying}
                  onCopyElement={(elementId) => {
                    // Find the element to copy
                    const elementToCopy = canvasObjects.find(el => el.id === elementId);
                    if (elementToCopy) {
                      // Create a copy with new ID and slight offset
                      const newElement = {
                        ...elementToCopy,
                        id: `copy-${Date.now()}`,
                        name: `${elementToCopy.name} Copy`,
                        x: elementToCopy.x + 20,
                        y: elementToCopy.y + 20
                      };
                      setCanvasObjects(prev => [...prev, newElement]);
                      selectElement([newElement]);
                    }
                  }}
                  onGroupElements={(elementIds) => {
                    const elementsToGroup = canvasObjects.filter(el => elementIds.includes(el.id));
                    if (elementsToGroup.length > 0) {
                      handleGroupElements();
                    }
                  }}
                  onMoveToFront={(elementId) => {
                    // Move element to front by updating z-index or reordering
                    setCanvasObjects(prev => {
                      const element = prev.find(el => el.id === elementId);
                      if (element) {
                        const otherElements = prev.filter(el => el.id !== elementId);
                        return [...otherElements, element]; // Move to end (front)
                      }
                      return prev;
                    });
                  }}
                  onMoveToBack={(elementId) => {
                    // Move element to back by updating z-index or reordering  
                    setCanvasObjects(prev => {
                      const element = prev.find(el => el.id === elementId);
                      if (element) {
                        const otherElements = prev.filter(el => el.id !== elementId);
                        return [element, ...otherElements]; // Move to beginning (back)
                      }
                      return prev;
                    });
                  }}
                />
              )}
            </div>
        </main>

        {/* Floating Toolbar - Fixed position outside scrollable area */}
        <div 
          className="absolute top-2/5 -translate-y-1/2 z-50 transition-all duration-300"
          style={{ left: `${leftPanelVisible ? leftPanelWidth + 16 : 16}px` }}
        >
          <Toolbar
            currentTool={tool}
            onToolChange={handleToolChange}
            isPathMode={isPathMode}
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
              <SceneExplorer 
                elements={canvasObjects} 
                groups={groups} 
                onElementVisibilityChange={(elementId, visible) => {
                  setCanvasObjects(prev => 
                    prev.map(el => 
                      el.id === elementId 
                        ? { ...el, visible } 
                        : el
                    )
                  );
                }}
                onGroupVisibilityChange={(groupId, visible) => {
                  setGroups(prev => 
                    prev.map(group => 
                      group.id === groupId 
                        ? { ...group, visible } 
                        : group
                    )
                  );
                }}
                onParentChange={(childId, newParentId, childType) => {
                  console.log('onParentChange called:', { childId, newParentId, childType });
                  if (childType === 'element') {
                    setCanvasObjects(prev => {
                      const updated = prev.map(el => 
                        el.id === childId 
                          ? { ...el, parent: newParentId } 
                          : el
                      );
                      console.log('Updated canvas objects:', updated.find(el => el.id === childId));
                      return updated;
                    });
                  } else {
                    setGroups(prev => 
                      prev.map(group => 
                        group.id === childId 
                          ? { ...group, parent: newParentId } 
                          : group
                      )
                    );
                  }
                }}
              />
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

      {/* Floating Timeline - positioned fixed at bottom, floats over content */}
      <div 
        className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50"
        style={{ 
          height: isTimelineCollapsed ? '32px' : `${timelineHeight}px`,
          minHeight: '32px', // Allow collapsing to 32px (h-8)
          maxHeight: '80vh'
        }}
      >
        {/* Timeline Resize Handle - Visual indicator - only show when not collapsed */}
        {!isTimelineCollapsed && (
          <div
            className="absolute top-0 left-0 right-0 h-1 border-t-2 border-gray-300 hover:border-blue-500 cursor-row-resize z-40 transition-colors"
            onMouseDown={handleMouseDown('timeline')}
          />
        )}
        
        <Timeline
          elements={canvasObjects.filter(el => !el.isAnimationPath)}
          groups={groups}
          timelineState={timelineState}
          timeState={timeState}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onAnimationChange={handleAnimationChange}
          onGroupAnimationChange={handleGroupAnimationChange}
          isCollapsed={isTimelineCollapsed}
          onToggleCollapse={() => setIsTimelineCollapsed(!isTimelineCollapsed)}
        />
      </div>
      
      {/* Hidden file input for image upload - temporarily disabled */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={() => {/* Image import temporarily disabled */}}
      />
    </div>
  );
}
