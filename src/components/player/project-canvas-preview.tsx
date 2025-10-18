'use client';

import React, { useEffect, useState } from 'react';
import { FitFullCanvasPlayer } from './fit-full-canvas-player';
import { apiClient } from '@/lib/api-client';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useTimelineSync, useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';

type Props = { projectId: string; fallbackSize?: { width: number; height: number } };

export function ProjectCanvasPreview({ projectId, fallbackSize = { width: 1920, height: 1080 } }: Props) {
  const [elements, setElements] = useState<AnimatedCanvasObject[]>([]);
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [designSize, setDesignSize] = useState(fallbackSize);
  const { setElements: setTimelineElements, setGroups: setTimelineGroups, updateTracks } = useTimelineStoreV2();
  const { buildGSAPTimeline } = useTimelineSync();

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<any>(`/api/projects/${projectId}`);
        const project = 'data' in res ? res.data.project : res.project;
        const mainState = (project?.mainState as any) || {};
        const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
        const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];

        const sanitized = rawElements.map((el: any) => ({
          ...el,
          animations: Array.isArray(el?.animations) ? el.animations : [],
          fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
        }));
        const uniqElements = Array.from(new Map(sanitized.map((e: any) => [e.id, e])).values()) as AnimatedCanvasObject[];
        const uniqGroups = Array.from(new Map(rawGroups.map((g: any) => [g.id, g])).values()) as CanvasGroup[];
        setElements(uniqElements);
        setGroups(uniqGroups);

        // Also hydrate the timeline store for playback controls
        setTimelineElements(uniqElements);
        setTimelineGroups(uniqGroups);
        updateTracks();
        buildGSAPTimeline();

        const w = mainState?.canvas?.width || mainState?.width || fallbackSize.width;
        const h = mainState?.canvas?.height || mainState?.height || fallbackSize.height;
        setDesignSize({ width: w, height: h });
      } catch (e) {
        // Non-blocking: keep empty state
        // eslint-disable-next-line no-console
        console.warn('ProjectCanvasPreview: failed to load project', e);
      }
    })();
  }, [projectId, fallbackSize.width, fallbackSize.height, setTimelineElements, setTimelineGroups, updateTracks, buildGSAPTimeline]);

  return (
    <FitFullCanvasPlayer
      designWidth={designSize.width}
      designHeight={designSize.height}
      elements={elements}
      groups={groups}
      hideInlineControls
    />
  );
}


