import React from 'react';
import { extend, useApplication } from '@pixi/react';
import type { Application as PixiApplication } from 'pixi.js';
import { ViewportWrapper, type ViewportProps } from './viewport-wrapper';

extend({ ViewportWrapper });

const Viewport = React.forwardRef<ViewportWrapper, React.PropsWithChildren<ViewportProps>>(
  (props, ref) => {
    const { children, ...rest } = props;
    const { app } = useApplication();

    return (
      app?.renderer && (
        <pixiViewportWrapper ref={ref} app={app} {...rest}>
          {children}
        </pixiViewportWrapper>
      )
    );
  }
);

Viewport.displayName = 'Viewport';

// Type declarations for the custom pixi element
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace React.JSX {
    interface IntrinsicElements {
      pixiViewportWrapper: React.PropsWithChildren<{
        app: PixiApplication;
        screenWidth?: number;
        screenHeight?: number;
        worldWidth?: number | null;
        worldHeight?: number | null;
        stopPropagation?: boolean;
        initialZoom?: number;
        initialCenter?: { x: number; y: number };
        ref?: React.Ref<ViewportWrapper>;
      }>;
    }
  }
}

export { Viewport };
export type { ViewportProps }; 