'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import gsap from 'gsap';

import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore, useTimelineSync } from '@/stores/use-timeline-store';
import type { ApplicationCanvasRef } from '@/components/editor/application-canvas';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

declare global {
  // Globals used by the render worker (Puppeteer)
  // eslint-disable-next-line no-var
  var __renderReady__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __renderInfo__: { width: number; height: number; fps: number; duration: number } | undefined;
  // eslint-disable-next-line no-var
  var __seekAndRender__: ((t: number) => void) | undefined;
}

const ApplicationCanvas = dynamic(
  () => import('@/components/editor/application-canvas').then(m => m.ApplicationCanvas),
  { ssr: false }
);

export default function RenderPage() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const projectId = params.projectId;

  const fps = Number(search.get('fps') || 30);
  const width = Number(search.get('width') || 1280);
  const height = Number(search.get('height') || 720);

  const appRef = useRef<ApplicationCanvasRef>(null);
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();

  // Subscribe to canvas store for re-renders
  const elements = useCanvasStore(s => s.elements);
  const groups = useCanvasStore(s => s.groups);

  // Minimal required no-op handlers with correct types
  const handleCanvasPointerDown = (_e: FederatedPointerEvent) => {};
  const handleCanvasPointerMove = (_e: FederatedPointerEvent) => {};
  const handlePointerUp = () => {};
  const handleSelectElement = (_id: string | null, _isMulti?: boolean) => {};
  const handleCanvasClick = (_e: FederatedPointerEvent) => {};
  const handlePointerDown = (_id: string, _x: number, _y: number) => (_e: FederatedPointerEvent) => {};
  const handleElementMouseMove = (_id: string) => (_e: FederatedPointerEvent) => {};
  const handleElementMouseLeave = (_id: string) => () => {};
  const handleGroupSelectionDragStart = (
    _virtualElement: AnimatedCanvasObject,
    _mouseX: number,
    _mouseY: number,
    _allElements?: AnimatedCanvasObject[]
  ) => {};

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      const res = await apiClient.get<{ project: { id: string; name: string; title?: string; version?: string; mainState?: unknown } }>(`/api/projects/${projectId}`);
      const project = res.data.project;

      setProjectInfo({
        projectId: project.id,
        name: project.name,
        title: project.title,
        version: project.version,
      });
      const mainState = (project.mainState as Record<string, unknown>) || {};
      setBaseline(mainState);
      captureBaseline();

      // Hydrate canvas + timeline stores from mainState
      const canvasStore = useCanvasStore.getState();
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      canvasStore.setElements(rawElements);
      canvasStore.setGroups(rawGroups);

      // Build GSAP timeline deterministically
      initializeSubscriptions();
      buildGSAPTimeline();

      // Stop GSAP and Pixi tickers; render on demand
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.fps(fps);
      gsap.ticker.sleep();

      const pixiApp = appRef.current?.getApplication()?.app;
      pixiApp?.ticker?.stop();

      const duration = useTimelineStore.getState().playback.totalDuration || 5;
      const tl = gsap.globalTimeline;

      // Expose hooks for Puppeteer (typed via globalThis)
      globalThis.__seekAndRender__ = (t: number) => {
        tl.pause(t, false);
        pixiApp?.render?.();
      };
      globalThis.__renderInfo__ = { width, height, fps, duration };
      globalThis.__renderReady__ = true;
    })();

    return () => {
      cleanupSubscriptions();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, fps, width, height]);

  return (
    <div style={{ width, height, margin: 0, padding: 0, overflow: 'hidden', background: '#fff' }}>
      <ApplicationCanvas
        ref={appRef}
        dimensions={{ width, height }}
        // Canvas data
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
        // Refs
        shapeRefs={{ current: {} }}
        groupContainers={{ current: {} }}
        mainCanvasContainerRef={{ current: null }}
        drawingRef={{ current: null }}
        canvasScaleFactor={{ current: 1 }}
        // Handlers
        handleCanvasPointerDown={handleCanvasPointerDown}
        handleCanvasPointerMove={handleCanvasPointerMove}
        handlePointerUp={noop}
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


