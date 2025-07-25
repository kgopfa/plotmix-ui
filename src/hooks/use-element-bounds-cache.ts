import { useRef, useCallback, useMemo } from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import {
  createElementBoundsCache,
  updateElementBoundsCache,
  shouldUpdateCache,
  markCacheAsDirty,
  getAlignmentHighlights,
  type ElementBoundsCache,
  type CachedSnapPoint
} from '@/utils/element-bounds-cache';

interface UseElementBoundsCacheProps {
  elements: AnimatedCanvasObject[];
  snapThreshold?: number;
}

export const useElementBoundsCache = ({ elements, snapThreshold = 10 }: UseElementBoundsCacheProps) => {
  const cacheRef = useRef<ElementBoundsCache>(createElementBoundsCache());

  // Update cache when elements change
  const updateCache = useCallback(() => {
    const cache = cacheRef.current;
    
    if (shouldUpdateCache(cache, elements)) {
      cacheRef.current = updateElementBoundsCache(cache, elements);
    }
  }, [elements]);

  // Get alignment highlights for an element
  const getAlignmentHighlightsForElement = useCallback((
    elementBounds: { left: number; right: number; top: number; bottom: number; centerX: number; centerY: number },
    excludeElementId?: string
  ): CachedSnapPoint[] => {
    updateCache();
    return getAlignmentHighlights(
      elementBounds,
      cacheRef.current,
      snapThreshold,
      excludeElementId
    );
  }, [updateCache, snapThreshold]);

  // Mark cache as dirty (when elements are modified)
  const markCacheDirty = useCallback(() => {
    cacheRef.current = markCacheAsDirty(cacheRef.current);
  }, []);

  // Get current cache state
  const cacheState = useMemo(() => {
    updateCache();
    return {
      isDirty: cacheRef.current.isDirty,
      lastUpdate: cacheRef.current.lastUpdate,
      elementCount: cacheRef.current.bounds.size,
      snapPointCount: cacheRef.current.snapPoints.size
    };
  }, [updateCache]);

  return {
    getAlignmentHighlightsForElement,
    markCacheDirty,
    cacheState,
    updateCache,
    cache: cacheRef.current
  };
}; 