import type { FederatedPointerEvent } from 'pixi.js';
import type { Container } from 'pixi.js';
import type { ViewportWrapper } from '@/components/editor/viewport/viewport-wrapper';

/**
 * Convert global coordinates to design canvas local coordinates
 * Uses a two-step process: Global → Viewport → Design Canvas
 * 
 * @param globalCoords - Global coordinates (from mouse event)
 * @param designCanvasContainer - The design canvas container
 * @returns Local coordinates relative to the design canvas
 */
export function convertGlobalToDesignCanvasCoords(
  globalCoords: { x: number; y: number },
  designCanvasContainer: Container
): { x: number; y: number } {
  // Get the viewport (parent of design canvas container)
  const viewport = designCanvasContainer.parent;
  
  if (viewport && (viewport as ViewportWrapper).toWorld) {
    // Use pixi-viewport's toWorld method for proper coordinate conversion
    // This automatically handles all viewport transformations (pan, zoom, etc.)
    const worldPos = (viewport as ViewportWrapper).toWorld(globalCoords.x, globalCoords.y);
    
    // Convert world coordinates to design canvas local coordinates
    // The design canvas is positioned at centerX, centerY relative to the viewport
    const localPos = {
      x: worldPos.x - designCanvasContainer.x,
      y: worldPos.y - designCanvasContainer.y
    };
    
    return localPos;
  } else if (viewport && viewport.toLocal) {
    // Fallback to the old method if toWorld is not available
    const viewportLocal = viewport.toLocal(globalCoords);
    const localPos = {
      x: viewportLocal.x - designCanvasContainer.x,
      y: viewportLocal.y - designCanvasContainer.y
    };
    
    return localPos;
  } else {
    // Final fallback to direct conversion if viewport is not available
    return designCanvasContainer.toLocal(globalCoords);
  }
}

/**
 * Convert a FederatedPointerEvent to design canvas local coordinates
 * 
 * @param e - The pointer event
 * @param designCanvasContainer - The design canvas container
 * @returns Local coordinates relative to the design canvas
 */
export function convertPointerEventToDesignCanvasCoords(
  e: FederatedPointerEvent,
  designCanvasContainer: Container
): { x: number; y: number } {
  return convertGlobalToDesignCanvasCoords(e.global, designCanvasContainer);
}

/**
 * Constrain a point to the nearest axis (horizontal or vertical) from a start point
 * This is used for shift-constrained line drawing, similar to Photoshop behavior
 * 
 * @param startPoint - The starting point of the line
 * @param currentPoint - The current mouse position
 * @returns The constrained point that lies on either the horizontal or vertical axis from the start point
 */
export function constrainToAxis(
  startPoint: { x: number; y: number },
  currentPoint: { x: number; y: number }
): { x: number; y: number } {
  const deltaX = Math.abs(currentPoint.x - startPoint.x);
  const deltaY = Math.abs(currentPoint.y - startPoint.y);
  
  // If the horizontal distance is greater, constrain to horizontal axis
  if (deltaX > deltaY) {
    return {
      x: currentPoint.x,
      y: startPoint.y
    };
  } else {
    // Otherwise, constrain to vertical axis
    return {
      x: startPoint.x,
      y: currentPoint.y
    };
  }
}