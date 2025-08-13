'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import gsap from 'gsap';
import type { ApplicationCanvasRef } from '@/components/designer/application-canvas';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useProjectStore } from '@/stores/use-project-store';
import { useTimelineStore, useTimelineSync } from '@/stores/use-timeline-store';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { apiClient } from '@/lib/api-client';

const ApplicationCanvas = dynamic(
  () => import('@/components/designer/application-canvas').then(m => m.ApplicationCanvas),
  { ssr: false }
);

type Props = {
  projectId: string;
  autoplay?: boolean;
};

export function SimpleRenderEmbed({ projectId, autoplay = true }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>({ width: 1920, height: 1080 });

  const appRef = useRef<ApplicationCanvasRef>(null);
  const shapeRefs = useRef<Record<string, unknown>>({});
  const groupContainers = useRef<Record<string, unknown>>({});
  const mainCanvasContainerRef = useRef<any>(null);
  const drawingRef = useRef<any>(null);
  const canvasScaleFactor = useRef<number>(1);

  const elements = useCanvasStore(s => s.elements);
  const groups = useCanvasStore(s => s.groups);

  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();
  const { setCanvasRef } = useTimelineIntegration();

  // No-op handlers required by ApplicationCanvas
  const handleCanvasPointerDown = (e: FederatedPointerEvent) => { void e; };
  const handleCanvasPointerMove = (e: FederatedPointerEvent) => { void e; };
  const handlePointerUp = () => {};
  const handleSelectElement = (id: string | null, isMulti?: boolean) => { void id; void isMulti; };
  const handleCanvasClick = (e: FederatedPointerEvent) => { void e; };
  const handlePointerDown = (id: string, x: number, y: number) => (e: FederatedPointerEvent) => { void id; void x; void y; void e; };
  const handleElementMouseMove = (id: string) => (e: FederatedPointerEvent) => { void id; void e; };
  const handleElementMouseLeave = (id: string) => () => { void id; };
  const handleGroupSelectionDragStart = (
    virtualElement: AnimatedCanvasObject,
    mouseX: number,
    mouseY: number,
    allElements?: AnimatedCanvasObject[]
  ) => { void virtualElement; void mouseX; void mouseY; void allElements; };

  // Wire PIXI canvas to timeline manager
  useEffect(() => {
    setCanvasRef(appRef as React.RefObject<TimelineCanvasRef | null>);
  }, [setCanvasRef]);

  // Measure the container (aspect-video box)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
      // small defer to allow viewport to mount
      requestAnimationFrame(() => {
        try {
          appRef.current?.centerOnDesign();
          appRef.current?.zoomToFit();
        } catch {}
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Fetch and hydrate
  useEffect(() => {
    (async () => {
      if (!projectId) return;
      type ProjectDataShape = { id: string; name: string; title?: string; version?: string; mainState?: unknown };
      let project: ProjectDataShape;
      try {
        const res = await apiClient.get<{ data: { project: ProjectDataShape } } | { project: ProjectDataShape }>(`/api/projects/${projectId}`);
        project = 'project' in res ? (res as any).project : (res as any).data.project;
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Canvas embed failed to load project', e);
        return;
      }

      setProjectInfo({ projectId: project.id, name: project.name, title: project.title, version: project.version });
      const mainState = (project.mainState as Record<string, unknown>) || {};
      setBaseline(mainState);
      captureBaseline();

      const canvasStore = useCanvasStore.getState();
      type MainStateLike = { elements?: AnimatedCanvasObject[]; groups?: CanvasGroup[] };
      const ms = mainState as MainStateLike;
      const rawElements = Array.isArray(ms.elements) ? ms.elements : [];
      const rawGroups = Array.isArray(ms.groups) ? ms.groups : [];

      const sanitizedElements: AnimatedCanvasObject[] = rawElements.map((el: any) => ({
        ...el,
        animations: Array.isArray(el?.animations) ? el.animations : [],
        fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
      }));
      const elementsUnique: AnimatedCanvasObject[] = Array.from(new Map(sanitizedElements.map((e) => [e.id as string, e])).values());
      const groupsUnique: CanvasGroup[] = Array.from(new Map(rawGroups.map((g) => [g.id as string, g])).values());

      canvasStore.setElements(elementsUnique);
      canvasStore.setGroups(groupsUnique);

      initializeSubscriptions();
      buildGSAPTimeline();

      // Configure tickers
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.fps(30);
      // Start for preview
      if (autoplay) {
        gsap.ticker.wake();
        // @ts-expect-error runtime app
        const pixiApp = appRef.current?.getApplication()?.app;
        pixiApp?.ticker?.start();
        const { play } = useTimelineStore.getState();
        try { play(); } catch {}
      }
    })();

    return () => {
      cleanupSubscriptions();
    };
  }, [projectId, autoplay, setProjectInfo, setBaseline, captureBaseline, initializeSubscriptions, buildGSAPTimeline, cleanupSubscriptions]);

  return (
    <div ref={containerRef} className="absolute inset-0">
      <ApplicationCanvas
        ref={appRef}
        dimensions={size}
        elements={elements}
        groups={groups}
        selectedIds={[]}
        hoveredId={null}
        editingTextId={null}
        tool="select"
        isPathMode={false}
        animationTarget={null}
        lineStartPoint={null}
        isLineChaining={false}
        chainedLineIds={[]}
        mousePos={null}
        currentPath={[]}
        isDrawing={false}
        shapeRefs={shapeRefs}
        groupContainers={groupContainers}
        mainCanvasContainerRef={mainCanvasContainerRef}
        drawingRef={drawingRef}
        canvasScaleFactor={canvasScaleFactor}
        handleCanvasPointerDown={handleCanvasPointerDown}
        handleCanvasPointerMove={handleCanvasPointerMove}
        handlePointerUp={handlePointerUp}
        handleSelectElement={handleSelectElement}
        handleCanvasClick={handleCanvasClick}
        handlePointerDown={handlePointerDown}
        handleElementMouseMove={handleElementMouseMove}
        handleElementMouseLeave={handleElementMouseLeave}
        onPathStartClick={undefined}
        handleGroupSelectionDragStart={handleGroupSelectionDragStart}
        isElementInCustomOrPolygonGroup={() => false}
        onSnapElement={undefined}
        onSnapPoint={undefined}
        onSetSnapGuides={undefined}
        onClearSnapGuides={undefined}
        onEmptyAreaClick={undefined}
        onElementContextMenu={undefined}
        onGroupContextMenu={undefined}
        shiftKey={false}
        isSnappingEnabled={false}
      />
    </div>
  );
}


