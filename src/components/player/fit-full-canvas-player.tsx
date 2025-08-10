'use client';

import React, { useLayoutEffect, useRef, useState } from 'react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { ApplicationCanvasPlayer, type ApplicationCanvasPlayerRef } from './application-canvas-player';
import { PlaybackControls } from './playback-controls';

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
};

export function FitFullCanvasPlayer({ designWidth, designHeight, elements, groups }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationCanvasPlayerRef>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });

  useLayoutEffect(() => {
    if (!containerRef.current) return;
    const el = containerRef.current;
    const ro = new ResizeObserver(() => {
      const rect = el.getBoundingClientRect();
      setSize({ width: Math.max(1, rect.width), height: Math.max(1, rect.height) });
      requestAnimationFrame(() => {
        appRef.current?.centerOnDesign();
        appRef.current?.zoomToFit();
      });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useLayoutEffect(() => {
    requestAnimationFrame(() => {
      appRef.current?.centerOnDesign();
      appRef.current?.zoomToFit();
    });
  }, [elements, groups, designWidth, designHeight]);

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <ApplicationCanvasPlayer
        ref={appRef}
        dimensions={size}
        designWidth={designWidth}
        designHeight={designHeight}
        elements={elements}
        groups={groups}
        lockDimensionsToProps
        transparentBackground={false}
        clipToDesignCanvas={false}
        clipCornerRadius={14}
        appBackgroundColor={0xFFFFFF}
        designCanvasBackgroundColor={0xFFFFFF}
        designCanvasBorderColor={0xFFFFFF}
      />

      {/* Sticky playback controls */}
      <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-white/80 backdrop-blur-sm px-3 py-2">
        <PlaybackControls />
      </div>
    </div>
  );
}


