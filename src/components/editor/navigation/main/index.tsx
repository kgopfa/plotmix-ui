import React, { useState, useEffect } from 'react';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
  Menu,
  MenuButton,
  MenuItem,
  MenuItems
} from '@headlessui/react'
import {
  Menu as MenuIcon,
  Bell,
  X,
  Upload,
  Settings,
  Redo2,
  Search,
  Undo2,
  CloudCheck,
  Video,
  Move3D
} from 'lucide-react'
import { ProjectControls } from './project-controls';
import { PathModeIndicator } from './path-mode-indicator';
import { PanelToggleButtons } from './panel-toggle-buttons';
import { SnappingControls } from './snapping-controls';
import { SelectionIndicator } from './selection-indicator';
import { SnappingOptions } from './snap-options';
import { VideoOptions } from './video-options';
import { useGridSnapping } from '@/hooks/use-grid-snapping';
import { useElementSnapping } from '@/hooks/use-element-snapping';
import { useScenes, useActiveSceneId, useRenameScene } from '@/stores/use-scene-store';
import { ProjectManager } from '@/lib/project-manager';

// Simplified interface - only for props that can't be accessed via stores
interface MainNavBarProps {
  canvasZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

// Settings navigation configuration
const settingsNavigation = [
  { name: 'Video Settings', href: '#', icon: Video },
  { name: 'Snapping Settings', href: '#', icon: Move3D },
];

function classNames(...classes: (string | boolean | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export const MainNavBar: React.FC<MainNavBarProps> = ({
  onGroupElements,
  onUngroupElements
}) => {
  const [projectName, setProjectName] = useState('Project Name');
  const [showSnappingSettings, setShowSnappingSettings] = useState(false);
  const [showVideoSettings, setShowVideoSettings] = useState(false);
  const [currentSettingsItem, setCurrentSettingsItem] = useState('Video Settings');
  const [hoveredSettingsItem, setHoveredSettingsItem] = useState<string | null>(null);
  const [hoverTimeout, setHoverTimeout] = useState<NodeJS.Timeout | null>(null);

  // Scene selector state
  const [showSceneDropdown, setShowSceneDropdown] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);
  const [tempSceneName, setTempSceneName] = useState('');

  // Scene store hooks
  const scenes = useScenes();
  const activeSceneId = useActiveSceneId();
  const renameScene = useRenameScene();
  const projectManager = ProjectManager.getInstance();

  // Get current scene info
  const currentScene = scenes.find(scene => scene.id === activeSceneId);

  // Grid snapping hook
  const {
    gridConfig,
    setGridConfig,
    toggleGrid,
    toggleSnapEnabled,
    isSnapTemporarilyDisabled
  } = useGridSnapping({
    size: 10,
    enabled: true,
    visible: false,
    snapThreshold: 8
  });

  // Element snapping hook
  const {
    config: elementSnapConfig,
    setConfig: setElementSnapConfig,
    toggleEnabled: toggleElementSnap,
    toggleGuides: toggleElementSnapGuides,
    toggleSpacing: toggleElementSpacing,
    toggleDistribution: toggleElementDistribution,
    isSnapTemporarilyDisabled: isElementSnapDisabled
  } = useElementSnapping({
    enabled: true,
    snapThreshold: 10,
    showGuides: true,
    enableSpacing: true,
    enableDistribution: true
  });

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

  const handleSceneSelect = async (sceneId: string) => {
    if (sceneId === activeSceneId) {
      setShowSceneDropdown(false);
      return;
    }

    try {
      await projectManager.switchScene(sceneId);
      setShowSceneDropdown(false);
    } catch (error) {
      console.error('Failed to switch scene:', error);
    }
  };

  const handleCreateScene = () => {
    try {
      const newSceneId = projectManager.createScene();
      console.log(`Created new scene: ${newSceneId}`);
      setShowSceneDropdown(false);
    } catch (error) {
      console.error('Failed to create scene:', error);
    }
  };

  const handleSceneRename = (sceneId: string) => {
    if (tempSceneName.trim()) {
      renameScene(sceneId, tempSceneName.trim());
    }
    setEditingSceneId(null);
    setTempSceneName('');
  };

  const startEditingSceneName = (sceneId: string, sceneName: string) => {
    setTempSceneName(sceneName);
    setEditingSceneId(sceneId);
    setShowSceneDropdown(false);
  };



  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-slate-50 to-gray-50 backdrop-blur-sm border-b border-gray-200/50 shadow-xl shadow-gray-200/50">
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-0">
        <div className="flex h-16 justify-between">
          <div className="flex lg:pl-0 lg:pr-0">
            {/* Options menu button */}
            <div className="flex items-center mx-6">
              <DisclosureButton className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open options menu</span>
                <MenuIcon aria-hidden="true" className="block size-5 group-data-open:hidden transition-all duration-200 group-hover:scale-110" />
                <X aria-hidden="true" className="hidden size-5 group-data-open:block transition-all duration-200 group-hover:scale-110" />
              </DisclosureButton>
            </div>
            <div className="flex shrink-0 items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="flex items-center ml-8">
                <button className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <CloudCheck className="size-5 transition-all duration-200 group-hover:scale-110" />
                </button>
                <button className="ml-4 group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <Undo2 className="size-5 transition-all duration-200 group-hover:scale-110" />
                </button>
                <button className="ml-4 group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <Redo2 className="size-5 transition-all duration-200 group-hover:scale-110" />
                </button>

                {/* Settings dropdown */}
                <Menu as="div" className="relative ml-4">
                  <div>
                    <MenuButton className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2">
                      <span className="sr-only">Open settings menu</span>
                      <Settings className="size-5 transition-all duration-200 group-hover:scale-110" />
                    </MenuButton>
                  </div>
                  <MenuItems
                    transition
                    className="absolute left-0 z-10 mt-2 -ml-2 w-56 origin-top-left rounded-xl bg-white/95 backdrop-blur-sm pt-3 pb-3 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
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
                              <a
                                href={item.href}
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleSettingsClick(item.name);
                                }}
                                onMouseEnter={() => handleSettingsHover(item.name)}
                                className={classNames(
                                  currentSettingsItem === item.name || hoveredSettingsItem === item.name
                                    ? 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
                                    : 'text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 data-focus:bg-purple-50 data-focus:text-purple-700',
                                  'group flex gap-x-3 rounded-xl p-2 text-sm font-semibold data-focus:outline-hidden cursor-pointer transition-all duration-200 ease-out transform hover:scale-105',
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
                              </a>
                            </MenuItem>
                          </li>
                        ))}
                      </ul>
                    </nav>
                  </MenuItems>

                  {/* Settings Panels - positioned next to settings menu */}
                  {showSnappingSettings && (
                    <div
                      className="absolute left-60 top-0 z-20"
                      onMouseEnter={() => handleSettingsHover('Snapping Settings')}
                      onMouseLeave={handleSettingsLeave}
                    >
                      <div className="relative z-20">
                        <SnappingOptions
                          gridConfig={gridConfig}
                          onToggleGrid={toggleGrid}
                          onToggleGridSnap={toggleSnapEnabled}
                          onGridSizeChange={(size: number) => setGridConfig({ size })}
                          elementSnapConfig={elementSnapConfig}
                          onToggleElementSnap={toggleElementSnap}
                          onToggleGuides={toggleElementSnapGuides}
                          onToggleSpacing={toggleElementSpacing}
                          onToggleDistribution={toggleElementDistribution}
                          onSnapThresholdChange={(threshold: number) => setElementSnapConfig({ snapThreshold: threshold })}
                          isGridSnapTemporarilyDisabled={isSnapTemporarilyDisabled}
                          isElementSnapTemporarilyDisabled={isElementSnapDisabled}
                        />
                      </div>
                    </div>
                  )}

                  {/* Video Settings Panel - positioned next to settings menu */}
                  {showVideoSettings && (
                    <div
                      className="absolute left-60 top-0 z-20"
                      onMouseEnter={() => handleSettingsHover('Video Settings')}
                      onMouseLeave={handleSettingsLeave}
                    >
                      <div className="relative z-20">
                        <VideoOptions />
                      </div>
                    </div>
                  )}
                </Menu>

                {/* Scene selector */}
                <div className="relative ml-8">
                  <div className="grid w-48 max-w-sm grid-cols-1 relative">
                    {editingSceneId === activeSceneId ? (
                      <input
                        type="text"
                        value={tempSceneName}
                        onChange={(e) => setTempSceneName(e.target.value)}
                        onBlur={() => {
                          if (editingSceneId) {
                            handleSceneRename(editingSceneId);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && editingSceneId) {
                            handleSceneRename(editingSceneId);
                          }
                          if (e.key === 'Escape') {
                            setEditingSceneId(null);
                            setTempSceneName('');
                          }
                        }}
                        autoFocus
                        className="col-start-1 row-start-1 block w-full h-9 rounded-xl py-1.5 pr-10 pl-3 text-sm text-gray-900 font-medium placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      />
                    ) : (
                      <button
                        onClick={() => setShowSceneDropdown(!showSceneDropdown)}
                        onDoubleClick={() => {
                          if (currentScene) {
                            startEditingSceneName(currentScene.id, currentScene.name);
                          }
                        }}
                        className="col-start-1 row-start-1 flex flex-row items-center w-full h-9 rounded-xl py-1.5 pr-10 pl-3 text-sm text-gray-500 font-semibold focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 transition-all duration-200 ease-out hover:bg-gray-50/50"
                      >
                        <span className="truncate">{currentScene?.name || 'Scene 1'}</span>
                        <svg className="size-5 ml-4 text-gray-500 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 16l-6-6h12z" />
                        </svg>
                      </button>
                    )}

                  </div>

                  {/* Scene Dropdown */}
                  {showSceneDropdown && (
                    <div className="absolute top-full left-0 mt-1 w-full z-50 bg-white/95 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-xl shadow-gray-200/50 max-h-60 overflow-y-auto">
                      <div className="p-1">
                        {/* Current scenes */}
                        {scenes.map((scene) => (
                          <div key={scene.id} className="relative">
                            <button
                              onClick={() => handleSceneSelect(scene.id)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 flex items-center justify-between transition-all duration-200 ease-out transform hover:scale-105 ${scene.id === activeSceneId ? 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30' : 'text-gray-700'
                                }`}
                            >
                              <span className="truncate">{scene.name}</span>
                              {scene.id === activeSceneId && (
                                <span className="text-xs text-white">Active</span>
                              )}
                            </button>
                          </div>
                        ))}

                        {/* Create new scene button */}
                        <div className="border-t border-gray-100/50 mt-1 pt-1">
                          <button
                            onClick={handleCreateScene}
                            className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 rounded-lg flex items-center gap-2 transition-all duration-200 ease-out transform hover:scale-105"
                          >
                            <svg className="w-4 h-4 text-gray-400 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            Create New Scene
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Backdrop to close dropdown */}
                  {showSceneDropdown && (
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSceneDropdown(false)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Project Name and Profile Section */}
          <div className="flex items-center gap-4">
            {/* Zoom Control */}
            <div className="hidden lg:block">
              <div className="grid w-24 max-w-sm grid-cols-1 relative">
                <input
                  name="zoomControl"
                  type="text"
                  value="100%"
                  onChange={() => { }}
                  className="col-start-1 row-start-1 block w-full h-9 rounded-xl py-1.5 pr-3 pl-6 text-sm text-gray-500 font-semibold placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
                <svg className="size-5 absolute right-1 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 16l-6-6h12z" />
                </svg>
              </div>
            </div>

            {/* Project Name */}
            <div className="hidden lg:block">
              <div className="grid w-full max-w-sm grid-cols-1">
                <input
                  name="projectName"
                  type="text"
                  placeholder="Project name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  className="col-start-1 row-start-1 block w-full h-9 rounded-xl py-1.5 pr-3 pl-6 text-sm text-gray-500 font-medium placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Desktop user menu */}
            <div className="hidden lg:flex lg:items-center gap-4">
              {/* Profile dropdown */}
              <Menu as="div" className="relative shrink-0">
                <div>
                  <MenuButton className="group relative flex rounded-full bg-white/95 backdrop-blur-sm text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 border border-gray-200/50 shadow-sm">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <div className="size-8 rounded-full bg-gradient-to-r from-gray-400 to-gray-500 flex items-center justify-center shadow-sm">
                      <span className="text-white font-medium text-sm">U</span>
                    </div>
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-xl bg-white/95 backdrop-blur-sm py-1 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 data-focus:bg-indigo-50 data-focus:outline-hidden transition-all duration-200 ease-out transform hover:scale-105 rounded-lg mx-1"
                    >
                      Your Profile
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-indigo-50 hover:to-purple-50 hover:text-indigo-700 data-focus:bg-indigo-50 data-focus:outline-hidden transition-all duration-200 ease-out transform hover:scale-105 rounded-lg mx-1"
                    >
                      Settings
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700 data-focus:bg-red-50 data-focus:outline-hidden transition-all duration-200 ease-out transform hover:scale-105 rounded-lg mx-1"
                    >
                      Sign out
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>

              <button
                type="button"
                className="group relative inline-flex w-28 h-9 items-center gap-x-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-indigo-500/30 hover:from-indigo-600 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mr-4 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
              >
                <Upload className="size-4 ml-1.5 transition-all duration-200 group-hover:scale-110" />
                <span className="text-sm">Share</span>
              </button>
            </div>
          </div>
        </div>
      </div>



      {/* Mobile menu */}
      <DisclosurePanel className="lg:hidden">
        <div className="space-y-1 pt-2 pb-3">
          <DisclosureButton
            as="a"
            href="/editor"
            className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pr-4 pl-3 text-base font-medium text-indigo-700"
          >
            Editor
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
          >
            Projects
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
          >
            Templates
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="#"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
          >
            Help
          </DisclosureButton>
        </div>

        {/* Mobile editor controls */}
        <div className="border-t border-gray-200 pt-2 pb-2">
          <div className="px-4 space-y-2">
            <div className="text-sm font-medium text-gray-700 mb-2">Editor Tools</div>
            <div className="flex flex-col gap-2">
              <ProjectControls />
              <PathModeIndicator />
              <PanelToggleButtons />
              <SnappingControls />
              <SelectionIndicator
                onGroupElements={onGroupElements}
                onUngroupElements={onUngroupElements}
              />
            </div>
          </div>
        </div>

        {/* Mobile search */}
        <div className="border-t border-gray-200 pt-4 pb-3">
          <div className="px-4">
            <div className="grid w-full grid-cols-1">
              <input
                name="search"
                type="search"
                placeholder="Search projects..."
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                className="col-start-1 row-start-1 block w-full rounded-md bg-white py-2 pr-3 pl-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
              <Search
                aria-hidden="true"
                className="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Mobile user section */}
        <div className="border-t border-gray-200 pt-4 pb-3">
          <div className="flex items-center px-4">
            <div className="shrink-0">
              <div className="size-10 rounded-full bg-gray-300 flex items-center justify-center">
                <span className="text-gray-600 font-medium">U</span>
              </div>
            </div>
            <div className="ml-3">
              <div className="text-base font-medium text-gray-800">Animation Creator</div>
              <div className="text-sm font-medium text-gray-500">creator@example.com</div>
            </div>
            <button
              type="button"
              className="relative ml-auto shrink-0 rounded-full bg-white p-1 text-gray-400 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:outline-hidden"
            >
              <span className="absolute -inset-1.5" />
              <span className="sr-only">View notifications</span>
              <Bell aria-hidden="true" className="size-6" />
            </button>
          </div>
          <div className="mt-3 space-y-1">
            <DisclosureButton
              as="a"
              href="#"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              Your Profile
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="#"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              Settings
            </DisclosureButton>
            <DisclosureButton
              as="a"
              href="#"
              className="block px-4 py-2 text-base font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-800"
            >
              Sign out
            </DisclosureButton>
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}; 