'use client';

import React, { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { Application, type ApplicationRef } from '@pixi/react';
import { Viewport, ViewportWrapper, centerOnDesign, zoomToFit, resetZoom } from '@/components/designer/viewport';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { DesignCanvasView } from './design-canvas-view';

export interface ApplicationCanvasPlayerRef {
  getApplication: () => ApplicationRef | null;
  getViewport: () => ViewportWrapper | null;
  centerOnDesign: () => void;
  zoomToFit: () => void;
  resetZoom: () => void;
}

type Props = {
  dimensions: { width: number; height: number };
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  transparentBackground?: boolean;
  clipToDesignCanvas?: boolean;
  clipCornerRadius?: number;
  lockDimensionsToProps?: boolean;
  // Visual customization
  appBackgroundColor?: number; // default 0xF1F5F9
  designCanvasBackgroundColor?: number; // default 0xFFFFFF
  designCanvasBorderColor?: number; // default 0xE2E8F0
  // Interaction control
  readonlyViewport?: boolean;
};

export const ApplicationCanvasPlayer = forwardRef<ApplicationCanvasPlayerRef, Props>(
  (
    {
      dimensions: dimsProp,
      designWidth,
      designHeight,
      elements,
      groups,
      transparentBackground = true,
      clipToDesignCanvas = true,
      clipCornerRadius = 14,
      lockDimensionsToProps = true,
      appBackgroundColor,
      designCanvasBackgroundColor,
      designCanvasBorderColor,
      readonlyViewport,
    },
    ref
  ) => {
    const appRef = useRef<ApplicationRef | null>(null);
    const viewportRef = useRef<ViewportWrapper | null>(null);
    const [dimensions, setDimensions] = useState(dimsProp);

    useEffect(() => {
      if (lockDimensionsToProps) setDimensions(dimsProp);
    }, [dimsProp, lockDimensionsToProps]);

    useEffect(() => {
      if (!lockDimensionsToProps) {
        const update = () => {
          if (typeof window !== 'undefined') {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
          }
        };
        update();
        window.addEventListener('resize', update);
        return () => window.removeEventListener('resize', update);
      }
    }, [lockDimensionsToProps]);

    useEffect(() => {
      if (viewportRef.current && dimensions.width > 0 && dimensions.height > 0) {
        centerOnDesign(viewportRef.current, designWidth, designHeight);
      }
    }, [dimensions.width, dimensions.height, designWidth, designHeight]);

    useImperativeHandle(ref, () => ({
      getApplication: () => appRef.current,
      getViewport: () => viewportRef.current,
      centerOnDesign: () => centerOnDesign(viewportRef.current, designWidth, designHeight),
      zoomToFit: () => zoomToFit(viewportRef.current, designWidth, designHeight),
      resetZoom: () => resetZoom(viewportRef.current, designWidth, designHeight),
    }));

    return (
      <Application
        ref={appRef}
        width={dimensions.width}
        height={dimensions.height}
        backgroundColor={appBackgroundColor ?? 0xF1F5F9}
        backgroundAlpha={transparentBackground ? 0 : 1}
        antialias
        resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
        autoDensity
      >
        <Viewport
          screenWidth={dimensions.width}
          screenHeight={dimensions.height}
          worldWidth={designWidth * 3}
          worldHeight={designHeight * 3}
          stopPropagation={false}
          readonly={!!readonlyViewport}
          ref={viewportRef}
        >
          <DesignCanvasView
            designWidth={designWidth}
            designHeight={designHeight}
            elements={elements}
            groups={groups}
            clipToCanvas={clipToDesignCanvas}
            clipCornerRadius={clipCornerRadius}
            backgroundColor={designCanvasBackgroundColor}
            borderColor={designCanvasBorderColor}
          />
        </Viewport>
      </Application>
    );
  }
);

ApplicationCanvasPlayer.displayName = 'ApplicationCanvasPlayer';


