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
  Undo2,
  CloudCheck,
  Home,
  MessagesSquare,
  Boxes,
} from 'lucide-react';
import { SettingsDropdown } from './settings';
import { UserAvatar } from './user-avatar';
import { useProjectStore } from '@/stores/use-project-store';
import { apiClient } from '@/lib/api-client';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
import { useUIStore } from '@/stores/use-ui-store';

// Simplified interface - only for props that can't be accessed via stores
interface MainNavBarProps {
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

export const MainNavBar: React.FC<MainNavBarProps> = () => {
  const [projectName, setProjectName] = useState('Project Name');
  const { projectId, name, title, saveStatus, captureBaseline, setProjectInfo, setSaveStatus } = useProjectStore();

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
      const timelineStore = useTimelineStoreV2.getState();
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
        timelineAnimations: Array.isArray(timeline) ? timeline : [],
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
      const timelineStore = useTimelineStoreV2.getState();
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
        timelineAnimations: Array.isArray(timeline) ? timeline : [], // Load timeline animations array
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
                <div className="w-44 rounded-xl bg-white/95 backdrop-blur-sm px-4 py-6 text-sm font-semibold text-gray-700 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50">
                  <Link
                    href="/"
                    className="group flex items-center gap-x-3 px-2 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <Home className="size-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" />
                    Home
                  </Link>
                  <Link
                    href="/chats"
                    className="group flex items-center gap-x-3 px-2 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <MessagesSquare strokeWidth={2.3} className="size-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" />
                    Chats
                  </Link>
                  <Link
                    href="/projects"
                    className="group flex items-center gap-x-3 px-2 py-3 rounded-lg transition-colors duration-200 hover:bg-gray-50 hover:text-indigo-600"
                  >
                    <Boxes strokeWidth={1.5} className="size-4 text-gray-600 group-hover:text-indigo-600 transition-colors duration-200" />
                    Projects
                  </Link>
                </div>
              </DisclosurePanel>
            </div>
            <div className="flex shrink-0 items-center">
              <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <span className="text-white font-bold text-sm">P</span>
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
                      className="col-start-1 row-start-1 block w-full h-9 rounded-md px-3 py-1.5 border border-gray-300 text-sm text-gray-600 font-medium placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-500"
                    />
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* Project Name and Profile Section */}
          <div className="flex items-center gap-4">
            {/* Desktop user menu */}
            <div className="hidden lg:flex lg:items-center gap-x-5 mr-5">

              {/* Share */}
              <button
                type="button"
                className="group relative inline-flex w-28 h-9 items-center gap-x-2.5 rounded-lg bg-purple-600 opacity-90 px-3 py-2 text-sm font-semibold text-white hover:from-indigo-600 hover:to-purple-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
              >
                <Upload className="size-4 ml-1.5 transition-all duration-200 group-hover:scale-110 drop-shadow-sm" />
                <span className="text-sm">Share</span>
              </button>

              {/* Profile dropdown */}
              <UserAvatar showDropdown={true} />
            </div>
          </div>
        </div>
      </div>
    </Disclosure>
  );
}; 