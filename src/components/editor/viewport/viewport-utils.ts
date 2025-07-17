import type { ViewportWrapper } from './viewport-wrapper';

// Viewport utility functions
export const centerOnDesign = (viewport: ViewportWrapper | null) => {
  if (viewport) {
    // Center on the design canvas at the origin
    viewport.moveCenter(0, -155);
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

    // Use smooth zoom with animation and center on design canvas at (0,0)
    viewport.setZoom(scale, true);
    viewport.moveCenter(0, 0);
  }
};

export const resetZoom = (viewport: ViewportWrapper | null) => {
  if (viewport) {
    // Use smooth zoom with animation and center on design canvas at the origin
    viewport.setZoom(1, true);
    viewport.moveCenter(0, -155);
  }
}; 