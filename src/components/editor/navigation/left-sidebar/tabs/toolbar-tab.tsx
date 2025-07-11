import { useToolState, useToolActions } from '@/stores/use-ui-store';
import type { ToolType } from '@/types/tool';
import { 
  Square, 
  Circle, 
  Triangle, 
  RotateCcw,
  Minus,
  Pen,
  MousePointer2,
  Route
} from 'lucide-react';

export function ToolbarTab() {
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
    const baseClass = 'group flex flex-col items-center justify-center p-3 rounded-md';
    const disabled = isToolDisabled(tool);
    
    if (disabled) {
      return `${baseClass} opacity-50 cursor-not-allowed bg-gray-200`;
    }
    
    if (activeTool === tool) {
      return `${baseClass} bg-fuchsia-500 text-white`;
    }
    
    return `${baseClass} text-gray-400 hover:bg-fuchsia-500 hover:text-white`;
  };

  // Function to get icon class based on tool state
  const getIconClass = (tool: ToolType) => {
    const disabled = isToolDisabled(tool);
    
    if (disabled) {
      return 'w-5 h-5 text-gray-400';
    }
    
    if (activeTool === tool) {
      return 'w-5 h-5 text-white';
    }
    
    return 'w-5 h-5 text-gray-400 group-hover:text-white';
  };
  
  // Function to handle tool click
  const handleToolClick = (tool: ToolType) => {
    if (!isToolDisabled(tool)) {
      setActiveTool(tool);
    }
  };


  
  const renderVerticalToolbar = () => (
    <div className="bg-white shadow-lg border border-gray-200 rounded-lg flex flex-col gap-1 pt-8 pb-4 px-2 w-16 items-center">

      <button
        className={`${getButtonClass('rectangle')} mt-1`}
        onClick={() => handleToolClick('rectangle')}
        title={isToolDisabled('rectangle') ? "Rectangle (disabled in path mode)" : "Rectangle"}
        disabled={isToolDisabled('rectangle')}
      >
        <Square className={getIconClass('rectangle')} />
      </button>
      <button
        className={`${getButtonClass('circle')} mt-1`}
        onClick={() => handleToolClick('circle')}
        title={isToolDisabled('circle') ? "Circle (disabled in path mode)" : "Circle"}
        disabled={isToolDisabled('circle')}
      >
        <Circle className={getIconClass('circle')} />
      </button>
      <button
        className={`${getButtonClass('triangle')} mt-1`}
        onClick={() => handleToolClick('triangle')}
        title={isToolDisabled('triangle') ? "Triangle (disabled in path mode)" : "Triangle"}
        disabled={isToolDisabled('triangle')}
      >
        <Triangle className={getIconClass('triangle')} />
      </button>
      <button
        className={`${getButtonClass('arc')} mt-1`}
        onClick={() => handleToolClick('arc')}
        title={isToolDisabled('arc') ? "Arc (disabled in path mode)" : "Arc"}
        disabled={isToolDisabled('arc')}
      >
        <RotateCcw className={getIconClass('arc')} />
      </button>
      <button
        className={`${getButtonClass('line')} mt-1`}
        onClick={() => handleToolClick('line')}
        title="Line"
        disabled={isToolDisabled('line')}
      >
        <Route className={getIconClass('line')} />
      </button>
      <button
        className={getButtonClass('simpleLine')}
        onClick={() => handleToolClick('simpleLine')}
        title="Simple Line"
        disabled={isToolDisabled('simpleLine')}
      >
        <Minus className={getIconClass('simpleLine')} />
      </button>
      <button
        className={`${getButtonClass('draw')} mt-1`}
        onClick={() => handleToolClick('draw')}
        title="Free Draw"
        disabled={isToolDisabled('draw')}
      >
        <Pen className={getIconClass('draw')} />
      </button>

      <button
        className={`${getButtonClass('select')} mt-2`}
        onClick={() => handleToolClick('select')}
        title={isToolDisabled('select') ? "Selection Tool (disabled in path mode)" : "Selection Tool"}
        disabled={isToolDisabled('select')}
      >
        <MousePointer2 className={getIconClass('select')} />
      </button>

    </div>
  );

  return renderVerticalToolbar();
}