'use client';

import React, { forwardRef, useRef, useImperativeHandle, useEffect } from 'react';
import { Application } from '@pixi/react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { DesignCanvasView } from './design-canvas-view';
import type { DesignCanvasViewRef } from './design-canvas-view';
import type { Container } from 'pixi.js';

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  transparentBackground?: boolean;
  appBackgroundColor?: number;
  backgroundColor: string;
  onAppReady?: () => void;
};

export interface ApplicationCanvasPlayerRef {
  getShapeRefs: () => Record<string, Container>;
  getGroupContainers: () => Record<string, Container>;
  getMainContainer: () => Container | null;
}

export const ApplicationCanvasPlayer = forwardRef<ApplicationCanvasPlayerRef, Props>(
  (
    {
      designWidth,
      designHeight,
      elements,
      groups,
      transparentBackground = true,
      appBackgroundColor,
      backgroundColor,
      onAppReady,
    },
    ref
  ) => {
    const designCanvasRef = useRef<DesignCanvasViewRef>(null);
    const appReadyRef = useRef(false);

    useImperativeHandle(ref, () => ({
      getShapeRefs: () => designCanvasRef.current?.getShapeRefs() || {},
      getGroupContainers: () => designCanvasRef.current?.getGroupContainers() || {},
      getMainContainer: () => designCanvasRef.current?.getMainContainer() || null
    }));

    // Mark app as ready after ensuring PIXI has rendered initial frames
    useEffect(() => {
      if (!appReadyRef.current && onAppReady) {
        appReadyRef.current = true;
        // Use triple requestAnimationFrame to ensure PIXI has fully initialized and rendered
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              onAppReady();
            });
          });
        });
      }
    }, [onAppReady]);

    return (
      <div className="w-full h-full flex items-center justify-center">
        <style dangerouslySetInnerHTML={{ __html: `
          .canvas-player-wrapper canvas {
            width: 100% !important;
            height: 100% !important;
            max-width: 100%;
            max-height: 100%;
            object-fit: contain;
          }
        ` }} />
        <div 
          className="canvas-player-wrapper"
          style={{
            width: '100%',
            height: '100%',
            maxWidth: `${designWidth}px`,
            maxHeight: `${designHeight}px`,
            aspectRatio: `${designWidth}/${designHeight}`,
          }}
        >
          <Application
            width={designWidth}
            height={designHeight}
            backgroundColor={appBackgroundColor ?? 0xF1F5F9}
            backgroundAlpha={transparentBackground ? 0 : 1}
            antialias
            resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
            autoDensity
          >
            <DesignCanvasView
              ref={designCanvasRef}
              designWidth={designWidth}
              designHeight={designHeight}
              elements={elements}
              groups={groups}
              backgroundColor={backgroundColor}
            />
          </Application>
        </div>
      </div>
    );
  }
);

ApplicationCanvasPlayer.displayName = 'ApplicationCanvasPlayer';


