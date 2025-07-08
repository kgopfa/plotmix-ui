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

const navigation = [
  { name: 'Video Settings', href: '#', icon: VideoCameraIcon, current: true },
  { name: 'Scenes', href: '#', icon: FilmIcon, current: false },
  { name: 'Uploads', href: '#', icon: CloudArrowUpIcon, current: false },
  { name: 'AI', href: '#', icon: SparklesIcon, current: false },
  { name: 'Tools', href: '#', icon: PaintBrushIcon, current: false },
]

const bottomNavigation = [
  { name: 'Audio', href: '#', icon: MusicalNoteIcon, current: false },
  { name: 'Timeline', href: '#', icon: ClockIcon, current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const NavigationSidebar: React.FC = () => {
  return (
    <div className="m-2 fixed inset-y-0 left-0 z-40 w-16 overflow-y-auto border border-gray-200 shadow-lg pb-4 rounded-sm flex flex-col" style={{ top: '64px' }}>
      {/* Top Navigation */}
      <nav className="mt-8">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={classNames(
                  item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                )}
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
          {bottomNavigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={classNames(
                  item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                )}
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