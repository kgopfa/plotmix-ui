import React, { useState, useMemo } from 'react';
import { componentLibrary, ComponentItem, getComponentsByCategory, searchComponents, getAllCategories } from '@/data/components';

export function ComponentsTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
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
    // TODO: Implement adding component to canvas
    console.log('Adding component to canvas:', component);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl p-6 w-96 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6 flex-shrink-0">
        <h2 className="text-lg font-semibold text-gray-900">Components</h2>
        <div className="text-sm text-gray-500">{filteredComponents.length} items</div>
      </div>
      
      <div className="flex flex-col h-full space-y-4">
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

        {/* Components grid - takes remaining space */}
        <div className="flex-1 min-h-0">
          {filteredComponents.length > 0 ? (
            <div className="grid grid-cols-3 gap-3 h-full overflow-y-auto">
              {filteredComponents.map((component) => (
                <div
                  key={component.id}
                  onClick={() => handleComponentClick(component)}
                  className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex flex-col items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors p-2"
                  title={component.description}
                >
                  <div className="w-8 h-8 mb-1 flex items-center justify-center">
                    <img 
                      src={component.path} 
                      alt={component.name}
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
        <div className="text-xs text-gray-500 text-center pt-4 flex-shrink-0">
          Click on any component to add it to your canvas
        </div>
      </div>
    </div>
  );
} 