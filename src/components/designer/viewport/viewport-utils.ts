import type { ViewportWrapper } from './viewport-wrapper';

// Viewport utility functions following standard viewport patterns
export const centerOnDesign = (
  viewport: ViewportWrapper | null,
  canvasWidth?: number,
  canvasHeight?: number
) => {
  if (viewport) {
    // Use the world dimensions to center on the design canvas
    const worldWidth = (canvasWidth || 1920) * 3;
    const worldHeight = (canvasHeight || 1080) * 3;
    
    // Simply center on the world center - let viewport handle the rest
    viewport.moveCenter(worldWidth / 2, worldHeight / 2);
  }
};

export const zoomToFit = (
  viewport: ViewportWrapper | null,
  canvasWidth: number,
  canvasHeight: number
) => {
  if (viewport) {
    // Use standard viewport.fit() to fit the world to the viewport
    viewport.fit();
    
    // Center on the world center after fitting
    const worldWidth = canvasWidth * 3;
    const worldHeight = canvasHeight * 3;
    viewport.moveCenter(worldWidth / 2, worldHeight / 2);
  }
};

export const resetZoom = (
  viewport: ViewportWrapper | null,
  canvasWidth?: number,
  canvasHeight?: number
) => {
  if (viewport) {
    // Reset zoom to 1 with smooth animation
    viewport.setZoom(1, true);
    
    // Center on the world center
    const worldWidth = (canvasWidth || 1920) * 3;
    const worldHeight = (canvasHeight || 1080) * 3;
    viewport.moveCenter(worldWidth / 2, worldHeight / 2);
  }
}; 