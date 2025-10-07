import React, { useState, useMemo } from 'react';
import { ChevronsUpDown, Check, Search, Star, Globe } from 'lucide-react';
import { Listbox, ListboxButton, ListboxOptions, ListboxOption } from '@headlessui/react';
import { FONT_CATEGORIES, FontOption, getPopularFonts, searchFonts } from '@/lib/font-config';

interface FontSelectorProps {
  value: string;
  onChange: (fontFamily: string) => void;
  className?: string;
}

export function FontSelector({ value, onChange, className = '' }: FontSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Get current font name from family string
  const getCurrentFontName = (fontFamily: string): string => {
    const font = FONT_CATEGORIES.flatMap(cat => cat.fonts).find(f => f.family === fontFamily);
    return font ? font.name : fontFamily?.split(',')[0]?.trim();
  };

  // Filter fonts based on search and category
  const filteredFonts = useMemo(() => {
    let fonts: FontOption[] = [];
    
    if (searchQuery.trim()) {
      fonts = searchFonts(searchQuery);
    } else if (selectedCategory === 'All') {
      fonts = FONT_CATEGORIES.flatMap(cat => cat.fonts);
    } else if (selectedCategory === 'Popular') {
      fonts = getPopularFonts();
    } else {
      fonts = FONT_CATEGORIES.find(cat => cat.name === selectedCategory)?.fonts || [];
    }
    
    return fonts;
  }, [searchQuery, selectedCategory]);

  // Get category names for the selector
  const categoryNames = ['All', 'Popular', ...FONT_CATEGORIES.map(cat => cat.name)];

  const currentFontName = getCurrentFontName(value);

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search fonts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Category Selector */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {categoryNames.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 text-xs font-medium rounded-full whitespace-nowrap transition-colors ${
              selectedCategory === category
                ? 'bg-blue-100 text-blue-700 border border-blue-200'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Font Listbox */}
      <Listbox value={value} onChange={onChange}>
        <div className="relative">
          <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-2 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 text-sm border border-gray-300">
            <span className="col-start-1 row-start-1 truncate pr-6" style={{ fontFamily: value }}>
              {currentFontName}
            </span>
            <ChevronsUpDown
              aria-hidden="true"
              className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
            />
          </ListboxButton>

          <ListboxOptions className="absolute z-50 mt-1 max-h-80 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden border border-gray-200">
            {filteredFonts.length === 0 ? (
              <div className="px-4 py-2 text-gray-500 text-center">
                No fonts found matching &quot;{searchQuery}&quot;
              </div>
            ) : (
              filteredFonts.map((font) => (
                <ListboxOption
                  key={font.family}
                  value={font.family}
                  className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-blue-600 data-focus:text-white data-focus:outline-hidden hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <span 
                      className="block truncate font-normal group-data-selected:font-semibold"
                      style={{ fontFamily: font.family }}
                    >
                      {font.name}
                    </span>
                                         <div className="flex items-center gap-1">
                       {font.webSafe && (
                         <div title="Web-safe font">
                           <Globe className="w-3 h-3 text-green-500" />
                         </div>
                       )}
                       {font.popular && (
                         <div title="Popular font">
                           <Star className="w-3 h-3 text-yellow-500" />
                         </div>
                       )}
                     </div>
                  </div>
                  
                  {font.description && (
                    <div className="text-xs text-gray-400 mt-1 truncate">
                      {font.description}
                    </div>
                  )}

                  <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                    <Check aria-hidden="true" className="size-4" />
                  </span>
                </ListboxOption>
              ))
            )}
          </ListboxOptions>
        </div>
      </Listbox>
    </div>
  );
} 