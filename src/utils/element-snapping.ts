import { AnimatedCanvasObject } from '../types/canvas';
import { GridConfig } from './grid-utils';
import { findCanvasSnapPoints, getCanvasBounds } from './canvas-snapping';
import type { ElementBoundsCache, CachedSnapPoint } from './element-bounds-cache';

export interface SnapPoint {
  x?: number;
  y?: number;
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'spacingX' | 'spacingY' | 'distributionX' | 'distributionY';
  sourceElementId: string;
  distance: number;
  spacingInfo?: {
    spacing: number;
    referenceElements: string[];
  };
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal' | 'spacing';
  position: number;
  sourceElementId: string;
  targetElementId: string;
  alignmentType: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY' | 'spacingX' | 'spacingY' | 'distributionX' | 'distributionY';
  spacingInfo?: {
    spacing: number;
    referenceElements: string[];
    direction: 'horizontal' | 'vertical';
  };
}

export interface ElementBounds {
  id: string;
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
 * Calculate element bounds including position and dimensions
 */
export const getElementBounds = (element: AnimatedCanvasObject): ElementBounds => {
  const halfWidth = element.width / 2;
  const halfHeight = element.height / 2;
  
  return {
    id: element.id,
    left: element.x - halfWidth,
    right: element.x + halfWidth,
    top: element.y - halfHeight,
    bottom: element.y + halfHeight,
    centerX: element.x,
    centerY: element.y,
    width: element.width,
    height: element.height
  };
};

/**
 * Get all potential snap points from an element
 */
export const getElementSnapPoints = (bounds: ElementBounds): Array<{type: SnapPoint['type'], value: number}> => {
  return [
    { type: 'left', value: bounds.left },
    { type: 'right', value: bounds.right },
    { type: 'top', value: bounds.top },
    { type: 'bottom', value: bounds.bottom },
    { type: 'centerX', value: bounds.centerX },
    { type: 'centerY', value: bounds.centerY }
  ];
};

/**
 * Generate grid center snap points within the vicinity of an element
 */
export const generateGridCenterSnapPoints = (
  elementBounds: ElementBounds,
  gridConfig: GridConfig,
  snapThreshold: number = 10
): SnapPoint[] => {
  if (!gridConfig.enabled) return [];
  
  const snapPoints: SnapPoint[] = [];
  const { size } = gridConfig;
  
  // Calculate grid centers around the element
  const padding = snapThreshold + size; // Look slightly beyond the snap threshold
  const minX = elementBounds.centerX - padding;
  const maxX = elementBounds.centerX + padding;
  const minY = elementBounds.centerY - padding;
  const maxY = elementBounds.centerY + padding;
  
  // Find grid center points (offset by half grid size from grid lines)
  const startGridX = Math.floor(minX / size) * size + size / 2;
  const endGridX = Math.ceil(maxX / size) * size + size / 2;
  const startGridY = Math.floor(minY / size) * size + size / 2;
  const endGridY = Math.ceil(maxY / size) * size + size / 2;
  
  // Generate vertical grid center snap points (centerX alignment)
  for (let gridCenterX = startGridX; gridCenterX <= endGridX; gridCenterX += size) {
    const distance = Math.abs(elementBounds.centerX - gridCenterX);
    if (distance <= snapThreshold) {
      snapPoints.push({
        type: 'centerX',
        sourceElementId: 'grid-center',
        distance,
        x: gridCenterX
      });
    }
  }
  
  // Generate horizontal grid center snap points (centerY alignment)
  for (let gridCenterY = startGridY; gridCenterY <= endGridY; gridCenterY += size) {
    const distance = Math.abs(elementBounds.centerY - gridCenterY);
    if (distance <= snapThreshold) {
      snapPoints.push({
        type: 'centerY',
        sourceElementId: 'grid-center',
        distance,
        y: gridCenterY
      });
    }
  }
  
  return snapPoints;
};

/**
 * Find nearby elements and their snap points for a dragged element
 */
export const findNearbySnapPoints = (
  draggedElement: AnimatedCanvasObject,
  allElements: AnimatedCanvasObject[],
  snapThreshold: number = 10,
  gridConfig?: GridConfig,
  enableSpacing: boolean = true,
  enableDistribution: boolean = true,
  canvasBounds?: { width: number; height: number; centerX?: number; centerY?: number }
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  const draggedBounds = getElementBounds(draggedElement);
  
  // Add canvas snap points if canvas bounds are provided
  if (canvasBounds) {
    const canvasBoundsObj = getCanvasBounds(
      canvasBounds.width,
      canvasBounds.height,
      canvasBounds.centerX || 0,
      canvasBounds.centerY || 0
    );
    const canvasSnapPoints = findCanvasSnapPoints(draggedBounds, canvasBoundsObj, snapThreshold);
    snapPoints.push(...canvasSnapPoints);
  }
  
  // Add grid center snap points if grid config is provided
  if (gridConfig) {
    const gridSnapPoints = generateGridCenterSnapPoints(draggedBounds, gridConfig, snapThreshold);
    snapPoints.push(...gridSnapPoints);
  }
  
  // Add spacing and distribution snap points
  if (enableSpacing) {
    const spacingSnapPoints = findEqualSpacingSnapPoints(draggedElement, allElements, snapThreshold);
    snapPoints.push(...spacingSnapPoints);
  }
  
  if (enableDistribution) {
    const distributionSnapPoints = findDistributionSnapPoints(draggedElement, allElements, snapThreshold);
    snapPoints.push(...distributionSnapPoints);
  }
  
  // Get other elements (excluding the one being dragged)
  const otherElements = allElements.filter(el => 
    el.id !== draggedElement.id && !el.isAnimationPath
  );
  
  for (const element of otherElements) {
    const elementBounds = getElementBounds(element);
    const elementSnapPoints = getElementSnapPoints(elementBounds);
    
    // Check each snap point type
    for (const snapPoint of elementSnapPoints) {
      let distance: number;
      
      // Calculate distance based on snap point type
      switch (snapPoint.type) {
        case 'left':
        case 'right':
        case 'centerX':
          // Vertical alignment - compare X coordinates
          distance = Math.abs(draggedBounds.centerX - snapPoint.value);
          if (distance <= snapThreshold) {
            const snapValue: SnapPoint = {
              type: snapPoint.type,
              sourceElementId: element.id,
              distance: distance,
              x: snapPoint.value
            };
            snapPoints.push(snapValue);
          }
          break;
          
        case 'top':
        case 'bottom':
        case 'centerY':
          // Horizontal alignment - compare Y coordinates
          distance = Math.abs(draggedBounds.centerY - snapPoint.value);
          if (distance <= snapThreshold) {
            const snapValue: SnapPoint = {
              type: snapPoint.type,
              sourceElementId: element.id,
              distance: distance,
              y: snapPoint.value
            };
            snapPoints.push(snapValue);
          }
          break;
      }
    }
  }
  
  return snapPoints;
};

/**
 * Find the best snap points (closest ones) for X and Y coordinates
 */
export const getBestSnapPoints = (snapPoints: SnapPoint[]): { x?: SnapPoint; y?: SnapPoint } => {
  let bestX: SnapPoint | undefined;
  let bestY: SnapPoint | undefined;
  
  for (const point of snapPoints) {
    if (point.x !== undefined) {
      if (!bestX || point.distance < bestX.distance) {
        bestX = point;
      }
    }
    
    if (point.y !== undefined) {
      if (!bestY || point.distance < bestY.distance) {
        bestY = point;
      }
    }
  }
  
  return { x: bestX, y: bestY };
};

/**
 * Apply snapping to element position based on snap points
 */
export const applyElementSnapping = (
  element: AnimatedCanvasObject,
  allElements: AnimatedCanvasObject[],
  snapThreshold: number = 20, // Increased threshold for easier testing
  enableSpacing: boolean = true,
  enableDistribution: boolean = true,
  canvasBounds?: { width: number; height: number; centerX?: number; centerY?: number }
): { x: number; y: number; guides: SnapGuide[] } => {
  // Disable grid snapping to prevent jittering and constant green lines
  const snapPoints = findNearbySnapPoints(element, allElements, snapThreshold, undefined, enableSpacing, enableDistribution, canvasBounds);
  const { x: bestX, y: bestY } = getBestSnapPoints(snapPoints);
  
  let newX = element.x;
  let newY = element.y;
  const guides: SnapGuide[] = [];
  
  // Apply X snapping
  if (bestX && bestX.x !== undefined) {
    const elementBounds = getElementBounds(element);
    
    // Calculate new position based on snap type
    if (bestX.type === 'left') {
      // Element's left edge snaps to canvas left edge
      newX = bestX.x + elementBounds.width / 2;
    } else if (bestX.type === 'right') {
      // Element's right edge snaps to canvas right edge
      newX = bestX.x - elementBounds.width / 2;
    } else {
      // Center alignment (centerX)
      newX = bestX.x;
    }
    
    // Create appropriate guide based on snap type
    const guideType = bestX.type.includes('spacing') || bestX.type.includes('distribution') ? 'spacing' : 'vertical';
    
    // For center alignment, position guide at the center of the element
    // For edge alignment, position guide at the edge
    let guidePosition = bestX.x;
    if (bestX.type === 'centerX') {
      // For center alignment, use the center position
      guidePosition = bestX.x;
    } else if (bestX.type === 'left' || bestX.type === 'right') {
      // For edge alignment, use the edge position
      guidePosition = bestX.x;
    }
    
    guides.push({
      type: guideType,
      position: guidePosition,
      sourceElementId: bestX.sourceElementId,
      targetElementId: element.id,
      alignmentType: bestX.type,
      spacingInfo: bestX.spacingInfo ? {
        ...bestX.spacingInfo,
        direction: 'horizontal'
      } : undefined
    });
  }
  
  // Apply Y snapping
  if (bestY && bestY.y !== undefined) {
    const elementBounds = getElementBounds(element);
    
    // Calculate new position based on snap type
    if (bestY.type === 'top') {
      // Element's top edge snaps to canvas top edge
      newY = bestY.y + elementBounds.height / 2;
    } else if (bestY.type === 'bottom') {
      // Element's bottom edge snaps to canvas bottom edge
      newY = bestY.y - elementBounds.height / 2;
    } else {
      // Center alignment (centerY)
      newY = bestY.y;
    }
    
    // Create appropriate guide based on snap type
    const guideType = bestY.type.includes('spacing') || bestY.type.includes('distribution') ? 'spacing' : 'horizontal';
    
    // For center alignment, position guide at the center of the element
    // For edge alignment, position guide at the edge
    let guidePosition = bestY.y;
    if (bestY.type === 'centerY') {
      // For center alignment, use the center position
      guidePosition = bestY.y;
    } else if (bestY.type === 'top' || bestY.type === 'bottom') {
      // For edge alignment, use the edge position
      guidePosition = bestY.y;
    }
    
    guides.push({
      type: guideType,
      position: guidePosition,
      sourceElementId: bestY.sourceElementId,
      targetElementId: element.id,
      alignmentType: bestY.type,
      spacingInfo: bestY.spacingInfo ? {
        ...bestY.spacingInfo,
        direction: 'vertical'
      } : undefined
    });
  }
  
  return { x: newX, y: newY, guides };
};

/**
 * Check if two elements are aligned along a specific axis
 */
export const areElementsAligned = (
  element1: AnimatedCanvasObject,
  element2: AnimatedCanvasObject,
  tolerance: number = 2
): { x: boolean; y: boolean; alignmentTypes: SnapPoint['type'][] } => {
  const bounds1 = getElementBounds(element1);
  const bounds2 = getElementBounds(element2);
  
  const alignmentTypes: SnapPoint['type'][] = [];
  
  // Check X alignment
  const xAligned = 
    Math.abs(bounds1.left - bounds2.left) <= tolerance ||
    Math.abs(bounds1.right - bounds2.right) <= tolerance ||
    Math.abs(bounds1.centerX - bounds2.centerX) <= tolerance;
    
  if (Math.abs(bounds1.left - bounds2.left) <= tolerance) alignmentTypes.push('left');
  if (Math.abs(bounds1.right - bounds2.right) <= tolerance) alignmentTypes.push('right');
  if (Math.abs(bounds1.centerX - bounds2.centerX) <= tolerance) alignmentTypes.push('centerX');
  
  // Check Y alignment  
  const yAligned = 
    Math.abs(bounds1.top - bounds2.top) <= tolerance ||
    Math.abs(bounds1.bottom - bounds2.bottom) <= tolerance ||
    Math.abs(bounds1.centerY - bounds2.centerY) <= tolerance;
    
  if (Math.abs(bounds1.top - bounds2.top) <= tolerance) alignmentTypes.push('top');
  if (Math.abs(bounds1.bottom - bounds2.bottom) <= tolerance) alignmentTypes.push('bottom');
  if (Math.abs(bounds1.centerY - bounds2.centerY) <= tolerance) alignmentTypes.push('centerY');
  
  return { x: xAligned, y: yAligned, alignmentTypes };
};

/**
 * Generate snap guides for multiple selected elements
 */
export const generateSnapGuides = (
  selectedElements: AnimatedCanvasObject[],
  allElements: AnimatedCanvasObject[]
): SnapGuide[] => {
  const guides: SnapGuide[] = [];
  
  for (const selectedElement of selectedElements) {
    const { guides: elementGuides } = applyElementSnapping(selectedElement, allElements);
    guides.push(...elementGuides);
  }
  
  return guides;
};

/**
 * Find equal spacing snap points - maintains consistent distances between elements
 */
export const findEqualSpacingSnapPoints = (
  draggedElement: AnimatedCanvasObject,
  allElements: AnimatedCanvasObject[],
  snapThreshold: number = 10
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  const draggedBounds = getElementBounds(draggedElement);
  
  // Get other elements (excluding the one being dragged)
  const otherElements = allElements.filter(el => 
    el.id !== draggedElement.id && !el.isAnimationPath
  );
  
  if (otherElements.length < 2) return snapPoints; // Need at least 2 other elements for spacing
  
  const otherBounds = otherElements.map(getElementBounds);
  
  // Look for horizontal spacing patterns
  for (let i = 0; i < otherBounds.length; i++) {
    for (let j = i + 1; j < otherBounds.length; j++) {
      const elem1 = otherBounds[i];
      const elem2 = otherBounds[j];
      
      // Check if elements are roughly aligned vertically (same Y center)
      if (Math.abs(elem1.centerY - elem2.centerY) <= snapThreshold) {
        const spacing = Math.abs(elem2.centerX - elem1.centerX);
        const leftElement = elem1.centerX < elem2.centerX ? elem1 : elem2;
        const rightElement = elem1.centerX < elem2.centerX ? elem2 : elem1;
        
        // Try snapping to maintain equal spacing on the left
        const targetXLeft = leftElement.centerX - spacing;
        const distanceLeft = Math.abs(draggedBounds.centerX - targetXLeft);
        if (distanceLeft <= snapThreshold) {
          snapPoints.push({
            type: 'spacingX',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceLeft,
            x: targetXLeft,
            spacingInfo: {
              spacing,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
        
        // Try snapping to maintain equal spacing on the right
        const targetXRight = rightElement.centerX + spacing;
        const distanceRight = Math.abs(draggedBounds.centerX - targetXRight);
        if (distanceRight <= snapThreshold) {
          snapPoints.push({
            type: 'spacingX',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceRight,
            x: targetXRight,
            spacingInfo: {
              spacing,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
        
        // Try snapping to position between elements (equal spacing)
        const targetXBetween = (leftElement.centerX + rightElement.centerX) / 2;
        const distanceBetween = Math.abs(draggedBounds.centerX - targetXBetween);
        if (distanceBetween <= snapThreshold) {
          snapPoints.push({
            type: 'spacingX',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceBetween,
            x: targetXBetween,
            spacingInfo: {
              spacing: spacing / 2,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
      }
    }
  }
  
  // Look for vertical spacing patterns  
  for (let i = 0; i < otherBounds.length; i++) {
    for (let j = i + 1; j < otherBounds.length; j++) {
      const elem1 = otherBounds[i];
      const elem2 = otherBounds[j];
      
      // Check if elements are roughly aligned horizontally (same X center)
      if (Math.abs(elem1.centerX - elem2.centerX) <= snapThreshold) {
        const spacing = Math.abs(elem2.centerY - elem1.centerY);
        const topElement = elem1.centerY < elem2.centerY ? elem1 : elem2;
        const bottomElement = elem1.centerY < elem2.centerY ? elem2 : elem1;
        
        // Try snapping to maintain equal spacing above
        const targetYTop = topElement.centerY - spacing;
        const distanceTop = Math.abs(draggedBounds.centerY - targetYTop);
        if (distanceTop <= snapThreshold) {
          snapPoints.push({
            type: 'spacingY',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceTop,
            y: targetYTop,
            spacingInfo: {
              spacing,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
        
        // Try snapping to maintain equal spacing below
        const targetYBottom = bottomElement.centerY + spacing;
        const distanceBottom = Math.abs(draggedBounds.centerY - targetYBottom);
        if (distanceBottom <= snapThreshold) {
          snapPoints.push({
            type: 'spacingY',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceBottom,
            y: targetYBottom,
            spacingInfo: {
              spacing,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
        
        // Try snapping to position between elements (equal spacing)
        const targetYBetween = (topElement.centerY + bottomElement.centerY) / 2;
        const distanceBetween = Math.abs(draggedBounds.centerY - targetYBetween);
        if (distanceBetween <= snapThreshold) {
          snapPoints.push({
            type: 'spacingY',
            sourceElementId: `spacing-${elem1.id}-${elem2.id}`,
            distance: distanceBetween,
            y: targetYBetween,
            spacingInfo: {
              spacing: spacing / 2,
              referenceElements: [elem1.id, elem2.id]
            }
          });
        }
      }
    }
  }
  
  return snapPoints;
};

/**
 * Find distribution snap points - evenly distribute elements across space
 */
export const findDistributionSnapPoints = (
  draggedElement: AnimatedCanvasObject,
  allElements: AnimatedCanvasObject[],
  snapThreshold: number = 10
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  const draggedBounds = getElementBounds(draggedElement);
  
  // Get other elements (excluding the one being dragged)
  const otherElements = allElements.filter(el => 
    el.id !== draggedElement.id && !el.isAnimationPath
  );
  
  if (otherElements.length < 2) return snapPoints; // Need at least 2 other elements for distribution
  
  const otherBounds = otherElements.map(getElementBounds);
  
  // Horizontal distribution
  const horizontallySorted = [...otherBounds].sort((a, b) => a.centerX - b.centerX);
  if (horizontallySorted.length >= 2) {
    const leftMost = horizontallySorted[0];
    const rightMost = horizontallySorted[horizontallySorted.length - 1];
    const totalWidth = rightMost.centerX - leftMost.centerX;
    const segments = horizontallySorted.length + 1; // +1 for the dragged element
    const segmentWidth = totalWidth / segments;
    
    // Try each possible position in the distribution
    for (let i = 1; i < segments; i++) {
      const targetX = leftMost.centerX + (segmentWidth * i);
      const distance = Math.abs(draggedBounds.centerX - targetX);
      
      if (distance <= snapThreshold) {
        snapPoints.push({
          type: 'distributionX',
          sourceElementId: `distribution-${leftMost.id}-${rightMost.id}`,
          distance,
          x: targetX,
          spacingInfo: {
            spacing: segmentWidth,
            referenceElements: [leftMost.id, rightMost.id]
          }
        });
      }
    }
  }
  
  // Vertical distribution
  const verticallySorted = [...otherBounds].sort((a, b) => a.centerY - b.centerY);
  if (verticallySorted.length >= 2) {
    const topMost = verticallySorted[0];
    const bottomMost = verticallySorted[verticallySorted.length - 1];
    const totalHeight = bottomMost.centerY - topMost.centerY;
    const segments = verticallySorted.length + 1; // +1 for the dragged element
    const segmentHeight = totalHeight / segments;
    
    // Try each possible position in the distribution
    for (let i = 1; i < segments; i++) {
      const targetY = topMost.centerY + (segmentHeight * i);
      const distance = Math.abs(draggedBounds.centerY - targetY);
      
      if (distance <= snapThreshold) {
        snapPoints.push({
          type: 'distributionY',
          sourceElementId: `distribution-${topMost.id}-${bottomMost.id}`,
          distance,
          y: targetY,
          spacingInfo: {
            spacing: segmentHeight,
            referenceElements: [topMost.id, bottomMost.id]
          }
        });
      }
    }
  }
  
  return snapPoints;
}; 

/**
 * Find nearby snap points using cached element bounds data
 */
export const findNearbySnapPointsCached = (
  draggedElement: AnimatedCanvasObject,
  cache: ElementBoundsCache,
  snapThreshold: number = 10,
  gridConfig?: GridConfig,
  canvasBounds?: { width: number; height: number; centerX?: number; centerY?: number }
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  const draggedBounds = getElementBounds(draggedElement);
  
  // Add canvas snap points if canvas bounds are provided
  if (canvasBounds) {
    const canvasBoundsObj = getCanvasBounds(
      canvasBounds.width,
      canvasBounds.height,
      canvasBounds.centerX || 0,
      canvasBounds.centerY || 0
    );
    const canvasSnapPoints = findCanvasSnapPoints(draggedBounds, canvasBoundsObj, snapThreshold);
    snapPoints.push(...canvasSnapPoints);
  }
  
  // Add grid center snap points if grid config is provided
  if (gridConfig) {
    const gridSnapPoints = generateGridCenterSnapPoints(draggedBounds, gridConfig, snapThreshold);
    snapPoints.push(...gridSnapPoints);
  }
  
  // Use cached snap points for element-to-element alignment
  if (cache.snapPoints) {
    cache.snapPoints.forEach((elementSnapPoints: CachedSnapPoint[], elementId: string) => {
      if (elementId === draggedElement.id) return;
      
      elementSnapPoints.forEach((snapPoint: CachedSnapPoint) => {
        let distance: number;
        
        // Calculate distance based on snap point type
        switch (snapPoint.type) {
          case 'left':
          case 'right':
          case 'centerX':
            // Vertical alignment - compare X coordinates
            if (snapPoint.x !== undefined) {
              distance = Math.abs(draggedBounds.centerX - snapPoint.x);
              if (distance <= snapThreshold) {
                snapPoints.push({
                  type: snapPoint.type,
                  sourceElementId: elementId,
                  distance,
                  x: snapPoint.x
                });
              }
            }
            break;
            
          case 'top':
          case 'bottom':
          case 'centerY':
            // Horizontal alignment - compare Y coordinates
            if (snapPoint.y !== undefined) {
              distance = Math.abs(draggedBounds.centerY - snapPoint.y);
              if (distance <= snapThreshold) {
                snapPoints.push({
                  type: snapPoint.type,
                  sourceElementId: elementId,
                  distance,
                  y: snapPoint.y
                });
              }
            }
            break;
        }
      });
    });
  }
  
  return snapPoints;
}; 