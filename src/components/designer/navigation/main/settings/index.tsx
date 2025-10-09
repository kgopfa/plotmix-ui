'use client'

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Menu,
  MenuButton,
  MenuItems
} from '@headlessui/react'
import {
  Settings,
  Video,
  Move3D
} from 'lucide-react'
import { SnappingOptions } from './snapping';
import { DisplaySettings } from './display';
import { useSnappingState, useSnappingActions } from '@/stores/use-ui-store';

// Settings navigation configuration
const settingsNavigation = [
  { name: 'Display Settings', icon: Video },
  { name: 'Snapping Settings', icon: Move3D },
];

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const SettingsDropdown: React.FC = () => {
  const [currentSettingsItem, setCurrentSettingsItem] = useState<string | null>(null);
  const [hoveredSettingsItem, setHoveredSettingsItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const openStateRef = useRef(false);
  const [isMounted, setIsMounted] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuItemsRef = useRef<HTMLDivElement>(null);

  // Use UI store snapping state instead of local hooks
  const snappingState = useSnappingState();
  const { gridConfig, elementSnapConfig, isGridSnapTemporarilyDisabled, isElementSnapTemporarilyDisabled } = snappingState;

  const {
    updateGridConfig,
    updateElementSnapConfig
  } = useSnappingActions();

  // Reset selection when menu closes
  useEffect(() => {
    if (!isMenuOpen) {
      setCurrentSettingsItem(null);
      setHoveredSettingsItem(null);
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
        setHoverTimeout(null);
      }
    }
  }, [isMenuOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync open state from render prop to state (only when it actually changes)
  const syncOpenState = (open: boolean) => {
    if (openStateRef.current !== open) {
      openStateRef.current = open;
      // Use queueMicrotask to defer state update until after render
      queueMicrotask(() => setIsMenuOpen(open));
    }
  };

  const handleSettingsClick = (settingName: string) => {
    setCurrentSettingsItem(settingName);
  };

  const handleSettingsHover = (settingName: string) => {
    // Clear any existing timeout
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      setHoverTimeout(null);
    }

    setHoveredSettingsItem(settingName);
  };

  const handleSettingsLeave = () => {
    // Add a small delay before clearing the hover state
    const timeout = setTimeout(() => {
      setHoveredSettingsItem(null);
    }, 150); // 150ms delay

    setHoverTimeout(timeout);
  };

  // Determine which panel to show based on hover or current selection
  const getShowPanel = (panelName: string) => {
    if (hoveredSettingsItem) {
      return hoveredSettingsItem === panelName;
    }
    return currentSettingsItem === panelName;
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  // Set mounted state for portal (SSR safety)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <Menu as="div" className="relative ml-4" ref={menuRef}>
      {({ open }) => {
        // Sync the open state (deferred to avoid setState during render)
        syncOpenState(open);

        // Calculate panel position based on MenuItems position
        const panelPosition = (() => {
          if (!menuItemsRef.current) return { top: 72, left: 240 };
          
          const rect = menuItemsRef.current.getBoundingClientRect();
          return {
            top: rect.top,
            left: rect.right + 8 // 8px gap from MenuItems
          };
        })();

        return (
          <>
            <div>
              <MenuButton className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
                <span className="sr-only">Open settings menu</span>
                <Settings className="size-5 transition-all duration-200 group-hover:scale-110" />
              </MenuButton>
            </div>
            <MenuItems
              ref={menuItemsRef}
              transition
              className="absolute left-0 z-[60] mt-2 -ml-2 w-56 origin-top-left rounded-md bg-white/95 backdrop-blur-sm pt-3 pb-3 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
            >
              <nav
                aria-label="Settings menu"
                className="flex flex-1 flex-col"
                onMouseLeave={handleSettingsLeave}
              >
                <ul role="list" className="space-y-4 px-2">
                  {settingsNavigation.map((item) => (
                    <li key={item.name}>
                      <button
                        type="button"
                        onClick={() => handleSettingsClick(item.name)}
                        onMouseEnter={() => handleSettingsHover(item.name)}
                        className={classNames(
                          currentSettingsItem === item.name || hoveredSettingsItem === item.name
                            ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-sm shadow-purple-500/30'
                            : 'text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 focus:bg-purple-50 focus:text-purple-700',
                          'group flex gap-x-3 items-center rounded-md py-2 px-4 text-sm font-semibold focus:outline-hidden cursor-pointer w-full text-left h-10',
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            currentSettingsItem === item.name || hoveredSettingsItem === item.name
                              ? 'text-white drop-shadow-sm'
                              : 'text-gray-500 group-hover:text-purple-700',
                            'size-5 shrink-0 transition-colors duration-200',
                          )}
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </nav>
            </MenuItems>

            {/* Settings Panels rendered via Portal - positioned next to settings menu - only show when menu is open */}
            {isMounted && open && getShowPanel('Snapping Settings') && createPortal(
              <div
                className="fixed z-[60]"
                style={{
                  top: `${panelPosition.top}px`,
                  left: `${panelPosition.left}px`
                }}
                onMouseEnter={() => handleSettingsHover('Snapping Settings')}
                onMouseLeave={handleSettingsLeave}
              >
                <SnappingOptions
                  gridConfig={gridConfig}
                  onToggleGridSnap={() => updateGridConfig({ enabled: !gridConfig.enabled })}
                  elementSnapConfig={elementSnapConfig}
                  onToggleElementSnap={() => updateElementSnapConfig({ enabled: !elementSnapConfig.enabled })}
                  onToggleGuides={() => updateElementSnapConfig({ showGuides: !elementSnapConfig.showGuides })}
                  isGridSnapTemporarilyDisabled={isGridSnapTemporarilyDisabled}
                  isElementSnapTemporarilyDisabled={isElementSnapTemporarilyDisabled}
                />
              </div>,
              document.body
            )}

            {/* Display Settings Panel rendered via Portal - positioned next to settings menu - only show when menu is open */}
            {isMounted && open && getShowPanel('Display Settings') && createPortal(
              <div
                className="fixed z-[60]"
                style={{
                  top: `${panelPosition.top}px`,
                  left: `${panelPosition.left}px`
                }}
                onMouseEnter={() => handleSettingsHover('Display Settings')}
                onMouseLeave={handleSettingsLeave}
              >
                <DisplaySettings />
              </div>,
              document.body
            )}
          </>
        );
      }}
    </Menu>
  );
}; 