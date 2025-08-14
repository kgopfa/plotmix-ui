'use client'

import React, { useState, useEffect } from 'react';
import {
  Menu,
  MenuButton,
  MenuItem,
  MenuItems
} from '@headlessui/react'
import {
  Settings,
  Video,
  Move3D
} from 'lucide-react'
import { SnappingOptions } from './snapping/snap-options';
import { VideoOptions } from './video/video-options';
import { useSnappingState, useSnappingActions } from '@/stores/use-ui-store';

// Settings navigation configuration
const settingsNavigation = [
  { name: 'Video Settings', icon: Video },
  { name: 'Snapping Settings', icon: Move3D },
];

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const SettingsDropdown: React.FC = () => {
  const [showSnappingSettings, setShowSnappingSettings] = useState(false);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [currentSettingsItem, setCurrentSettingsItem] = useState('Video Settings');
  const [hoveredSettingsItem, setHoveredSettingsItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Use UI store snapping state instead of local hooks
  const snappingState = useSnappingState();
  const { gridConfig, elementSnapConfig, isGridSnapTemporarilyDisabled, isElementSnapTemporarilyDisabled } = snappingState;
  
  const {
    updateGridConfig,
    updateElementSnapConfig
  } = useSnappingActions();

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

    if (settingName === 'Snapping Settings') {
      setShowSnappingSettings(true);
      setShowVideoSettings(false);
    } else if (settingName === 'Video Settings') {
      setShowVideoSettings(true);
      setShowSnappingSettings(false);
    } else {
      setShowSnappingSettings(false);
      setShowVideoSettings(false);
    }
  };

  const handleSettingsLeave = () => {
    // Add a small delay before hiding the panels
    const timeout = setTimeout(() => {
      setHoveredSettingsItem(null);
      setShowSnappingSettings(false);
      setShowVideoSettings(false);
    }, 150); // 150ms delay

    setHoverTimeout(timeout);
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout) {
        clearTimeout(hoverTimeout);
      }
    };
  }, [hoverTimeout]);

  return (
    <Menu as="div" className="relative ml-4">
      <div>
        <MenuButton className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
          <span className="sr-only">Open settings menu</span>
          <Settings className="size-5 transition-all duration-200 group-hover:scale-110" />
        </MenuButton>
      </div>
      <MenuItems
        transition
        className="absolute left-0 z-50 mt-2 -ml-2 w-56 origin-top-left rounded-md bg-white/95 backdrop-blur-sm pt-3 pb-3 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
      >
        <nav
          aria-label="Settings menu"
          className="flex flex-1 flex-col"
          onMouseLeave={handleSettingsLeave}
        >
          <ul role="list" className="space-y-4 px-2">
            {settingsNavigation.map((item) => (
              <li key={item.name}>
                <MenuItem>
                  <button
                    type="button"
                    onClick={() => handleSettingsClick(item.name)}
                    onMouseEnter={() => handleSettingsHover(item.name)}
                    className={classNames(
                      currentSettingsItem === item.name || hoveredSettingsItem === item.name
                        ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                        : 'text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 data-focus:bg-purple-50 data-focus:text-purple-700',
                      'group flex gap-x-3 rounded-md py-2 px-4 text-sm font-semibold data-focus:outline-hidden cursor-pointer w-full text-left',
                    )}
                  >
                    <item.icon
                      aria-hidden="true"
                      className={classNames(
                        currentSettingsItem === item.name || hoveredSettingsItem === item.name
                          ? 'text-white drop-shadow-sm'
                          : 'text-gray-500 group-hover:text-purple-700 group-hover:scale-110',
                        'size-5 shrink-0 transition-all duration-200',
                      )}
                    />
                    {item.name}
                  </button>
                </MenuItem>
              </li>
            ))}
          </ul>
        </nav>
      </MenuItems>

      {/* Settings Panels - positioned next to settings menu */}
      {showSnappingSettings && (
        <div
          className="absolute left-60 top-0 z-50"
          onMouseEnter={() => handleSettingsHover('Snapping Settings')}
          onMouseLeave={handleSettingsLeave}
        >
          <div className="relative z-50">
            <SnappingOptions
              gridConfig={gridConfig}
              onToggleGrid={() => updateGridConfig({ visible: !gridConfig.visible })}
              onToggleGridSnap={() => updateGridConfig({ enabled: !gridConfig.enabled })}
              onGridSizeChange={(size: number) => updateGridConfig({ size })}
              elementSnapConfig={elementSnapConfig}
              onToggleElementSnap={() => updateElementSnapConfig({ enabled: !elementSnapConfig.enabled })}
              onToggleGuides={() => updateElementSnapConfig({ showGuides: !elementSnapConfig.showGuides })}
              onToggleSpacing={() => updateElementSnapConfig({ enableSpacing: !elementSnapConfig.enableSpacing })}
              onToggleDistribution={() => updateElementSnapConfig({ enableDistribution: !elementSnapConfig.enableDistribution })}
              onSnapThresholdChange={(threshold: number) => updateElementSnapConfig({ snapThreshold: threshold })}
              isGridSnapTemporarilyDisabled={isGridSnapTemporarilyDisabled}
              isElementSnapTemporarilyDisabled={isElementSnapTemporarilyDisabled}
            />
          </div>
        </div>
      )}

      {/* Video Settings Panel - positioned next to settings menu */}
      {showVideoSettings && (
        <div
          className="absolute left-60 top-0 z-50"
          onMouseEnter={() => handleSettingsHover('Video Settings')}
          onMouseLeave={handleSettingsLeave}
        >
          <div className="relative z-50">
            <VideoOptions />
          </div>
        </div>
      )}
    </Menu>
  );
}; 