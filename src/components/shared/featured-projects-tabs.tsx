import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Tab {
  name: string;
  current: boolean;
}

interface SortOption {
  name: string;
  value: string;
}

interface FeaturedProjectsTabsProps {
  tabs: Tab[];
  onTabChange: (tabName: string) => void;
  sortOptions: SortOption[];
  selectedSort: string;
  onSortChange: (sortValue: string) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export function FeaturedProjectsTabs({
  tabs,
  onTabChange,
  sortOptions,
  selectedSort,
  onSortChange
}: FeaturedProjectsTabsProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
      {/* Tabs Section */}
      <div className="flex-1">
        <div className="grid grid-cols-1 sm:hidden">
          {/* Mobile dropdown */}
          <select
            defaultValue={tabs.find((tab) => tab.current)?.name}
            aria-label="Select a tab"
            className="col-start-1 row-start-1 w-full appearance-none rounded-md bg-white py-2 pr-8 pl-3 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600 border border-gray-200"
            onChange={(e) => onTabChange(e.target.value)}
          >
            {tabs.map((tab) => (
              <option key={tab.name}>{tab.name}</option>
            ))}
          </select>
          <ChevronDown
            aria-hidden="true"
            className="pointer-events-none col-start-1 row-start-1 mr-2 size-5 self-center justify-self-end fill-gray-500"
          />
        </div>
        <div className="hidden sm:block">
          <nav aria-label="Tabs" className="flex space-x-4">
            {tabs.map((tab) => (
              <button
                key={tab.name}
                onClick={() => onTabChange(tab.name)}
                aria-current={tab.current ? 'page' : undefined}
                className={classNames(
                  tab.current 
                    ? 'bg-purple-100 text-purple-700 border-purple-200' 
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                  'rounded-md px-3 py-2 text-sm font-medium border transition-colors'
                )}
              >
                {tab.name}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Sort Section */}
      <div className="mt-4 sm:mt-0 flex items-center gap-x-2">
        <span className="text-sm text-gray-500">Sort by:</span>
        <select
          value={selectedSort}
          onChange={(e) => onSortChange(e.target.value)}
          className="rounded-md border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
} 