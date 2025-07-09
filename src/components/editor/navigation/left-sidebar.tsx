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
import { useActiveNav, useSetActiveNav, useSetHoverNav, useHoverNav } from '@/stores/use-ui-store';
import { VideoSettingsPreview, AIToolsPreview, UploadsPreview, SceneExplorerPreview } from './previews';

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

// Hover Preview Content Component
const HoverPreviewContent: React.FC<{ navKey: string }> = ({ navKey }) => {
  switch (navKey) {
    case 'scenes':
      return <SceneExplorerPreview />;
    
    case 'video':
      return <VideoSettingsPreview />;
    
    case 'uploads':
      return <UploadsPreview />;
    
    case 'ai':
      return <AIToolsPreview />;
    
    case 'tools':
      return (
        <div className="w-80 bg-white border border-gray-200 shadow-lg rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <PaintBrushIcon className="w-5 h-5 text-orange-600" />
            <h3 className="font-semibold text-gray-900">Tools</h3>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            {[
              { name: 'Select', icon: '↖️' },
              { name: 'Rectangle', icon: '▭' },
              { name: 'Circle', icon: '⭕' },
              { name: 'Text', icon: 'T' },
              { name: 'Line', icon: '📏' },
              { name: 'Arrow', icon: '➡️' }
            ].map((tool) => (
              <div key={tool.name} className="p-2 bg-gray-50 rounded text-center">
                <div className="text-lg mb-1">{tool.icon}</div>
                <div className="text-xs text-gray-600">{tool.name}</div>
              </div>
            ))}
          </div>
        </div>
      );
    
    case 'audio':
    case 'timeline':
      // These are toggle buttons, no preview needed
      return null;
    
    default:
      return null;
  }
};

export const LeftSidebar: React.FC = () => {
  const activeNav = useActiveNav();
  const hoverNav = useHoverNav();
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
    <>
      <div
        className="m-2 fixed bg-white inset-y-0 left-0 z-40 w-16 overflow-y-auto border border-gray-200 shadow-lg pb-4 rounded-lg flex flex-col"
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

      {/* Hover Preview Panel */}
      {hoverNav && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{ 
            left: '88px', // Position right after the sidebar (80px width + 8px margin)
            top: '72px',  // Align with sidebar top
            maxHeight: 'calc(100vh - 80px)', // Don't overflow viewport
          }}
        >
          <div 
            className="pointer-events-auto animate-in slide-in-from-left-2 fade-in duration-200"
            onMouseEnter={() => setHoverNav(hoverNav)} // Keep the preview open when hovering over it
            onMouseLeave={() => setHoverNav(null)}
          >
            <HoverPreviewContent navKey={hoverNav} />
          </div>
        </div>
      )}
    </>
  )
} 