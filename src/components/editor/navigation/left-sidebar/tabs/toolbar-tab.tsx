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
  
  // Function to get button styling based on tool state
  const getButtonStyling = (tool: ToolType) => {
    const disabled = isToolDisabled(tool);
    const isActive = activeTool === tool;
    
    if (disabled) {
      return {
        buttonClass: 'relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out opacity-50 cursor-not-allowed bg-gray-100 text-gray-400',
        iconClass: 'w-5 h-5'
      };
    }
    
    if (isActive) {
      return {
        buttonClass: 'relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30',
        iconClass: 'w-5 h-5 drop-shadow-sm'
      };
    }
    
    return {
      buttonClass: 'relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 text-orange-600 hover:bg-orange-50 hover:text-orange-700 hover:shadow-md',
      iconClass: 'w-5 h-5 transition-all duration-200 group-hover:scale-110'
    };
  };
  
  // Function to handle tool click
  const handleToolClick = (tool: ToolType) => {
    if (!isToolDisabled(tool)) {
      setActiveTool(tool);
    }
  };

  const renderVerticalToolbar = () => (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col gap-3 pt-6 pb-4 px-2 w-16 items-center">
      <div className="flex flex-col items-center space-y-3">
        <button
          className={getButtonStyling('rectangle').buttonClass}
          onClick={() => handleToolClick('rectangle')}
          title={isToolDisabled('rectangle') ? "Rectangle (disabled in path mode)" : "Rectangle"}
          disabled={isToolDisabled('rectangle')}
        >
          <Square className={getButtonStyling('rectangle').iconClass} />
          <span className="sr-only">Rectangle</span>
        </button>
        
        <button
          className={getButtonStyling('circle').buttonClass}
          onClick={() => handleToolClick('circle')}
          title={isToolDisabled('circle') ? "Circle (disabled in path mode)" : "Circle"}
          disabled={isToolDisabled('circle')}
        >
          <Circle className={getButtonStyling('circle').iconClass} />
          <span className="sr-only">Circle</span>
        </button>
        
        <button
          className={getButtonStyling('triangle').buttonClass}
          onClick={() => handleToolClick('triangle')}
          title={isToolDisabled('triangle') ? "Triangle (disabled in path mode)" : "Triangle"}
          disabled={isToolDisabled('triangle')}
        >
          <Triangle className={getButtonStyling('triangle').iconClass} />
          <span className="sr-only">Triangle</span>
        </button>
        
        <button
          className={getButtonStyling('arc').buttonClass}
          onClick={() => handleToolClick('arc')}
          title={isToolDisabled('arc') ? "Arc (disabled in path mode)" : "Arc"}
          disabled={isToolDisabled('arc')}
        >
          <RotateCcw className={getButtonStyling('arc').iconClass} />
          <span className="sr-only">Arc</span>
        </button>
        
        <button
          className={getButtonStyling('line').buttonClass}
          onClick={() => handleToolClick('line')}
          title="Line"
          disabled={isToolDisabled('line')}
        >
          <Route className={getButtonStyling('line').iconClass} />
          <span className="sr-only">Line</span>
        </button>
        
        <button
          className={getButtonStyling('simpleLine').buttonClass}
          onClick={() => handleToolClick('simpleLine')}
          title="Simple Line"
          disabled={isToolDisabled('simpleLine')}
        >
          <Minus className={getButtonStyling('simpleLine').iconClass} />
          <span className="sr-only">Simple Line</span>
        </button>
        
        <button
          className={getButtonStyling('draw').buttonClass}
          onClick={() => handleToolClick('draw')}
          title="Free Draw"
          disabled={isToolDisabled('draw')}
        >
          <Pen className={getButtonStyling('draw').iconClass} />
          <span className="sr-only">Free Draw</span>
        </button>
      </div>

      <div className="border-t border-gray-300/50 w-full my-4"></div>
      
      <button
        className={getButtonStyling('select').buttonClass}
        onClick={() => handleToolClick('select')}
        title={isToolDisabled('select') ? "Selection Tool (disabled in path mode)" : "Selection Tool"}
        disabled={isToolDisabled('select')}
      >
        <MousePointer2 className={getButtonStyling('select').iconClass} />
        <span className="sr-only">Selection Tool</span>
      </button>
    </div>
  );

  return renderVerticalToolbar();
}