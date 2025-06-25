import { useToolState, useToolActions } from '@/stores/useUIStore';

export function Toolbar() {
  const { activeTool, isPathMode } = useToolState();
  const { setActiveTool } = useToolActions();
  
  const renderVerticalToolbar = () => (
    <div className="bg-white shadow-lg rounded-lg flex flex-col gap-2 p-2">
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'rectangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('rectangle')}
        title="Rectangle"
      >
        <span className="text-xl">🔲</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'circle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('circle')}
        title="Circle"
      >
        <span className="text-xl">⭕</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'triangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('triangle')}
        title="Triangle"
      >
        <span className="text-xl text-black">△</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'line' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('line')}
        title="Line"
      >
        <span className="text-xl">🔗</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'simpleLine' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('simpleLine')}
        title="Simple Line"
      >
        <span className="text-xl">📏</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'draw' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('draw')}
        title="Free Draw"
      >
        <span className="text-xl">✏️</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'text' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('text')}
        title="Text"
      >
        <span className="text-xl text-black">T</span>
      </button>

      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'textGroup' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('textGroup')}
        title="Text Group"
      >
        <span className="text-xl text-black">TG</span>
      </button>

      <button
        className={`flex flex-col items-center justify-center p-2 ${activeTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={() => setActiveTool('select')}
        title="Selection Tool"
      >
        <span className="text-xl">👆</span>
      </button>


    </div>
  );

  return renderVerticalToolbar();
}