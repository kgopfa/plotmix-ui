// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import dynamic from 'next/dynamic';
import { AnimatedCanvasElement } from './Canvas';
import { TimeManager, type TimeManagerState } from '@/lib/TimeManager';
import { TimelineManager } from '@/lib/TimelineManager';
import { TimelineTrack } from '@/components/timeline/TimelineTrack';
import { TimelineState } from '@/lib/types';
import { SelectionManager } from '@/lib/SelectionManager';

const Canvas = dynamic(() => import('./Canvas'), { ssr: false });

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
      const newDimensions = {
        width: window.innerWidth - 64 * 2, // account for sidebars
        height: window.innerHeight - 12 - 160, // top bar and timeline
      };
      setDimensions(newDimensions);
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

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedEmpty = e.target === e.target.getStage();

    if ((tool === 'rectangle' || tool === 'circle' || tool === 'triangle') && clickedEmpty) {
      const stage = e.target.getStage() as KonvaStage;
      const pointer = stage.getPointerPosition();

      if (pointer) {
        const newId = `${tool}-${elements.length + 1}`;
        // Count existing shapes of the same type
        const existingCount = elements.filter(el => el.type === tool).length;
        const newElement: AnimatedCanvasElement = {
          id: newId,
          name: existingCount === 0
            ? tool.charAt(0).toUpperCase() + tool.slice(1)
            : `${tool.charAt(0).toUpperCase() + tool.slice(1)} (${existingCount})`,
          type: tool,
          x: pointer.x - 50,
          y: pointer.y - 50,
          width: 100,
          height: 100,
          fill: '#ffa500',
          radius: tool === 'circle' || tool === 'triangle' ? 70 : undefined,
          stroke: 'black',
          strokeWidth: 1,
          cornerRadius: tool === 'rectangle' ? 0 : undefined,
          opacity: 1,
          shadowEnabled: false,
          shadowColor: 'black',
          shadowBlur: 0,
          shadowOffsetX: 10,
          shadowOffsetY: 10,
          shadowOpacity: 0.5,
          animations: [],
        };

        // Add element to canvas
        setElements(prevElements => [...prevElements, newElement]);
        selectionManager.select(newElement);
        setTool('select');
        setMaskPos(null);
      }
    } else if (clickedEmpty) {
      selectionManager.select(null);
    }
  };

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

  // Memoize the formatTime function
  const formatTime = useCallback((time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  }, []);

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

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
        {/* Scene Explorer */}
        <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto text-gray-800">
          <h3 className="font-semibold mb-2">Scenes</h3>
          <ul>
            <li>
              <details open>
                <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
                <ul className="ml-4 mt-1 space-y-1">
                  {elements.map(element => (
                    <li
                      key={element.id}
                      className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 ${selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                        }`}
                      onClick={() => selectionManager.select(element)}
                    >
                      {element.name}
                    </li>
                  ))}
                  {elements.length === 0 && (
                    <li className="text-sm text-gray-500 italic">No shapes added yet</li>
                  )}
                </ul>
              </details>
            </li>
          </ul>
        </aside>

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
          {/* Floating Toolbar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow rounded flex gap-2 p-2 z-10">
            <button
              className={`btn flex items-center gap-1 ${tool === 'rectangle' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('rectangle')}
            >
              <span>🔲</span>
              <span>Rectangle</span>
            </button>
            <button
              className={`btn flex items-center gap-1 ${tool === 'circle' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('circle')}
            >
              <span>⭕</span>
              <span>Circle</span>
            </button>
            <button
              className={`btn flex items-center gap-1 ${tool === 'triangle' ? 'bg-gray-100' : ''}`}
              onClick={() => setTool('triangle')}
            >
              <span>△</span>
              <span>Triangle</span>
            </button>
          </div>
          {renderMask()}
          {/* Konva Canvas */}
          <Canvas
            elements={elements}
            selectedId={selectedElement?.id || null}
            dimensions={dimensions}
            onStageClick={handleStageClick}
            onElementSelect={handleSelectElement}
            onElementDragEnd={handleElementDragEnd}
          />
        </main>

        {/* Inspector */}
        <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
          <h3 className="font-semibold mb-2">Inspector</h3>
          {selectedElement ? (
            <form className="flex flex-col gap-2">
              <label>
                Name:
                <input
                  type="text"
                  value={selectedElement.name}
                  onChange={e => handleInspectorChange('name', e.target.value)}
                  className="w-full px-2 py-1 border rounded"
                />
              </label>
              <button
                type="button" // prevent form submit
                onClick={(e) => {
                  e.preventDefault(); // also prevent default just in case

                  const newAnimation = {
                    id: `${Date.now()}`,
                    startTime: 0,
                    duration: 2,
                    properties: {},
                    type: 'custom',
                  };

                  setElements((prev) =>
                    prev.map((el) =>
                      el.id === selectedElement.id
                        ? { ...el, animations: [...el.animations, newAnimation] }
                        : el
                    )
                  );
                }}
                className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                + Add Animation
              </button>

              <label>
                X:
                <input
                  type="number"
                  value={selectedElement.x}
                  onChange={e => handleInspectorChange('x', Number(e.target.value))}
                />
              </label>
              <label>
                Y:
                <input
                  type="number"
                  value={selectedElement.y}
                  onChange={e => handleInspectorChange('y', Number(e.target.value))}
                />
              </label>
              <label>
                Width:
                <input
                  type="number"
                  value={selectedElement.width}
                  onChange={e => handleInspectorChange('width', Number(e.target.value))}
                />
              </label>
              <label>
                Height:
                <input
                  type="number"
                  value={selectedElement.height}
                  onChange={e => handleInspectorChange('height', Number(e.target.value))}
                />
              </label>
              {selectedElement.type === 'rectangle' && (
                <label>
                  Border Radius:
                  <input
                    type="number"
                    value={selectedElement.cornerRadius ?? 0}
                    onChange={e => handleInspectorChange('cornerRadius', Number(e.target.value))}
                  />
                </label>
              )}
              {(selectedElement.type === 'circle' || selectedElement.type === 'triangle') && (
                <label>
                  Radius:
                  <input
                    type="number"
                    value={selectedElement.radius ?? 0}
                    onChange={e => handleInspectorChange('radius', Number(e.target.value))}
                  />
                </label>
              )}
              <label>
                Border:
                <input
                  type="color"
                  value={selectedElement.stroke ?? '#000000'}
                  onChange={e => handleInspectorChange('stroke', e.target.value)}
                />
              </label>
              <label>
                Border Width:
                <input
                  type="number"
                  value={selectedElement.strokeWidth ?? 1}
                  onChange={e => handleInspectorChange('strokeWidth', Number(e.target.value))}
                />
              </label>
              <label>
                Fill:
                <input
                  type="color"
                  value={selectedElement.fill}
                  onChange={e => handleInspectorChange('fill', e.target.value)}
                />
              </label>
              <label>
                Opacity:
                <input
                  type="number"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedElement.opacity ?? 1}
                  onChange={e => handleInspectorChange('opacity', Number(e.target.value))}
                />
              </label>
              <label>
                <input
                  type="checkbox"
                  checked={selectedElement.shadowEnabled ?? false}
                  onChange={e => handleInspectorChange('shadowEnabled', e.target.checked)}
                />
                Shadow enabled
              </label>
              <fieldset
                disabled={!selectedElement.shadowEnabled}
                className={
                  'flex flex-col gap-2 ' +
                  (!selectedElement.shadowEnabled ? 'opacity-50 pointer-events-none' : '')
                }
              >
                <label>
                  Shadow Color:
                  <input
                    type="color"
                    value={selectedElement.shadowColor ?? '#000000'}
                    onChange={e => handleInspectorChange('shadowColor', e.target.value)}
                  />
                </label>
                <label>
                  Shadow Blur:
                  <input
                    type="number"
                    value={selectedElement.shadowBlur ?? 0}
                    onChange={e => handleInspectorChange('shadowBlur', Number(e.target.value))}
                  />
                </label>
                <label>
                  Shadow Offset X:
                  <input
                    type="number"
                    value={selectedElement.shadowOffsetX ?? 10}
                    onChange={e => handleInspectorChange('shadowOffsetX', Number(e.target.value))}
                  />
                </label>
                <label>
                  Shadow Offset Y:
                  <input
                    type="number"
                    value={selectedElement.shadowOffsetY ?? 10}
                    onChange={e => handleInspectorChange('shadowOffsetY', Number(e.target.value))}
                  />
                </label>
                <label>
                  Shadow Opacity:
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.01}
                    value={selectedElement.shadowOpacity ?? 0.5}
                    onChange={e => handleInspectorChange('shadowOpacity', Number(e.target.value))}
                  />
                </label>
              </fieldset>
            </form>
          ) : (
            <p>Select an element to edit properties</p>
          )}
        </aside>
      </div>

      {/* Timeline */}
      <footer className="h-60 border-t border-gray-200 bg-white">
        {/* Controls */}
        <div className="h-8 border-b border-gray-200 flex items-center px-4">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePlayPause}
              className="w-20 h-6 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
            >
              {timeState.isPlaying ? 'Pause' : 'Play'}
            </button>
            <button
              onClick={handleStop}
              className="w-20 h-6 flex items-center justify-center bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
            >
              Stop
            </button>
            <div className="text-sm font-mono text-gray-700 w-32">
              {formatTime(timeState.elapsedTime)}
            </div>
          </div>
        </div>

        {/* Scrollable timeline container (ruler + tracks) */}
        <div className="h-[calc(100%-56px)] overflow-y-auto">
          <div
            className="relative w-max"
            style={{ width: `${timelineState.scale * 120 + 128}px` }} // 128 = w-32 name column
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {/* Ruler (scrolls with timeline) */}
            <div className="h-6 relative border-b border-gray-200">
              <div className="absolute top-0 left-32 h-full w-full" style={{ transform: `translateX(-${scrollLeft}px)` }}>
                {Array.from({ length: 121 }).map((_, i) => {
                  const isMajor = i % 5 === 0;
                  return (
                    <div
                      key={i}
                      className="absolute h-full border-l border-gray-200"
                      style={{ left: `${i * timelineState.scale}px`, width: 0 }}
                    >
                      {isMajor && (
                        <div className="absolute top-0 text-[10px] text-gray-500 font-mono translate-x-[-50%]">
                          {formatTime(i)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tracks */}
            {elements.map((element) => (
              <TimelineTrack
                key={element.id}
                element={element}
                scale={timelineState.scale}
                currentTime={timeState.elapsedTime}
                isSelected={selectionManager.isSelected(element)}
                onAnimationChange={handleAnimationChange}
              />
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
