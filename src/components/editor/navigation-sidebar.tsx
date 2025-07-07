'use client'

import React from 'react'
import {
  CalendarIcon,
  ChartPieIcon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
} from '@heroicons/react/24/outline'

const navigation = [
  { name: 'Dashboard', href: '#', icon: HomeIcon, current: true },
  { name: 'Team', href: '#', icon: UsersIcon, current: false },
  { name: 'Projects', href: '#', icon: FolderIcon, current: false },
  { name: 'Calendar', href: '#', icon: CalendarIcon, current: false },
  { name: 'Documents', href: '#', icon: DocumentDuplicateIcon, current: false },
  { name: 'Reports', href: '#', icon: ChartPieIcon, current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export const NavigationSidebar: React.FC = () => {
  return (
    <div className="fixed inset-y-0 left-0 z-40 w-20 overflow-y-auto bg-gray-900 pb-4" style={{ top: '64px' }}>
      <nav className="mt-8">
        <ul role="list" className="flex flex-col items-center space-y-1">
          {navigation.map((item) => (
            <li key={item.name}>
              <a
                href={item.href}
                className={classNames(
                  item.current ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
                  'group flex gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
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