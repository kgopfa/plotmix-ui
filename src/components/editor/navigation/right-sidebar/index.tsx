'use client';

import React from 'react';
import {
  History,
  SwatchBook,
  VectorSquare,
} from 'lucide-react';
import { useActiveRightPanel, useSetActiveRightPanel } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';

// Navigation item type for right sidebar
type RightNavKey = 'properties' | 'animations' | 'history';
interface RightNavItem {
  name: string;
  key: RightNavKey;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string;
}

const navigation: RightNavItem[] = [
  { 
    name: 'Properties', 
    key: 'properties', 
    icon: SwatchBook,
    color: 'text-blue-600',
    hoverColor: 'hover:bg-blue-50 hover:text-blue-700',
    activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
  },
  { 
    name: 'Animations', 
    key: 'animations', 
    icon: VectorSquare,
    color: 'text-purple-600',
    hoverColor: 'hover:bg-purple-50 hover:text-purple-700',
    activeColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
  },
  { 
    name: 'History', 
    key: 'history', 
    icon: History,
    color: 'text-green-600',
    hoverColor: 'hover:bg-green-50 hover:text-green-700',
    activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
  },
];

export const RightSidebar: React.FC = () => {
  const activePanel = useActiveRightPanel();
  const setActivePanel = useSetActiveRightPanel();
  const { selectedElements, selectedGroups } = useSelectionStore();

  const hasSelection = selectedElements.length > 0 || selectedGroups.length > 0;

  const handleClick = (key: RightNavKey) => {
    setActivePanel(key);
  };

  return (
    <div className={`m-2 fixed right-0 top-16 z-40 w-16 overflow-visible transition-all duration-300 ease-out ${
      hasSelection || activePanel === 'history' 
        ? 'translate-x-0 opacity-100' 
        : 'translate-x-full opacity-0'
    }`}>
      <div className="relative bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col items-center">
        <nav className="mt-6 pb-6">
          <ul role="list" className="flex flex-col items-center space-y-3">
            {navigation.map((item) => {
              const isActive = activePanel === item.key;
              const isDisabled = !hasSelection && item.key !== 'history';
              
              return (
                <li key={item.key}>
                  <div className="relative">
                    <button
                      className={`
                        relative group flex flex-col items-center justify-center
                        w-12 h-12 rounded-xl font-medium
                        transition-all duration-200 ease-out
                        transform hover:scale-105 active:scale-95
                        ${isDisabled 
                          ? 'opacity-50 cursor-not-allowed' 
                          : isActive 
                            ? item.activeColor 
                            : `${item.color} ${item.hoverColor} hover:shadow-md`
                        }
                      `}
                      onClick={() => !isDisabled && handleClick(item.key)}
                      title={isDisabled ? `${item.name} (select an element first)` : item.name}
                      disabled={isDisabled}
                    >
                      <item.icon 
                        aria-hidden="true" 
                        className={`w-5 h-5 transition-all duration-200 ${
                          isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'
                        }`} 
                      />
                      <span className="sr-only">{item.name}</span>
                      
                      {/* Active indicator */}
                      {isActive && (
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-sm"></div>
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}; 