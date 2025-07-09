import React, { useState } from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel, Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react'
import { MagnifyingGlassIcon } from '@heroicons/react/20/solid'
import { Bars3Icon, BellIcon, XMarkIcon } from '@heroicons/react/24/outline'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faArrowUpFromBracket, faCloudArrowUp, faArrowRotateLeft, faArrowRotateRight, faGear, faChevronDown } from '@fortawesome/free-solid-svg-icons'
import { ProjectControls } from './project-controls';
import { PathModeIndicator } from './path-mode-indicator';
import { PanelToggleButtons } from './panel-toggle-buttons';
import { SnappingControls } from './snapping-controls';
import { SelectionIndicator } from './selection-indicator';

// Simplified interface - only for props that can't be accessed via stores
interface MainNavBarProps {
  canvasZoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

export const MainNavBar: React.FC<MainNavBarProps> = ({
  onGroupElements,
  onUngroupElements
}) => {
  const [projectName, setProjectName] = useState('Project Name');

  return (
    <Disclosure as="nav" className="bg-white border-b border-gray-200 shadow-lg">
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-0">
        <div className="flex h-16 justify-between">
          <div className="flex lg:pl-0 lg:pr-0">
            {/* Options menu button */}
            <div className="flex items-center mx-6">
              <DisclosureButton className="group relative inline-flex items-center justify-center rounded-md text-gray-400 hover:bg-gray-100 hover:text-gray-500 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open options menu</span>
                <Bars3Icon aria-hidden="true" className="block size-6 group-data-open:hidden" />
                <XMarkIcon aria-hidden="true" className="hidden size-6 group-data-open:block" />
              </DisclosureButton>
            </div>
            <div className="flex shrink-0 items-center">
              <div className="h-8 w-8 bg-indigo-600 rounded flex items-center justify-center">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="flex items-center ml-8">
                <button className="p-1.5 text-gray-500 hover:text-gray-700 rounded-sm hover:bg-gray-100">
                  <FontAwesomeIcon icon={faCloudArrowUp} className="size-5" />
                </button>
                <button className="ml-4 p-1.5 text-gray-500 hover:text-gray-700 pl-3 border-l border-gray-200 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faArrowRotateLeft} className="size-5" />
                </button>
                <button className="ml-2 p-1.5 text-gray-500 hover:text-gray-700 pr-3 border-r border-gray-200 hover:bg-gray-100">
                  <FontAwesomeIcon icon={faArrowRotateRight} className="size-5" />
                </button>
                <button className="ml-4 p-1.5 text-gray-500 hover:text-gray-700 rounded-sm hover:bg-gray-100">
                  <FontAwesomeIcon icon={faGear} className="size-5" />
                </button>
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
                  onChange={() => {}}
                  className="col-start-1 row-start-1 block w-full h-9 rounded-md bg-white py-1.5 pr-3 pl-6 text-sm text-gray-600 font-medium outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
                <FontAwesomeIcon icon={faChevronDown} className="size-3 absolute right-4 top-1/2 -translate-y-1/2 text-gray-500" />
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
                  className="col-start-1 row-start-1 block w-full h-9 rounded-md bg-white py-1.5 pr-3 pl-6 text-sm text-gray-600 font-medium outline-1 -outline-offset-1 outline-gray-200 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                />
              </div>
            </div>

            {/* Desktop user menu */}
            <div className="hidden lg:flex lg:items-center gap-4">
              {/* Profile dropdown */}
              <Menu as="div" className="relative shrink-0">
                <div>
                  <MenuButton className="relative flex rounded-full bg-white text-sm focus:outline-hidden focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2">
                    <span className="absolute -inset-1.5" />
                    <span className="sr-only">Open user menu</span>
                    <div className="size-8 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm">U</span>
                    </div>
                  </MenuButton>
                </div>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-2 w-48 origin-top-right rounded-md bg-white py-1 shadow-lg ring-1 ring-black/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                    >
                      Your Profile
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                    >
                      Settings
                    </a>
                  </MenuItem>
                  <MenuItem>
                    <a
                      href="#"
                      className="block px-4 py-2 text-sm text-gray-700 data-focus:bg-gray-100 data-focus:outline-hidden"
                    >
                      Sign out
                    </a>
                  </MenuItem>
                </MenuItems>
              </Menu>

              <button
                type="button"
                className="inline-flex w-28 h-9 items-center gap-x-2.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mr-4"
              >
                <FontAwesomeIcon icon={faArrowUpFromBracket} className="size-4 ml-1.5" />
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
              <MagnifyingGlassIcon
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
              <BellIcon aria-hidden="true" className="size-6" />
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