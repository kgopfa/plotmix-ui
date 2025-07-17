import type { ViewportWrapper } from './viewport-wrapper';

// Design canvas constants
export const DESIGN_CANVAS_WIDTH = 1280;
export const DESIGN_CANVAS_HEIGHT = 720;
export const DESIGN_CANVAS_CENTER_X = DESIGN_CANVAS_WIDTH / 2; // 640
export const DESIGN_CANVAS_CENTER_Y = DESIGN_CANVAS_HEIGHT / 2; // 360

// Viewport utility functions
export const centerOnDesign = (viewport: ViewportWrapper | null) => {
  if (viewport) {
    viewport.moveCenter(DESIGN_CANVAS_CENTER_X, DESIGN_CANVAS_CENTER_Y);
  }
};

export const zoomToFit = (
  viewport: ViewportWrapper | null, 
  containerWidth: number, 
  containerHeight: number
) => {
  if (viewport) {
    const padding = 50;
    const scaleX = (containerWidth - padding * 2) / DESIGN_CANVAS_WIDTH;
    const scaleY = (containerHeight - padding * 2) / DESIGN_CANVAS_HEIGHT;
    const scale = Math.min(scaleX, scaleY, 5);

    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(scale, true);
    viewport.moveCenter(DESIGN_CANVAS_CENTER_X, DESIGN_CANVAS_CENTER_Y);
  }
};

export const resetZoom = (viewport: ViewportWrapper | null) => {
  if (viewport) {
    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(1, true);
    viewport.moveCenter(DESIGN_CANVAS_CENTER_X, DESIGN_CANVAS_CENTER_Y);
  }
}; 