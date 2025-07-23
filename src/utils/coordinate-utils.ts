import type { FederatedPointerEvent } from 'pixi.js';
import type { Container } from 'pixi.js';

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
  
  if (viewport && viewport.toLocal) {
    // Step 1: Convert global coordinates to viewport coordinates
    const viewportLocal = viewport.toLocal(globalCoords);
    
    // Step 2: Convert viewport coordinates to design canvas local coordinates
    // The design canvas is positioned at centerX, centerY relative to the viewport
    const localPos = {
      x: viewportLocal.x - designCanvasContainer.x,
      y: viewportLocal.y - designCanvasContainer.y
    };
    
    return localPos;
  } else {
    // Fallback to direct conversion if viewport is not available
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
 * Debug coordinate conversion for troubleshooting
 * 
 * @param globalCoords - Global coordinates
 * @param localCoords - Local coordinates
 * @param designCanvasContainer - The design canvas container
 */
export function debugCoordinateConversion(
  globalCoords: { x: number; y: number },
  localCoords: { x: number; y: number },
  designCanvasContainer: Container
): void {
  const viewport = designCanvasContainer.parent;
  
  console.log('[Coordinate Debug]', {
    global: globalCoords,
    local: localCoords,
    containerPosition: { x: designCanvasContainer.x, y: designCanvasContainer.y },
    containerScale: { x: designCanvasContainer.scale?.x, y: designCanvasContainer.scale?.y },
    viewportScale: viewport?.scale,
    viewportPosition: viewport?.position
  });
} 