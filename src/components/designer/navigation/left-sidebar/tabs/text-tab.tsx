import React from 'react';
import { AlignLeft, Bold, Italic, Type, Underline, X } from 'lucide-react';
import { useToolState, useToolActions, useSetActiveNav, useSetHoverNav, useSetInteractedNav } from '@/stores/use-ui-store';

export const TextTab: React.FC = () => {
  const { activeTool } = useToolState();
  const { setActiveTool } = useToolActions();
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();

  const textTools =
    {
      name: 'Add a textbox',
      icon: <Type className="w-4 h-4 text-blue-600" />,
      tool: 'text' as const,
    };

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
    <div className="h-full w-80 2xl:w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
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
            <button
              onClick={() => handleToolSelect(textTools.tool)}
              className={`w-full p-4 rounded-xl text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-[1.02] hover:bg-blue-50 ${activeTool === textTools.tool}`}
            >
              <div className="flex items-center justify-center gap-3">
                <span className="text-xl">{textTools.icon}</span>
                <div className="font-medium text-sm text-gray-700">{textTools.name}</div>
              </div>
            </button>
          </div>

          {/* Text Styles */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-3">Text Styles</div>
            <div className="grid grid-cols-1 gap-2">
              <button className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-extrabold text-gray-700">Add a heading</span>
                </div>
              </button>
              <button className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-semibold text-gray-700">Add a subheading</span>
                </div>
              </button>
              <button className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-normal text-gray-700">Add body text</span>
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