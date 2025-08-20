import { Viewport as BaseViewport, type IViewportOptions } from 'pixi-viewport';
import type { Application as PixiApplication } from 'pixi.js';

// Custom Viewport wrapper that properly integrates with @pixi/react
export type ViewportProps = Omit<IViewportOptions, "events"> & {
  /**
   * When true, disables interactive plugins (drag, pinch, wheel pan/decelerate)
   * while keeping programmatic controls (centerOnDesign, zoomToFit, setZoom) available.
   */
  readonly?: boolean;
};

export class ViewportWrapper extends BaseViewport {
  constructor(options: ViewportProps & { app: PixiApplication }) {
    const { app, readonly, ...rest } = options;
    super({
      ...rest,
      events: app.renderer.events,
    });

    console.log('ViewportWrapper created with options:', { readonly, hasEvents: !!app.renderer.events });

    if (!readonly) {
      this
        .drag({
          pressDrag: false,
          wheel: true,
        })
        .pinch()
        .wheel({
          percent: 0.08,
          trackpadPinch: true,
          wheelZoom: false,
        })
        .decelerate({
          friction: 0.95,
          bounce: 0.8
        });
      
      console.log('Viewport plugins configured for interactive use');
    }

    // Initial zoom only; avoid animation to prevent race with later centering
    this.setZoom(1, false);

    // Center on world center by default so content isn't off-screen
    const ww = (rest.worldWidth ?? 0) as number;
    const wh = (rest.worldHeight ?? 0) as number;
    if (ww > 0 && wh > 0) {
      this.moveCenter(ww / 2, wh / 2);
    }
  }
}