import type { SnapPoint } from './element-snapping';

export interface CanvasBounds {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/**
 * Calculate canvas bounds based on canvas dimensions and center position
 */
export const getCanvasBounds = (
  canvasWidth: number,
  canvasHeight: number,
  centerX: number = 0,
  centerY: number = 0
): CanvasBounds => {
  const halfWidth = canvasWidth / 2;
  const halfHeight = canvasHeight / 2;
  
  return {
    left: centerX - halfWidth,
    right: centerX + halfWidth,
    top: centerY - halfHeight,
    bottom: centerY + halfHeight,
    centerX,
    centerY,
    width: canvasWidth,
    height: canvasHeight,
  };
};

/**
 * Generate canvas snap points (edges, center, and midpoints)
 */
export const generateCanvasSnapPoints = (
  canvasBounds: CanvasBounds
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  
  // Canvas edges
  snapPoints.push({
    type: 'left',
    sourceElementId: 'canvas-edge',
    distance: 0,
    x: canvasBounds.left
  });
  
  snapPoints.push({
    type: 'right',
    sourceElementId: 'canvas-edge',
    distance: 0,
    x: canvasBounds.right
  });
  
  snapPoints.push({
    type: 'top',
    sourceElementId: 'canvas-edge',
    distance: 0,
    y: canvasBounds.top
  });
  
  snapPoints.push({
    type: 'bottom',
    sourceElementId: 'canvas-edge',
    distance: 0,
    y: canvasBounds.bottom
  });
  
  // Canvas center
  snapPoints.push({
    type: 'centerX',
    sourceElementId: 'canvas-center',
    distance: 0,
    x: canvasBounds.centerX
  });
  
  snapPoints.push({
    type: 'centerY',
    sourceElementId: 'canvas-center',
    distance: 0,
    y: canvasBounds.centerY
  });
  
  // Canvas midpoints (vertical and horizontal)
  const verticalMidpoint = canvasBounds.left + canvasBounds.width / 2;
  const horizontalMidpoint = canvasBounds.top + canvasBounds.height / 2;
  
  snapPoints.push({
    type: 'centerX',
    sourceElementId: 'canvas-midpoint',
    distance: 0,
    x: verticalMidpoint
  });
  
  snapPoints.push({
    type: 'centerY',
    sourceElementId: 'canvas-midpoint',
    distance: 0,
    y: horizontalMidpoint
  });
  
  return snapPoints;
};

/**
 * Find canvas snap points that are within threshold of an element
 */
export const findCanvasSnapPoints = (
  elementBounds: { centerX: number; centerY: number },
  canvasBounds: CanvasBounds,
  snapThreshold: number = 10
): SnapPoint[] => {
  const canvasSnapPoints = generateCanvasSnapPoints(canvasBounds);
  const nearbySnapPoints: SnapPoint[] = [];
  
  for (const snapPoint of canvasSnapPoints) {
    let distance: number;
    
    // Calculate distance based on snap point type
    switch (snapPoint.type) {
      case 'left':
      case 'right':
      case 'centerX':
        // Vertical alignment - compare X coordinates
        distance = Math.abs(elementBounds.centerX - (snapPoint.x || 0));
        if (distance <= snapThreshold) {
          nearbySnapPoints.push({
            ...snapPoint,
            distance
          });
        }
        break;
        
      case 'top':
      case 'bottom':
      case 'centerY':
        // Horizontal alignment - compare Y coordinates
        distance = Math.abs(elementBounds.centerY - (snapPoint.y || 0));
        if (distance <= snapThreshold) {
          nearbySnapPoints.push({
            ...snapPoint,
            distance
          });
        }
        break;
    }
  }
  
  return nearbySnapPoints;
}; 