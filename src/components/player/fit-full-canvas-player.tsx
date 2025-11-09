'use client';

import React, { useRef, forwardRef, useImperativeHandle } from 'react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { ApplicationCanvasPlayer } from './application-canvas-player';
import type { ApplicationCanvasPlayerRef } from './application-canvas-player';

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  hideInlineControls?: boolean;
  onAppReady?: () => void;
};

export interface FitFullCanvasPlayerRef {
  getCanvasRef: () => ApplicationCanvasPlayerRef | null;
}

export const FitFullCanvasPlayer = forwardRef<FitFullCanvasPlayerRef, Props>(
  ({ designWidth, designHeight, elements, groups, onAppReady }, ref) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const appRef = useRef<ApplicationCanvasPlayerRef>(null);

    useImperativeHandle(ref, () => ({
      getCanvasRef: () => appRef.current
    }));

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <div ref={containerRef} className="absolute inset-0 flex items-center justify-center">
        <ApplicationCanvasPlayer
          ref={appRef}
          designWidth={designWidth}
          designHeight={designHeight}
          elements={elements}
          groups={groups}
          transparentBackground={false}
          backgroundColor="#FFFFFF"
          appBackgroundColor={0xFFFFFF}
          onAppReady={onAppReady}
        />
      </div>
    </div>
  );
});

FitFullCanvasPlayer.displayName = 'FitFullCanvasPlayer';


