'use client';

import { useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import gsap from 'gsap';

import { useProjectStore } from '@/stores/use-project-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore, useTimelineSync } from '@/stores/use-timeline-store';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import type { ApplicationCanvasRef } from '@/components/render/canvas/application-canvas';
import type { FederatedPointerEvent } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

declare global {
  // Exposed for Puppeteer deterministic rendering
  // eslint-disable-next-line no-var
  var __renderReady__: boolean | undefined;
  // eslint-disable-next-line no-var
  var __renderInfo__: { width: number; height: number; fps: number; duration: number } | undefined;
  // eslint-disable-next-line no-var
  var __seekAndRender__: ((t: number) => void) | undefined;
  // eslint-disable-next-line no-var
  var __renderError__: string | undefined;
}

const ApplicationCanvas = dynamic(
  () => import('@/components/render/canvas/application-canvas').then(m => m.ApplicationCanvas),
  { ssr: false }
);

export default function RenderXPage() {
  const params = useParams<{ projectId: string }>();
  const search = useSearchParams();
  const projectId = params.projectId;

  const fps = Number(search.get('fps') || 30);
  const width = Number(search.get('width') || 1280);
  const height = Number(search.get('height') || 720);
  const debugPlay = search.get('debug') === '1' || search.get('play') === '1';

  const appRef = useRef<ApplicationCanvasRef>(null);
  const shapeRefs = useRef<Record<string, unknown>>({});
  const groupContainers = useRef<Record<string, unknown>>({});
  const mainCanvasContainerRef = useRef<any>(null);
  const canvasScaleFactor = useRef<number>(1);

  const { setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();
  const { setCanvasRef } = useTimelineIntegration();

  // Subscribe to canvas store for re-renders
  const elements = useCanvasStore(s => s.elements);
  const groups = useCanvasStore(s => s.groups);

  // Minimal required no-op handlers with correct types
  const handleCanvasPointerDown = (e: FederatedPointerEvent) => { void e; };
  const handleCanvasPointerMove = (e: FederatedPointerEvent) => { void e; };
  const handlePointerUp = () => {};
  const handleCanvasClick = (e: FederatedPointerEvent) => { void e; };
  

  useEffect(() => {
    // Align the logical design-canvas size to requested render dimensions
    try {
      const ui = useUIStore.getState();
      ui.setCustomCanvasSize(width, height);
    } catch {}

    // Link the PIXI canvas to the GSAP timeline manager so it can find targets
    setCanvasRef(appRef as React.RefObject<TimelineCanvasRef | null>);
  }, [setCanvasRef]);

  // Rebuild GSAP timeline once PIXI refs are likely mounted
  useEffect(() => {
    const raf = () => buildGSAPTimeline();
    const raf2 = () => requestAnimationFrame(raf);
    requestAnimationFrame(raf2);
  }, [elements, groups, buildGSAPTimeline]);

  useEffect(() => {
    (async () => {
      if (!projectId) return;
      try {
        type ProjectDataShape = { id: string; name: string; title?: string; version?: string; mainState?: unknown };
        let project: ProjectDataShape;

        const token = search.get('token');
        if (token) {
          // Token-based render fetch (preferred for headless Puppeteer)
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

        // Hydrate canvas + timeline stores from mainState (rendertest style)
        const canvasStore = useCanvasStore.getState();
        type MainStateLike = { elements?: AnimatedCanvasObject[]; groups?: CanvasGroup[]; timeline?: any };
        const ms = mainState as MainStateLike;
        const rawElements = Array.isArray(ms.elements) ? ms.elements : [];
        const rawGroups = Array.isArray(ms.groups) ? ms.groups : [];

        // Sanitize and dedupe elements
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

        const timeline = ms.timeline || {};
        useTimelineStore.getState().loadProjectData({
          elements: elementsUnique,
          groups: groupsUnique,
          animationStates: timeline.animationStates || {},
          scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
          duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
          currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
        });

        // Build GSAP timeline deterministically (after canvas ref is wired)
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
          // Headless recording mode: sleep GSAP and stop Pixi ticker for manual seeking
          gsap.ticker.sleep();
          pixiApp?.ticker?.stop();
        }

        const duration = useTimelineStore.getState().playback.totalDuration || 5;
        const tl = gsap.globalTimeline;

        // Expose deterministic seek-and-render entry
        globalThis.__seekAndRender__ = (t: number) => {
          try {
            const { gsapManager } = useTimelineStore.getState();
            // Debug: check a sample animated target value before/after
            const animatedIds = elements
              .filter(el => !el.isAnimationPath && (el.animations?.length ?? 0) > 0)
              .map(el => el.id);
            const sampleId = animatedIds[0];
            const before = sampleId ? (shapeRefs.current as Record<string, any>)[sampleId]?.x : undefined;

            if (gsapManager) {
              gsapManager.updateTime(t);
            } else {
              tl.pause(t, false);
            }

            // Also set global timeline time in case some tweens were registered there
            try { tl.pause(t, false); } catch {}

            const after = sampleId ? (shapeRefs.current as Record<string, any>)[sampleId]?.x : undefined;
            // eslint-disable-next-line no-console
            console.log('[renderx] seek', { t, sampleId, before, after });
          } catch (err) {
            // eslint-disable-next-line no-console
            console.warn('[renderx] seek error', err);
          }
          pixiApp?.render?.();
        };

        // Ensure containers are mounted and refs are populated before declaring readiness
        // Wait until all animated targets are present to avoid empty timeline builds
        const hasAnimations = (els: AnimatedCanvasObject[], grps: CanvasGroup[]) =>
          els.some(el => !el.isAnimationPath && (el.animations?.length ?? 0) > 0) ||
          grps.some(g => !g.isDefaultGroup && (g.animations?.length ?? 0) > 0);

        const needTargets = hasAnimations(elements, groups);
        if (!pixiApp || needTargets) {
          const animatedIds = elements
            .filter(el => !el.isAnimationPath && (el.animations?.length ?? 0) > 0)
            .map(el => el.id);
          const animatedGroupIds = groups
            .filter(g => !g.isDefaultGroup && (g.animations?.length ?? 0) > 0)
            .map(g => g.id);

          let tries = 0;
          while (tries < 40) { // up to ~2s
            const shapeMap = shapeRefs.current || {};
            const groupMap = groupContainers.current || {};
            const haveElements = animatedIds.every(id => !!(shapeMap as Record<string, unknown>)[id]);
            const haveGroups = animatedGroupIds.every(id => !!(groupMap as Record<string, unknown>)[id]);
            if (pixiApp && (!needTargets || (haveElements && haveGroups))) break;
            await new Promise(res => setTimeout(res, 50));
            tries += 1;
          }
          // Rebuild after refs are likely populated
          buildGSAPTimeline();
        }

        // Prime initial frame at t=0 to apply starting values
        try {
          const { gsapManager } = useTimelineStore.getState();
          if (gsapManager) {
            gsapManager.updateTime(0);
          } else {
            tl.pause(0, false);
          }
        } catch {}
        pixiApp?.render?.();

        // Ensure viewport centers on the actual design container and fits it
        try {
          const viewport: any = appRef.current?.getViewport();
          const main: any = mainCanvasContainerRef.current;
          if (viewport && main) {
            const screenW = typeof window !== 'undefined' ? window.innerWidth : width;
            const screenH = typeof window !== 'undefined' ? window.innerHeight : height;
            const { canvas: cs } = useUIStore.getState();
            const currentSize = cs.currentSizeId === 'custom'
              ? cs.customSize
              : cs.availableSizes.find((s: any) => s.id === cs.currentSizeId);
            const dWidth = Number(currentSize?.width || 1280);
            const dHeight = Number(currentSize?.height || 720);
            // No padding: make design canvas fill the entire viewport
            const zoom = Math.min(screenW / dWidth, screenH / dHeight);
            // Apply instantly to avoid animation timing issues for crop calculation
            viewport.setZoom(zoom, false);
            viewport.moveCenter(main.x, main.y);
          }
          pixiApp?.render?.();
        } catch {}

        // Expose a global crop rect calculator for server-side screenshot clipping
        try {
          const compute = () => {
            const viewport: any = appRef.current?.getViewport();
            const main: any = mainCanvasContainerRef.current;
            if (!viewport || !main || typeof viewport.toScreen !== 'function') return null;

            const { canvas: cs } = useUIStore.getState();
            const currentSize = cs.currentSizeId === 'custom'
              ? cs.customSize
              : cs.availableSizes.find((s: any) => s.id === cs.currentSizeId);
            const dWidth = Number(currentSize?.width || 1280);
            const dHeight = Number(currentSize?.height || 720);

            const topLeft = viewport.toScreen(main.x - dWidth / 2, main.y - dHeight / 2);
            const bottomRight = viewport.toScreen(main.x + dWidth / 2, main.y + dHeight / 2);

            const xRaw = Math.min(topLeft.x, bottomRight.x);
            const yRaw = Math.min(topLeft.y, bottomRight.y);
            const wRaw = Math.abs(bottomRight.x - topLeft.x);
            const hRaw = Math.abs(bottomRight.y - topLeft.y);

            // Clamp within current window viewport to avoid negative or overflow clipping
            const vw = typeof window !== 'undefined' ? window.innerWidth : width;
            const vh = typeof window !== 'undefined' ? window.innerHeight : height;
            const x = Math.max(0, Math.round(xRaw));
            const y = Math.max(0, Math.round(yRaw));
            const maxW = vw - x;
            const maxH = vh - y;
            const widthPx = Math.max(0, Math.min(Math.round(wRaw), maxW));
            const heightPx = Math.max(0, Math.min(Math.round(hRaw), maxH));

            if (widthPx < 2 || heightPx < 2) return null;
            return { x, y, width: widthPx, height: heightPx };
          };
          // eslint-disable-next-line no-console
          console.log('[renderx] installing __computeCropRect__');
          // @ts-expect-error - attach to global for puppeteer
          globalThis.__computeCropRect__ = compute;
          // Back-compat alias if needed
          // @ts-expect-error - attach to global for puppeteer
          globalThis.__getDesignClip__ = compute;
        } catch {}

        globalThis.__renderInfo__ = { width, height, fps, duration };
        globalThis.__renderReady__ = true;
      } catch (e) {
        console.error('RenderX init failed', e);
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
        shapeRefs={shapeRefs}
        groupContainers={groupContainers}
        mainCanvasContainerRef={mainCanvasContainerRef}
        canvasScaleFactor={canvasScaleFactor}
        // Handlers
        handleCanvasPointerDown={handleCanvasPointerDown}
        handleCanvasPointerMove={handleCanvasPointerMove}
        handlePointerUp={handlePointerUp}
        handleCanvasClick={handleCanvasClick}
        isElementInCustomOrPolygonGroup={() => false}
        shiftKey={false}
        isSnappingEnabled={false}
      />
    </div>
  );
}


