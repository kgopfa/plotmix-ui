import { useMemo } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

interface CanvasPosition {
  x: number;
  y: number;
}

/**
 * Custom hook to calculate responsive canvas positioning based on screen dimensions
 * @param containerDimensions - The dimensions of the container/viewport
 * @param canvasDimensions - The dimensions of the canvas (optional, for future use)
 * @returns Calculated position for optimal canvas placement
 */
export const useResponsiveCanvasPosition = (
  containerDimensions: Dimensions
): CanvasPosition => {
  return useMemo(() => {
    const { width, height } = containerDimensions;
    const screenAspectRatio = width / height;
    
    let verticalOffset = 0;
    
    if (screenAspectRatio > 2) {
      // Ultrawide screens: position much higher (closer to top navigation)
      verticalOffset = Math.min(150, height * 0.15);
    } else if (screenAspectRatio > 1.5) {
      // Wide screens: position much higher
      verticalOffset = Math.min(200, height * 0.18);
    } else {
      // Standard screens: position much higher
      verticalOffset = Math.min(250, height * 0.22);
    }
    
    return {
      x: 0,
      y: -verticalOffset
    };
  }, [containerDimensions.width, containerDimensions.height]);
};

/**
 * Utility function to calculate optimal zoom level for fitting canvas in viewport
 * @param containerDimensions - The dimensions of the container/viewport
 * @param canvasDimensions - The dimensions of the canvas
 * @param maxZoom - Maximum zoom level (default: 5)
 * @returns Calculated zoom level and padding
 */
export const calculateOptimalZoom = (
  containerDimensions: Dimensions,
  canvasDimensions: Dimensions,
  maxZoom: number = 5
): { zoom: number; padding: number } => {
  const { width: containerWidth, height: containerHeight } = containerDimensions;
  const { width: canvasWidth, height: canvasHeight } = canvasDimensions;
  
  // Calculate responsive padding based on container size
  const padding = Math.min(50, Math.min(containerWidth, containerHeight) * 0.05);
  
  // Calculate zoom levels for both dimensions
  const scaleX = (containerWidth - padding * 2) / canvasWidth;
  const scaleY = (containerHeight - padding * 2) / canvasHeight;
  
  // Use the smaller scale to ensure the entire canvas fits
  const zoom = Math.min(scaleX, scaleY, maxZoom);
  
  return { zoom, padding };
}; 