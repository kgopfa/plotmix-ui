import type { AnimatedCanvasObject } from '../types/canvas';
import { getElementBounds } from './element-snapping';

export interface CachedElementBounds {
  id: string;
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
  lastUpdated: number;
}

export interface CachedSnapPoint {
  x?: number;
  y?: number;
  type: 'left' | 'right' | 'top' | 'bottom' | 'centerX' | 'centerY';
  sourceElementId: string;
  distance: number;
}

export interface ElementBoundsCache {
  bounds: Map<string, CachedElementBounds>;
  snapPoints: Map<string, CachedSnapPoint[]>;
  lastUpdate: number;
  isDirty: boolean;
}

/**
 * Create a new element bounds cache
 */
export const createElementBoundsCache = (): ElementBoundsCache => ({
  bounds: new Map(),
  snapPoints: new Map(),
  lastUpdate: 0,
  isDirty: true
});

/**
 * Calculate bounds for a single element
 */
export const calculateElementBounds = (element: AnimatedCanvasObject): CachedElementBounds => {
  const bounds = getElementBounds(element);
  
  return {
    id: element.id,
    left: bounds.left,
    right: bounds.right,
    top: bounds.top,
    bottom: bounds.bottom,
    centerX: bounds.centerX,
    centerY: bounds.centerY,
    width: bounds.width,
    height: bounds.height,
    lastUpdated: Date.now()
  };
};

/**
 * Update the cache with current element bounds
 */
export const updateElementBoundsCache = (
  cache: ElementBoundsCache,
  elements: AnimatedCanvasObject[]
): ElementBoundsCache => {
  const newBounds = new Map<string, CachedElementBounds>();
  const newSnapPoints = new Map<string, CachedSnapPoint[]>();
  
  // Calculate bounds for all elements
  elements.forEach(element => {
    if (!element.isAnimationPath) {
      const bounds = calculateElementBounds(element);
      newBounds.set(element.id, bounds);
    }
  });
  
  // Generate snap points for each element
  elements.forEach(element => {
    if (!element.isAnimationPath) {
      const elementBounds = newBounds.get(element.id);
      if (elementBounds) {
        const snapPoints: CachedSnapPoint[] = [];
        
        // Generate snap points for this element
        snapPoints.push(
          { type: 'left', sourceElementId: element.id, x: elementBounds.left, distance: 0 },
          { type: 'right', sourceElementId: element.id, x: elementBounds.right, distance: 0 },
          { type: 'top', sourceElementId: element.id, y: elementBounds.top, distance: 0 },
          { type: 'bottom', sourceElementId: element.id, y: elementBounds.bottom, distance: 0 },
          { type: 'centerX', sourceElementId: element.id, x: elementBounds.centerX, distance: 0 },
          { type: 'centerY', sourceElementId: element.id, y: elementBounds.centerY, distance: 0 }
        );
        
        newSnapPoints.set(element.id, snapPoints);
      }
    }
  });
  
  return {
    bounds: newBounds,
    snapPoints: newSnapPoints,
    lastUpdate: Date.now(),
    isDirty: false
  };
};

/**
 * Get cached bounds for an element
 */
export const getCachedElementBounds = (
  cache: ElementBoundsCache,
  elementId: string
): CachedElementBounds | undefined => {
  return cache.bounds.get(elementId);
};

/**
 * Get cached snap points for an element
 */
export const getCachedSnapPoints = (
  cache: ElementBoundsCache,
  elementId: string
): CachedSnapPoint[] => {
  return cache.snapPoints.get(elementId) || [];
};

/**
 * Get all cached snap points
 */
export const getAllCachedSnapPoints = (cache: ElementBoundsCache): CachedSnapPoint[] => {
  const allSnapPoints: CachedSnapPoint[] = [];
  cache.snapPoints.forEach(snapPoints => {
    allSnapPoints.push(...snapPoints);
  });
  return allSnapPoints;
};

/**
 * Find nearby snap points using cached data
 */
export const findNearbySnapPointsCached = (
  elementBounds: { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number },
  cache: ElementBoundsCache,
  snapThreshold: number = 10,
  excludeElementId?: string
): CachedSnapPoint[] => {
  const nearbySnapPoints: CachedSnapPoint[] = [];
  
  cache.snapPoints.forEach((snapPoints, elementId) => {
    // Skip the element being moved/resized
    if (excludeElementId && elementId === excludeElementId) {
      return;
    }
    
    snapPoints.forEach(snapPoint => {
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
    });
  });
  
  return nearbySnapPoints;
};

/**
 * Mark cache as dirty (needs update)
 */
export const markCacheAsDirty = (cache: ElementBoundsCache): ElementBoundsCache => {
  return {
    ...cache,
    isDirty: true
  };
};

/**
 * Check if cache needs update
 */
export const shouldUpdateCache = (
  cache: ElementBoundsCache,
  elements: AnimatedCanvasObject[]
): boolean => {
  if (cache.isDirty) return true;
  
  // Check if element count changed
  const cachedElementIds = new Set(cache.bounds.keys());
  const currentElementIds = new Set(
    elements.filter(el => !el.isAnimationPath).map(el => el.id)
  );
  
  if (cachedElementIds.size !== currentElementIds.size) return true;
  
  // Check if any element IDs don't match
  for (const id of cachedElementIds) {
    if (!currentElementIds.has(id)) return true;
  }
  
  return false;
};

/**
 * Get alignment highlights for an element
 */
export const getAlignmentHighlights = (
  elementBounds: { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number },
  cache: ElementBoundsCache,
  snapThreshold: number = 10,
  excludeElementId?: string
): CachedSnapPoint[] => {
  return findNearbySnapPointsCached(elementBounds, cache, snapThreshold, excludeElementId);
}; 