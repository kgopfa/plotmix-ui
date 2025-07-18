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
    <div className="h-full w-full bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col">
      <div className="p-6 border-b border-gray-200/50">
        <div className="flex items-center gap-3">
          <div className="relative group flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30">
            <Type className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-lg">Text Tools</h3>
            <p className="text-sm text-gray-600">Add and format text elements</p>
          </div>
        </div>
      </div>
      
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Text Tools */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-3">Text Tools</div>
            {textTools.map((tool, index) => (
              <button
                key={index}
                onClick={() => handleToolSelect(tool.tool)}
                className={`w-full p-4 rounded-xl text-left transition-all duration-200 ease-out transform hover:scale-[1.02] ${
                  activeTool === tool.tool 
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30' 
                    : 'bg-white/80 hover:bg-blue-50 border border-gray-200/50 hover:border-blue-200/50 shadow-sm hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tool.icon}</span>
                    <div className="font-medium text-gray-700">{tool.name}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-lg ${
                    activeTool === tool.tool 
                      ? 'bg-white/20 text-white' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {tool.shortcut}
                  </span>
                </div>
                <div className={`text-xs ml-11 ${
                  activeTool === tool.tool ? 'text-blue-100' : 'text-gray-600'
                }`}>
                  {tool.description}
                </div>
              </button>
            ))}
          </div>

          {/* Quick Formatting */}
          <div className="p-4 bg-white/80 border border-gray-200/50 rounded-xl shadow-sm">
            <div className="font-medium text-gray-700 mb-3 text-sm">Quick Formatting</div>
            <div className="flex flex-wrap gap-2">
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <Bold className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <Italic className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <Underline className="w-4 h-4 text-gray-700" />
              </button>
              <div className="w-px bg-gray-300 mx-1"></div>
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <AlignLeft className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <AlignCenter className="w-4 h-4 text-gray-700" />
              </button>
              <button className="p-2 bg-white/80 rounded-lg border border-gray-200/50 hover:bg-blue-50 hover:border-blue-200/50 transition-all duration-200 hover:scale-105">
                <AlignRight className="w-4 h-4 text-gray-700" />
              </button>
            </div>
          </div>

          {/* Text Features */}
          {textFeatures.map((feature, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-xl shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{feature.icon}</span>
                <div className="font-medium text-gray-700 text-sm">{feature.name}</div>
              </div>
              <div className="text-sm text-gray-600 ml-11">
                {feature.items.join(' • ')}
              </div>
            </div>
          ))}

          {/* Typography Tips */}
          <div className="p-4 bg-gradient-to-r from-orange-50/80 to-yellow-50/80 border border-orange-200/50 rounded-xl shadow-sm">
            <div className="text-sm font-medium text-gray-700 mb-2">Typography Tips</div>
            <div className="text-sm text-gray-600 space-y-1">
              <div>• Use consistent font sizes for hierarchy</div>
              <div>• Maintain good contrast ratios</div>
              <div>• Consider line spacing for readability</div>
            </div>
          </div>

          {/* Current Selection */}
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200/50 rounded-xl shadow-sm">
            <div className="text-sm font-medium text-gray-700 mb-2">Active Tool</div>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {activeTool === 'text' ? '📝' : activeTool === 'textGroup' ? '📋' : '👆'}
              </span>
              <span className="text-blue-700 font-medium text-sm">
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