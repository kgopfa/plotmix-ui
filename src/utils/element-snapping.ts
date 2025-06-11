import { AnimatedCanvasObject } from '../types/canvas';
import { GridConfig } from './grid-utils';

export interface SnapPoint {
  x?: number;
  y?: number;
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
  sourceElementId: string;
  distance: number;
}

export interface SnapGuide {
  type: 'vertical' | 'horizontal';
  position: number;
  sourceElementId: string;
  targetElementId: string;
  alignmentType: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
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
  gridConfig?: GridConfig
): SnapPoint[] => {
  const snapPoints: SnapPoint[] = [];
  const draggedBounds = getElementBounds(draggedElement);
  
  // Add grid center snap points if grid config is provided
  if (gridConfig) {
    const gridSnapPoints = generateGridCenterSnapPoints(draggedBounds, gridConfig, snapThreshold);
    snapPoints.push(...gridSnapPoints);
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
  snapThreshold: number = 10,
  gridConfig?: GridConfig
): { x: number; y: number; guides: SnapGuide[] } => {
  const snapPoints = findNearbySnapPoints(element, allElements, snapThreshold, gridConfig);
  const { x: bestX, y: bestY } = getBestSnapPoints(snapPoints);
  
  let newX = element.x;
  let newY = element.y;
  const guides: SnapGuide[] = [];
  
  // Apply X snapping
  if (bestX && bestX.x !== undefined) {
    newX = bestX.x;
    
    // Create vertical guide (for element snapping or grid center snapping)
    guides.push({
      type: 'vertical',
      position: bestX.x,
      sourceElementId: bestX.sourceElementId,
      targetElementId: element.id,
      alignmentType: bestX.type
    });
  }
  
  // Apply Y snapping
  if (bestY && bestY.y !== undefined) {
    newY = bestY.y;
    
    // Create horizontal guide (for element snapping or grid center snapping)
    guides.push({
      type: 'horizontal',
      position: bestY.y,
      sourceElementId: bestY.sourceElementId,
      targetElementId: element.id,
      alignmentType: bestY.type
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