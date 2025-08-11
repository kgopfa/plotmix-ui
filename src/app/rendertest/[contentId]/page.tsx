'use client';

import { useEffect } from 'react';
import { useParams } from 'next/navigation';
import ScreenCapture from '@/components/render';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';

export default function RenderPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!contentId) return;
      try {
        const res = await apiClient.get<any>(`/api/projects/${contentId}`);
        const project = res.data.project;
        setProjectInfo({
          projectId: project.id,
          name: project.name,
          title: project.title,
          version: project.version,
        });
        const mainState = (project.mainState as any) || {};
        setBaseline(mainState);
        captureBaseline();

        // Hydrate canvas and timeline stores from mainState
        const canvasStore = useCanvasStore.getState();
        const timelineStore = useTimelineStore.getState();
        const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
        const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];

        // Sanitize to ensure required fields exist
        const sanitizedElements = rawElements.map((el: any) => ({
          animations: Array.isArray(el?.animations) ? el.animations : [],
          fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
          ...el,
        }));
        // Dedupe by id
        const elements = Array.from(
          new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values()
        ) as import('@/types/canvas').AnimatedCanvasObject[];

        const sanitizedGroups = rawGroups.map((g: any) => ({
          animations: Array.isArray(g?.animations) ? g.animations : [],
          elementIds: Array.isArray(g?.elementIds) ? g.elementIds : [],
          ...g,
        }));
        const groups = Array.from(
          new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values()
        ) as import('@/types/canvas').CanvasGroup[];

        canvasStore.setElements(elements);
        canvasStore.setGroups(groups);

        const timeline = mainState.timeline || {};
        timelineStore.loadProjectData({
          elements,
          groups,
          animationStates: timeline.animationStates || {},
          scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
          duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
          currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
        });
      } catch (e) {
        console.error('Failed to initialize editor project', e);
      }
    };

    fetchProjectData();
  }, [contentId, setProjectInfo, setBaseline, captureBaseline]);

  return <ScreenCapture autoplayOnReady recordDurationSec={5} />;
} 