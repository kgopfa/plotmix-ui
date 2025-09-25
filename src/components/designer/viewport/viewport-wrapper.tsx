import { Viewport as BaseViewport, type IViewportOptions } from 'pixi-viewport';
import type { Application as PixiApplication } from 'pixi.js';

// Custom Viewport wrapper that properly integrates with @pixi/react
export type ViewportProps = Omit<IViewportOptions, "events"> & {
  /**
   * When true, disables interactive plugins (drag, pinch, wheel pan/decelerate)
   * while keeping programmatic controls (centerOnDesign, zoomToFit, setZoom) available.
   */
  readonly?: boolean;
  /**
   * Initial zoom level for the viewport
   */
  initialZoom?: number;
  /**
   * Initial center position for the viewport
   */
  initialCenter?: { x: number; y: number };
};

export class ViewportWrapper extends BaseViewport {
  constructor(options: ViewportProps & { app: PixiApplication }) {
    const { app, readonly, initialZoom, initialCenter, ...rest } = options;
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

    // Use initial zoom from props, or default to 1
    const zoom = initialZoom ?? 1;
    this.setZoom(zoom, false);

    // Use initial center from props, or center on world center by default
    if (initialCenter) {
      this.moveCenter(initialCenter.x, initialCenter.y);
    } else {
      const ww = (rest.worldWidth ?? 0) as number;
      const wh = (rest.worldHeight ?? 0) as number;
      if (ww > 0 && wh > 0) {
        this.moveCenter(ww / 2, wh / 2);
      }
    }
  }
}