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
    }

    this.setZoom(1, true).moveCenter(0, 0);
  }
}