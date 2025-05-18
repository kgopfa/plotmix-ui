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
  const [, setAnimationTarget] = useState<{
    animationId: string;
    elementId: string;
  } | null>(null);
  const [showPaths, setShowPaths] = useState(true);

  const MASK_OFFSET_X = 0;
  const MASK_OFFSET_Y = 0;

  const canvasRef = useRef<CanvasRef | null>(null);
  const gsapManager = useMemo(() => new GSAPTimelineManager(), []);

  // Memoize the time manager instance
  const timeManager = useMemo(() => TimeManager.getInstance(), []);
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);
  const selectionManager = useMemo(() => SelectionManager.getInstance(), []);

  // Use the canvas dimensions hook
  const dimensions = useCanvasDimensions();

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
  }, [gsapManager]);

  useEffect(() => {
    if (dimensions.width > 0 && elements.length > 0) {
      gsapManager.buildAnimationTimeline(elements);
    }
  }, [elements, dimensions, gsapManager]);

  useEffect(() => {
    return timeManager.subscribe(({ isPlaying, elapsedTime }) => {
      gsapManager.updateTime(elapsedTime);
      gsapManager.handlePlayback(isPlaying, () => gsapManager.updateTime(timeManager.getState().elapsedTime));
    });
  }, [timeManager, gsapManager]);

  const canvasClickHandler = (e: FederatedPointerEvent) => {
    const isEmptyClick = !(e.target && (e.target as Container).name === 'shape');

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
          setIsPathMode(false);
          setAnimationTarget(null);
        }
      } else {
        selectionManager.select(null);
      }
    }
  };


  const handleElementDragEnd = (id: string, x: number, y: number) => {
    setElements(elements.map((el) => {
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
    }));
    gsapManager.buildAnimationTimeline(elements);
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
    gsapManager.buildAnimationTimeline(elements);
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
      if (prop === 'animations') {
        setElements(elements => {
          const updatedElements = elements.map(el =>
            el.id === selectedElement.id ? { ...el, animations: value as ElementAnimation[] } : el
          );
          gsapManager.buildAnimationTimeline(updatedElements);
          return updatedElements;
        });
      } else if (prop === 'lineOptions') {
        setElements(elements => {
          const updatedElements = elements.map(el =>
            el.id === selectedElement.id ? { ...el, lineOptions: value as NonNullable<AnimatedCanvasElement['lineOptions']> } : el
          );
          gsapManager.buildAnimationTimeline(updatedElements);
          return updatedElements;
        });
      } else {
        setElements(elements => {
          const updatedElements = elements.map(el =>
            el.id === selectedElement.id ? { ...el, [prop]: value } : el
          );
          return updatedElements;
        });
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
    setElements(elements.map((el) => {
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
    }));
  };

  const handleAddElement = useCallback((element: AnimatedCanvasElement) => {
    setElements(prev => [...prev, element]);
    selectionManager.select(element);
  }, [selectionManager]);

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
        </div>
        <div className="flex gap-2">
          <button className="btn">Export ▼</button>
          <button className="btn">Zoom In</button>
          <button className="btn">Zoom Out</button>
        </div>
      </div>

      {/* Main Body */}
      <div className="flex flex-1 overflow-hidden">
        <SceneExplorer elements={elements} selectionManager={selectionManager} />

        {/* Canvas + Element Toolbar */}
        <main
          className="flex-1 relative bg-white overflow-hidden"
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

          <MaskOverlay
            tool={tool}
            maskPos={maskPos}
            maskOffsetX={MASK_OFFSET_X}
            maskOffsetY={MASK_OFFSET_Y}
            lineStartPoint={lineStartPoint}
          />

          {/* Only show path visibility toggle if paths exist */}
          {elements.some(el => el.isPath) && (
            <div className="absolute bottom-4 right-4 z-10">
              <button 
                className={`px-3 py-1.5 rounded shadow flex items-center ${showPaths ? 'bg-blue-500 text-white' : 'bg-white text-gray-700'}`}
                onClick={() => setShowPaths(!showPaths)}
                title={showPaths ? 'Hide Animation Paths' : 'Show Animation Paths'}
              >
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" 
                    fill={showPaths ? "white" : "currentColor"}/>
                  <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" 
                    fill={showPaths ? "white" : "currentColor"}/>
                </svg>
                {showPaths ? 'Paths Visible' : 'Paths Hidden'}
              </button>
            </div>
          )}

          {dimensions.width > 0 && dimensions.height > 0 && (
            <Canvas
              ref={canvasRef}
              dimensions={dimensions}
              elements={showPaths ? elements : elements.filter(el => !el.isPath)}
              selectedId={selectedElement?.id || null}
              onElementSelect={handleSelectElement}
              onElementDragEnd={handleElementDragEnd}
              onCanvasClick={canvasClickHandler}
              onLineEndpointDrag={handleLineEndpointDrag}
              tool={tool}
              onAddElement={handleAddElement}
              isPathMode={isPathMode}
            />
          )}
        </main>

        <Inspector
          selectedElement={selectedElement}
          onInspectorChange={handleInspectorChange}
        />
      </div>

      <Timeline
        elements={elements.filter(el => !el.isPath)}
        timelineState={timelineState}
        timeState={timeState}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onAnimationChange={handleAnimationChange}
        selectionManager={selectionManager}
      />
    </div>
  );
}
