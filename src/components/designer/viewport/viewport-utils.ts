import type { ViewportWrapper } from './viewport-wrapper';
import { calculateOptimalZoom } from '@/hooks/use-responsive-canvas-position';

// Calculate optimal canvas position based on screen dimensions
export const calculateCanvasPosition = (
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number } => {
  // Center on the world's center with the same responsive vertical offset
  // used by the design canvas container so both align.
  const worldWidth = canvasWidth * 3;
  const worldHeight = canvasHeight * 3;

  const screenAspectRatio = containerWidth / containerHeight;
  let verticalOffset = 0;
  if (screenAspectRatio > 2) {
    verticalOffset = Math.min(150, containerHeight * 0.15);
  } else if (screenAspectRatio > 1.5) {
    verticalOffset = Math.min(200, containerHeight * 0.18);
  } else {
    verticalOffset = Math.min(250, containerHeight * 0.22);
  }

  return {
    x: worldWidth / 2,
    y: worldHeight / 2 - verticalOffset,
  };
};

// Viewport utility functions
export const centerOnDesign = (
  viewport: ViewportWrapper | null,
  containerWidth?: number,
  containerHeight?: number,
  canvasWidth?: number,
  canvasHeight?: number
) => {
  if (viewport) {
    // Only move center to our target; do not change zoom here
    if (containerWidth && containerHeight && canvasWidth && canvasHeight) {
      // Use calculated position for responsive centering
      const position = calculateCanvasPosition(containerWidth, containerHeight, canvasWidth, canvasHeight);
      viewport.moveCenter(position.x, position.y);
    } else {
      // Fallback to default centering - center on world
      const worldWidth = (canvasWidth || 1920) * 3;
      const worldHeight = (canvasHeight || 1080) * 3;
      viewport.moveCenter(worldWidth / 2, worldHeight / 2);
    }
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
    // First fit the world to the viewport (similar to working example)
    viewport.fit();
    
    // Use the utility function for optimal zoom calculation
    const { zoom } = calculateOptimalZoom(
      { width: containerWidth, height: containerHeight },
      { width: canvasWidth, height: canvasHeight }
    );

    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(zoom, true);
    
    // Use calculated position for responsive centering
    const position = calculateCanvasPosition(containerWidth, containerHeight, canvasWidth, canvasHeight);
    viewport.moveCenter(position.x, position.y);
  }
};

export const resetZoom = (
  viewport: ViewportWrapper | null,
  containerWidth?: number,
  containerHeight?: number,
  canvasWidth?: number,
  canvasHeight?: number
) => {
  if (viewport) {
    // Use smooth zoom with animation and center on design canvas
    viewport.setZoom(1, true);
    
    if (containerWidth && containerHeight && canvasWidth && canvasHeight) {
      // Use calculated position for responsive centering
      const position = calculateCanvasPosition(containerWidth, containerHeight, canvasWidth, canvasHeight);
      viewport.moveCenter(position.x, position.y);
    } else {
      // Fallback to default centering - center on world
      const worldWidth = (canvasWidth || 1920) * 3;
      const worldHeight = (canvasHeight || 1080) * 3;
      viewport.moveCenter(worldWidth / 2, worldHeight / 2);
    }
  }
}; 