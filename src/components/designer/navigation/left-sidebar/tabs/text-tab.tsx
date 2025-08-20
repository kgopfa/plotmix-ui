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
      sampleText: 'Stroke',
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

  // Function to load fonts dynamically
  React.useEffect(() => {
    const loadFonts = async () => {
      try {
        // Load OTF fonts with exact file names
        const otfFonts = [
          { name: 'Bouncy-PERSONAL_USE_ONLY', file: 'Bouncy-PERSONAL_USE_ONLY.otf' },
          { name: 'College-Block', file: 'College-Block.otf' },
          { name: 'Playful-Boxes', file: 'Playful-Boxes.otf' },
          { name: 'DK-Jambo', file: 'DK-Jambo.otf' },
          { name: 'Bouncy-Thin-PERSONAL_USE_ONLY', file: 'Bouncy-Thin-PERSONAL_USE_ONLY.otf' },
          { name: 'Bouncy-Black-PERSONAL_USE_ONLY', file: 'Bouncy-Black-PERSONAL_USE_ONLY.otf' }
        ];
        
        // Load TTF fonts with exact file names
        const ttfFonts = [
          { name: 'varsity_regular', file: 'varsity_regular.ttf' },
          { name: 'spacetime-regular', file: 'spacetime-regular.ttf' },
          { name: 'african', file: 'african.ttf' },
          { name: 'Top-Secret', file: 'Top-Secret.ttf' },
          { name: 'Super-Kindly', file: 'Super-Kindly.ttf' },
          { name: 'Snowboarding', file: 'Snowboarding.ttf' },
          { name: 'Richis-Stiller', file: 'Richis-Stiller.ttf' },
          { name: 'Ka-Blam', file: 'Ka-Blam.ttf' },
          { name: 'Cute-Notes', file: 'Cute-Notes.ttf' },
          { name: 'KGChasingCars', file: 'KGChasingCars.ttf' },
          { name: 'Angelia-Beauty', file: 'Angelia-Beauty.ttf' }
        ];

        // Create font faces for OTF fonts
        otfFonts.forEach(font => {
          const fontFace = new FontFace(font.name, `url(/fonts/otf/${font.file})`);
          fontFace.load().then(() => {
            document.fonts.add(fontFace);
            console.log('Font loaded successfully:', font.name);
          }).catch(err => console.log('Font loading failed:', font.name, err));
        });

        // Create font faces for TTF fonts
        ttfFonts.forEach(font => {
          const fontFace = new FontFace(font.name, `url(/fonts/tff/${font.file})`);
          fontFace.load().then(() => {
            document.fonts.add(fontFace);
            console.log('Font loaded successfully:', font.name);
          }).catch(err => console.log('Font loading failed:', font.name, err));
        });

      } catch (error) {
        console.error('Error loading fonts:', error);
      }
    };

    loadFonts();
  }, []);

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

          {/* Font Showcase */}
          <div className="space-y-3">
            <div className="text-sm font-semibold text-gray-700 mb-3">Presets</div>
            <div className="grid grid-cols-2 gap-3">
              {fontShowcase.map((font, index) => (
                <div 
                  key={index} 
                  className="p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-out transform hover:scale-[1.02] cursor-pointer group h-24 flex items-center justify-center"
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