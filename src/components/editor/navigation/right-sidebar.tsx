'use client';

import React from 'react';
import {
  PencilRuler,
  Blend,
  History,
} from 'lucide-react';
import { useActiveRightPanel, useSetActiveRightPanel, useHoverRightPanel, useSetHoverRightPanel } from '@/stores/use-ui-store';

// Navigation item type for right sidebar
type RightNavKey = 'properties' | 'animations' | 'history';
interface RightNavItem {
  name: string;
  key: RightNavKey;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
}

const navigation: RightNavItem[] = [
  { name: 'Properties', key: 'properties', icon: PencilRuler },
  { name: 'Animations', key: 'animations', icon: Blend },
  { name: 'History', key: 'history', icon: History },
];

export const RightSidebar: React.FC = () => {
  const activePanel = useActiveRightPanel();
  const hoverPanel = useHoverRightPanel();
  const setActivePanel = useSetActiveRightPanel();
  const setHoverPanel = useSetHoverRightPanel();

  const handleClick = (key: RightNavKey) => {
    setActivePanel(key);
  };

  return (
    <div
      className="m-2 fixed right-0 top-16 z-40 w-16 overflow-visible border border-gray-200 shadow-lg pb-8 rounded-lg flex flex-col items-center bg-white/95 backdrop-blur-sm"
    >
      <nav className="mt-8">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item) => (
            <li key={item.key}>
              <button
                className={`${(activePanel === item.key || hoverPanel === item.key) ? 'bg-fuchsia-500 text-white' : 'text-gray-400 hover:bg-fuchsia-500 hover:text-white'} group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold`}
                onClick={() => handleClick(item.key)}
                onMouseEnter={() => setHoverPanel(item.key)}
                onMouseLeave={() => setHoverPanel(null)}
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