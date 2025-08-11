'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { ApplicationCanvasPlayer, type ApplicationCanvasPlayerRef } from './application-canvas-player';
import { FullscreenPlaybackControls } from './fullscreen-playback-controls';
import { Maximize2, Minimize2 } from 'lucide-react';

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  hideInlineControls?: boolean;
};

export function FitFullCanvasPlayer({ designWidth, designHeight, elements, groups, hideInlineControls = false }: Props) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<ApplicationCanvasPlayerRef>(null);
  const [size, setSize] = useState({ width: 1280, height: 720 });
  const [isFullscreen, setIsFullscreen] = useState(false);

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

  // Track fullscreen changes and refit
  useEffect(() => {
    const onChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
      requestAnimationFrame(() => {
        appRef.current?.centerOnDesign();
        appRef.current?.zoomToFit();
      });
    };
    document.addEventListener('fullscreenchange', onChange);
    return () => document.removeEventListener('fullscreenchange', onChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (!document.fullscreenElement) {
        await wrapperRef.current?.requestFullscreen?.();
      } else {
        await document.exitFullscreen?.();
      }
    } catch {}
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
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
        readonlyViewport
      />

        {!hideInlineControls && (
          <div className="pointer-events-auto absolute bottom-0 left-0 right-0 flex items-center gap-3 bg-transparent backdrop-blur-sm px-3 py-2">
            <FullscreenPlaybackControls />
            <button
              type="button"
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              onClick={toggleFullscreen}
              className="ml-auto p-1.5 rounded bg-gray-900 text-white hover:bg-gray-800"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


