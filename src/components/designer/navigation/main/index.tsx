import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Disclosure,
  DisclosureButton,
  DisclosurePanel,
} from '@headlessui/react'
import {
  Menu as MenuIcon,
  X,
  Upload,
  Redo2,
  Search,
  Undo2,
  CloudCheck,
  Home,
  Sparkles,
  FileText,
  ListVideo,
  MessagesSquare,
  Boxes
} from 'lucide-react'
import { ProjectControls } from './project-controls';
import { PathModeIndicator } from './path-mode-indicator';
import { PanelToggleButtons } from './panel-toggle-buttons';
import { SnappingControls } from './settings/snapping/snapping-controls';
import { SelectionIndicator } from './selection-indicator';
import { SettingsDropdown } from './settings';
import { UserAvatar } from './user-avatar';
import { useProjectStore } from '@/stores/use-project-store';
import { DiffPatcher } from 'jsondiffpatch';
import { apiClient } from '@/lib/api-client';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';

// Simplified interface - only for props that can't be accessed via stores
interface MainNavBarProps {
  canvasZoom?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onResetZoom?: () => void;
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

export const MainNavBar: React.FC<MainNavBarProps> = ({
  onGroupElements,
  onUngroupElements
}) => {
  const [projectName, setProjectName] = useState('Project Name');
  const { projectId, name, title, saveStatus, getDiffFromBaseline, captureBaseline, setProjectInfo, setSaveStatus } = useProjectStore();

  useEffect(() => {
    if (name) setProjectName(name);
  }, [name]);

  const handleSave = async () => {
    if (!projectId) return;
    try {
      setSaveStatus('saving');

      // Persist configuration and optional metadata (name/title)
      const hasMetaChange = projectName !== name;
      const ui = useUIStore.getState();
      const configuration = { canvas: ui.canvas };
      if (hasMetaChange) {
        const res = await apiClient.put<any>(`/api/projects/${projectId}`, { name: projectName, title, configuration });
        setProjectInfo({ name: res.data.project.name, version: res.data.project.version, title: res.data.project.title });
      } else {
        await apiClient.put<any>(`/api/projects/${projectId}`, { configuration });
      }

      // Delegate persistence of mainState to store's robust method
      await useProjectStore.getState().persistIfDirty('User edits');

      setSaveStatus('success');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (e) {
      console.error('Save failed', e);
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }
  };

  const handleUndo = async () => {
    if (!projectId) return;
    try {
      // Ensure any in-memory edits are flushed as a change so undo has something to revert
      await useProjectStore
        .getState()
        .persistIfDirty('Pre-undo autosave')
        .catch((e) => {
          // eslint-disable-next-line no-console
          console.warn('Pre-undo autosave failed (continuing with undo):', e);
        });

      await apiClient.post<any>(`/api/projects/${projectId}/undo`);
      const refreshed = await apiClient.get<any>(`/api/projects/${projectId}`);
      const project = refreshed.data.project;
      setProjectInfo({ version: project.version, name: project.name, title: project.title });
      // Hydrate canvas and timeline from returned mainState
      const mainState = (project.mainState as any) || {};
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      const sanitizedElements = rawElements.map((el: any) => ({
        animations: Array.isArray(el?.animations) ? el.animations : [],
        fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
        ...el,
      }));
      const elements = Array.from(new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values());
      const sanitizedGroups = rawGroups.map((g: any) => ({
        animations: Array.isArray(g?.animations) ? g.animations : [],
        elementIds: Array.isArray(g?.elementIds) ? g.elementIds : [],
        ...g,
      }));
      const groups = Array.from(new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values());
      canvasStore.setElements(elements as any);
      canvasStore.setGroups(groups as any);
      const timeline = mainState.timeline || {};
      timelineStore.loadProjectData({
        elements: elements as any,
        groups: groups as any,
        animationStates: timeline.animationStates || {},
        scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
        duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
        currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
      });
      // Update baseline
      captureBaseline();
    } catch (e) {
      console.error('Undo failed', e);
    }
  };

  const handleRedo = async () => {
    if (!projectId) return;
    try {
      await apiClient.post<any>(`/api/projects/${projectId}/redo`);
      const refreshed = await apiClient.get<any>(`/api/projects/${projectId}`);
      const project = refreshed.data.project;
      setProjectInfo({ version: project.version, name: project.name, title: project.title });
      // Hydrate canvas and timeline from returned mainState
      const mainState = (project.mainState as any) || {};
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      const sanitizedElements = rawElements.map((el: any) => ({
        animations: Array.isArray(el?.animations) ? el.animations : [],
        fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
        ...el,
      }));
      const elements = Array.from(new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values());
      const sanitizedGroups = rawGroups.map((g: any) => ({
        animations: Array.isArray(g?.animations) ? g.animations : [],
        elementIds: Array.isArray(g?.elementIds) ? g.elementIds : [],
        ...g,
      }));
      const groups = Array.from(new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values());
      canvasStore.setElements(elements as any);
      canvasStore.setGroups(groups as any);
      const timeline = mainState.timeline || {};
      timelineStore.loadProjectData({
        elements: elements as any,
        groups: groups as any,
        animationStates: timeline.animationStates || {},
        scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
        duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
        currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
      });
      // Update baseline
      captureBaseline();
    } catch (e) {
      console.error('Redo failed', e);
    }
  };

  return (
    <Disclosure as="nav" className="bg-gradient-to-r from-slate-50 to-gray-50 backdrop-blur-sm border-b border-gray-200/50 shadow-sm shadow-gray-200/50">
      <div className="mx-auto max-w-full px-2 sm:px-4 lg:px-0">
        <div className="flex h-16 justify-between">
          <div className="flex lg:pl-0 lg:pr-0">
            {/* Options menu button */}
            <div className="relative flex items-center mx-6">
              <DisclosureButton className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 hover:text-gray-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden focus:ring-inset">
                <span className="absolute -inset-0.5" />
                <span className="sr-only">Open options menu</span>
                <MenuIcon aria-hidden="true" className="block size-5 group-data-open:hidden transition-all duration-200 group-hover:scale-110" />
                <X aria-hidden="true" className="hidden size-5 group-data-open:block transition-all duration-200 group-hover:scale-110" />
              </DisclosureButton>
              {/* Desktop options menu */}
              <DisclosurePanel className="absolute left-0 top-12 z-50 hidden lg:block">
                <div className="w-56 rounded-xl bg-white shadow-lg ring-1 ring-black/5 p-4">
                  <Link
                    href="/"
                    className="flex items-center gap-3 p-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Home className="size-4 text-indigo-500" />
                    <span className="font-medium text-gray-500">Home</span>
                  </Link>
                  <Link
                    href="/chats"
                    className="flex items-center gap-3 p-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <MessagesSquare className="size-4 text-green-500" />
                    <span className="font-medium text-gray-500">Chats</span>
                  </Link>
                  <Link
                    href="/projects"
                    className="flex items-center gap-3 p-3 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
                  >
                    <Boxes strokeWidth={1.5} className="size-4 text-blue-500" />
                    <span className="font-medium text-gray-500">Projects</span>
                  </Link>
                </div>
              </DisclosurePanel>
            </div>
            <div className="flex shrink-0 items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">R</span>
              </div>
              <div className="flex items-center ml-8">
                <button onClick={handleSave} className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <CloudCheck className={`size-5 transition-all duration-200 group-hover:scale-110 ${saveStatus === 'success' ? 'text-green-600' : ''}`} />
                </button>
                <button onClick={handleUndo} className="ml-4 group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <Undo2 className="size-5 transition-all duration-200 group-hover:scale-110" />
                </button>
                <button onClick={handleRedo} className="ml-4 group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95">
                  <Redo2 className="size-5 transition-all duration-200 group-hover:scale-110" />
                </button>

                {/* Settings dropdown */}
                <SettingsDropdown />

                {/* Project Name */}
                <div className="relative ml-6">
                  <div className="grid w-48 max-w-sm grid-cols-1">
                    <input
                      name="projectName"
                      type="text"
                      placeholder="Project name"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      className="col-start-1 row-start-1 block w-full h-9 rounded-md px-3 py-1.5 border-2 border-gray-300 text-sm text-gray-500 font-semibold placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Project Name and Profile Section */}
          <div className="flex items-center gap-4">
            {/* Desktop user menu */}
            <div className="hidden lg:flex lg:items-center gap-4">
              {/* Profile dropdown */}
              <UserAvatar showDropdown={true} />

              <button
                type="button"
                className="group relative inline-flex w-28 h-9 items-center gap-x-2.5 rounded-md bg-gradient-to-r from-purple-500 to-purple-600 px-3 py-2 text-sm font-semibold text-white shadow-sm shadow-purple-500/30 hover:from-purple-600 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-purple-600 mr-4 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
              >
                <Upload className="size-4 ml-1.5 transition-all duration-200 group-hover:scale-110 drop-shadow-sm" />
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
            href="/"
            className="block border-l-4 border-indigo-500 bg-indigo-50 py-2 pr-4 pl-3 text-base font-medium text-indigo-700"
          >
            Home
          </DisclosureButton>
          <DisclosureButton
            as="a"
            href="/chat"
            className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
          >
            Generate
          </DisclosureButton>
          {projectId && (
            <DisclosureButton
              as="a"
              href={`/content/${projectId}`}
              className="block border-l-4 border-transparent py-2 pr-4 pl-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800"
            >
              Project
            </DisclosureButton>
          )}
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
          <div className="px-4">
            <UserAvatar showDropdown={true} />
          </div>
        </div>
      </DisclosurePanel>
    </Disclosure>
  );
}; 