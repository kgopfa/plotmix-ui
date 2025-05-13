// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { TimeManager, type TimeManagerState } from '@/lib/time-manager';
import { TimelineManager } from '@/lib/timeline-manager';
import { TimelineState } from '@/lib/types';
import { SelectionManager } from '@/lib/selection-manager';
import { SceneExplorer } from './scene-explorer';
import { Inspector } from './inspector';
import { Timeline } from './timeline';
import { Toolbar } from './toolbar';
import { AnimatedCanvasElement } from '@/types/canvas';
import { Canvas } from './canvas';
import { FederatedPointerEvent, Container } from 'pixi.js';


export default function EditorCanvas() {
  const [elements, setElements] = useState<AnimatedCanvasElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<AnimatedCanvasElement | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle'>('select');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
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

  // Memoize the time manager instance
  const timeManager = useMemo(() => TimeManager.getInstance(), []);
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);
  const selectionManager = useMemo(() => SelectionManager.getInstance(), []);

  // Handle window dimensions
  useEffect(() => {
    const updateDimensions = () => {
      const sidebarWidth = 288; // w-72 in Tailwind
      const topBarHeight = 48; // h-12
      const timelineHeight = 160; // estimated height of timeline

      setDimensions({
        width: window.innerWidth - sidebarWidth * 2,
        height: window.innerHeight - topBarHeight - timelineHeight,
      });
    };


    // Initial dimensions
    updateDimensions();

    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        setElements(elements => elements.filter(el => el.id !== selectedElement.id));
        setSelectedElement(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement]);

  const createNewElement = (
    type: 'rectangle' | 'circle' | 'triangle',
    x: number,
    y: number,
    elements: AnimatedCanvasElement[]
  ): AnimatedCanvasElement => {
    console.log('Creating element:', { type, x, y, elementsCount: elements.length });
    
    const newId = `${type}-${elements.length + 1}`;
    const existingCount = elements.filter(el => el.type === type).length;
    console.log('Element counts:', { newId, existingCount });
  
    return {
      id: newId,
      name:
        existingCount === 0
          ? type.charAt(0).toUpperCase() + type.slice(1)
          : `${type.charAt(0).toUpperCase() + type.slice(1)} (${existingCount})`,
      type,
      x: x - 50,
      y: y - 50,
      width: 100,
      height: 100,
      fill: '#ffa500',
      radius: type === 'circle' || type === 'triangle' ? 70 : undefined,
      stroke: 'black',
      strokeWidth: 1,
      cornerRadius: type === 'rectangle' ? 0 : undefined,
      opacity: 1,
      shadowEnabled: false,
      shadowColor: 'black',
      shadowBlur: 0,
      shadowOffsetX: 10,
      shadowOffsetY: 10,
      shadowOpacity: 0.5,
      animations: [],
    };
  }

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
  };

  const handleInspectorChange = (prop: string, value: string | number | boolean) => {
    setElements(elements =>
      elements.map(el =>
        el.id === selectedElement?.id ? { ...el, [prop]: value } : el
      )
    );
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

  // Remove unused scroll-related code
  const handleAnimationChange = (
    elementId: string,
    animationId: string,
    update: { startTime: number; duration: number }
  ) => {
    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? {
            ...el,
            animations: el.animations.map((a) =>
              a.id === animationId ? { ...a, ...update } : a
            ),
          }
          : el
      )
    );
  };

  const handleAddAnimation = (elementId: string) => {
    const newAnimation = {
      id: `${Date.now()}`,
      startTime: 0,
      duration: 2,
      properties: {},
      type: 'custom',
    };

    setElements((prev) =>
      prev.map((el) =>
        el.id === elementId
          ? { ...el, animations: [...el.animations, newAnimation] }
          : el
      )
    );
  };

  // Mask overlay for shape placement
  const renderMask = () => {
    if (tool === 'select' || !maskPos) return null;
    const style = {
      position: 'absolute' as const,
      left: maskPos.x + MASK_OFFSET_X,
      top: maskPos.y + MASK_OFFSET_Y,
      width: 50,
      height: 50,
      pointerEvents: 'none' as const,
      background: 'white',
      opacity: 0.5,
      zIndex: 20,
      border: '2px dotted #888',
      boxSizing: 'border-box' as const,
    };
    if (tool === 'rectangle') {
      return <div style={{ ...style, borderRadius: 4 }} />;
    }
    if (tool === 'circle') {
      return <div style={{ ...style, borderRadius: '50%' }} />;
    }
    if (tool === 'triangle') {
      // SVG triangle offset from mouse
      return (
        <svg
          style={{
            position: 'absolute',
            left: maskPos.x + MASK_OFFSET_X,
            top: maskPos.y + MASK_OFFSET_Y,
            width: 50,
            height: 50,
            pointerEvents: 'none',
            opacity: 0.5,
            zIndex: 20,
          }}
        >
          <polygon
            points="25,5 45,45 5,45"
            fill="white"
            stroke="#888"
            strokeWidth={2}
            strokeDasharray="4,3"
          />
        </svg>
      );
    }
    return null;
  };

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
          <Toolbar currentTool={tool} onToolChange={setTool} />

          {renderMask()}

          {dimensions.width > 0 && dimensions.height > 0 && (
            <Canvas
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
          onAddAnimation={handleAddAnimation}
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
