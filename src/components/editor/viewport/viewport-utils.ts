import type { ViewportWrapper } from './viewport-wrapper';

// Viewport utility functions that accept dynamic canvas dimensions
export const centerOnDesign = (
  viewport: ViewportWrapper | null, 
  canvasWidth: number, 
  canvasHeight: number
) => {
  if (viewport) {
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    viewport.moveCenter(centerX, centerY);
  }
};

export const zoomToFit = (
  viewport: ViewportWrapper | null, 
  containerWidth: number, 
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (viewport) {
    const padding = 50;
    const scaleX = (containerWidth - padding * 2) / canvasWidth;
    const scaleY = (containerHeight - padding * 2) / canvasHeight;
    const scale = Math.min(scaleX, scaleY, 5);

    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(scale, true);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    viewport.moveCenter(centerX, centerY);
  }
};

export const resetZoom = (
  viewport: ViewportWrapper | null,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (viewport) {
    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(1, true);
    const centerX = canvasWidth / 2;
    const centerY = canvasHeight / 2;
    viewport.moveCenter(centerX, centerY);
  }
}; 