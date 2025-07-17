import { Viewport as BaseViewport, type IViewportOptions } from 'pixi-viewport';
import type { Application as PixiApplication } from 'pixi.js';

// Custom Viewport wrapper that properly integrates with @pixi/react
export type ViewportProps = Omit<IViewportOptions, "events">;

export class ViewportWrapper extends BaseViewport {
  constructor(options: ViewportProps & { app: PixiApplication; canvasWidth?: number; canvasHeight?: number }) {
    const { app, canvasWidth = 1280, canvasHeight = 720, ...rest } = options;
    super({
      ...rest,
      events: app.renderer.events,
    });
    this.drag().pinch().wheel().decelerate({
      friction: 0.95,
      bounce: 0.8
    })
      .clampZoom({
        minScale: 0.1,
        maxScale: 5
      })
      .clamp({
        direction: 'all',
        underflow: 'center'
      })
      // Always center the design canvas
      .setZoom(1, true)
      .moveCenter(canvasWidth / 2, canvasHeight / 2);
  }
} 