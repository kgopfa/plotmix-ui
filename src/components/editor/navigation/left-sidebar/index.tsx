'use client'

import React, { useRef, useEffect } from 'react'
import {
  WandSparkles,
  Palette,
  VolumeOff,
  Hourglass,
  CircleFadingPlus,
  Type as TypeIcon,
  Layers,
} from 'lucide-react'
import {
  useActiveNav, 
  useSetActiveNav, 
  useSetHoverNav, 
  useHoverNav, 
  usePanelActions, 
  usePanelState, 
  useUIStore 
} from '@/stores/use-ui-store';

import { ToolbarTab } from './tabs/toolbar-tab';
import { UploadsTab } from './tabs/uploads-tab';
import { TextTab } from './tabs/text-tab';
import { AIToolsTab } from './tabs/ai-tools-tab';
import { AnimationsTab } from './tabs/animations-tab';
import { LayersTab } from './tabs/layers-tab';

type NavItem = { name: string; key: 'video' | 'scenes' | 'uploads' | 'ai' | 'text' | 'layers' | 'tools' | 'audio' | 'timeline'; icon: React.ComponentType<React.SVGProps<SVGSVGElement>>; };

const navigation: NavItem[] = [
  { name: 'Uploads', key: 'uploads', icon: CircleFadingPlus },
  { name: 'AI', key: 'ai', icon: WandSparkles },
  { name: 'Text', key: 'text', icon: (props: React.SVGProps<SVGSVGElement>) => <TypeIcon {...props} strokeWidth={2.5} /> },
  { name: 'Layers', key: 'layers', icon: Layers },
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
    case 'uploads':
      return <UploadsTab />;

    case 'text':
      return <TextTab />;
    
    case 'animations':
      return <AnimationsTab />;
    
    case 'layers':
      return <LayersTab />;
    
    case 'ai':
      return <AIToolsTab />;
    
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
  const showAnimationsTab = useUIStore(state => state.showAnimationsTab);
  const setShowAnimationsTab = useUIStore(state => state.setShowAnimationsTab);
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
      // Also hide animations tab if it's open
      if (showAnimationsTab) {
        setShowAnimationsTab(false);
      }
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

      {/* Tab Panel - Shows on hover (when no active tab) OR when active (sticky) OR when animations tab is shown */}
      {(activeNav || (!activeNav && hoverNav) || showAnimationsTab) && (
        <>
          {/* Transparent bridge to ensure seamless hover */}
          <div
            className={`fixed pointer-events-auto ${
              showAnimationsTab ? 'z-[45]' : 'z-[40]'
            }`}
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
            className={`fixed pointer-events-none tab-panel-area ${
              showAnimationsTab ? 'z-[45]' : 'z-[40]'
            }`}
            style={{ 
              left: '80px', // Position after bridge
              top: '72px',
              maxHeight: 'calc(100vh - 80px)',
              height: 'calc(100vh - 80px)',
              width: '384px', // Fixed width for the panel content
            }}
          >
            <div 
              className={`pointer-events-auto h-full ${
                showAnimationsTab 
                  ? 'transform transition-all duration-300 ease-out' 
                  : 'animate-in slide-in-from-left-2 fade-in duration-200'
              }`}
              style={showAnimationsTab ? { animation: 'slideInFromLeft 0.3s ease-out' } : {}}
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
                // Hide animations tab when leaving tab area
                if (showAnimationsTab && !activeNav && !hoverNav) {
                  setShowAnimationsTab(false);
                }
              }}
            >
              <div className={`h-full ${(activeNav || hoverNav) === 'tools' ? '' : 'overflow-hidden'}`}>
                <TabContent navKey={showAnimationsTab ? 'animations' : (activeNav || hoverNav!)} />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  )
} 