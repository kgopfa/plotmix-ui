// app/layout.tsx or pages/index.tsx depending on routing
'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TimelineManager } from '@/lib/timeline-manager';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasElements, useCanvasGroups, useCanvasStore } from '@/stores/use-canvas-store';
import { useUIStore, useActiveNav, useActiveRightPanel, useSnappingState, useCanvasState } from '@/stores/use-ui-store';
import { useTimelineSync, useTimelineStore } from '@/stores/use-timeline-store';
import { useCanvasMigration } from '@/hooks/use-canvas-migration';
import { GSAPTimelineManager } from '@/lib/gsap-timeline-manager';
import { Graphics, Container } from 'pixi.js';
import { PropertiesPanel } from './navigation/right-sidebar/properties-panel';
import { AnimationsPanel } from './navigation/right-sidebar/animations-panel';
import { LayersTab } from './navigation/right-sidebar/tabs/layers-tab';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import { Timeline } from './timeline';
import { MaskOverlay } from './helpers/mask-overlay';
import { AnimatedCanvasObject, ElementAnimation, CanvasGroup } from '@/types/canvas';
import dynamic from 'next/dynamic';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useElementBoundsCache } from '@/hooks/use-element-bounds-cache';
import { usePanelResize } from '@/hooks/use-panel-resize';
import { useImageUpload } from '@/hooks/use-image-upload';
import { useComponentImport } from '@/hooks/use-component-import';
import { useCanvasInteractions } from '@/hooks/use-canvas-interactions';
import { useCanvasEventListeners } from '@/hooks/use-canvas-event-listeners';
import { MainNavBar } from './navigation/main';
import { LeftSidebar } from './navigation/left-sidebar';
import { RightSidebar } from './navigation/right-sidebar';
import { SelectionNavbar } from './navigation/selection/layer-info';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import type { ApplicationCanvasRef } from './application-canvas';
import { useElementDragging } from '@/hooks/use-element-dragging';

const ApplicationCanvas = dynamic(() => import('./application-canvas').then(m => m.ApplicationCanvas), { ssr: false });

export default function Designer() {
  // Use canvas store instead of local state
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const {
    setCanvasObjects,
    setGroups,
  } = useCanvasMigration();

  // Use Zustand store for selection state
  const {
    selectedElements: selectedObjects,
    selectedGroups,
    select: selectElement,
    selectGroup,
    selectAll,
    updateSelectedGroups
  } = useSelectionStore();

  const hasSelection = selectedObjects.length > 0 || selectedGroups.length > 0;

  // Use UI store for tool state
  const toolState = useUIStore((state) => state.tools);
  const {
    setActiveTool,
    setMaskPos,
    setLineStartPoint,
    setLineChaining,
    clearChainedLineIds,
    setClosingShape,
  } = useUIStore();

  // Timeline integration is handled by useTimelineIntegration hook
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();

  // Use UI store for panel state
  const panelState = useUIStore((state) => state.panels);

  // Use UI store for other tool state
  const {
    togglePathMode,
    setAnimationTarget,
    toggleShowPaths,
  } = useUIStore();

  const activeRightPanel = useActiveRightPanel();
  const setActiveRightPanel = useUIStore(state => state.setActiveRightPanel);

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const fullscreenCanvasRef = useRef<ApplicationCanvasRef | null>(null);
  const { imageFileInputRef, handleImageUpload } = useImageUpload();
  const { handleComponentImport } = useComponentImport();

  // Timeline store integration
  const {
    setCanvasRef: setTimelineCanvasRef,
  } = useTimelineIntegration();

  // Canvas zoom state - will be implemented with pixi-viewport
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Shift key state for constrained drawing
  const [shiftKey, setShiftKey] = useState(false);

  // Animation playback state - needed for UI hiding during playback
  const isPlaying = useTimelineStore(state => state.playback.isPlaying);

  // Canvas container ref for wheel event handling
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // Refs for canvas operations
  const shapeRefs = useRef<Record<string, unknown>>({});
  const groupContainers = useRef<Record<string, unknown>>({});
  const mainCanvasContainerRef = useRef<Container | null>(null);
  const drawingRef = useRef<Graphics | null>(null);
  const canvasScaleFactor = useRef<number>(1);

  // Create a canvas ref that provides the shape refs to the timeline manager
  const canvasRefForTimeline = useRef<TimelineCanvasRef>({
    getShapeRefs: () => shapeRefs.current as Record<string, Container>,
    getGroupContainers: () => groupContainers.current as Record<string, Container>,
    getMainContainer: () => mainCanvasContainerRef.current
  });

  // Set up the canvas ref for the timeline manager
  useEffect(() => {
    setTimelineCanvasRef({ current: canvasRefForTimeline.current });
  }, [setTimelineCanvasRef]);

  // Set up the canvas ref for the canvas store
  const { setCanvasRef } = useCanvasStore();
  useEffect(() => {
    setCanvasRef(fullscreenCanvasRef);
  }, [setCanvasRef]);

  // Get snapping state from UI store
  const snappingState = useSnappingState();
  const { gridConfig: uiGridConfig, elementSnapConfig } = snappingState;

  // Get current canvas size for snapping
  const canvasState = useCanvasState();
  const currentSize = canvasState.currentSizeId === 'custom'
    ? canvasState.customSize
    : canvasState.availableSizes.find((size) => size.id === canvasState.currentSizeId);

  const canvasWidth = currentSize?.width || 1920;
  const canvasHeight = currentSize?.height || 1080;

  // Element snapping functionality
  // Element bounds cache for performance optimization
  const elementBoundsCache = useElementBoundsCache({
    elements: canvasObjects,
    snapThreshold: elementSnapConfig.snapThreshold
  });

  // Use UI store snapping state instead of local hooks
  const {
    snapElement,
    currentGuides,
    setCurrentGuides,
    clearGuides: clearElementSnapGuides,
    isSnapTemporarilyDisabled: isElementSnapDisabled
  } = useElementSnapping({
    enabled: elementSnapConfig.enabled,
    snapThreshold: elementSnapConfig.snapThreshold,
    showGuides: elementSnapConfig.showGuides,
    enableSpacing: elementSnapConfig.enableSpacing,
    enableDistribution: elementSnapConfig.enableDistribution,
    canvasBounds: {
      width: canvasWidth,
      height: canvasHeight,
      centerX: 0, // Canvas is centered at origin
      centerY: 0
    }
  });

  // Grid snapping functionality - use UI store state
  const {
    snapPoint,
    isSnapTemporarilyDisabled: isGridSnapDisabled
  } = useGridSnapping({
    size: uiGridConfig.size,
    enabled: uiGridConfig.enabled, // Use UI store state instead of hardcoded false
    visible: uiGridConfig.visible,
    snapThreshold: uiGridConfig.snapThreshold
  });

  // Canvas interactions hook
  const {
    hoveredId,
    isDrawing,
    currentPath,
    mousePos,
    editingTextId,
    handleCanvasClick,
    handleSelectElement,
    handleCanvasPointerDown,
    handleCanvasPointerMove,
    handlePointerUp,
    handlePointerDown,
    handleElementMouseMove,
    handleElementMouseLeave,
  } = useCanvasInteractions({ snapPoint });

  // Panel resize handlers
  const { handleMouseDown } = usePanelResize();
  const gsapManager = useMemo(() => new GSAPTimelineManager(), []);

  // Memoize the timeline manager instance
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);

  // Use the canvas dimensions hook
  const { dimensions } = useCanvasDimensions();
  
  // Grid and snap configuration - now properly integrated
  const gridConfig = uiGridConfig;
  const snapGuides = currentGuides;

  // Force a center on mount/size changes using the exposed ref method
  useEffect(() => {
    if (!fullscreenCanvasRef.current) return;
    const run = () => fullscreenCanvasRef.current?.centerOnDesign();
    const raf = requestAnimationFrame(() => {
      run();
      setTimeout(run, 50);
    });
    return () => cancelAnimationFrame(raf);
  }, [dimensions.width, dimensions.height, canvasWidth, canvasHeight]);

  // Element dragging functionality
  const {
    startDragging,
    startEndpointDragging,
    setupGlobalEventListeners,
  } = useElementDragging({
    elements: canvasObjects,
    moveElement: (id, position) => {
      const { moveElement } = useCanvasStore.getState();
      moveElement(id, position);
    },
    moveMultipleElements: (positions) => {
      const { moveMultipleElements } = useCanvasStore.getState();
      moveMultipleElements(positions);
    },
    updateElement: (id, updates) => {
      const { updateElement } = useCanvasStore.getState();
      updateElement(id, updates);
    },
    onSnapElement: snapElement,
    onSnapPoint: snapPoint,
    onSetSnapGuides: setCurrentGuides,
    onClearSnapGuides: clearElementSnapGuides,
  });

  // Set up global event listeners for dragging
  useEffect(() => {
    const cleanup = setupGlobalEventListeners();
    return cleanup;
  }, [setupGlobalEventListeners]);

  // Initialize timeline subscriptions on mount
  useEffect(() => {
    initializeSubscriptions();
    return () => {
      cleanupSubscriptions();
    };
  }, [initializeSubscriptions, cleanupSubscriptions]);

  // Update groups when groups array changes
  useEffect(() => {
    updateSelectedGroups(groups);
  }, [groups, updateSelectedGroups]);

  // Handle side effects when tool changes - clear selection when switching to creation tools
  useEffect(() => {
    // Clear selection when switching to creation tools to prevent drag conflicts
    // This allows placing new objects on top of previously selected shapes
    // Exception: In path mode, keep the target element selected so user knows which element they're creating paths for
    if (toolState.activeTool !== 'select' && !toolState.isPathMode) {
      selectElement(null);
    }
  }, [toolState.activeTool, toolState.isPathMode, selectElement]);

  // Handle select all
  const handleSelectAll = useCallback(() => {
    const selectableElements = canvasObjects.filter(el => !el.isAnimationPath);
    selectAll(selectableElements);
  }, [canvasObjects, selectAll]);

  // Enhanced keyboard shortcuts hook will be called after handlers are defined

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      gsapManager.clearTimeline();
    };
  }, [gsapManager, setTimelineCanvasRef, fullscreenCanvasRef]);

  useEffect(() => {
    if (dimensions.width > 0 && canvasObjects.length > 0 && gsapManager) {
      // Small delay to ensure canvas refs are ready
      setTimeout(() => {
        buildGSAPTimeline();
      }, 10);
    }
  }, [canvasObjects, groups, dimensions, buildGSAPTimeline, gsapManager]);

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
      return null;
    }

    const bounds = calculateBounds(elements);
    const groupId = customId || `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const groupName = name || (() => {
      switch (type) {
        case 'custom':
          const customGroupCount = groups.filter(g => !g.isDefaultGroup && g.type === 'custom').length;
          return `Group ${customGroupCount + 1}`;
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
      opacity: 1,
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
  }, [groups, calculateBounds, setCanvasObjects, setGroups, selectAll, selectGroup]);

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
    if (!toolState.isClosingShape || toolState.chainedLineIds.length === 0) return;

    // Find the chained lines including the last one
    const chainedLines = canvasObjects.filter(obj => toolState.chainedLineIds.includes(obj.id));

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
        togglePathMode();
        setAnimationTarget(null);
      }
    }

    // Clean up line chaining state
    setLineStartPoint(null);
    setLineChaining(false);
    clearChainedLineIds();
    setClosingShape(false);
    setActiveTool('select');
    setMaskPos(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolState.isClosingShape, toolState.chainedLineIds, canvasObjects, createPolygonGroup, clearChainedLineIds, setActiveTool, setAnimationTarget, setClosingShape, setGroups, setLineChaining, setLineStartPoint, setMaskPos, togglePathMode]);

  // Helper function to add path shape to animation
  const addPathToAnimation = useCallback((pathShape: AnimatedCanvasObject | CanvasGroup) => {
    const target = toolState.animationTarget;
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
  }, [toolState.animationTarget, setCanvasObjects]);



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

  // Canvas event listeners hook
  useCanvasEventListeners({
    gsapManager,
    updateAnimationsForPathElement,
    addPathToAnimation,
    togglePathMode,
    setAnimationTarget,
    clearElementSnapGuides
  });

  // Use a ref to track if we're currently dragging to avoid expensive operations
  const isGroupDraggingRef = useRef(false);
  const groupDragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      togglePathMode();
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
              const newLineOptions = value as NonNullable<AnimatedCanvasObject['lineOptions']>;
              updatedElement = {
                ...el,
                lineOptions: {
                  ...newLineOptions,
                  // Ensure controlPoint and isCurved are preserved
                  controlPoint: newLineOptions.controlPoint ?? el.lineOptions?.controlPoint,
                  isCurved: newLineOptions.isCurved ?? el.lineOptions?.isCurved ?? true
                }
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
          } else if (prop === 'opacity') {
            return { ...group, opacity: value as number };
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
  }, [canvasObjects, selectedGroups, setCanvasObjects, setGroups]);

  // Selection navbar handlers
  const handleSelectionNavbarAnimate = useCallback(() => {
    if (selectedObjects.length === 1) {
      const { setShowAnimationsTab } = useUIStore.getState();
      setShowAnimationsTab(true);
    }
  }, [selectedObjects]);

  const handleSelectionNavbarDelete = useCallback(() => {
    const { removeElement, removeGroup } = useCanvasStore.getState();
    
    // Delete selected elements
    if (selectedObjects.length > 0) {
      selectedObjects.forEach(element => {
        removeElement(element.id);
      });
    }
    
    // Delete selected groups
    if (selectedGroups.length > 0) {
      selectedGroups.forEach(group => {
        removeGroup(group.id);
      });
    }
    
    // Add a small delay before clearing selections to keep navbar visible briefly
    setTimeout(() => {
      selectElement(null);
    }, 100);
  }, [selectedObjects, selectedGroups, selectElement]);

  const handleSelectionNavbarCopy = useCallback(() => {
    if (selectedObjects.length > 0) {
      const { copyElements } = useCanvasStore.getState();
      const elementIds = selectedObjects.map(element => element.id);
      copyElements(elementIds);
    }
  }, [selectedObjects]);

  const handleSelectionNavbarDuplicate = useCallback(() => {
    if (selectedObjects.length > 0) {
      const { addElement } = useCanvasStore.getState();
      const duplicatedElements = selectedObjects.map(element => ({
        ...element,
        id: crypto.randomUUID(),
        name: `${element.name} Copy`,
        x: element.x + 20,
        y: element.y + 20,
      }));
      
      duplicatedElements.forEach(element => {
        addElement(element);
      });
      
      selectElement(duplicatedElements);
    }
  }, [selectedObjects, selectElement]);

  const handlePaste = useCallback(() => {
    const { pasteElements } = useCanvasStore.getState();
    const pastedElements = pasteElements();
    
    if (pastedElements.length > 0) {
      // Select the newly pasted elements
      selectElement(pastedElements);
    }
  }, [selectElement]);

  const handleSelectionNavbarGroup = useCallback(() => {
    if (selectedObjects.length > 1) {
      handleGroupElements();
    }
  }, [selectedObjects, handleGroupElements]);

  const handleSelectionNavbarUngroup = useCallback(() => {
    if (selectedGroups.length > 0) {
      handleUngroupElements();
    }
  }, [selectedGroups, handleUngroupElements]);

  const handleSelectionNavbarOptions = useCallback(() => {
    // TODO: Implement options menu
    console.log('Show options for selected elements');
  }, []);

  // Enhanced keyboard shortcuts integration
  useKeyboardShortcuts({
    onSelectAll: handleSelectAll,
    onCopy: handleSelectionNavbarCopy,
    onPaste: handlePaste,
    onDuplicate: handleSelectionNavbarDuplicate,
    onGroup: handleGroupElements,
    onUngroup: handleUngroupElements,
  });

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
  }, [selectedObjects, groups, updateSelectedGroups]);



  // Track shift key state for constrained drawing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKey(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setShiftKey(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Prevent browser's default context menu globally
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      // Only prevent context menu on the canvas area
      const target = e.target as HTMLElement;
      if (target.closest('.canvas-area') || target.closest('[data-pixi-container]')) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  const activeNav = useActiveNav();

  const handleGroupSelectionDragStart = useCallback((virtualElement: AnimatedCanvasObject, mouseX: number, mouseY: number, allElements?: AnimatedCanvasObject[]) => {
    // Check if this is a real group selection (not just multi-selection)
    const selectedGroupIds = new Set(selectedGroups.map(g => g.id));
    const elementsInGroups = selectedObjects.filter(el => el.groupId && selectedGroupIds.has(el.groupId));
    
    if (elementsInGroups.length > 0) {
      // This is a group selection - handle group movement using the existing drag system
      const groupId = elementsInGroups[0].groupId!;
      const group = groups.find(g => g.id === groupId);
      
      if (group && !group.isDefaultGroup) {
        // Calculate offsets for all elements in the group
        const groupOffsets = elementsInGroups.map(element => ({
          id: element.id,
          offsetX: mouseX - element.x,
          offsetY: mouseY - element.y
        }));
        
        // Start group dragging using the existing startDragging function
        startDragging('virtual-group', mouseX - group.x, mouseY - group.y, true, groupOffsets);
      }
    } else {
      // This is multi-selection of ungrouped elements - use existing multi-element dragging
      const offsetX = mouseX - virtualElement.x;
      const offsetY = mouseY - virtualElement.y;
      
      // Calculate offsets for all selected elements
      const groupOffsets = selectedObjects.map(element => ({
        id: element.id,
        offsetX: mouseX - element.x,
        offsetY: mouseY - element.y
      }));
      
      // Start multi-element dragging using the existing startDragging function
      startDragging('virtual-group', offsetX, offsetY, true, groupOffsets);
    }
  }, [selectedObjects, selectedGroups, groups, startDragging]);

  const isElementInCustomOrPolygonGroup = useCallback((element: AnimatedCanvasObject) => {
    const group = groups.find(g => g.id === element.groupId);
    return !!(group && !group.isDefaultGroup && (group.type === 'custom' || group.type === 'polygon'));
  }, [groups]);

  const onPathStartClick = useCallback((_elementId: string, _x: number, _y: number) => {
    // Handle path start click
  }, []);

  // Timeline should shift when any tab with content panels is active (not toggle buttons or compact tabs)
  // Include: scenes, uploads, ai, video, text, animations, layers, components
  // Exclude: tools (compact), audio (toggle), timeline (toggle)
  const tabsWithPanels = ['scenes', 'uploads', 'ai', 'video', 'text', 'animations', 'layers', 'components'];
  const timelineLeftOffset = 80 + (panelState.leftPanelVisible && activeNav && tabsWithPanels.includes(activeNav) ? panelState.leftPanelWidth + 8 : 0);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Options Bar - Fixed at top */}
      <div className="fixed top-0 left-0 right-0 z-50">
        <MainNavBar
          onGroupElements={handleGroupElements}
          onUngroupElements={handleUngroupElements}
        />
      </div>

      {/* Selection Navbar - appears when elements are selected and not playing */}
      {!isPlaying && (
        <SelectionNavbar
          selectedElements={selectedObjects}
          selectedGroups={selectedGroups}
          onAnimate={handleSelectionNavbarAnimate}
          onDelete={handleSelectionNavbarDelete}
          onCopy={handleSelectionNavbarCopy}
          onDuplicate={handleSelectionNavbarDuplicate}
          onGroup={handleSelectionNavbarGroup}
          onUngroup={handleSelectionNavbarUngroup}
          onOptions={handleSelectionNavbarOptions}
        />
      )}

      {/* Navigation Sidebars */}
      <LeftSidebar />
      <RightSidebar />

      {/* Main Body - Full-screen PIXI Application */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative overflow-hidden" 
        style={{ marginTop: '64px' }}
        onContextMenu={(e) => {
          // Prevent browser's default context menu from appearing
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <ApplicationCanvas 
          ref={fullscreenCanvasRef}
          dimensions={dimensions}
          snapGuides={snapGuides}
          elements={canvasObjects}
          groups={groups}
          selectedIds={selectedObjects.map(el => el.id)}
          hoveredId={hoveredId}
          editingTextId={editingTextId}
          tool={toolState.activeTool}
          isPathMode={toolState.isPathMode}
          animationTarget={toolState.animationTarget}
          lineStartPoint={toolState.lineStartPoint}
          isLineChaining={toolState.isLineChaining}
          chainedLineIds={toolState.chainedLineIds}
          mousePos={mousePos}
          currentPath={currentPath}
          isDrawing={isDrawing}
          shapeRefs={shapeRefs}
          groupContainers={groupContainers}
          mainCanvasContainerRef={mainCanvasContainerRef}
          drawingRef={drawingRef}
          canvasScaleFactor={canvasScaleFactor}
          handleCanvasPointerDown={handleCanvasPointerDown}
          handleCanvasPointerMove={handleCanvasPointerMove}
          handlePointerUp={handlePointerUp}
          handleSelectElement={handleSelectElement}
          handleCanvasClick={handleCanvasClick}
          handlePointerDown={handlePointerDown}
          handleElementMouseMove={handleElementMouseMove}
          handleElementMouseLeave={handleElementMouseLeave}
          onPathStartClick={onPathStartClick}
          handleGroupSelectionDragStart={handleGroupSelectionDragStart}
          isElementInCustomOrPolygonGroup={isElementInCustomOrPolygonGroup}
          canvasZoom={canvasZoom}
          onCanvasZoomChange={setCanvasZoom}
          // Snapping handlers
          onSnapElement={snapElement}
          onSnapPoint={snapPoint}
          onSetSnapGuides={setCurrentGuides}
          onClearSnapGuides={clearElementSnapGuides}
          // Deselection handler for empty area clicks
          onEmptyAreaClick={() => {
            // Deselect all elements when clicking in empty area
            selectElement(null);
          }}
          // Context menu handlers
          onElementContextMenu={(e, elementId) => {
            // Handle element context menu
            console.log('Element context menu:', elementId);
          }}
          onGroupContextMenu={(e, groupId) => {
            // Handle group context menu
            console.log('Group context menu:', groupId);
          }}
          shiftKey={shiftKey}
          isSnappingEnabled={elementSnapConfig.enabled && !isElementSnapDisabled}
        />

        {/* Path Mode Banner */}
        {toolState.isPathMode && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-blue-100 text-blue-800 px-4 py-2 rounded-lg shadow-md z-50 flex items-center gap-4">
            <span>
              <strong>Path Drawing Mode:</strong> Select a tool and draw a path that your element will follow.
            </span>
            <button
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              onClick={() => {
                togglePathMode();
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
          style={{ right: `${panelState.rightPanelVisible ? panelState.rightPanelWidth + 16 + 80 : 16 + 80}px` }}
        >
          {/* Path visibility toggle - only show if paths exist */}
          {canvasObjects.some(el => el.isAnimationPath) && (
            <button
              className={`px-3 py-1.5 rounded shadow flex items-center ${toolState.showPaths ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
              onClick={() => toggleShowPaths()}
              title={toolState.showPaths ? 'Hide Animation Paths' : 'Show Animation Paths'}
            >
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z"
                  fill={toolState.showPaths ? "white" : "currentColor"} />
                <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z"
                  fill={toolState.showPaths ? "white" : "currentColor"} />
              </svg>
              {toolState.showPaths ? 'Paths Visible' : 'Paths Hidden'}
            </button>
          )}
        </div>

        {/* Mask Overlay - Fixed position relative to viewport */}
        <MaskOverlay
          tool={toolState.activeTool}
          maskPos={toolState.maskPos}
          maskOffsetX={MASK_OFFSET_X}
          maskOffsetY={MASK_OFFSET_Y}
        />

        {/* Floating Right Panel - Content */}
        {(() => {
          // Show right panel when there's a selection or when layers is explicitly selected
          const shouldShow = panelState.rightPanelVisible && activeRightPanel && !isPlaying && (
            activeRightPanel === 'layers' || 
            (hasSelection && (activeRightPanel === 'properties' || activeRightPanel === 'animations'))
          );
          return shouldShow;
        })() && (
          <>
            <div
              className={`absolute h-2/3 right-20 top-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl overflow-y-auto z-30 mb-2 transform transition-all duration-300 ease-out translate-x-0 opacity-100`}
              style={{ 
                width: `${panelState.rightPanelWidth / 16}rem`,
                bottom: `${panelState.timelineHeight + 8}px`,
              }}
            >
              { activeRightPanel === 'properties' && hasSelection && (
                <PropertiesPanel
                  onInspectorChange={handleInspectorChange}
                  onGroupInspectorChange={handleGroupInspectorChange}
                />
              )}
              { activeRightPanel === 'animations' && hasSelection && (
                <AnimationsPanel
                  onInspectorChange={handleInspectorChange}
                  onGroupInspectorChange={handleGroupInspectorChange}
                />
              )}
              { activeRightPanel === 'layers' && (
                <LayersTab />
              )}
            </div>
          </>
        )}
      </div>

      {/* Floating Timeline - positioned fixed at bottom, starts after navigation sidebar */}
      <div
        className="fixed bottom-2 right-0 bg-transparent z-50 transition-all duration-600 ease-in-out"
        style={{
          left: `${timelineLeftOffset}px`, // Start after nav sidebar and any visible left panel
          height: panelState.isTimelineCollapsed ? '72px' : `${panelState.timelineHeight}px`,
          minHeight: '72px', // Allow collapsing to 72px to show controls
          maxHeight: '80vh'
        }}
      >
        {/* Timeline Resize Handle - Visual indicator - only show when not collapsed */}
        {!panelState.isTimelineCollapsed && (
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-40"
            onMouseDown={handleMouseDown('timeline')}
          />
        )}

        <Timeline canvasZoom={canvasZoom} onCanvasZoom={setCanvasZoom} />
      </div>

      {/* Hidden file input for image upload */}
      <input
        ref={imageFileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageUpload}
      />
    </div>
  );
}
