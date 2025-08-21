import React, { useEffect } from 'react';
import { Type, X } from 'lucide-react';
import { 
  useToolState, 
  useToolActions, 
  useSetActiveNav, 
  useSetHoverNav, 
  useSetInteractedNav 
} from '@/stores/use-ui-store';
import { useFontLoading } from '@/hooks/use-font-loading';

export const TextTab: React.FC = () => {
  const { activeTool, selectedFont, selectedFontWeight } = useToolState();
  const { setActiveTool, setSelectedFont, setSelectedFontWeight } = useToolActions();
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  
  const { loadingFonts, availableFonts } = useFontLoading();

  const textTools = {
    name: 'Add a textbox',
    icon: <Type className="w-4 h-4 text-blue-600" />,
    tool: 'text' as const,
  };

  // Font showcase data with sample text similar to Photoshop effects
  const fontShowcase = [
    {
      name: 'Bouncy',
      family: 'Bouncy-PERSONAL_USE_ONLY',
      sampleText: 'I Love You',
      category: 'Display',
      hasColor: true,
      gradient: 'from-pink-400 to-red-500'
    },
    {
      name: 'College Block',
      family: 'College-Block',
      sampleText: 'Drop Shadow',
      category: 'Display',
      hasColor: false
    },
    {
      name: 'Playful Boxes',
      family: 'Playful-Boxes',
      sampleText: 'Gradient',
      category: 'Decorative',
      hasColor: true,
      gradient: 'from-emerald-300 to-teal-400'
    },
    {
      name: 'DK Jambo',
      family: 'DK-Jambo',
      sampleText: 'Overlay',
      category: 'Display',
      hasColor: false
    },
    {
      name: 'Top Secret',
      family: 'Top-Secret',
      sampleText: 'Denied',
      category: 'Display',
      hasColor: true,
      gradient: 'from-orange-500 to-red-600'
    },
    {
      name: 'Super Kindly',
      family: 'Super-Kindly',
      sampleText: 'Inner Glow',
      category: 'Script',
      hasColor: true,
      gradient: 'from-blue-300 to-cyan-400'
    },
    {
      name: 'KGChasingCars',
      family: 'KGChasingCars',
      sampleText: 'Chasing Cars',
      category: 'Display',
      hasColor: true,
      gradient: 'from-amber-500 to-orange-600'
    },
    {
      name: 'Varsity',
      family: 'varsity_regular',
      sampleText: 'Emboss',
      category: 'Display',
      hasColor: false
    },
    {
      name: 'Spacetime',
      family: 'spacetime-regular',
      sampleText: 'Outer Glow',
      category: 'Display',
      hasColor: false
    },
    {
      name: 'Richis Stiller',
      family: 'Richis-Stiller',
      sampleText: 'Pattern',
      category: 'Display',
      hasColor: true,
      gradient: 'from-violet-500 to-purple-600'
    },
    {
      name: 'Snowboarding',
      family: 'Snowboarding',
      sampleText: 'Texture',
      category: 'Display',
      hasColor: false
    },
    {
      name: 'Cute Notes',
      family: 'Cute-Notes',
      sampleText: '3D Extrude',
      category: 'Handwriting',
      hasColor: true,
      gradient: 'from-indigo-500 to-purple-600'
    }
  ];

  const handleToolSelect = (tool: 'text') => {
    setActiveTool(tool);
  };

  const handleFontPresetSelect = (fontFamily: string) => {
    setSelectedFont(fontFamily);
    // Also set the text tool as active when selecting a font preset
    setActiveTool('text');
  };

  const handleTextStyleSelect = (fontWeight: string) => {
    setSelectedFontWeight(fontWeight);
    setSelectedFont('ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif');
    setActiveTool('text');
  };

  // Check if the currently selected font is available, if not reset to Tailwind font-sans stack
  const tailwindFontStack = 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
  
  useEffect(() => {
    if (availableFonts.length > 1 && selectedFont !== tailwindFontStack && !availableFonts.includes(selectedFont)) {
      console.warn(`Selected font ${selectedFont} not available, resetting to Tailwind font-sans stack`);
      setSelectedFont(tailwindFontStack);
    }
  }, [availableFonts, selectedFont, setSelectedFont, tailwindFontStack]);

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
                <div className="font-medium text-sm text-gray-900">{textTools.name}</div>
              </div>
            </button>
          </div>

          {/* Text Styles */}
          <div className="space-y-3">
            <div className="text-sm font-medium text-gray-700 mb-3">Text Styles</div>
            <div className="grid grid-cols-1 gap-2">
              <button 
                onClick={() => handleTextStyleSelect('900')}
                className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="text-lg font-extrabold text-gray-900"
                    style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  >
                    Add a heading
                  </span>
                </div>
              </button>
              <button 
                onClick={() => handleTextStyleSelect('600')}
                className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="text-lg font-semibold text-gray-900"
                    style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  >
                    Add a subheading
                  </span>
                </div>
              </button>
              <button 
                onClick={() => handleTextStyleSelect('400')}
                className="p-3 rounded-lg text-center border border-gray-200 transition-all duration-200 ease-out transform hover:scale-105 hover:bg-blue-50"
              >
                <div className="flex items-center justify-center gap-2">
                  <span 
                    className="text-lg font-normal text-gray-900"
                    style={{ fontFamily: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif' }}
                  >
                    Add body text
                  </span>
                </div>
              </button>
            </div>
          </div>

          {/* Font Showcase */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-3">
              Presets
              {loadingFonts && (
                <span className="ml-2 text-xs text-gray-500">(Loading fonts...)</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-3">
              {fontShowcase.map((font, index) => (
                <div 
                  key={index} 
                  onClick={loadingFonts ? undefined : () => handleFontPresetSelect(font.family)}
                  className={`p-3 bg-white border rounded-lg shadow-sm transition-all duration-200 ease-out transform group h-24 flex items-center justify-center ${
                    loadingFonts 
                      ? 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-60' 
                      : selectedFont === font.family 
                        ? 'border-blue-500 bg-blue-50 shadow-md hover:shadow-md hover:scale-[1.02] cursor-pointer' 
                        : 'border-gray-200 hover:shadow-md hover:scale-[1.02] cursor-pointer'
                  }`}
                >
                  <div className="text-center w-full">
                    <div 
                      className={`text-lg font-bold mb-1 leading-tight ${font.hasColor ? `bg-gradient-to-r ${font.gradient} bg-clip-text text-transparent` : 'text-gray-800'}`}
                      style={{ fontFamily: font.family }}
                    >
                      {font.sampleText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
