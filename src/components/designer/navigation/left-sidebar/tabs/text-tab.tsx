import React from 'react';
import { AlignLeft, Bold, Italic, Type, Underline, X } from 'lucide-react';
import { useToolState, useToolActions, useSetActiveNav, useSetHoverNav, useSetInteractedNav } from '@/stores/use-ui-store';

export const TextTab: React.FC = () => {
  const { activeTool } = useToolState();
  const { setActiveTool } = useToolActions();
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();

  const textTools = [
    {
      name: 'Single Text',
      description: 'Add individual text elements',
      icon: '📝',
      tool: 'text' as const,
      shortcut: 'T'
    },
  ];

  const textFeatures = [
    {
      name: 'Font Categories',
      items: ['Sans-serif', 'Serif', 'Script', 'Monospace', 'Decorative'],
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
      name: 'Rich Text Effects',
      items: ['Gradients', 'Shadows', 'Outlines', 'Letter Spacing'],
      icon: '✨'
    },
    {
      name: 'Advanced Layout',
      items: ['Word Wrap', 'Line Height', 'Text Stroke'],
      icon: '📝'
    }
  ];

  const handleToolSelect = (tool: 'text') => {
    setActiveTool(tool);
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="border-b border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-0.5">
            <Type strokeWidth={2.75} className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-gray-800 ml-0.5">Text</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveNav(null);
              setHoverNav(null);
              setInteractedNav(null);
              // Prevent immediate re-hovering by adding a small delay
              setTimeout(() => {
                setHoverNav(null);
              }, 50);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-6">
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-3">Text Tools</div>
          {textTools.map((tool, index) => (
            <button
              key={index}
              onClick={() => handleToolSelect(tool.tool)}
              className={`w-full p-4 rounded-xl text-left transition-all duration-200 ease-out transform hover:scale-[1.02] ${activeTool === tool.tool
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'bg-white/80 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 border border-gray-200/50 hover:border-blue-200/50 shadow-sm hover:shadow-md'
                }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{tool.icon}</span>
                  <div className="font-medium text-gray-700">{tool.name}</div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-lg ${activeTool === tool.tool
                  ? 'bg-white/20 text-white'
                  : 'bg-blue-100 text-blue-600'
                  }`}>
                  {tool.shortcut}
                </span>
              </div>
              <div className={`text-xs ml-11 ${activeTool === tool.tool ? 'text-blue-100' : 'text-gray-600'
                }`}>
                {tool.description}
              </div>
            </button>
          ))}
        </div>

        {/* Quick Formatting */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-3">Quick Formatting</div>
          <div className="grid grid-cols-2 gap-2">
            <button className="p-3 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200/50 hover:from-purple-100 hover:to-pink-100 transition-all duration-200 ease-out transform hover:scale-105">
              <div className="flex items-center gap-2">
                <Bold className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700">Bold</span>
              </div>
            </button>
            <button className="p-3 rounded-lg bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200/50 hover:from-blue-100 hover:to-cyan-100 transition-all duration-200 ease-out transform hover:scale-105">
              <div className="flex items-center gap-2">
                <Italic className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700">Italic</span>
              </div>
            </button>
            <button className="p-3 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200/50 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 ease-out transform hover:scale-105">
              <div className="flex items-center gap-2">
                <Underline className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">Underline</span>
              </div>
            </button>
            <button className="p-3 rounded-lg bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200/50 hover:from-orange-100 hover:to-yellow-100 transition-all duration-200 ease-out transform hover:scale-105">
              <div className="flex items-center gap-2">
                <AlignLeft className="w-4 h-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">Left</span>
              </div>
            </button>
          </div>
        </div>

        {/* Text Features */}
        <div className="space-y-3">
          <div className="text-sm font-semibold text-gray-700 mb-3">Text Features</div>
          {textFeatures.map((feature, index) => (
            <div key={index} className="p-4 bg-gradient-to-r from-blue-50/80 to-indigo-50/80 border border-blue-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out transform hover:scale-[1.01]">
              <div className="flex items-center gap-3 mb-3">
                <span className="text-xl">{feature.icon}</span>
                <div className="font-medium text-gray-700 text-sm">{feature.name}</div>
              </div>
              <div className="text-sm text-gray-600 ml-11">
                {feature.items.join(' • ')}
              </div>
            </div>
          ))}

          {/* Current Selection */}
          <div className="p-4 bg-gradient-to-r from-blue-50/80 to-cyan-50/80 border border-blue-200/50 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 ease-out transform hover:scale-[1.01]">
            <div className="text-sm font-medium text-gray-700 mb-2">Active Tool</div>
            <div className="flex items-center gap-3">
              <span className="text-xl">
                {activeTool === 'text' ? '📝' : '👆'}
              </span>
              <span className="text-blue-700 font-medium text-sm">
                {activeTool === 'text' ? 'Single Text' :
                  'Selection Tool'}
              </span>
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}; 