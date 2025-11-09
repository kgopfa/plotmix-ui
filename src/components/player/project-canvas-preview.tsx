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
  const [allScenes, setAllScenes] = useState<any[]>([]);
  const [currentSceneIndex, setCurrentSceneIndex] = useState(0);
  const [isPixiReady, setIsPixiReady] = useState(false);
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

        // Store all scenes for progression
        setAllScenes(mainState.scenes);

        // Load the first scene initially
        const loadScene = (sceneIndex: number) => {
          const scene = mainState.scenes[sceneIndex] as any;
          if (!scene?.sceneCanvas) {
            console.warn(`ProjectCanvasPreview: No sceneCanvas found in scene ${sceneIndex}`);
            return;
          }

          const rawElements = Array.isArray(scene.sceneCanvas.elements) ? scene.sceneCanvas.elements : [];
          const rawGroups = Array.isArray(scene.sceneCanvas.groups) ? scene.sceneCanvas.groups : [];
          const timeline = scene.sceneCanvas.timeline || {};

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
        };

        // Load first scene
        loadScene(0);

        // Set up project store with all scenes for automatic progression
        const { useProjectStore } = await import('@/stores/use-project-store');
        const projectStore = useProjectStore.getState();
        projectStore.setScenes(mainState.scenes, mainState.dimensions || fallbackSize);

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
        const timelineStore = useTimelineStoreV2.getState();
        timelineStore.gsapManager.setCanvasRef({ current: canvasRef });
        
        timelineStore.buildGSAPTimeline();
      }
    }
  }, [elements, groups]);

  // Listen for scene changes from project store
  useEffect(() => {
    const { useProjectStore } = require('@/stores/use-project-store');
    const unsubscribe = useProjectStore.subscribe((state: any) => {
      if (state.currentSceneIndex !== currentSceneIndex && allScenes.length > 0) {
        setCurrentSceneIndex(state.currentSceneIndex);
        
        // Load the new scene data
        const scene = allScenes[state.currentSceneIndex];
        if (scene?.sceneCanvas) {
          const rawElements = Array.isArray(scene.sceneCanvas.elements) ? scene.sceneCanvas.elements : [];
          const rawGroups = Array.isArray(scene.sceneCanvas.groups) ? scene.sceneCanvas.groups : [];
          const timeline = scene.sceneCanvas.timeline || {};

          // Sanitize elements
          const sanitizedElements = rawElements.map((el: unknown) => {
            const element = el as any;
            return {
              animations: Array.isArray(element?.animations) ? element.animations : [],
              fill: typeof element?.fill === 'string' && element.fill ? element.fill : '#000000',
              ...element,
            };
          });

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

          // Update timeline with new scene data
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
        }
      }
    });

    return unsubscribe;
  }, [currentSceneIndex, allScenes]);

  return (
    <FitFullCanvasPlayer
      ref={playerRef}
      designWidth={designSize.width}
      designHeight={designSize.height}
      elements={isPixiReady ? elements : []}
      groups={isPixiReady ? groups : []}
      hideInlineControls
      onAppReady={() => setIsPixiReady(true)}
    />
  );
}
