'use client'

import React from 'react'
import {
  CloudArrowUpIcon,
  FilmIcon,
  SparklesIcon,
  VideoCameraIcon,
  ClockIcon,
  MusicalNoteIcon,
  PaintBrushIcon,
} from '@heroicons/react/24/outline'
import { useActiveNav, useSetActiveNav, useSetHoverNav } from '@/stores/use-ui-store';

type NavItem = { name: string; key: 'video' | 'scenes' | 'uploads' | 'ai' | 'tools' | 'audio' | 'timeline'; href: string; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; };

const navigation: NavItem[] = [
  { name: 'Video Settings', key: 'video', href: '#', icon: VideoCameraIcon },
  { name: 'Scenes', key: 'scenes', href: '#', icon: FilmIcon },
  { name: 'Uploads', key: 'uploads', href: '#', icon: CloudArrowUpIcon },
  { name: 'AI', key: 'ai', href: '#', icon: SparklesIcon },
  { name: 'Tools', key: 'tools', href: '#', icon: PaintBrushIcon },
];

const bottomNavigation: NavItem[] = [
  { name: 'Audio', key: 'audio', href: '#', icon: MusicalNoteIcon },
  { name: 'Timeline', key: 'timeline', href: '#', icon: ClockIcon },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const NavigationSidebar: React.FC = () => {
  const activeNav = useActiveNav();
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();

  // Deselect active navigation item when clicking on empty sidebar space
  const handleRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // If the click is not within a link (<a>) element, clear selection
    if (!target.closest('a')) {
      setActiveNav(null);
      setHoverNav(null);
    }
  };

  return (
    <div
      className="m-2 fixed inset-y-0 left-0 z-40 w-16 overflow-y-auto border border-gray-200 shadow-lg pb-4 rounded-sm flex flex-col"
      style={{ top: '64px' }}
      onClick={handleRootClick}
    >
      {/* Top Navigation */}
      <nav className="mt-8">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item: NavItem) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={classNames(
                  activeNav === item.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                )}
                onClick={()=>setActiveNav(item.key)}
                onMouseEnter={()=>setHoverNav(item.key)}
                onMouseLeave={()=>setHoverNav(null)}
              >
                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                <span className="sr-only">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>

      {/* Bottom Navigation */}
      <nav className="mt-auto mb-4">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {bottomNavigation.map((item: NavItem) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={classNames(
                  activeNav === item.key ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                )}
                onClick={()=>setActiveNav(item.key)}
                onMouseEnter={()=>setHoverNav(item.key)}
                onMouseLeave={()=>setHoverNav(null)}
              >
                <item.icon aria-hidden="true" className="size-6 shrink-0" />
                <span className="sr-only">{item.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
} 