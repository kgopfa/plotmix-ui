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
import { AnimatedCanvasElement, ElementAnimation } from '@/types/canvas';
import { Canvas } from './canvas';
import { FederatedPointerEvent, Container } from 'pixi.js';
import type { CanvasRef } from './canvas';
import { createNewElement } from '@/lib/element-factory';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useKeyboardShortcuts } from '@/hooks/use-keyboard-shortcuts';
import { ToolType } from '@/types/editor';


export default function EditorCanvas() {
  const [elements, setElements] = useState<AnimatedCanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<AnimatedCanvasElement | null>(null);
  const [tool, setTool] = useState<ToolType>('select');
  const [maskPos, setMaskPos] = useState<{ x: number, y: number } | null>(null);
  const [lineStartPoint, setLineStartPoint] = useState<{ x: number, y: number } | null>(null);
  const [timeState, setTimeState] = useState<TimeManagerState>({
    isPlaying: false,
    elapsedTime: 0
  });
  const [timelineState, setTimelineState] = useState<TimelineState>({
    tracks: [],
    duration: 10,
    scale: 100
  });
  const [isPathMode, setIsPathMode] = useState(false);
  const [animationTarget, setAnimationTarget] = useState<{
    animationId: string;
    elementId: string;
  } | null>(null);
  const [showPaths, setShowPaths] = useState(true);

  // Panel state management
  const [leftPanelWidth, setLeftPanelWidth] = useState(320); // Default 320px (w-80)
  const [rightPanelWidth, setRightPanelWidth] = useState(320); // Default 320px (w-80)
  const [leftPanelVisible, setLeftPanelVisible] = useState(true);
  const [rightPanelVisible, setRightPanelVisible] = useState(true);
  const [isResizing, setIsResizing] = useState<'left' | 'right' | null>(null);

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const canvasRef = useRef<CanvasRef | null>(null);

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
    setElements(prev => prev.map(el =>
      el.id === id
        ? { ...el, rotation }
        : el
    ));
  };

  const handleTextChange = (id: string, text: string) => {
    setElements(prev => prev.map(el =>
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
  const selectionManager = useMemo(() => SelectionManager.getInstance(), []);

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
    setElements(elements => elements.filter(el => el.id !== elementId));
    setSelectedElement(null);
  }, []);

  const handleToolChange = useCallback((newTool: ToolType) => {
    setTool(newTool);
    setMaskPos(null);
  }, []);

  useKeyboardShortcuts({
    selectedElement,
    onDeleteElement: handleDeleteElement,
    onToolChange: handleToolChange
  });

  useEffect(() => {
    gsapManager.setCanvasRef(canvasRef);

    // Cleanup on unmount
    return () => {
      gsapManager.clearTimeline();
    };
  }, [gsapManager]);

  useEffect(() => {
    if (dimensions.width > 0 && elements.length > 0 && gsapManager) {
      // Small delay to ensure canvas refs are ready
      setTimeout(() => {
        gsapManager.buildAnimationTimeline(elements);
      }, 10);
    }
  }, [elements, dimensions, gsapManager]);

  useEffect(() => {
    return timeManager.subscribe(({ isPlaying, elapsedTime }) => {
      gsapManager.updateTime(elapsedTime);
      gsapManager.handlePlayback(isPlaying, () => gsapManager.updateTime(timeManager.getState().elapsedTime));
    });
  }, [timeManager, gsapManager]);

  const canvasClickHandler = (e: FederatedPointerEvent) => {
    const isEmptyClick = !(e.target && (e.target as Container).label === 'shape');

    if (isEmptyClick) {
      if (tool === 'line') {
        if (!lineStartPoint) {
          // First click - set start point
          setLineStartPoint({ x: e.global.x, y: e.global.y });
        } else {
          // Second click - create line and reset
          const newElement = createNewElement('line', lineStartPoint.x, lineStartPoint.y, elements, undefined, isPathMode);
          // Update line end point
          newElement.lineOptions = {
            points: {
              start: { x: lineStartPoint.x, y: lineStartPoint.y },
              end: { x: e.global.x, y: e.global.y }
            },
            arrow: false,
            dotted: false
          };

          setElements(prev => [...prev, newElement]);
          selectionManager.select(newElement);
          setTool('select');
          setLineStartPoint(null);
          setMaskPos(null);

          // If in path mode, exit after creating the path
          if (isPathMode) {
            addPathToAnimation(newElement);
            setIsPathMode(false);
            setAnimationTarget(null);
          }
        }
      } else if (tool === 'rectangle' || tool === 'circle' || tool === 'triangle') {
        const newElement = createNewElement(tool, e.global.x, e.global.y, elements, undefined, isPathMode);
        setElements(prev => [...prev, newElement]);
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
        const newElement = createNewElement('text', e.global.x, e.global.y, elements, undefined, isPathMode);
        setElements(prev => [...prev, newElement]);
        selectionManager.select(newElement);
        setTool('select');
        setMaskPos(null);

        // If in path mode, exit after creating the path
        if (isPathMode) {
          addPathToAnimation(newElement);
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else {
        selectionManager.select(null);
      }
    }
  };

  // Helper function to add path shape to animation
  const addPathToAnimation = useCallback((pathShape: AnimatedCanvasElement) => {
    const target = animationTarget;
    if (!target) return;

    const { elementId, animationId } = target;

    setElements(prev =>
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
  }, [animationTarget, setElements]);

  // Update animations when their path element is modified
  const updateAnimationsForPathElement = useCallback((elements: AnimatedCanvasElement[], pathElement: AnimatedCanvasElement) => {
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
    setElements(prevElements => {
      const updatedElements = prevElements.map((el) => {
        if (el.id !== id) return el;

        // For lines, we need to update both position and points
        if (el.type === 'line' && el.lineOptions?.points) {
          const dx = x - el.x;
          const dy = y - el.y;
          return {
            ...el,
            x,
            y,
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
        return { ...el, x, y };
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
      setElements(currentElements => {
        gsapManager.buildAnimationTimeline(currentElements);
        return currentElements;
      });
    }, 0);
  };

  const handleAnimationChange = (
    elementId: string,
    animationId: string,
    update: Partial<ElementAnimation>
  ) => {
    setElements(prev =>
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
      setElements(currentElements => {
        gsapManager.buildAnimationTimeline(currentElements);
        return currentElements;
      });
    }, 0);
  };

  const handleInspectorChange = (
    prop: string,
    value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasElement['lineOptions']> | {
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

    if (selectedElement) {
      let updatedElement: AnimatedCanvasElement | null = null;

      if (prop === 'animations') {
        setElements(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedElement.id) {
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
        setElements(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedElement.id) {
              updatedElement = {
                ...el,
                lineOptions: value as NonNullable<AnimatedCanvasElement['lineOptions']>
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
        setElements(prevElements => {
          const newElements = prevElements.map(el => {
            if (el.id === selectedElement.id) {
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
    timelineManager.setTracks(elements);
  }, [elements, timelineManager]);

  // Subscribe to selection updates
  useEffect(() => {
    return selectionManager.subscribe(setSelectedElement);
  }, [selectionManager]);

  // Use a ref to access current elements to avoid dependency issues
  const elementsRef = useRef(elements);
  elementsRef.current = elements;

  // Listen for resize events from the Canvas component
  useEffect(() => {
    const handleElementResize = (e: CustomEvent) => {
      const { id, width, height, handle } = e.detail;
      console.log('Resize event:', { id, width, height, handle });

      setElements(() => {
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

      setElements(prevElements =>
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

      setElements(prevElements => {
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

    return () => {
      window.removeEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);
    };
  }, [updateAnimationsForPathElement, gsapManager]);

  // Memoize the handleSelectElement function
  const handleSelectElement = useCallback((id: string | null) => {
    const element = id ? elements.find(e => e.id === id) || null : null;
    selectionManager.select(element);
  }, [elements, selectionManager]);

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
    setElements(prevElements => {
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

  const handleAddElement = useCallback((element: AnimatedCanvasElement) => {
    setElements(prev => [...prev, element]);
    selectionManager.select(element);

    if (isPathMode && element.type === 'path' && element.isAnimationPath) {
      addPathToAnimation(element);
      setIsPathMode(false);
      setAnimationTarget(null);
    }
  }, [selectionManager, isPathMode, addPathToAnimation, setIsPathMode, setAnimationTarget]);

  const handleSvgImport = useCallback(async (file: File) => {
    try {
      // Read the file contents
      const svgData = await file.text();

      console.log("Importing SVG:", file.name);

      // Create a placeholder first while we wait for the image to load
      const placeholderElement = createNewElement(
        'rectangle',
        dimensions.width / 2 - 50,  // Center horizontally - half of default width (100px)
        dimensions.height / 2 - 50, // Center vertically - half of default height (100px)
        elements,
        undefined,
        false
      );
      placeholderElement.fill = '#e0e0e0';
      placeholderElement.name = "SVG Loading...";

      setElements(prev => [...prev, placeholderElement]);
      selectionManager.select(placeholderElement);

      // Load the SVG to get its aspects/dimensions
      const imgUrl = URL.createObjectURL(new Blob([svgData], { type: 'image/svg+xml' }));
      const img = new Image();

      // Wait for image to load
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load SVG"));
        img.src = imgUrl;
      });

      // Use default dimensions of 100x100 (same as rectangle)
      const svgWidth = 100;
      const svgHeight = 100;

      // Create SVG element with standard size
      const svgElement = createNewElement(
        'svg',
        dimensions.width / 2 - svgWidth / 2,    // Center horizontally
        dimensions.height / 2 - svgHeight / 2,  // Center vertically
        elements,
        undefined,
        false,
        svgData,
        svgWidth,   // Fixed size of 100px width
        svgHeight   // Fixed size of 100px height
      );

      // Replace the placeholder with the SVG
      setElements(prev => {
        const filtered = prev.filter(el => el.id !== placeholderElement.id);
        return [...filtered, svgElement];
      });

      selectionManager.select(svgElement);
      setTool('select');

      // Clean up
      URL.revokeObjectURL(imgUrl);

    } catch (error) {
      console.error("Error importing SVG:", error);
      alert("Failed to import SVG. Please try another file.");
    }
  }, [dimensions.width, dimensions.height, elements, selectionManager]);

  return (
    <div className="flex flex-col h-screen w-screen">
      {/* Options Bar */}
      <div className="h-12 bg-white border-b flex items-center justify-between px-4 shadow z-20">
        <div className="flex gap-2">
          <button className="btn">New Scene</button>
          <button className="btn">Save</button>
          <button className="btn">Revert</button>
          <div className="flex gap-1 ml-2 border-l pl-2">
            <button 
              className={`btn ${leftPanelVisible ? 'bg-blue-100' : ''}`}
              onClick={() => setLeftPanelVisible(!leftPanelVisible)}
              title="Toggle Scene Explorer"
            >
              📋
            </button>
            <button 
              className={`btn ${rightPanelVisible ? 'bg-blue-100' : ''}`}
              onClick={() => setRightPanelVisible(!rightPanelVisible)}
              title="Toggle Inspector"
            >
              🔧
            </button>
          </div>
        </div>
        <div className="flex gap-2 items-center">
          <button className="btn">Export ▼</button>
          <div className="flex gap-1 items-center border-r pr-2 mr-2">
            <button 
              className="btn" 
              onClick={() => {
                if (canvasRef.current) {
                  canvasRef.current.zoomOut();
                } else {
                  setCanvasZoom(prev => Math.max(prev * 0.9, 0.1));
                }
              }}
            >
              −
            </button>
            <span className="text-xs text-gray-600 min-w-[40px] text-center">
              {Math.round(canvasZoom * 100)}%
            </span>
            <button 
              className="btn" 
              onClick={() => {
                if (canvasRef.current) {
                  canvasRef.current.zoomIn();
                } else {
                  setCanvasZoom(prev => Math.min(prev * 1.1, 5));
                }
              }}
            >
              +
            </button>
            <button 
              className="btn ml-1" 
              onClick={() => {
                // Reset zoom to 100% while maintaining view position
                if (canvasRef.current) {
                  canvasRef.current.resetZoomToOneHundredPercent();
                }
              }}
              title="Reset to 100%"
            >
              100%
            </button>
          </div>
        </div>
      </div>

      {/* Main Body - Full width canvas with floating panels */}
      <div className="flex-1 relative overflow-hidden">
        {/* Scrollable Canvas Container */}
        <main
          ref={containerRef}
          className="absolute inset-0 bg-gray-100 overflow-auto"
          onMouseMove={e => {
            if (tool !== 'select') {
              const rect = e.currentTarget.getBoundingClientRect();
              setMaskPos({
                x: e.clientX - rect.left,
                y: e.clientY - rect.top,
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
            {elements.some(el => el.isAnimationPath) && (
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
                  elements={showPaths ? elements : elements.filter(el => !el.isAnimationPath)}
                  selectedId={selectedElement?.id || null}
                  onElementSelect={handleSelectElement}
                  onElementDragEnd={handleElementDragEnd}
                  onCanvasClick={canvasClickHandler}
                  onLineEndpointDrag={handleLineEndpointDrag}
                  tool={tool}
                  onAddElement={handleAddElement}
                  isPathMode={isPathMode}
                  onElementRotate={handleElementRotate}
                  onTextChange={handleTextChange}
                  zoom={canvasZoom}
                  onZoomChange={setCanvasZoom}
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
            onSvgImport={handleSvgImport}
          />
        </div>

        {/* Mask Overlay - Fixed position relative to viewport */}
        <MaskOverlay
          tool={tool}
          maskPos={maskPos}
          maskOffsetX={MASK_OFFSET_X}
          maskOffsetY={MASK_OFFSET_Y}
          lineStartPoint={lineStartPoint}
        />

        {/* Floating Left Panel - Scene Explorer */}
        {leftPanelVisible && (
          <>
            <div
              className="absolute top-0 left-0 h-full bg-gray-50/95 backdrop-blur-sm border-r border-gray-200 overflow-y-auto z-30 shadow-lg transition-transform duration-300"
              style={{ width: `${leftPanelWidth}px` }}
            >
              <SceneExplorer elements={elements} selectionManager={selectionManager} />
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
                selectedElement={selectedElement}
                onInspectorChange={handleInspectorChange}
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
          elements={elements.filter(el => !el.isAnimationPath)}
          timelineState={timelineState}
          timeState={timeState}
          onPlayPause={handlePlayPause}
          onStop={handleStop}
          onAnimationChange={handleAnimationChange}
          selectionManager={selectionManager}
        />
      </div>
    </div>
  );
}
