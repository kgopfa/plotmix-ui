import { AnimatedCanvasObject } from '@/types/canvas';
import { CanvasGroup } from '@/types/canvas';
import { getElementBounds } from './element-snapping';

export interface EdgeSnapResult {
  snapped: boolean;
  point: { x: number; y: number };
  targetId: string;
  targetType: 'element' | 'group';
  distance: number;
  edgeType: 'top' | 'bottom' | 'left' | 'right';
}

/**
 * Calculate the bounds of a group based on its elements
 */
export const getGroupBounds = (
  group: CanvasGroup,
  elements: AnimatedCanvasObject[]
): { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number } => {
  const groupElements = elements.filter(el => group.elementIds.includes(el.id));
  
  if (groupElements.length === 0) {
    // Fallback to group center with default size
    return {
      left: group.x - 50,
      right: group.x + 50,
      top: group.y - 50,
      bottom: group.y + 50,
      centerX: group.x,
      centerY: group.y
    };
  }

  // Calculate bounding box of all elements in the group
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  
  groupElements.forEach(el => {
    const halfW = el.width / 2;
    const halfH = el.height / 2;
    const left = el.x - halfW;
    const right = el.x + halfW;
    const top = el.y - halfH;
    const bottom = el.y + halfH;
    
    minX = Math.min(minX, left);
    minY = Math.min(minY, top);
    maxX = Math.max(maxX, right);
    maxY = Math.max(maxY, bottom);
  });

  return {
    left: minX,
    right: maxX,
    top: minY,
    bottom: maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2
  };
};

/**
 * Find the closest point on a rectangle's perimeter to a given point
 * This is the key function for Draw.io-style edge snapping
 */
export const findNearestPointOnRectangleEdge = (
  point: { x: number; y: number },
  bounds: { left: number; right: number; top: number; bottom: number }
): { point: { x: number; y: number }; distance: number; edgeType: 'top' | 'bottom' | 'left' | 'right' } => {
  const { left, right, top, bottom } = bounds;
  const { x, y } = point;

  // Calculate distance to each edge and the closest point on that edge
  const edges = [
    {
      type: 'top' as const,
      point: { x: Math.max(left, Math.min(right, x)), y: top },
    },
    {
      type: 'bottom' as const,
      point: { x: Math.max(left, Math.min(right, x)), y: bottom },
    },
    {
      type: 'left' as const,
      point: { x: left, y: Math.max(top, Math.min(bottom, y)) },
    },
    {
      type: 'right' as const,
      point: { x: right, y: Math.max(top, Math.min(bottom, y)) },
    },
  ];

  // Find the edge with the closest point
  let closestEdge = edges[0];
  let minDistance = Math.hypot(
    closestEdge.point.x - x,
    closestEdge.point.y - y
  );

  for (let i = 1; i < edges.length; i++) {
    const distance = Math.hypot(edges[i].point.x - x, edges[i].point.y - y);
    if (distance < minDistance) {
      minDistance = distance;
      closestEdge = edges[i];
    }
  }

  return {
    point: closestEdge.point,
    distance: minDistance,
    edgeType: closestEdge.type,
  };
};

/**
 * Check if a point should snap to any element or group edge
 * Returns the nearest snap point if within threshold
 */
export const findLineEndpointEdgeSnap = (
  point: { x: number; y: number },
  elements: AnimatedCanvasObject[],
  groups: CanvasGroup[],
  snapThreshold: number = 30,
  excludeElementIds: string[] = []
): EdgeSnapResult | null => {
  let bestSnap: EdgeSnapResult | null = null;

  // Check all elements (excluding animation paths and excluded elements)
  const snappableElements = elements.filter(
    el => !el.isAnimationPath && !excludeElementIds.includes(el.id)
  );

  for (const element of snappableElements) {
    const bounds = getElementBounds(element);
    const result = findNearestPointOnRectangleEdge(point, bounds);

    if (result.distance <= snapThreshold) {
      if (!bestSnap || result.distance < bestSnap.distance) {
        bestSnap = {
          snapped: true,
          point: result.point,
          targetId: element.id,
          targetType: 'element',
          distance: result.distance,
          edgeType: result.edgeType,
        };
      }
    }
  }

  // Check all groups
  for (const group of groups) {
    const bounds = getGroupBounds(group, elements);
    const result = findNearestPointOnRectangleEdge(point, bounds);

    if (result.distance <= snapThreshold) {
      if (!bestSnap || result.distance < bestSnap.distance) {
        bestSnap = {
          snapped: true,
          point: result.point,
          targetId: group.id,
          targetType: 'group',
          distance: result.distance,
          edgeType: result.edgeType,
        };
      }
    }
  }

  return bestSnap;
};

/**
 * Apply edge snapping to a line endpoint if hovering near an element or group
 * This is used when drawing new lines or dragging existing line endpoints
 */
export const applyLineEndpointSnapping = (
  point: { x: number; y: number },
  elements: AnimatedCanvasObject[],
  groups: CanvasGroup[],
  snapThreshold: number = 30,
  excludeElementIds: string[] = [],
  isEnabled: boolean = true
): { point: { x: number; y: number }; snapResult: EdgeSnapResult | null } => {
  if (!isEnabled) {
    return { point, snapResult: null };
  }

  const snapResult = findLineEndpointEdgeSnap(
    point,
    elements,
    groups,
    snapThreshold,
    excludeElementIds
  );

  if (snapResult) {
    return { point: snapResult.point, snapResult };
  }

  return { point, snapResult: null };
};

