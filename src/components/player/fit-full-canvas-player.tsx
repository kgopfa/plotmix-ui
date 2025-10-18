'use client';

import React, { useRef } from 'react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { ApplicationCanvasPlayer } from './application-canvas-player';
import { ApplicationRef } from '@pixi/react';

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
  const appRef = useRef<ApplicationRef>(null);

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <div ref={containerRef} className="relative w-full h-full">
        <ApplicationCanvasPlayer
          ref={appRef}
          designWidth={designWidth}
          designHeight={designHeight}
          elements={elements}
          groups={groups}
          transparentBackground={false}
          clipToDesignCanvas={false}
          clipCornerRadius={14}
          appBackgroundColor={0xFFFFFF}
          designCanvasBackgroundColor={0xFFFFFF}
          designCanvasBorderColor={0xE2E8F0}
        />
      </div>
    </div>
  );
}


