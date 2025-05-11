// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import dynamic from 'next/dynamic';
import { AnimatedCanvasElement } from './Canvas';
import { TimeManager, type TimeManagerState } from '@/lib/TimeManager';

const Canvas = dynamic(() => import('./Canvas'), { ssr: false });

export default function EditorCanvas() {
  const [elements, setElements] = useState<AnimatedCanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle'>('select');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [maskPos, setMaskPos] = useState<{ x: number, y: number } | null>(null);
  const [timeState, setTimeState] = useState<TimeManagerState>({ isPlaying: false, elapsedTime: 0 });

  const MASK_OFFSET_X = 25;
  const MASK_OFFSET_Y = 25;

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
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId) {
        setElements(elements => elements.filter(el => el.id !== selectedId));
        setSelectedId(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedId]);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedEmpty = e.target === e.target.getStage();

    if ((tool === 'rectangle' || tool === 'circle' || tool === 'triangle') && clickedEmpty) {
      const stage = e.target.getStage() as KonvaStage;
      const pointer = stage.getPointerPosition();

      if (pointer) {
        const newId = `${tool}-${elements.length + 1}`;
        const newElement: AnimatedCanvasElement = {
          id: newId,
          type: tool,
          x: pointer.x - 50,
          y: pointer.y - 50,
          width: 100,
          height: 100,
          fill: '#ffa500', // hex orange
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
        setElements(prevElements => [...prevElements, newElement]);
        setTool('select');
        setSelectedId(newId);
        setMaskPos(null); // Reset mask after placing shape
      }
    } else if (clickedEmpty) {
      setSelectedId(null);
    }
  };

  const handleElementDragEnd = (id: string, x: number, y: number) => {
    setElements(elements.map((el) =>
      el.id === id ? { ...el, x, y } : el
    ));
  };

  const selectedElement = elements.find(el => el.id === selectedId);

  const handleInspectorChange = (prop: string, value: string | number | boolean) => {
    setElements(elements =>
      elements.map(el =>
        el.id === selectedId ? { ...el, [prop]: value } : el
      )
    );
  };

  // Subscribe to TimeManager updates
  useEffect(() => {
    const timeManager = TimeManager.getInstance();
    const unsubscribe = timeManager.subscribe(setTimeState);
    return () => unsubscribe();
  }, []);

  const handlePlayPause = () => {
    const timeManager = TimeManager.getInstance();
    const { isPlaying } = timeManager.getState();
    if (isPlaying) {
      timeManager.pause();
    } else {
      timeManager.play();
    }
  };

  const handleStop = () => {
    TimeManager.getInstance().stop();
  };

  // Format time as MM:SS.ms
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    const milliseconds = Math.floor((seconds % 1) * 100);
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  // Don't render the Canvas until we have dimensions
  if (dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

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
        {/* Scene Explorer */}
        <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto text-gray-800">
          <h3 className="font-semibold mb-2">Scenes</h3>
          <ul>
            <li className="mb-1">Scene 1</li>
            <li>Scene 2</li>
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
            selectedId={selectedId}
            dimensions={dimensions}
            onStageClick={handleStageClick}
            onElementSelect={setSelectedId}
            onElementDragEnd={handleElementDragEnd}
          />
        </main>

        {/* Inspector */}
        <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
          <h3 className="font-semibold mb-2">Inspector</h3>
          {selectedElement ? (
            <form className="flex flex-col gap-2">
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
      <footer className="h-48 bg-gray-100 border-t border-gray-200 p-2 overflow-y-auto">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold">Timeline</h3>
          <div className="flex items-center gap-4">
            <div className="text-base font-mono bg-white text-gray-600 px-3 py-1.5 rounded-md shadow-sm w-[120px] text-center">
              {formatTime(timeState.elapsedTime)}
            </div>
            <div className="flex gap-2">
              <button
                className={`btn flex items-center gap-1 ${timeState.isPlaying ? 'bg-gray-100' : ''} w-[100px] justify-center`}
                onClick={handlePlayPause}
              >
                <span>{timeState.isPlaying ? '⏸' : '▶'}</span>
              </button>
              <button
                className="btn flex items-center gap-1 w-[100px] justify-center"
                onClick={handleStop}
              >
                <span>⏹</span>
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white rounded border p-2">
          <p>Timeline tracks will go here</p>
        </div>
      </footer>
    </div>
  );
}
