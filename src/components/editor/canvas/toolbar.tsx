import { ToolType } from '@/types/editor';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isPathMode?: boolean;
  onExitPathMode?: () => void;
}

export function Toolbar({
  currentTool,
  onToolChange,
  isPathMode,
  onExitPathMode
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
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('select')}
        title="Selection Tool"
      >
        <span className="text-xl">👆</span>
      </button>


    </div>
  );

  if (isPathMode) {
    return (
      <div className="flex flex-col gap-4">
        {/* Path mode header */}
        <div className="bg-blue-500 text-white shadow-lg rounded-lg flex gap-2 p-3 items-center justify-between">
          <span className="font-medium">Drawing Animation Path</span>
          <button
            className="bg-white text-blue-500 px-3 py-1 rounded hover:bg-gray-100 text-sm font-medium"
            onClick={onExitPathMode}
          >
            Cancel
          </button>
        </div>

        {/* Vertical toolbar */}
        {renderVerticalToolbar()}
      </div>
    );
  }

  return renderVerticalToolbar();
}