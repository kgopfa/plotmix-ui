'use client'

import React, { useRef, useEffect, useState } from 'react'
import {
  WandSparkles,
  Palette,
  CircleFadingPlus,
  Type as TypeIcon,
  Blocks,
  BrushCleaning,
} from 'lucide-react'
import {
  useActiveNav,
  useSetActiveNav,
  useSetHoverNav,
  useHoverNav,
  useInteractedNav,
  useSetInteractedNav,
  useUIStore
} from '@/stores/use-ui-store';
import { useCanvasOperations } from '@/stores/use-canvas-store';
import { useTimelineOperations } from '@/stores/use-timeline-store';
import { ToolbarTab } from './tabs/toolbar-tab';
import { UploadsTab } from './tabs/uploads-tab';
import { TextTab } from './tabs/text-tab';
import { AIToolsTab } from './tabs/ai-tools-tab';
import { AnimationsTab } from './tabs/animations-tab';
import { ComponentsTab } from './tabs/components-tab';
import { ClearCanvasDialog } from '../../panels/clear-canvas-dialog';

type NavItem = {
  name: string;
  key: 'video' | 'scenes' | 'uploads' | 'ai' | 'text' | 'tools' | 'components' | 'audio' | 'timeline' | 'reset';
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string;
};

const navigation: NavItem[] = [
  {
    name: 'Uploads',
    key: 'uploads',
    icon: CircleFadingPlus,
    color: 'text-green-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700',
    activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
  },
  {
    name: 'AI',
    key: 'ai',
    icon: WandSparkles,
    color: 'text-purple-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700',
    activeColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
  },
  {
    name: 'Text',
    key: 'text',
    icon: (props: React.SVGProps<SVGSVGElement>) => <TypeIcon {...props} strokeWidth={2.5} />,
    color: 'text-blue-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700',
    activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
  },

  {
    name: 'Tools',
    key: 'tools',
    icon: Palette,
    color: 'text-orange-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:text-orange-700',
    activeColor: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30'
  },
  {
    name: 'Components',
    key: 'components',
    icon: Blocks,
    color: 'text-teal-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-teal-50 hover:to-cyan-50 hover:text-teal-700',
    activeColor: 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg shadow-teal-500/30'
  },
];

const bottomNavigation: NavItem[] = [
  {
    name: 'Clear Canvas',
    key: 'reset',
    icon: BrushCleaning,
    color: 'text-red-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700',
    activeColor: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
  },
];

// Tab Content Component - Used for both hover and sticky tabs
const TabContent: React.FC<{ navKey: string }> = ({ navKey }) => {
  switch (navKey) {
    case 'uploads':
      return <UploadsTab />;

    case 'text':
      return <TextTab />;

    case 'animations':
      return <AnimationsTab />;

    case 'ai':
      return <AIToolsTab />;

    case 'tools':
      return <ToolbarTab />;

    case 'components':
      return <ComponentsTab />;

    case 'audio':
    case 'reset':
      // These are toggle buttons, no preview needed
      return null;

    default:
      return null;
  }
};

export const LeftSidebar: React.FC = () => {
  const activeNav = useActiveNav();
  const hoverNav = useHoverNav();
  const interactedNav = useInteractedNav();
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  const { clearCanvas } = useCanvasOperations();
  const { resetTimeline } = useTimelineOperations();
  const [showClearDialog, setShowClearDialog] = useState(false);

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
      // Clear interacted nav when hovering over a different tab
      if (interactedNav && interactedNav !== itemKey) {
        setInteractedNav(null);
      }
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
      setInteractedNav(null);
      // Also hide animations tab if it's open
      if (showAnimationsTab) {
        setShowAnimationsTab(false);
      }
    }
  };

  // Handle canvas clear confirmation
  const handleClearCanvas = () => {
    clearCanvas();
    resetTimeline();
    setActiveNav(null);
    setInteractedNav(null);
  };

  return (
    <>
      <div
        className="m-2 fixed left-0 top-16 z-40 w-16 bg-transparent transition-all duration-300 ease-out translate-x-0 opacity-100"
        style={{ height: 'calc(100vh - 80px)' }}
        onClick={handleRootClick}
      >
        <div className="relative bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col items-center h-full">
          {/* Top Navigation */}
          <nav className="mt-6 pb-6 flex-1">
            <ul role="list" className="flex flex-col items-center space-y-3">
              {navigation.map((item: NavItem) => {
                const isActive = activeNav === item.key;
                return (
                  <li key={item.name}>
                    <div className="relative">
                      <button
                        type="button"
                        className={`
                          relative group flex flex-col items-center justify-center
                          w-12 h-12 rounded-xl font-medium
                          transition-all duration-200 ease-out
                          transform hover:scale-105 active:scale-95
                          ${isActive
                            ? item.activeColor
                            : `${item.color} ${item.hoverColor} hover:shadow-md`
                          }
                        `}
                        onClick={() => {
                          setActiveNav(activeNav === item.key ? null : item.key);
                        }}
                        onMouseEnter={() => handleHoverEnter(item.key)}
                        onMouseLeave={() => handleHoverLeave()}
                        title={item.name}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={`w-5 h-5 transition-all duration-200 ${isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'
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

          {/* Bottom Navigation */}
          <nav className="mb-6">
            <ul role="list" className="flex flex-col items-center space-y-3">
              {bottomNavigation.map((item: NavItem) => {
                const isActive = activeNav === item.key;
                return (
                  <li key={item.name}>
                    <div className="relative">
                      <button
                        type="button"
                        className={`
                          relative group flex flex-col items-center justify-center
                          w-12 h-12 rounded-xl font-medium
                          transition-all duration-200 ease-out
                          transform hover:scale-105 active:scale-95
                          ${isActive
                            ? item.activeColor
                            : `${item.color} ${item.hoverColor} hover:shadow-md`
                          }
                        `}
                        onClick={() => {
                          if (item.key === 'reset') {
                            setShowClearDialog(true);
                          } else {
                            setActiveNav(activeNav === item.key ? null : item.key);
                          }
                        }}
                        onMouseEnter={() => handleHoverEnter(item.key)}
                        onMouseLeave={() => handleHoverLeave()}
                        title={item.name}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={`w-5 h-5 transition-all duration-200 ${isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'
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

      {/* Tab Panel - Shows on hover, when active, when interacted, or when animations tab is shown */}
      {(activeNav || (!activeNav && hoverNav) || (!activeNav && !hoverNav && interactedNav) || showAnimationsTab) && (
        <>
          {/* Transparent bridge to ensure seamless hover */}
          <div
            className={`fixed pointer-events-auto ${showAnimationsTab ? 'z-[45]' : 'z-[40]'
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
            className={`fixed pointer-events-none tab-panel-area ${showAnimationsTab ? 'z-[45]' : 'z-[40]'
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
              className={`pointer-events-auto h-full ${showAnimationsTab
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
              <div 
                className={`h-full ${(activeNav || hoverNav || interactedNav) === 'tools' ? '' : 'overflow-hidden'}`}
                onClick={() => {
                  // When user clicks inside the tab content area, mark the current hover tab as interacted
                  if (!activeNav && hoverNav) {
                    setInteractedNav(hoverNav);
                  }
                }}
              >
                <TabContent 
                  navKey={showAnimationsTab ? 'animations' : (activeNav || hoverNav || interactedNav)!} 
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Clear Canvas Confirmation Dialog */}
      <ClearCanvasDialog
        open={showClearDialog}
        onClose={() => setShowClearDialog(false)}
        onConfirm={handleClearCanvas}
      />
    </>
  )
} 