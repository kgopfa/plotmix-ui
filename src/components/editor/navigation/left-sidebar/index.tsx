'use client'

import React, { useRef, useEffect } from 'react'
import {
  CloudUpload,
  Video,
  Clapperboard,
  WandSparkles,
  Palette,
  VolumeOff,
  Hourglass,
} from 'lucide-react'
import { useActiveNav, useSetActiveNav, useSetHoverNav, useHoverNav, usePanelActions, usePanelState } from '@/stores/use-ui-store';
import { VideoSettingsPreview, AIToolsPreview, UploadsPreview, SceneExplorerPreview } from './tabs';
import { ToolbarTab } from './tabs/toolbar-tab';

type NavItem = { name: string; key: 'video' | 'scenes' | 'uploads' | 'ai' | 'tools' | 'audio' | 'timeline'; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; };

const navigation: NavItem[] = [
  { name: 'Video Settings', key: 'video', icon: Video },
  { name: 'Scenes', key: 'scenes', icon: Clapperboard },
  { name: 'Uploads', key: 'uploads', icon: CloudUpload },
  { name: 'AI', key: 'ai', icon: WandSparkles },
  { name: 'Tools', key: 'tools', icon: Palette },
];

const bottomNavigation: NavItem[] = [
  { name: 'Audio', key: 'audio', icon: VolumeOff },
  { name: 'Timeline', key: 'timeline', icon: Hourglass },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Tab Content Component - Used for both hover and sticky tabs
const TabContent: React.FC<{ navKey: string }> = ({ navKey }) => {
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
      return <ToolbarTab />;
    
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
  const { toggleTimelineCollapse } = usePanelActions();
  const { isTimelineCollapsed } = usePanelState();
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Clear any pending hover timeout
  const clearHoverTimeout = () => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
      hoverTimeoutRef.current = null;
    }
  };

  // Handle hover enter with timeout cleanup
  const handleHoverEnter = (itemKey: NavItem['key']) => {
    clearHoverTimeout();
    if (!activeNav) {
      setHoverNav(itemKey);
    }
  };

  // Handle hover leave with controlled timeout
  const handleHoverLeave = () => {
    clearHoverTimeout();
    if (!activeNav) {
      hoverTimeoutRef.current = setTimeout(() => {
        if (!document.querySelector('.tab-panel-area:hover')) {
          setHoverNav(null);
        }
        hoverTimeoutRef.current = null;
      }, 100);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearHoverTimeout();
    };
  }, []);

  // Deselect active navigation item when clicking on empty sidebar space
  const handleRootClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    // If the click is not within a button element, clear selection
    if (!target.closest('button')) {
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
                <button
                  type="button"
                  className={classNames(
                    activeNav === item.key ? 'bg-fuchsia-500 text-white' : 'text-gray-400 hover:bg-fuchsia-500 hover:text-white',
                    'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                  )}
                  onClick={()=>{
                    setActiveNav(activeNav === item.key ? null : item.key);
                  }}
                  onMouseEnter={()=>handleHoverEnter(item.key)}
                  onMouseLeave={()=>handleHoverLeave()}
                >
                  <item.icon aria-hidden="true" className="size-6 shrink-0" />
                  <span className="sr-only">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Bottom Navigation */}
        <nav className="mt-auto mb-4">
          <ul role="list" className="flex flex-col items-center space-y-1">
            {bottomNavigation.map((item: NavItem) => (
              <li key={item.name}>
                <button
                  type="button"
                  className={classNames(
                    item.key === 'timeline' && isTimelineCollapsed ? 'bg-fuchsia-500 text-white' : 
                    activeNav === item.key ? 'bg-fuchsia-500 text-white' : 'text-gray-400 hover:bg-fuchsia-500 hover:text-white',
                    'group flex flex-col gap-x-3 rounded-md p-3 text-sm/6 font-semibold',
                  )}
                  onClick={()=>{
                    if (item.key === 'timeline') {
                      toggleTimelineCollapse();
                    } else {
                      setActiveNav(activeNav === item.key ? null : item.key);
                    }
                  }}
                  onMouseEnter={()=>handleHoverEnter(item.key)}
                  onMouseLeave={()=>handleHoverLeave()}
                >
                  <item.icon aria-hidden="true" className="size-6 shrink-0" />
                  <span className="sr-only">{item.name}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {/* Tab Panel - Shows on hover (when no active tab) OR when active (sticky) */}
      {(activeNav || (!activeNav && hoverNav)) && (
        <>
          {/* Transparent bridge to ensure seamless hover */}
          <div
            className="fixed z-[60] pointer-events-auto"
            style={{ 
              left: '72px', // Start right after sidebar
              top: '72px',
              width: '16px', // Bridge gap between sidebar and panel
              height: 'calc(100vh - 80px)',
            }}
            onMouseEnter={() => {
              clearHoverTimeout();
              if (!activeNav && hoverNav) {
                setHoverNav(hoverNav);
              }
            }}
          />
          
          {/* Actual tab panel */}
          <div
            className="fixed z-[60] pointer-events-none tab-panel-area"
            style={{ 
              left: '80px', // Position after bridge
              top: '72px',
              maxHeight: 'calc(100vh - 80px)',
              height: 'calc(100vh - 80px)',
            }}
          >
            <div 
              className="pointer-events-auto animate-in slide-in-from-left-2 fade-in duration-200 h-full"
              onMouseEnter={() => {
                // Keep hover state active when entering tab content
                clearHoverTimeout();
                if (!activeNav && hoverNav) {
                  setHoverNav(hoverNav);
                }
              }}
              onMouseLeave={() => {
                // Only clear hover when leaving tab content
                if (!activeNav) {
                  handleHoverLeave();
                }
              }}
            >
              <div className={`h-full ${(activeNav || hoverNav) === 'tools' ? '' : 'overflow-hidden'}`}>
                <TabContent navKey={activeNav || hoverNav!} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
} 