import { useToolState, useToolActions } from '@/stores/useUIStore';
import type { ToolType } from '@/types/tool';

export function Toolbar() {
  const { activeTool, isPathMode } = useToolState();
  const { setActiveTool } = useToolActions();
  
  // Define which tools are allowed in path mode
  const pathModeAllowedTools: ToolType[] = ['line', 'simpleLine', 'draw'];
  
  // Function to check if a tool should be disabled
  const isToolDisabled = (tool: ToolType) => {
    return isPathMode && !pathModeAllowedTools.includes(tool);
  };
  
  // Function to get button class based on tool state
  const getButtonClass = (tool: ToolType) => {
    const baseClass = 'flex flex-col items-center justify-center p-2';
    const disabled = isToolDisabled(tool);
    
    if (disabled) {
      return `${baseClass} opacity-50 cursor-not-allowed bg-gray-200`;
    }
    
    if (activeTool === tool) {
      return `${baseClass} ${isPathMode ? 'bg-blue-100' : 'bg-gray-100'}`;
    }
    
    return `${baseClass} hover:bg-gray-100`;
  };
  
  // Function to handle tool click
  const handleToolClick = (tool: ToolType) => {
    if (!isToolDisabled(tool)) {
      setActiveTool(tool);
    }
  };
  
  const renderVerticalToolbar = () => (
    <div className="bg-white shadow-lg rounded-lg flex flex-col gap-2 p-2">
      <button
        className={getButtonClass('rectangle')}
        onClick={() => handleToolClick('rectangle')}
        title={isToolDisabled('rectangle') ? "Rectangle (disabled in path mode)" : "Rectangle"}
        disabled={isToolDisabled('rectangle')}
      >
        <span className="text-xl">🔲</span>
      </button>
      <button
        className={getButtonClass('circle')}
        onClick={() => handleToolClick('circle')}
        title={isToolDisabled('circle') ? "Circle (disabled in path mode)" : "Circle"}
        disabled={isToolDisabled('circle')}
      >
        <span className="text-xl">⭕</span>
      </button>
      <button
        className={getButtonClass('triangle')}
        onClick={() => handleToolClick('triangle')}
        title={isToolDisabled('triangle') ? "Triangle (disabled in path mode)" : "Triangle"}
        disabled={isToolDisabled('triangle')}
      >
        <span className="text-xl text-black">△</span>
      </button>
      <button
        className={getButtonClass('line')}
        onClick={() => handleToolClick('line')}
        title="Line"
        disabled={isToolDisabled('line')}
      >
        <span className="text-xl">🔗</span>
      </button>
      <button
        className={getButtonClass('simpleLine')}
        onClick={() => handleToolClick('simpleLine')}
        title="Simple Line"
        disabled={isToolDisabled('simpleLine')}
      >
        <span className="text-xl">📏</span>
      </button>
      <button
        className={getButtonClass('draw')}
        onClick={() => handleToolClick('draw')}
        title="Free Draw"
        disabled={isToolDisabled('draw')}
      >
        <span className="text-xl">✏️</span>
      </button>
      <button
        className={getButtonClass('text')}
        onClick={() => handleToolClick('text')}
        title={isToolDisabled('text') ? "Text (disabled in path mode)" : "Text"}
        disabled={isToolDisabled('text')}
      >
        <span className="text-xl text-black">T</span>
      </button>

      <button
        className={getButtonClass('textGroup')}
        onClick={() => handleToolClick('textGroup')}
        title={isToolDisabled('textGroup') ? "Text Group (disabled in path mode)" : "Text Group"}
        disabled={isToolDisabled('textGroup')}
      >
        <span className="text-xl text-black">TG</span>
      </button>

      <button
        className={getButtonClass('select')}
        onClick={() => handleToolClick('select')}
        title={isToolDisabled('select') ? "Selection Tool (disabled in path mode)" : "Selection Tool"}
        disabled={isToolDisabled('select')}
      >
        <span className="text-xl">👆</span>
      </button>


    </div>
  );

  return renderVerticalToolbar();
}