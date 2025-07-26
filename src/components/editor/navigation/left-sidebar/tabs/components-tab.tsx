import React from 'react';

export function ComponentsTab() {
  return (
    <div className="bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl p-6 w-96 h-full overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">Components</h2>
        <div className="text-sm text-gray-500">SVG Library</div>
      </div>
      
      <div className="space-y-4">
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search components..."
            className="w-full px-4 py-2 pl-10 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Categories */}
        <div className="flex space-x-2">
          <button className="px-3 py-1 text-xs font-medium text-teal-700 bg-teal-100 rounded-full">
            All
          </button>
          <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200">
            Icons
          </button>
          <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200">
            Shapes
          </button>
          <button className="px-3 py-1 text-xs font-medium text-gray-600 bg-gray-100 rounded-full hover:bg-gray-200">
            Objects
          </button>
        </div>

        {/* Components grid */}
        <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
          {/* Placeholder for SVG components */}
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 1</div>
          </div>
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 2</div>
          </div>
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 3</div>
          </div>
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 4</div>
          </div>
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 5</div>
          </div>
          <div className="aspect-square bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer transition-colors">
            <div className="text-xs text-gray-500">SVG 6</div>
          </div>
        </div>

        {/* Info text */}
        <div className="text-xs text-gray-500 text-center pt-4">
          Click on any component to add it to your canvas
        </div>
      </div>
    </div>
  );
} 