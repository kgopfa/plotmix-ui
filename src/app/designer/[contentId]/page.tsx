'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import Designer from '@/components/designer';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import type { AnimationState } from '@/types/project';

export default function DesignerPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();

  useEffect(() => {
    const init = async () => {
      if (!contentId) return;
      try {
        const res = await apiClient.get<{ data: { project: { id: string; name: string; title?: string; version: string; mainState?: unknown } } }>(`/api/projects/${contentId}`);
        const project = res.data.project;
        setProjectInfo({
          projectId: project.id,
          name: project.name,
          title: project.title,
          version: project.version,
        });
        
        const mainState = (project.mainState as { elements?: unknown[]; groups?: unknown[]; timeline?: unknown }) || {};
        setBaseline(mainState);
        captureBaseline();

        // Hydrate canvas and timeline stores from mainState
        const canvasStore = useCanvasStore.getState();
        const timelineStore = useTimelineStore.getState();
        const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
        const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];

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

        const timeline = (mainState.timeline as { animationStates?: unknown; scale?: number; duration?: number; currentTime?: number }) || {};
        timelineStore.loadProjectData({
          elements,
          groups,
          animationStates: (timeline.animationStates as Record<string, AnimationState>) || {},
          scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
          duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
          currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
        });
      } catch (e) {
        console.error('Failed to initialize editor project', e);
      }
    };
    init();
  }, [contentId, setProjectInfo, setBaseline, captureBaseline]);

  return (
    <div>
      {/* You can add a header here to show which content is being edited */}
      <div className="absolute top-4 left-4 z-50 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 text-sm text-gray-600">
        Editing: {contentId}
      </div>
      <Designer />
    </div>
  );
} 