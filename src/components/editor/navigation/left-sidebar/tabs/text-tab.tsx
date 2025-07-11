import React from 'react';
import { Type, AlignLeft, AlignCenter, AlignRight, Bold, Italic, Underline } from 'lucide-react';
import { useToolState, useToolActions } from '@/stores/use-ui-store';

export const TextTab: React.FC = () => {
  const { activeTool } = useToolState();
  const { setActiveTool } = useToolActions();

  const textTools = [
    {
      name: 'Single Text',
      description: 'Add individual text elements',
      icon: '📝',
      tool: 'text' as const,
      shortcut: 'T'
    },
    {
      name: 'Text Group',
      description: 'Create grouped text elements',
      icon: '📋',
      tool: 'textGroup' as const,
      shortcut: 'Shift+T'
    }
  ];

  const textFeatures = [
    {
      name: 'Font Styles',
      items: ['Arial', 'Helvetica', 'Times New Roman', 'Georgia'],
      icon: '🔤'
    },
    {
      name: 'Formatting',
      items: ['Bold', 'Italic', 'Underline', 'Strike'],
      icon: '✏️'
    },
    {
      name: 'Alignment',
      items: ['Left', 'Center', 'Right', 'Justify'],
      icon: '📐'
    },
    {
      name: 'Effects',
      items: ['Shadow', 'Outline', 'Gradient', 'Glow'],
      icon: '✨'
    }
  ];

  const handleToolSelect = (tool: 'text' | 'textGroup') => {
    setActiveTool(tool);
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Type className="w-5 h-5 text-orange-600" />
          <h3 className="font-semibold text-gray-900">Text Tools</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 text-sm">
          {/* Text Tools */}
          <div className="space-y-2">
            <div className="text-xs font-medium text-gray-700 mb-2">Text Tools</div>
            {textTools.map((tool, index) => (
              <button
                key={index}
                onClick={() => handleToolSelect(tool.tool)}
                className={`w-full p-3 rounded-lg text-left transition-colors ${
                  activeTool === tool.tool 
                    ? 'bg-orange-100 border border-orange-200' 
                    : 'bg-orange-50 hover:bg-orange-100 border border-transparent'
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{tool.icon}</span>
                    <div className="font-medium text-gray-700">{tool.name}</div>
                  </div>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                    {tool.shortcut}
                  </span>
                </div>
                <div className="text-gray-600 text-xs ml-6">{tool.description}</div>
              </button>
            ))}
          </div>

          {/* Quick Formatting */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="font-medium text-gray-700 mb-2 text-xs">Quick Formatting</div>
            <div className="flex flex-wrap gap-2">
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <Bold className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <Italic className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <Underline className="w-4 h-4" />
              </button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <AlignLeft className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <AlignCenter className="w-4 h-4" />
              </button>
              <button className="p-2 bg-white rounded border hover:bg-gray-50">
                <AlignRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Text Features */}
          {textFeatures.map((feature, index) => (
            <div key={index} className="p-3 bg-orange-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{feature.icon}</span>
                <div className="font-medium text-gray-700 text-xs">{feature.name}</div>
              </div>
              <div className="text-xs text-gray-600 ml-6">
                {feature.items.join(' • ')}
              </div>
            </div>
          ))}

          {/* Typography Tips */}
          <div className="p-3 bg-gradient-to-r from-orange-100 to-yellow-100 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Typography Tips</div>
            <div className="text-xs text-gray-600 space-y-1">
              <div>• Use consistent font sizes for hierarchy</div>
              <div>• Maintain good contrast ratios</div>
              <div>• Consider line spacing for readability</div>
            </div>
          </div>

          {/* Current Selection */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="text-xs font-medium text-gray-700 mb-1">Active Tool</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {activeTool === 'text' ? '📝' : activeTool === 'textGroup' ? '📋' : '👆'}
              </span>
              <span className="text-blue-700 font-medium text-xs">
                {activeTool === 'text' ? 'Single Text' : 
                 activeTool === 'textGroup' ? 'Text Group' : 
                 'Selection Tool'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 