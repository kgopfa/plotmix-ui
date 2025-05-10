// app/layout.tsx or pages/index.tsx depending on routing
'use client';

import { useState, useEffect, useRef } from 'react';
import type { KonvaEventObject } from 'konva/lib/Node';
import type { Stage as KonvaStage } from 'konva/lib/Stage';
import dynamic from 'next/dynamic';

const Canvas = dynamic(() => import('./Canvas'), { ssr: false });

interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
}

export default function EditorCanvas() {
  const [elements, setElements] = useState<CanvasElement[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'rectangle' | 'circle' | 'triangle'>('select');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);
  const shapeMenuRef = useRef<HTMLDivElement>(null);

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

  // Handle click outside to close the shape menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (shapeMenuRef.current && !shapeMenuRef.current.contains(event.target as Node)) {
        setIsShapeMenuOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    const clickedEmpty = e.target === e.target.getStage();
    
    if ((tool === 'rectangle' || tool === 'circle' || tool === 'triangle') && clickedEmpty) {
      const stage = e.target.getStage() as KonvaStage;
      const pointer = stage.getPointerPosition();
      
      if (pointer) {
        const newId = `${tool}-${elements.length + 1}`;
        const newElement: CanvasElement = {
          id: newId,
          type: tool,
          x: pointer.x - 50,
          y: pointer.y - 50,
          width: 100,
          height: 100,
          fill: 'orange',
        };
        setElements(prevElements => [...prevElements, newElement]);
        setTool('select');
        setSelectedId(newId);
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

  // Don't render the Canvas until we have dimensions
  if (dimensions.width === 0 || dimensions.height === 0) {
    return null;
  }

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
        <aside className="w-64 bg-gray-50 border-r p-2 overflow-y-auto">
          <h3 className="font-semibold mb-2">Scenes</h3>
          <ul>
            <li className="mb-1">Scene 1</li>
            <li>Scene 2</li>
          </ul>
        </aside>

        {/* Canvas + Element Toolbar */}
        <main className="flex-1 relative bg-white">
          {/* Floating Toolbar */}
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow rounded flex gap-2 p-2 z-10">
            <div className="relative" ref={shapeMenuRef}>
              <button 
                className="btn flex items-center gap-1"
                onClick={() => setIsShapeMenuOpen(!isShapeMenuOpen)}
              >
                <span>Shapes</span>
                <span className="text-xs">▼</span>
              </button>
              <div className={`absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md py-1 w-48 ${isShapeMenuOpen ? 'block' : 'hidden'}`}>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setTool('rectangle');
                    setIsShapeMenuOpen(false);
                  }}
                >
                  <span>🔲</span>
                  <span>Rectangle</span>
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setTool('circle');
                    setIsShapeMenuOpen(false);
                  }}
                >
                  <span>⭕</span>
                  <span>Circle</span>
                </button>
                <button 
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
                  onClick={() => {
                    setTool('triangle');
                    setIsShapeMenuOpen(false);
                  }}
                >
                  <span>△</span>
                  <span>Triangle</span>
                </button>
              </div>
            </div>
          </div>

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
        <aside className="w-64 bg-gray-50 border-l p-2 overflow-y-auto">
          <h3 className="font-semibold mb-2">Inspector</h3>
          <p>Select an element to edit properties</p>
        </aside>
      </div>

      {/* Timeline */}
      <footer className="h-40 bg-gray-100 border-t p-2 overflow-y-auto">
        <h3 className="font-semibold mb-2">Timeline</h3>
        <p>Timeline component goes here</p>
      </footer>
    </div>
  );
}
