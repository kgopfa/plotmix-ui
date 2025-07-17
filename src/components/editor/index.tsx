// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TimelineManager } from '@/lib/timeline-manager';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useUIStore, useActiveNav, useActiveRightPanel, useCanvasLock } from '@/stores/use-ui-store';
import { useTimelineSync } from '@/stores/use-timeline-store';
import { useCanvasMigration } from '@/hooks/use-canvas-migration';
import { GSAPTimelineManager } from '@/lib/gsap-timeline-manager';
import { PropertiesPanel } from './navigation/right-sidebar/properties-panel';
import { AnimationsPanel } from './navigation/right-sidebar/animations-panel';

import { Timeline } from './timeline';
import { MaskOverlay } from './canvas/mask-overlay';
import { AnimatedCanvasObject, ElementAnimation, CanvasGroup } from '@/types/canvas';

import dynamic from 'next/dynamic';
import { createNewObject } from '@/lib/canvas-object-factory';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { MainNavBar } from './navigation/main';
import { LeftSidebar } from './navigation/left-sidebar';
import { RightSidebar } from './navigation/right-sidebar';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import type { ApplicationCanvasRef } from './application-canvas';


const ApplicationCanvas = dynamic(() => import('./application-canvas').then(m => m.ApplicationCanvas), { ssr: false });


export default function EditorCanvas() {
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
  const {
    setLeftPanelWidth,
    setRightPanelWidth,
    setTimelineHeight,
    setResizing
  } = useUIStore();

  // Use UI store for other tool state
  const {
    togglePathMode,
    setAnimationTarget,
    toggleShowPaths,
  } = useUIStore();

  const activeRightPanel = useActiveRightPanel();

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const fullscreenCanvasRef = useRef<ApplicationCanvasRef | null>(null);
  const imageFileInputRef = useRef<HTMLInputElement>(null);

  // Timeline store integration
  const {
    setCanvasRef: setTimelineCanvasRef,
  } = useTimelineIntegration();

  // Canvas zoom state - will be implemented with pixi-viewport
  const [canvasZoom, setCanvasZoom] = useState(1);
  
  // Canvas lock state
  const isCanvasLocked = useCanvasLock();

  // Element snapping functionality - only keep what's needed for canvas operations
  const {
    clearGuides: clearElementSnapGuides,
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
    setResizing(panel);
  }, [setResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panelState.isResizing) return;

    // Use requestAnimationFrame for smooth resizing
    requestAnimationFrame(() => {
      if (panelState.isResizing === 'left') {
        const newWidth = Math.max(384, Math.min(600, e.clientX)); // Min 384px (w-96), max 600px
        setLeftPanelWidth(newWidth);
      } else if (panelState.isResizing === 'right') {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX)); // Min 200px, max 600px
        setRightPanelWidth(newWidth);
      } else if (panelState.isResizing === 'timeline') {
        const maxHeight = window.innerHeight * 0.8; // 80% of viewport height
        const minHeight = 32; // Can collapse to just the controls bar
        const newHeight = Math.max(minHeight, Math.min(maxHeight, window.innerHeight - e.clientY)); // Dynamic max height
        setTimelineHeight(newHeight);
      }
    });
  }, [panelState.isResizing, setLeftPanelWidth, setRightPanelWidth, setTimelineHeight]);

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, [setResizing]);


  useEffect(() => {
    if (panelState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = panelState.isResizing === 'timeline' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [panelState.isResizing, handleMouseMove, handleMouseUp]);
  const gsapManager = useMemo(() => new GSAPTimelineManager(), []);

  // Memoize the timeline manager instance
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);

  // Use the canvas dimensions hook
  const { dimensions } = useCanvasDimensions();
  
  // Grid and snap configuration (will be enhanced in next steps)
  const gridConfig = undefined; // Will be implemented with grid system
  const snapGuides: Array<{
    type: 'vertical' | 'horizontal' | 'spacing';
    position: number;
    sourceElementId: string;
    targetElementId: string;
    alignmentType: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'spacingX' | 'spacingY' | 'distributionX' | 'distributionY';
    spacingInfo?: {
      spacing: number;
      referenceElements: string[];
      direction: 'horizontal' | 'vertical';
    };
  }> = []; // Will be implemented with snapping system

  // Initialize timeline subscriptions on mount
  useEffect(() => {
    initializeSubscriptions();
    return () => {
      cleanupSubscriptions();
    };
  }, [initializeSubscriptions, cleanupSubscriptions]);

  // Timeline sync is handled by the useTimelineIntegration hook

  // No longer need auto-centering since canvas is fixed position

  // Note: Zoom handling is now done by the PIXI viewport in the Canvas component
  // This provides better performance and Figma-like zoom behavior

  // Update groups when groups array changes
  useEffect(() => {
    updateSelectedGroups(groups);
  }, [groups, updateSelectedGroups]);

  // Helper functions removed - using direct state management

  // Enhanced keyboard shortcuts now handle deletion internally

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
    // For now, we'll handle canvas ref integration in the next step
    // when we integrate pixi-viewport
    console.log('FullscreenCanvas ref available:', fullscreenCanvasRef.current);

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
    const handleDrawComplete = (e: CustomEvent) => {
      // Exit draw mode when a path is completed
      setActiveTool('select');
      
      const { element, isPathMode: wasInPathMode } = e.detail || {};
      
      // If we were in path mode and completed a drawing, add to animation and exit path mode
      if (toolState.isPathMode && toolState.animationTarget && element && wasInPathMode) {
        // Add the drawn path to the animation
        addPathToAnimation(element);
        
        // Exit path mode
        togglePathMode();
        setAnimationTarget(null);
      }
    };

    window.addEventListener('draw-complete', handleDrawComplete as EventListener);

    return () => {
      window.removeEventListener('draw-complete', handleDrawComplete as EventListener);
    };
      }, [setActiveTool, toolState.isPathMode, toolState.animationTarget, togglePathMode, setAnimationTarget, addPathToAnimation]);

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

    // Listen for single line/shape path additions
    const handleAddPathToAnimation = (e: CustomEvent) => {
      const { pathElement } = e.detail;
      addPathToAnimation(pathElement);
    };

    // Listen for path mode exit events
    const handleExitPathMode = (e: CustomEvent) => {
      const { source } = e.detail;
      console.log('Exiting path mode from:', source);
      
      if (toolState.isPathMode) {
        togglePathMode();
        setAnimationTarget(null);
      }
    };

    window.addEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);
    window.addEventListener('add-path-to-animation', handleAddPathToAnimation as EventListener);
    window.addEventListener('exit-path-mode', handleExitPathMode as EventListener);

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
      window.removeEventListener('add-path-to-animation', handleAddPathToAnimation as EventListener);
      window.removeEventListener('exit-path-mode', handleExitPathMode as EventListener);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateAnimationsForPathElement, gsapManager, addPathToAnimation]);

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

  // Enhanced keyboard shortcuts integration
  useKeyboardShortcuts({
    onSelectAll: handleSelectAll,
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

  // Helper function to handle image file directly
  const handleImageFile = useCallback((file: File) => {
    if (!file) return;

    // Check if file is an image
    if (!file.type.startsWith('image/')) {
      alert('Please select a valid image file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageData = event.target?.result as string;
      if (imageData) {
        // Position new image at center of fixed canvas (0,0 in canvas coordinates)
        const newImage = createNewObject(
          'image',
          0, // Center of canvas
          0, // Center of canvas
          canvasObjects,
          undefined, // pathPoints
          false, // isPath
          imageData,
          200, // default width
          150  // default height
        );

        // Add to canvas and select
        setCanvasObjects(prev => [...prev, newImage]);
        selectElement([newImage]);
      }
    };

    reader.onerror = () => {
      alert('Error reading image file.');
    };

    reader.readAsDataURL(file);
  }, [canvasObjects, setCanvasObjects, selectElement]);

  // Handle image file upload
  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleImageFile(file);
    
    // Clear the input so same file can be uploaded again
    e.target.value = '';
  }, [handleImageFile]);

  // Add event listener for image import from uploads tab
  useEffect(() => {
    const handleImageImport = (event: CustomEvent) => {
      const { file, imageData } = event.detail;
      if (file && imageData) {
        // Create new image element directly from the provided data
        const newImage = createNewObject(
          'image',
          0, // Center of canvas
          0, // Center of canvas
          canvasObjects,
          undefined, // pathPoints
          false, // isPath
          imageData,
          200, // default width
          150  // default height
        );

        // Add to canvas and select
        setCanvasObjects(prev => [...prev, newImage]);
        selectElement([newImage]);
      } else if (file) {
        // Fallback to old method for backward compatibility
        handleImageFile(file);
      }
    };

    window.addEventListener('image-import', handleImageImport as EventListener);
    return () => {
      window.removeEventListener('image-import', handleImageImport as EventListener);
    };
  }, [canvasObjects, setCanvasObjects, selectElement, handleImageFile]);

  const activeNav = useActiveNav();

  // Timeline should shift when any tab with content panels is active (not toggle buttons or compact tabs)
  // Include: scenes, uploads, ai, video, text, animations, layers
  // Exclude: tools (compact), audio (toggle), timeline (toggle)
  const tabsWithPanels = ['scenes', 'uploads', 'ai', 'video', 'text', 'animations', 'layers'];
  const timelineLeftOffset = 80 + (panelState.leftPanelVisible && activeNav && tabsWithPanels.includes(activeNav) ? panelState.leftPanelWidth + 8 : 0);

  return (
    <div className="h-screen w-screen flex flex-col">
      {/* Options Bar */}
      <MainNavBar
        onGroupElements={handleGroupElements}
        onUngroupElements={handleUngroupElements}
      />

      {/* Navigation Sidebars */}
      <LeftSidebar />
      <RightSidebar />

      {/* Main Body - Full-screen PIXI Application */}
      <div className="flex-1 relative overflow-hidden">
        <ApplicationCanvas 
          ref={fullscreenCanvasRef}
          dimensions={dimensions}
          gridConfig={gridConfig}
          snapGuides={snapGuides}
          elements={canvasObjects}
          groups={groups}
          selectedIds={selectedObjects.map(el => el.id)}
          hoveredId={null}
          isPlaying={false}
          editingTextId={null}
          tool={toolState.activeTool}
          isPathMode={toolState.isPathMode}
          animationTarget={toolState.animationTarget}
          lineStartPoint={toolState.lineStartPoint}
          isLineChaining={toolState.isLineChaining}
          chainedLineIds={toolState.chainedLineIds}
          mousePos={null}
          currentPath={[]}
          isDrawing={false}
          shapeRefs={{ current: {} }}
          groupContainers={{ current: {} }}
          drawingRef={{ current: null }}
          canvasScaleFactor={{ current: 1 }}
          handleCanvasPointerDown={() => {}}
          handleCanvasPointerMove={() => {}}
          handlePointerUp={() => {}}
          handleSelectElement={() => {}}
          handleCanvasClick={() => {}}
          handlePointerDown={() => () => {}}
          handleElementMouseMove={() => () => {}}
          handleElementMouseLeave={() => () => {}}
          onPathStartClick={() => {}}
          handleGroupSelectionDragStart={() => {}}
          isTextGroupCharacter={() => false}
          isElementInCustomOrPolygonGroup={() => false}
          canvasZoom={canvasZoom}
          onCanvasZoomChange={setCanvasZoom}
          isLocked={isCanvasLocked}
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
          // Only show right panel when there's a selection
          const shouldShow = panelState.rightPanelVisible && activeRightPanel && hasSelection && (
            activeRightPanel === 'properties' || activeRightPanel === 'animations'
          );
          return shouldShow;
        })() && (
          <>
            <div
              className={`absolute right-20 bg-white border border-gray-200 rounded-lg shadow-sm overflow-y-auto z-30 mb-2 transform transition-all duration-300 ease-out ${
                hasSelection 
                  ? 'translate-x-0 opacity-100' 
                  : 'translate-x-full opacity-0'
              }`}
              style={{ 
                width: `${panelState.rightPanelWidth / 16}rem`, 
                top: '8px', 
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
