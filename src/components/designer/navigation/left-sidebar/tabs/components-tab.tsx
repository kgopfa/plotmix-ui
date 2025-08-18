import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Blocks, X } from 'lucide-react';
import { componentLibrary, ComponentItem, getComponentsByCategory, searchComponents, getAllCategories } from '@/data/components';
import { useSetActiveNav, useSetHoverNav, useSetInteractedNav } from '@/stores/use-ui-store';

export function ComponentsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  
  const categories = getAllCategories();
  
  // Filter components based on search and category
  const filteredComponents = useMemo(() => {
    let components = componentLibrary;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      components = getComponentsByCategory(selectedCategory as ComponentItem['category']);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      components = searchComponents(searchQuery);
    }
    
    return components;
  }, [searchQuery, selectedCategory]);

  const handleComponentClick = (component: ComponentItem) => {
    // Dispatch custom event to handle component import in the main editor
    const componentImportEvent = new CustomEvent('component-import', {
      detail: { 
        component,
        componentId: component.id,
        componentPath: component.path,
        componentName: component.name
      }
    });
    window.dispatchEvent(componentImportEvent);
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-0.5">
            <Blocks strokeWidth={2.5} className="w-4 h-4 text-teal-600" />
            <h3 className="font-semibold text-gray-800 ml-0.5">Components</h3>
            <div className="text-xs text-gray-500">{filteredComponents.length} items</div>
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
        <div className="space-y-4">
        {/* Search bar */}
        <div className="relative flex-shrink-0">
          <input
            type="text"
            placeholder="Search components..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 flex-shrink-0">
          <button 
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
              selectedCategory === 'all' 
                ? 'text-teal-700 bg-teal-100' 
                : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
            }`}
          >
            All
          </button>
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors capitalize ${
                selectedCategory === category 
                  ? 'text-teal-700 bg-teal-100' 
                  : 'text-gray-600 bg-gray-100 hover:bg-gray-200'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Components grid */}
        <div>
          {filteredComponents.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors p-2"
                  title={component.description}
                >
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <Image 
                      src={component.path} 
                      alt={component.name}
                      width={32}
                      height={32}
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                  <div className="text-xs text-gray-600 text-center font-medium truncate w-full">
                    {component.name}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="text-gray-400 mb-2">🔍</div>
                <div className="text-sm text-gray-500">
                  {searchQuery ? 'No components found' : 'No components in this category'}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Info text */}
        <div className="text-xs text-gray-500 text-center pt-4">
          Click on any component to add it to your canvas
        </div>
        </div>
      </div>
    </div>
  );
} 