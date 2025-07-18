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
  
  // Enhanced color scheme for each tool
  const getToolColors = (tool: ToolType) => {
    switch (tool) {
      case 'rectangle':
        return {
          active: 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-blue-500/30',
          hover: 'hover:bg-blue-50 hover:text-blue-700',
          text: 'text-blue-600'
        };
      case 'circle':
        return {
          active: 'bg-gradient-to-r from-green-500 to-green-600 shadow-green-500/30',
          hover: 'hover:bg-green-50 hover:text-green-700',
          text: 'text-green-600'
        };
      case 'triangle':
        return {
          active: 'bg-gradient-to-r from-purple-500 to-purple-600 shadow-purple-500/30',
          hover: 'hover:bg-purple-50 hover:text-purple-700',
          text: 'text-purple-600'
        };
      case 'arc':
        return {
          active: 'bg-gradient-to-r from-pink-500 to-pink-600 shadow-pink-500/30',
          hover: 'hover:bg-pink-50 hover:text-pink-700',
          text: 'text-pink-600'
        };
      case 'line':
        return {
          active: 'bg-gradient-to-r from-orange-500 to-orange-600 shadow-orange-500/30',
          hover: 'hover:bg-orange-50 hover:text-orange-700',
          text: 'text-orange-600'
        };
      case 'simpleLine':
        return {
          active: 'bg-gradient-to-r from-yellow-500 to-yellow-600 shadow-yellow-500/30',
          hover: 'hover:bg-yellow-50 hover:text-yellow-700',
          text: 'text-yellow-600'
        };
      case 'draw':
        return {
          active: 'bg-gradient-to-r from-red-500 to-red-600 shadow-red-500/30',
          hover: 'hover:bg-red-50 hover:text-red-700',
          text: 'text-red-600'
        };
      case 'select':
        return {
          active: 'bg-gradient-to-r from-indigo-500 to-indigo-600 shadow-indigo-500/30',
          hover: 'hover:bg-indigo-50 hover:text-indigo-700',
          text: 'text-indigo-600'
        };
      default:
        return {
          active: 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-gray-500/30',
          hover: 'hover:bg-gray-50 hover:text-gray-700',
          text: 'text-gray-600'
        };
    }
  };
  
  // Function to get button styling based on tool state
  const getButtonStyling = (tool: ToolType) => {
    const disabled = isToolDisabled(tool);
    const isActive = activeTool === tool;
    const colors = getToolColors(tool);
    
    if (disabled) {
      return {
        buttonClass: 'relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out opacity-50 cursor-not-allowed bg-gray-100 text-gray-400',
        iconClass: 'w-5 h-5'
      };
    }
    
    if (isActive) {
      return {
        buttonClass: `relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 ${colors.active} text-white shadow-lg`,
        iconClass: 'w-5 h-5 drop-shadow-sm'
      };
    }
    
    return {
      buttonClass: `relative group flex flex-col items-center justify-center w-12 h-12 rounded-xl font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 ${colors.text} ${colors.hover} hover:shadow-md`,
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