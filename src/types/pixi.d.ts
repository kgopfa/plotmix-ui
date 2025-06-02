// src/types/pixi-jsx.d.ts
import type { Viewport } from 'pixi-viewport';
import type * as PIXI from 'pixi.js';
import type * as React from 'react';

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      viewport: {
        ref?: React.Ref<Viewport>;
        screenWidth: number;
        screenHeight: number;
        worldWidth?: number;
        worldHeight?: number;
        events: PIXI.EventSystem;
        ticker?: PIXI.Ticker;
        disableOnContextMenu?: boolean;
        interaction?: PIXI.InteractionManager;
        passiveWheel?: boolean;
        divWheel?: boolean;
        stopPropagation?: boolean;
        [key: string]: unknown;
      };
    }
  }
}
