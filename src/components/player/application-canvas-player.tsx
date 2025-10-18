'use client';

import React, { forwardRef, useRef, useImperativeHandle } from 'react';
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
    },
    ref
  ) => {
    const designCanvasRef = useRef<DesignCanvasViewRef>(null);

    useImperativeHandle(ref, () => ({
      getShapeRefs: () => designCanvasRef.current?.getShapeRefs() || {},
      getGroupContainers: () => designCanvasRef.current?.getGroupContainers() || {},
      getMainContainer: () => designCanvasRef.current?.getMainContainer() || null
    }));

    return (
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
    );
  }
);

ApplicationCanvasPlayer.displayName = 'ApplicationCanvasPlayer';


