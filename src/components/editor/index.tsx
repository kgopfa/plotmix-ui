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
  const [timeState, setTimeState] = useState<TimeManagerState>({
    isPlaying: false,
    elapsedTime: 0
  });
  const [timelineState, setTimelineState] = useState<TimelineState>({
    tracks: [],
    duration: 10,
    scale: 100
  });

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

    if (
      isEmptyClick &&
      (tool === 'rectangle' || tool === 'circle' || tool === 'triangle')
    ) {
      const newElement = createNewElement(tool, e.global.x, e.global.y, elements);
      
      setElements(prev => {
        const newElements = [...prev, newElement];
        return newElements;
      });
      selectionManager.select(newElement);
      setTool('select');
      setMaskPos(null);
    } else if (isEmptyClick) {
      selectionManager.select(null);
    }
  }


  const handleElementDragEnd = (id: string, x: number, y: number) => {
    setElements(elements.map((el) =>
      el.id === id ? { ...el, x, y } : el
    ));
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

  const handleInspectorChange = (prop: string, value: string | number | boolean | ElementAnimation[]) => {
    if (prop === 'animations') {
      setElements(elements => {
        const updatedElements = elements.map(el =>
          el.id === selectedElement?.id ? { ...el, animations: value as ElementAnimation[] } : el
        );
        gsapManager.buildAnimationTimeline(updatedElements);
        return updatedElements;
      });
    } else {
      setElements(elements => {
        const updatedElements = elements.map(el =>
          el.id === selectedElement?.id ? { ...el, [prop]: value } : el
        );
        return updatedElements;
      });
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
  const handleSelectElement = useCallback((id: string) => {
    const element = elements.find(e => e.id === id) || null;
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
          <Toolbar currentTool={tool} onToolChange={handleToolChange} />

          <MaskOverlay
            tool={tool}
            maskPos={maskPos}
            maskOffsetX={MASK_OFFSET_X}
            maskOffsetY={MASK_OFFSET_Y}
          />

          {dimensions.width > 0 && dimensions.height > 0 && (
            <Canvas
              ref={canvasRef}
              dimensions={dimensions}
              elements={elements}
              selectedId={selectedElement?.id || null}
              onElementSelect={handleSelectElement as (id: string | null) => void}
              onElementDragEnd={handleElementDragEnd}
              onCanvasClick={canvasClickHandler}
            />
          )}
        </main>

        <Inspector
          selectedElement={selectedElement}
          onInspectorChange={handleInspectorChange}
        />
      </div>

      <Timeline
        elements={elements}
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
