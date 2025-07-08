'use client';

import React from 'react';
import {
  Cog6ToothIcon,
  PlayCircleIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';

// Navigation item type for right sidebar
type RightNavKey = 'properties' | 'animations' | 'history';
interface RightNavItem {
  name: string;
  key: RightNavKey;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navigation: RightNavItem[] = [
  { name: 'Properties', key: 'properties', icon: Cog6ToothIcon },
  { name: 'Animations', key: 'animations', icon: PlayCircleIcon },
  { name: 'History', key: 'history', icon: ClockIcon },
];

export const RightNavigationSidebar: React.FC = () => {
  // Broadcast selected tab to listeners (Inspector, etc.)
  const handleClick = (key: RightNavKey) => {
    window.dispatchEvent(
      new CustomEvent('right-nav-select', { detail: { tab: key } }) as Event,
    );
  };

  return (
    <div
      className="m-2 fixed right-0 top-16 z-40 w-16 overflow-visible border border-gray-200 shadow-lg py-4 rounded-lg flex flex-col items-center bg-white/95 backdrop-blur-sm"
    >
      <nav>
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item) => (
            <li key={item.key}>
              <button
                className="text-gray-400 hover:bg-gray-800 hover:text-white group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold"
                onClick={() => handleClick(item.key)}
                title={item.name}
              >
                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                <span className="sr-only">{item.name}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}; 