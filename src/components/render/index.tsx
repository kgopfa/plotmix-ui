// app/layout.tsx or pages/index.tsx depending on routing
'use client';
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { TimelineManager } from '@/lib/timeline-manager';
import { useCanvasElements, useCanvasGroups, useCanvasStore } from '@/stores/use-canvas-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useTimelineSync } from '@/stores/use-timeline-store';
import { GSAPTimelineManager } from '@/lib/gsap-timeline-manager';
import { Graphics, Container } from 'pixi.js';
import type { TimelineCanvasRef } from '@/lib/gsap-timeline-manager';
import { Timeline } from '@/components/designer/timeline';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import dynamic from 'next/dynamic';
import { useCanvasDimensions } from '@/hooks/use-canvas-dimensions';
import { useTimelineIntegration } from '@/hooks/use-timeline-integration';
import { usePanelResize } from '@/hooks/use-panel-resize';
import type { ApplicationCanvasRef } from './canvas/application-canvas';

const ApplicationCanvas = dynamic(() => import('./canvas/application-canvas').then(m => m.ApplicationCanvas), { ssr: false });

export default function Designer() {
  // Use canvas store instead of local state
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();

  // Use UI store for tool state
  const toolState = useUIStore((state) => state.tools);

  // Timeline integration is handled by useTimelineIntegration hook
  const { initializeSubscriptions, cleanupSubscriptions, buildGSAPTimeline } = useTimelineSync();

  // Use UI store for panel state
  const panelState = useUIStore((state) => state.panels);

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
  const drawingRef = useRef<Graphics | null>(null);
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

  // Update timeline track data when elements or groups change
  useEffect(() => {
    timelineManager.setTrackData(canvasObjects, groups);
  }, [canvasObjects, groups, timelineManager]);

  const isElementInCustomOrPolygonGroup = useCallback((element: AnimatedCanvasObject) => {
    const group = groups.find(g => g.id === element.groupId);
    return !!(group && !group.isDefaultGroup && (group.type === 'custom' || group.type === 'polygon'));
  }, [groups]);

  const onPathStartClick = useCallback((_elementId: string, _x: number, _y: number) => {
    // Handle path start click
  }, []);

  // Timeline should shift when any tab with content panels is active (not toggle buttons or compact tabs)
  // Include: scenes, uploads, ai, video, text, animations, layers, components
  // Exclude: tools (compact), audio (toggle), timeline (toggle)
  const tabsWithPanels = ['scenes', 'uploads', 'ai', 'video', 'text', 'animations', 'layers', 'components'];
  const timelineLeftOffset = 80 + (panelState.leftPanelVisible && tabsWithPanels.includes('timeline') ? panelState.leftPanelWidth + 8 : 0);

  return (
    <div className="h-screen w-screen flex flex-col">

      {/* Main Body - Full-screen PIXI Application */}
      <div 
        ref={canvasContainerRef}
        className="flex-1 relative overflow-hidden"
        onContextMenu={(e) => {
          // Prevent browser's default context menu from appearing
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
          tool={toolState.activeTool}
          isPathMode={toolState.isPathMode}
          animationTarget={toolState.animationTarget}
          lineStartPoint={toolState.lineStartPoint}
          isLineChaining={toolState.isLineChaining}
          chainedLineIds={toolState.chainedLineIds}
          mousePos={null}
          currentPath={[]}
          isDrawing={false}
          shapeRefs={shapeRefs}
          groupContainers={groupContainers}
          mainCanvasContainerRef={mainCanvasContainerRef}
          drawingRef={drawingRef}
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

      {/* Floating Timeline - positioned fixed at bottom, starts after navigation sidebar */}
      <div
        className="fixed bottom-2 right-0 bg-transparent z-50 transition-all duration-600 ease-in-out"
        style={{
          left: `${timelineLeftOffset}px`, // Start after nav sidebar and any visible left panel
          height: panelState.isTimelineCollapsed ? '72px' : `${panelState.timelineHeight}px`,
          minHeight: '72px', // Allow collapsing to 72px to show controls
          maxHeight: '80vh'
        }}
      >
        {/* Timeline Resize Handle - Visual indicator - only show when not collapsed */}
        {!panelState.isTimelineCollapsed && (
          <div
            className="absolute top-0 left-0 right-0 h-2 cursor-row-resize z-40"
            onMouseDown={handleMouseDown('timeline')}
          />
        )}

        <Timeline canvasZoom={canvasZoom} onCanvasZoom={setCanvasZoom} />
      </div>
    </div>
  );
}
