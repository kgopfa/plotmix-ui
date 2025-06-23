import { ToolType } from '@/types/editor';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isPathMode?: boolean;
}

export function Toolbar({
  currentTool,
  onToolChange,
  isPathMode
}: ToolbarProps) {
  
  const renderVerticalToolbar = () => (
    <div className="bg-white shadow-lg rounded-lg flex flex-col gap-2 p-2">
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'rectangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('rectangle')}
        title="Rectangle"
      >
        <span className="text-xl">🔲</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'circle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('circle')}
        title="Circle"
      >
        <span className="text-xl">⭕</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'triangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('triangle')}
        title="Triangle"
      >
        <span className="text-xl text-black">△</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'line' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('line')}
        title="Line"
      >
        <span className="text-xl">🔗</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'simpleLine' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('simpleLine')}
        title="Simple Line"
      >
        <span className="text-xl">📏</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'draw' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('draw')}
        title="Free Draw"
      >
        <span className="text-xl">✏️</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'text' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('text')}
        title="Text"
      >
        <span className="text-xl text-black">T</span>
      </button>

      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'textGroup' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('textGroup')}
        title="Text Group"
      >
        <span className="text-xl text-black">TG</span>
      </button>

      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('select')}
        title="Selection Tool"
      >
        <span className="text-xl">👆</span>
      </button>


    </div>
  );

  return renderVerticalToolbar();
}