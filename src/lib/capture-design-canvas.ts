import type React from 'react';
import { Point } from 'pixi.js';
import type { ApplicationCanvasRef } from '@/components/render/canvas/application-canvas';

export type CaptureOutputKind = 'canvas' | 'blob' | 'dataURL';

export interface CaptureOptions {
  output?: CaptureOutputKind;
  type?: string;
  quality?: number;
}

export type CapturedFrame = HTMLCanvasElement | Blob | string;

/**
 * Capture a frame of ONLY the design canvas subtree, cropped to the design frame size.
 * Pan/zoom from the viewport is handled, so the result is stable regardless of current view.
 */
export async function captureDesignCanvasFrame(
  appCanvasRef: React.RefObject<ApplicationCanvasRef>,
  frameSize: { width: number; height: number },
  options?: CaptureOptions
): Promise<CapturedFrame> {
  const mainContainer = appCanvasRef.current?.getMainContainer();
  const appRef = appCanvasRef.current?.getApplication();

  if (!mainContainer || !appRef) {
    throw new Error('Design canvas not ready');
  }

  // Access underlying PIXI Application from @pixi/react ref (runtime-only field)
  const renderer = (appRef as unknown as { app?: { renderer: any } } | null)?.app?.renderer;
  if (!renderer) {
    throw new Error('Renderer not available');
  }

  // Render only the design canvas subtree to an intermediate canvas
  const extractedCanvas: HTMLCanvasElement = renderer.extract.canvas(mainContainer);
  const resolution: number = typeof renderer.resolution === 'number' && renderer.resolution > 0
    ? renderer.resolution
    : (typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1);

  // Bounds of the extracted image in world coordinates
  const bounds = mainContainer.getBounds();

  // Top-left of the design frame in world space (frame drawn from -w/2, -h/2 in local space)
  const topLeftWorld = mainContainer.toGlobal(new Point(-frameSize.width / 2, -frameSize.height / 2));

  // Crop rectangle within the extracted canvas (convert world -> pixel space)
  const sourceX = Math.round((topLeftWorld.x - bounds.x) * resolution);
  const sourceY = Math.round((topLeftWorld.y - bounds.y) * resolution);
  const sourceW = Math.round(frameSize.width * resolution);
  const sourceH = Math.round(frameSize.height * resolution);

  // Copy the cropped region into the output canvas
  const outputCanvas = document.createElement('canvas');
  outputCanvas.width = sourceW;
  outputCanvas.height = sourceH;
  const ctx = outputCanvas.getContext('2d');
  if (!ctx) throw new Error('Failed to create 2D context');
  ctx.drawImage(extractedCanvas, sourceX, sourceY, sourceW, sourceH, 0, 0, sourceW, sourceH);

  const outputKind: CaptureOutputKind = options?.output ?? 'canvas';
  if (outputKind === 'canvas') return outputCanvas;
  if (outputKind === 'dataURL') return outputCanvas.toDataURL(options?.type ?? 'image/png', options?.quality);

  return new Promise<Blob>((resolve, reject) => {
    outputCanvas.toBlob((blob) => {
      if (!blob) return reject(new Error('Failed to encode canvas to Blob'));
      resolve(blob);
    }, options?.type ?? 'image/png', options?.quality);
  });
}


