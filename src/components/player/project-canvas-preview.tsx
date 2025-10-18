'use client';

import React, { useEffect, useState, useRef } from 'react';
import { FitFullCanvasPlayer } from './fit-full-canvas-player';
import { apiClient } from '@/lib/api-client';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
import type { FitFullCanvasPlayerRef } from './fit-full-canvas-player';

type Props = { projectId: string; fallbackSize?: { width: number; height: number } };

export function ProjectCanvasPreview({ projectId, fallbackSize = { width: 1920, height: 1080 } }: Props) {
  const [elements, setElements] = useState<AnimatedCanvasObject[]>([]);
  const [groups, setGroups] = useState<CanvasGroup[]>([]);
  const [designSize, setDesignSize] = useState(fallbackSize);
  const playerRef = useRef<FitFullCanvasPlayerRef>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get<any>(`/api/projects/${projectId}`);
        const project = 'data' in res ? res.data.project : res.project;
        const mainState = (project?.mainState as any) || {};
        
        // Load from scenes structure (multi-scene format)
        if (!mainState.scenes || !Array.isArray(mainState.scenes) || mainState.scenes.length === 0) {
          console.warn('ProjectCanvasPreview: No scenes found in project');
          return;
        }

        const defaultScene = mainState.scenes[0] as any;
        if (!defaultScene?.sceneCanvas) {
          console.warn('ProjectCanvasPreview: No sceneCanvas found in default scene');
          return;
        }

        const rawElements = Array.isArray(defaultScene.sceneCanvas.elements) ? defaultScene.sceneCanvas.elements : [];
        const rawGroups = Array.isArray(defaultScene.sceneCanvas.groups) ? defaultScene.sceneCanvas.groups : [];
        const timeline = defaultScene.sceneCanvas.timeline || {};

        // Sanitize to ensure required fields exist (exactly like designer)
        const sanitizedElements = rawElements.map((el: unknown) => {
          const element = el as any;
          return {
            animations: Array.isArray(element?.animations) ? element.animations : [],
            fill: typeof element?.fill === 'string' && element.fill ? element.fill : '#000000',
            ...element,
          };
        });

        // Dedupe by id
        const elements = Array.from(
          new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values()
        ) as AnimatedCanvasObject[];

        const sanitizedGroups = rawGroups.map((g: unknown) => {
          const group = g as any;
          return {
            animations: Array.isArray(group?.animations) ? group.animations : [],
            elementIds: Array.isArray(group?.elementIds) ? group.elementIds : [],
            ...group,
          };
        });
        const groups = Array.from(
          new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values()
        ) as CanvasGroup[];

        setElements(elements);
        setGroups(groups);

        // Load timeline data exactly like designer
        const timelineStore = useTimelineStoreV2.getState();
        timelineStore.loadProjectData({
          elements,
          groups,
          timelineAnimations: Array.isArray(timeline) ? timeline : [],
          animationStates: ((timeline as any)?.animationStates as Record<string, any>) || {},
          scale: typeof (timeline as any)?.scale === 'number' ? (timeline as any).scale : 1,
          duration: typeof (timeline as any)?.duration === 'number' ? (timeline as any).duration : 0,
          currentTime: typeof (timeline as any)?.currentTime === 'number' ? (timeline as any).currentTime : 0,
        });

        const dimensions = (mainState.dimensions as any) || { width: fallbackSize.width, height: fallbackSize.height };
        setDesignSize({ width: dimensions.width, height: dimensions.height });
      } catch (e) {
        // Non-blocking: keep empty state
        // eslint-disable-next-line no-console
        console.warn('ProjectCanvasPreview: failed to load project', e);
      }
    })();
  }, [projectId, fallbackSize.width, fallbackSize.height]);

  // Initialize timeline subscriptions (required for playback to work)
  useEffect(() => {
    const timelineStore = useTimelineStoreV2.getState();
    timelineStore.initializeSubscriptions();
    
    return () => {
      timelineStore.cleanupSubscriptions();
    };
  }, []);

  // Connect canvas refs to timeline manager for animations
  useEffect(() => {
    if (playerRef.current && elements.length > 0) {
      const canvasRef = playerRef.current.getCanvasRef();
      if (canvasRef) {
        console.log('ProjectCanvasPreview: Setting canvas ref for animations', {
          shapeRefs: Object.keys(canvasRef.getShapeRefs()).length,
          groupRefs: Object.keys(canvasRef.getGroupContainers()).length,
          hasMainContainer: !!canvasRef.getMainContainer()
        });
        
        const timelineStore = useTimelineStoreV2.getState();
        timelineStore.gsapManager.setCanvasRef({ current: canvasRef });
        
        // Build the GSAP timeline after setting canvas ref
        console.log('ProjectCanvasPreview: Building GSAP timeline...');
        timelineStore.buildGSAPTimeline();
        console.log('ProjectCanvasPreview: Timeline built with duration:', timelineStore.playback.totalDuration);
      }
    }
  }, [elements, groups]);

  return (
    <FitFullCanvasPlayer
      ref={playerRef}
      designWidth={designSize.width}
      designHeight={designSize.height}
      elements={elements}
      groups={groups}
      hideInlineControls
    />
  );
}


