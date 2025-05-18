import { ToolType } from '@/types/editor';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isPathMode?: boolean;
  onExitPathMode?: () => void;
}

export function Toolbar({ currentTool, onToolChange, isPathMode, onExitPathMode }: ToolbarProps) {
  // Vertical toolbar used for both regular and path mode
  const renderVerticalToolbar = () => (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow rounded flex flex-col gap-2 p-2 z-10">
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
      <>
        {/* Path mode header */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white shadow rounded flex gap-2 p-2 z-10">
          <span className="font-medium">Drawing Animation Path</span>
          <button
            className="ml-4 bg-white text-blue-500 px-2 rounded hover:bg-gray-100"
            onClick={onExitPathMode}
          >
            Cancel
          </button>
        </div>
        
        {/* Vertical toolbar */}
        {renderVerticalToolbar()}
      </>
    );
  }
  
  return renderVerticalToolbar();
} 