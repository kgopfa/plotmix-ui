'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import gsap from 'gsap';

import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore, useTimelineSync } from '@/stores/use-timeline-store';
import type { ApplicationCanvasRef } from '../../../components/designer/application-canvas';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

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
  () => import('../../../components/designer/application-canvas').then(m => m.ApplicationCanvas),
  { ssr: false }
);

export default function RenderPage() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const projectId = params.projectId;

  const fps = Number(search.get('fps') || 30);
  const width = Number(search.get('width') || 1280);
  const height = Number(search.get('height') || 720);
  const debugPlay = search.get('debug') === '1' || search.get('play') === '1';

  const appRef = useRef<ApplicationCanvasRef>(null);
  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();

  // Subscribe to canvas store for re-renders
  const elements = useCanvasStore(s => s.elements);
  const groups = useCanvasStore(s => s.groups);

  // Minimal required no-op handlers with correct types
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

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      try {
        type ProjectDataShape = { id: string; name: string; title?: string; version?: string; mainState?: unknown };
        let project: ProjectDataShape;

        const token = search.get('token');
        if (token) {
          // Token-based render fetch (headless Puppeteer)
          const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
          const resp = await fetch(`${apiBase}/api/render/project-data/${projectId}`, {
            headers: { 'x-render-auth': token },
          });
          if (!resp.ok) throw new Error(`Render data fetch failed: ${resp.status}`);
          const json = (await resp.json()) as { project: ProjectDataShape };
          project = json.project;
        } else {
          // Fallback to session-based fetch for interactive browser debug
          const { apiClient } = await import('@/lib/api-client');
          type VariantA = { project: ProjectDataShape };
          type VariantB = { data: { project: ProjectDataShape } };
          const res = await apiClient.get<VariantA | VariantB>(`/api/projects/${projectId}`);
          project = 'project' in res ? res.project : res.data.project;
        }

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
      type MainStateLike = { elements?: AnimatedCanvasObject[]; groups?: CanvasGroup[] };
      const ms = mainState as MainStateLike;
      const rawElements = Array.isArray(ms.elements) ? ms.elements : [];
      const rawGroups = Array.isArray(ms.groups) ? ms.groups : [];

      // Sanitize and dedupe by id to avoid duplicate keys in React/Pixi trees
      const sanitizedElements: AnimatedCanvasObject[] = rawElements.map((el) => ({
        ...el,
        animations: Array.isArray(el?.animations) ? el.animations : [],
        fill: typeof el?.fill === 'string' && el.fill ? el.fill : '#000000',
      }));
      const elementsUnique: AnimatedCanvasObject[] = Array.from(
        new Map(sanitizedElements.map((e) => [e.id as string, e])).values()
      );

      const groupsUnique: CanvasGroup[] = Array.from(
        new Map(rawGroups.map((g) => [g.id as string, g])).values()
      );

      canvasStore.setElements(elementsUnique);
      canvasStore.setGroups(groupsUnique);

      // Build GSAP timeline deterministically
      initializeSubscriptions();
      buildGSAPTimeline();

      // @ts-expect-error - @pixi/react ApplicationRef provides app at runtime
      const pixiApp = appRef.current?.getApplication()?.app;
      // Configure tickers based on debugPlay
      gsap.ticker.lagSmoothing(0);
      gsap.ticker.fps(fps);
      if (debugPlay) {
        // Live preview: wake GSAP, start Pixi ticker, and play timeline
        gsap.ticker.wake();
        pixiApp?.ticker?.start();
        const { play } = useTimelineStore.getState();
        try { play(); } catch {}
      } else {
        // Recording mode: sleep GSAP and stop Pixi ticker for manual seeking
        gsap.ticker.sleep();
        pixiApp?.ticker?.stop();
      }

      const duration = useTimelineStore.getState().playback.totalDuration || 5;
      const tl = gsap.globalTimeline;

      // Expose hooks for Puppeteer (typed via globalThis)
      globalThis.__seekAndRender__ = (t: number) => {
        tl.pause(t, false);
        pixiApp?.render?.();
      };
      globalThis.__renderInfo__ = { width, height, fps, duration };
      globalThis.__renderReady__ = true;
      } catch (e) {
        console.error('Render init failed', e);
        // @ts-expect-error - exposed for Puppeteer error checks
        globalThis.__renderError__ = String(e instanceof Error ? e.message : e);
      }
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


