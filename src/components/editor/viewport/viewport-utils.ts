import type { ViewportWrapper } from './viewport-wrapper';

// Viewport utility functions
export const centerOnDesign = (viewport: ViewportWrapper | null, canvasWidth: number, canvasHeight: number) => {
  if (viewport) {
    // Center on the design canvas at its adjusted position using ratio
    const centerY = (canvasHeight * 3) * 0.321; // Use ratio based on canvas height
    viewport.moveCenter(canvasWidth / 2, centerY);
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

export const resetZoom = (viewport: ViewportWrapper | null, canvasWidth: number, canvasHeight: number) => {
  if (viewport) {
    // Use smooth zoom with animation and center on design canvas at the adjusted position using ratio
    const centerY = (canvasHeight * 3) * 0.207; // Use ratio based on canvas height
    viewport.setZoom(1, true);
    viewport.moveCenter(canvasWidth / 2, centerY);
  }
}; 