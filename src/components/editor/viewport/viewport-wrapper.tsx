import { Viewport as BaseViewport, type IViewportOptions } from 'pixi-viewport';
import type { Application as PixiApplication } from 'pixi.js';

// Custom Viewport wrapper that properly integrates with @pixi/react
export type ViewportProps = Omit<IViewportOptions, "events">;

export class ViewportWrapper extends BaseViewport {
  constructor(options: ViewportProps & { app: PixiApplication }) {
    const { app, ...rest } = options;
    super({
      ...rest,
      events: app.renderer.events,
    });
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
      })
      .setZoom(1, true)
      .moveCenter(0, 0);
  }
} 