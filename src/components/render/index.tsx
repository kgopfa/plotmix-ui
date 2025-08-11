// app/layout.tsx or pages/index.tsx depending on routing
'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import gsap from 'gsap';
import { TimelineManager } from '@/lib/timeline-manager';
import { useCanvasElements, useCanvasGroups, useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineSync, useTimelineStore } from '@/stores/use-timeline-store';
import { GSAPTimelineManager } from '@/lib/gsap-timeline-manager';
import { Container } from 'pixi.js';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import { AnimatedCanvasObject } from '@/types/canvas';
import dynamic from 'next/dynamic';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { usePanelResize } from '@/hooks/use-panel-resize';
import type { ApplicationCanvasRef } from './canvas/application-canvas';

const ApplicationCanvas = dynamic(() => import('./canvas/application-canvas').then(m => m.ApplicationCanvas), { ssr: false });

type DesignerProps = { autoplayOnReady?: boolean };

export default function ScreenCapture({ autoplayOnReady = false }: DesignerProps) {
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
  const gsapManager = useMemo(() => new GSAPTimelineManager(), []);

  // Memoize the timeline manager instance
  const timelineManager = useMemo(() => TimelineManager.getInstance(), []);

  // Use the canvas dimensions hook
  const { dimensions } = useCanvasDimensions();

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

    const areTargetsReady = () => {
      const refs = shapeRefs.current as Record<string, Container>;
      const animatedIds = canvasObjects
        .filter(el => !el.isAnimationPath && (el.animations?.length ?? 0) > 0)
        .map(el => el.id);
      if (animatedIds.length === 0) return false;
      return animatedIds.every(id => {
        const target = refs[id];
        return !!(target && !target.destroyed && target.parent);
      });
    };

    const tick = () => {
      if (cancelled || started) return;
      if (!areTargetsReady()) {
        rafId = requestAnimationFrame(tick);
        return;
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
        const { play, playback } = useTimelineStore.getState();
        if (!playback.isPlaying) play();
      } catch {}
    };

    rafId = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, [autoplayOnReady, canvasObjects, buildGSAPTimeline]);

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
