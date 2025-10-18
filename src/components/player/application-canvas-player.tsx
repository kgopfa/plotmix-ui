'use client';

import React, { forwardRef } from 'react';
import { Application, type ApplicationRef } from '@pixi/react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { DesignCanvasView } from './design-canvas-view';

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  transparentBackground?: boolean;
  appBackgroundColor?: number;
  backgroundColor: string;
};

export const ApplicationCanvasPlayer = forwardRef<ApplicationRef, Props>(
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
    return (
      <Application
        ref={ref}
        width={designWidth}
        height={designHeight}
        backgroundColor={appBackgroundColor ?? 0xF1F5F9}
        backgroundAlpha={transparentBackground ? 0 : 1}
        antialias
        resolution={typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2}
        autoDensity
      >
        <DesignCanvasView
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


