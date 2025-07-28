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

/**
 * Detect alignment between a line being drawn and existing elements
 * This provides visual feedback without actually snapping the line
 * 
 * @param startPoint - The starting point of the line being drawn
 * @param endPoint - The current end point of the line being drawn
 * @param elements - All existing elements to check alignment against
 * @param alignmentThreshold - Distance threshold for alignment detection
 * @returns Array of alignment guides for visual feedback
 */
export interface LineAlignmentGuide {
  type: 'horizontal' | 'vertical';
  position: number;
  sourceElementId: string;
  alignmentType: 'edge' | 'center';
  elementBounds: { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number };
}

export function detectLineAlignment(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  elements: Array<{ id: string; x: number; y: number; width: number; height: number; type?: string }>,
  alignmentThreshold: number = 10
): LineAlignmentGuide[] {
  const guides: LineAlignmentGuide[] = [];
  
  // Calculate line center points
  const lineCenterX = (startPoint.x + endPoint.x) / 2;
  const lineCenterY = (startPoint.y + endPoint.y) / 2;
  
  for (const element of elements) {
    
    
    // Calculate element bounds
    const elementLeft = element.x - element.width / 2;
    const elementRight = element.x + element.width / 2;
    const elementTop = element.y - element.height / 2;
    const elementBottom = element.y + element.height / 2;
    const elementCenterX = element.x;
    const elementCenterY = element.y;
    
    // Check horizontal alignment (vertical guides)
    const horizontalAlignments = [
      { type: 'edge' as const, pos: elementLeft, name: 'left' },
      { type: 'edge' as const, pos: elementRight, name: 'right' },
      { type: 'center' as const, pos: elementCenterX, name: 'centerX' }
    ];
    
    for (const alignment of horizontalAlignments) {
      // Check if line's X coordinates align with this element's X coordinate
      const lineXCoords = [startPoint.x, endPoint.x, lineCenterX];
      
      for (const lineX of lineXCoords) {
        const distance = Math.abs(lineX - alignment.pos);
        if (distance <= alignmentThreshold) {
          guides.push({
            type: 'vertical',
            position: alignment.pos,
            sourceElementId: element.id,
            alignmentType: alignment.type,
            elementBounds: {
              left: elementLeft,
              right: elementRight,
              top: elementTop,
              bottom: elementBottom,
              centerX: elementCenterX,
              centerY: elementCenterY
            }
          });
          break; // Only add one guide per element per alignment type
        }
      }
    }
    
    // Check vertical alignment (horizontal guides)
    const verticalAlignments = [
      { type: 'edge' as const, pos: elementTop, name: 'top' },
      { type: 'edge' as const, pos: elementBottom, name: 'bottom' },
      { type: 'center' as const, pos: elementCenterY, name: 'centerY' }
    ];
    
    for (const alignment of verticalAlignments) {
      // Check if line's Y coordinates align with this element's Y coordinate
      const lineYCoords = [startPoint.y, endPoint.y, lineCenterY];
      
      for (const lineY of lineYCoords) {
        const distance = Math.abs(lineY - alignment.pos);
        if (distance <= alignmentThreshold) {
          guides.push({
            type: 'horizontal',
            position: alignment.pos,
            sourceElementId: element.id,
            alignmentType: alignment.type,
            elementBounds: {
              left: elementLeft,
              right: elementRight,
              top: elementTop,
              bottom: elementBottom,
              centerX: elementCenterX,
              centerY: elementCenterY
            }
          });
          break; // Only add one guide per element per alignment type
        }
      }
    }
  }
  
  // Remove duplicate guides (same position and type)
  const uniqueGuides = guides.filter((guide, index, self) => 
    index === self.findIndex(g => 
      g.type === guide.type && 
      Math.abs(g.position - guide.position) < 1 &&
      g.alignmentType === guide.alignmentType
    )
  );
  
  return uniqueGuides;
}