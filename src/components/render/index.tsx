// app/layout.tsx or pages/index.tsx depending on routing
'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { TimelineManagerV2 } from '@/lib/timeline-manager-v2';
import { useCanvasElements, useCanvasGroups, useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineSync } from '@/stores/use-timeline-store-v2';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
import { GSAPTimelineManagerV2 } from '@/lib/gsap-timeline-manager-v2';
import { Container } from 'pixi.js';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager-v2';
import { AnimatedCanvasObject } from '@/types/canvas';
import dynamic from 'next/dynamic';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useCanvasState } from '@/stores/use-ui-store';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { usePanelResize } from '@/hooks/use-panel-resize';
import type { ApplicationCanvasRef } from './canvas/application-canvas';

const ApplicationCanvas = dynamic(() => import('./canvas/application-canvas').then(m => m.ApplicationCanvas), { ssr: false });

type DesignerProps = { autoplayOnReady?: boolean; recordDurationSec?: number };

export default function ScreenCapture({ autoplayOnReady = false, recordDurationSec }: DesignerProps) {
  // Use canvas store instead of local state
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();

  // Timeline integration is handled by useTimelineIntegration hook
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();

  const fullscreenCanvasRef = useRef<ApplicationCanvasRef | null>(null);

  // Timeline store integration
  const {
    setCanvasRef: setTimelineCanvasRef,
  } = useTimelineIntegration();

  // Timeline store V2 for animations
  const { timelineAnimations } = useTimelineStoreV2();

  // Canvas zoom state - will be implemented with pixi-viewport
  const [canvasZoom, setCanvasZoom] = useState(1);

  // Canvas container ref for wheel event handling
  const canvasContainerRef = useRef<HTMLDivElement>(null);
  // Refs for canvas operations
  const shapeRefs = useRef<Record<string, unknown>>({});
  const groupContainers = useRef<Record<string, unknown>>({});
  const mainCanvasContainerRef = useRef<Container | null>(null);
  const canvasScaleFactor = useRef<number>(1);

  // Create a canvas ref that provides the shape refs to the timeline manager
  const canvasRefForTimeline = useRef<TimelineCanvasRef>({
    getShapeRefs: () => shapeRefs.current as Record<string, Container>,
    getGroupContainers: () => groupContainers.current as Record<string, Container>,
    getMainContainer: () => mainCanvasContainerRef.current
  });

  // Set up the canvas ref for the timeline manager
  useEffect(() => {
    setTimelineCanvasRef({ current: canvasRefForTimeline.current });
  }, [setTimelineCanvasRef]);

  // Set up the canvas ref for the canvas store
  const { setCanvasRef } = useCanvasStore();
  useEffect(() => {
    setCanvasRef(fullscreenCanvasRef);
  }, [setCanvasRef]);

  // Panel resize handlers
  const { handleMouseDown } = usePanelResize();
  const gsapManager = useMemo(() => new GSAPTimelineManagerV2(), []);

  // Memoize the timeline manager instance
  const timelineManager = useMemo(() => TimelineManagerV2.getInstance(), []);

  // Use the canvas dimensions hook
  const { dimensions } = useCanvasDimensions();
  // Determine the logical design canvas size
  const uiCanvasState = useCanvasState();
  const uiCurrentSize = uiCanvasState.currentSizeId === 'custom'
    ? uiCanvasState.customSize
    : uiCanvasState.availableSizes.find(size => size.id === uiCanvasState.currentSizeId);
  const designWidth = uiCurrentSize?.width || 1920;
  const designHeight = uiCurrentSize?.height || 1080;

  // Initialize timeline subscriptions on mount
  useEffect(() => {
    initializeSubscriptions();
    return () => {
      cleanupSubscriptions();
    };
  }, [initializeSubscriptions, cleanupSubscriptions]);

  // Enhanced keyboard shortcuts hook will be called after handlers are defined

  useEffect(() => {
    // Cleanup on unmount
    return () => {
      gsapManager.clearTimeline();
    };
  }, [gsapManager, setTimelineCanvasRef, fullscreenCanvasRef]);

  useEffect(() => {
    if (dimensions.width > 0 && canvasObjects.length > 0 && gsapManager) {
      // Small delay to ensure canvas refs are ready
      setTimeout(() => {
        buildGSAPTimeline();
      }, 10);
    }
  }, [canvasObjects, groups, dimensions, buildGSAPTimeline, gsapManager]);

  // Autoplay when PIXI shape refs for animated elements are mounted
  useEffect(() => {
    if (!autoplayOnReady) return;

    let cancelled = false;
    let rafId = 0 as number | 0;
    let started = false;
    let mediaRecorder: MediaRecorder | null = null;
    const chunks: BlobPart[] = [];
    let stopTimer: number | null = null;
    let retryTimer: number | null = null;
    let recordRetryCount = 0;

    const areTargetsReady = () => {
      const refs = shapeRefs.current as Record<string, Container>;
      // Get animated element IDs from timeline
      const animatedIds = timelineAnimations
        .filter(anim => anim.target.type === 'element')
        .map(anim => anim.target.id);
      if (animatedIds.length === 0) return false;
      return animatedIds.every(id => {
        const target = refs[id];
        return !!(target && !target.destroyed && target.parent);
      });
    };

    const startRecordingIfRequested = () => {
      if (!recordDurationSec || recordDurationSec <= 0) return;
      try {
        // Try to get canvas from PIXI, then fall back to DOM query within our container
        // @ts-expect-error runtime app access
        const pixiApp = fullscreenCanvasRef.current?.getApplication()?.app;
        let canvas = pixiApp?.view as HTMLCanvasElement | undefined;
        if (!canvas) {
          const node = canvasContainerRef.current;
          const domCanvas = node?.querySelector('canvas') as HTMLCanvasElement | null;
          if (domCanvas) canvas = domCanvas;
        }
        if (!canvas) {
          if (recordRetryCount < 20) {
            recordRetryCount += 1;
            console.warn('[capture] canvas not available; retrying...', { attempt: recordRetryCount });
            retryTimer = window.setTimeout(startRecordingIfRequested, 100);
          } else {
            console.warn('[capture] pixi canvas not available; giving up on recording');
          }
          return;
        }
        if (typeof canvas.captureStream !== 'function') {
          console.warn('[capture] canvas.captureStream is not supported in this browser');
          return;
        }
        // Attempt to crop to the design canvas only via viewport + main container
        const viewport = fullscreenCanvasRef.current?.getViewport();
        const mainContainer = fullscreenCanvasRef.current?.getMainContainer();
        // @ts-expect-error runtime app access
        const appAny = fullscreenCanvasRef.current?.getApplication()?.app;
        const resolution = (appAny?.renderer?.resolution as number | undefined) ?? (window.devicePixelRatio || 1);

        let recordingCanvas: HTMLCanvasElement | null = null;
        let recordingStream: MediaStream | null = null;
        let copyRaf: number | null = null;

        if (viewport && mainContainer && typeof (viewport as any).toScreen === 'function') {
          try {
            const topLeftWorld = {
              x: mainContainer.x - designWidth / 2,
              y: mainContainer.y - designHeight / 2,
            };
            const bottomRightWorld = {
              x: mainContainer.x + designWidth / 2,
              y: mainContainer.y + designHeight / 2,
            };
            const tl = (viewport as any).toScreen(topLeftWorld.x, topLeftWorld.y);
            const br = (viewport as any).toScreen(bottomRightWorld.x, bottomRightWorld.y);
            let sx = Math.round(Math.min(tl.x, br.x) * resolution);
            let sy = Math.round(Math.min(tl.y, br.y) * resolution);
            let sw = Math.round(Math.abs(br.x - tl.x) * resolution);
            let sh = Math.round(Math.abs(br.y - tl.y) * resolution);

            // Clamp to source canvas bounds
            const maxSw = canvas.width - sx;
            const maxSh = canvas.height - sy;
            if (sw > 0 && sh > 0 && maxSw > 0 && maxSh > 0) {
              sw = Math.min(sw, maxSw);
              sh = Math.min(sh, maxSh);

              const off = document.createElement('canvas');
              off.width = Math.round(designWidth);
              off.height = Math.round(designHeight);
              const ctx = off.getContext('2d');
              if (ctx) ctx.imageSmoothingEnabled = false;

              const copyFrame = () => {
                if (!ctx) return;
                ctx.clearRect(0, 0, off.width, off.height);
                ctx.drawImage(canvas, sx, sy, sw, sh, 0, 0, off.width, off.height);
                copyRaf = requestAnimationFrame(copyFrame);
              };
              copyRaf = requestAnimationFrame(copyFrame);

              recordingCanvas = off;
              recordingStream = off.captureStream(30);
            } else {
              console.warn('[capture] invalid crop rect; falling back to full canvas', { sx, sy, sw, sh, cw: canvas.width, ch: canvas.height });
            }
          } catch (err) {
            console.warn('[capture] crop calculation failed; falling back to full canvas', err);
          }
        }

        // Fallback to full canvas capture
        if (!recordingStream) {
          const fps = 30;
          recordingCanvas = canvas;
          recordingStream = canvas.captureStream(fps);
        }
        const mimeTypeCandidates = [
          'video/webm;codecs=vp9',
          'video/webm;codecs=vp8',
          'video/webm',
        ];
        if (!(window as any).MediaRecorder) {
          console.warn('[capture] MediaRecorder is not supported in this browser');
          return;
        }
        const mimeType = mimeTypeCandidates.find((m) => (window as any).MediaRecorder?.isTypeSupported?.(m)) || '';
        mediaRecorder = new MediaRecorder(recordingStream!, {
          mimeType: mimeType || undefined,
          videoBitsPerSecond: 8_000_000,
        });
        mediaRecorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        mediaRecorder.onstop = async () => {
          try {
            const type = mediaRecorder?.mimeType || 'video/webm';
            const blob = new Blob(chunks, { type });
            // Upload to server to persist and get a URL
            const form = new FormData();
            const filename = `recording-${Date.now()}.webm`;
            form.append('file', blob, filename);
            form.append('filename', filename);
            const res = await fetch('/api/recordings', { method: 'POST', body: form });
            if (res.ok) {
              const data = await res.json();
            } else {
              console.warn('[capture] upload failed with status', res.status);
            }
          } catch (err) {
            console.warn('[capture] failed to persist recording', err);
          }
        };
        mediaRecorder.start();
        stopTimer = window.setTimeout(() => {
          try { mediaRecorder?.stop(); } catch {}
        }, Math.floor(recordDurationSec * 1000));
      } catch {}
    };

    const waitStart = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const tick = () => {
      if (cancelled || started) return;
      if (!areTargetsReady()) {
        const now = (typeof performance !== 'undefined' ? performance.now() : Date.now());
        if (now - waitStart <= 1500) {
          rafId = requestAnimationFrame(tick);
          return;
        }
        console.warn('[capture] proceeding without animated targets being fully ready');
      }
      started = true;
      try { buildGSAPTimeline(); } catch {}
      try {
        gsap.ticker.lagSmoothing(0);
        gsap.ticker.fps(30);
        gsap.ticker.wake();
      } catch {}
      try {
        // @ts-expect-error runtime app access
        const pixiApp = fullscreenCanvasRef.current?.getApplication()?.app;
        pixiApp?.ticker?.start();
      } catch {}
      try {
        const { play, playback } = useTimelineStoreV2.getState();
        if (!playback.isPlaying) play();
      } catch {}
      // Start recording after playback begins
      startRecordingIfRequested();
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
      if (stopTimer) clearTimeout(stopTimer);
      if (retryTimer) clearTimeout(retryTimer);
      try {
        if (mediaRecorder && mediaRecorder.state !== 'inactive') {
          mediaRecorder.stop();
        }
      } catch {}
    };
  }, [autoplayOnReady, recordDurationSec, canvasObjects, buildGSAPTimeline]);

  // Update timeline track data when elements or groups change
  useEffect(() => {
    timelineManager.setTrackData(canvasObjects, groups);
  }, [canvasObjects, groups, timelineManager]);

  const isElementInCustomOrPolygonGroup = useCallback((element: AnimatedCanvasObject) => {
    const group = groups.find(g => g.id === element.groupId);
    return !!(group && !group.isDefaultGroup && (group.type === 'custom' || group.type === 'polygon'));
  }, [groups]);

  return (
    <div className="h-screen w-screen flex flex-col">

      {/* Main Body - Full-screen PIXI Application */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative overflow-hidden"
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <ApplicationCanvas 
          ref={fullscreenCanvasRef}
          dimensions={dimensions}
          snapGuides={[]}
          elements={canvasObjects}
          groups={groups}
          selectedIds={[]}
          hoveredId={null}
          editingTextId={null}
          tool={'select'}
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
          canvasScaleFactor={canvasScaleFactor}
          handleCanvasPointerDown={() => {}}
          handleCanvasPointerMove={() => {}}
          handlePointerUp={() => {}}
          handleCanvasClick={() => {}}
          isElementInCustomOrPolygonGroup={isElementInCustomOrPolygonGroup}
          canvasZoom={canvasZoom}
          onCanvasZoomChange={setCanvasZoom}
          shiftKey={false}
        />
      </div>
    </div>
  );
}
