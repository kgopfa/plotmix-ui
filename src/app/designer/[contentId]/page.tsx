'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Designer from '@/components/designer';
import { WebGLSupportChecker } from '@/components/shared/webgl-support-checker';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useSnappingPersistence } from '@/hooks/use-snapping-persistence';
import type { AnimationState } from '@/types/project';

export default function DesignerPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { loadSnappingPreferences } = useSnappingPersistence();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    if (!contentId) return;
    setIsLoading(true);
    setError(null);

    // Clear any stale canvas/timeline/UI state immediately to avoid flash of previous project
    try {
      useCanvasStore.getState().clearCanvas();
      useTimelineStore.getState().resetTimeline();
      
      // Reset UI state to close any open tabs/panels from previous project
      const uiStore = useUIStore.getState();
      uiStore.setActiveRightPanel(null);
      uiStore.setActiveNav(null);
      uiStore.setHoverRightPanel(null);
      uiStore.setInteractedNav(null);
      useTimelineStore.getState().clearSelection(); // Clear timeline selection
      
      // Reset tool state to default
      uiStore.setActiveTool('select');
      uiStore.setMaskPos(null);
      uiStore.setLineStartPoint(null);
      uiStore.setLineChaining(false);
      uiStore.clearChainedLineIds();
      uiStore.setClosingShape(false);
      uiStore.setAnimationTarget(null);
      
      // Reset canvas zoom to default
      uiStore.setCanvasZoom(1);
    } catch {}

    try {
      const res = await apiClient.get<{ data: { project: { id: string; name: string; title?: string; version: string; mainState?: unknown; configuration?: unknown } } }>(`/api/projects/${contentId}`);
      const project = res.data.project;
      setProjectInfo({
        projectId: project.id,
        name: project.name,
        title: project.title,
        version: project.version,
      });
      
      // Load snapping preferences from project configuration
      if (project.configuration) {
        loadSnappingPreferences(project.configuration as Record<string, unknown>);
      }
      
      const mainState = (project.mainState as { 
        elements?: unknown[]; 
        groups?: unknown[]; 
        timeline?: unknown; 
      }) || {};
      setBaseline(mainState);

      // Hydrate canvas and timeline stores from mainState
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();
      
      // Single-scene format: mainState: {elements, groups, timeline}
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      const timeline = mainState.timeline || {};

      // Sanitize to ensure required fields exist
      const sanitizedElements = rawElements.map((el: unknown) => ({
        animations: Array.isArray((el as any)?.animations) ? (el as any).animations : [],
        fill: typeof (el as any)?.fill === 'string' && (el as any).fill ? (el as any).fill : '#000000',
        ...(el as any),
      }));
      // Dedupe by id
      const elements = Array.from(
        new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values()
      ) as import('@/types/canvas').AnimatedCanvasObject[];

      const sanitizedGroups = rawGroups.map((g: unknown) => ({
        animations: Array.isArray((g as any)?.animations) ? (g as any).animations : [],
        elementIds: Array.isArray((g as any)?.elementIds) ? (g as any).elementIds : [],
        ...(g as any),
      }));
      const groups = Array.from(
        new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values()
      ) as import('@/types/canvas').CanvasGroup[];

      canvasStore.setElements(elements);
      canvasStore.setGroups(groups);

      timelineStore.loadProjectData({
        elements,
        groups,
        animationStates: ((timeline as any)?.animationStates as Record<string, AnimationState>) || {},
        scale: typeof (timeline as any)?.scale === 'number' ? (timeline as any).scale : 1,
        duration: typeof (timeline as any)?.duration === 'number' ? (timeline as any).duration : 10,
        currentTime: typeof (timeline as any)?.currentTime === 'number' ? (timeline as any).currentTime : 0,
      });
      // Capture baseline after stores are hydrated
      captureBaseline();

      setIsLoading(false);
    } catch (e) {
      console.error('Failed to initialize editor project', e);
      setError('Failed to load project');
      setIsLoading(false);
    }
  }, [contentId, setProjectInfo, setBaseline, captureBaseline]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <div className="min-h-screen w-screen">
      {isLoading ? (
        <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      ) : error ? (
        <div className="h-screen w-screen flex flex-col items-center justify-center gap-4 bg-slate-100">
          <div className="text-red-600 font-medium">{error}</div>
          <button
            onClick={initialize}
            className="px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      ) : (
        <WebGLSupportChecker
          onWebGLNotSupported={() => {
            console.warn('WebGL not supported, user will see fallback UI');
          }}
          onWebGLSupported={() => {
            console.log('WebGL supported, proceeding with PIXI.js');
          }}
        >
          <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600">
            Editing: {contentId}
          </div>
          <Designer />
        </WebGLSupportChecker>
      )}
    </div>
  );
} 