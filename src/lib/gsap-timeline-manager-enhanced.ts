/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import { GSAPTimelineManager, type TimelinePerformanceMetrics } from './gsap-timeline-manager';

/**
 * Performance metrics interface
 */
interface PerformanceMetrics {
  totalRebuilds: number;
  averageRebuildTime: number;
  lastRebuildTime: number;
  cacheHits: number;
  cacheMisses: number;
  elementsProcessed: number;
  groupsProcessed: number;
}

/**
 * Simplified cache entry for Phase 1
 */
interface CacheEntry {
  animationHash: string;
  lastUpdate: number;
}

/**
 * Enhanced GSAP Timeline Manager with performance optimizations (Phase 1)
 * 
 * Key improvements:
 * - Intelligent change detection to avoid unnecessary rebuilds
 * - Performance metrics tracking
 * - Memory-efficient cache management
 * - Proper error handling
 * - Foundation for Phase 2 individual timeline implementation
 */
export class GSAPTimelineManagerEnhanced extends GSAPTimelineManager {
  private elementCache = new Map<string, CacheEntry>();
  private groupCache = new Map<string, CacheEntry>();
  private metrics: PerformanceMetrics = {
    totalRebuilds: 0,
    averageRebuildTime: 0,
    lastRebuildTime: 0,
    cacheHits: 0,
    cacheMisses: 0,
    elementsProcessed: 0,
    groupsProcessed: 0
  };
  private maxCacheSize = 1000; // Prevent memory leaks
  private readonly CACHE_TTL = 300000; // 5 minutes cache TTL

  constructor() {
    super();
  }

  /**
   * Enhanced timeline building with intelligent optimization
   */
  buildAnimationTimeline(elements: AnimatedCanvasObject[], groups?: CanvasGroup[]) {
    const startTime = performance.now();

    try {
      // Performance check - skip if no animations and already optimized
      if (!this.hasAnimations(elements, groups) && this.timeline.duration() === 0) {
        console.log('Skipping timeline build - no animations found');
        return;
      }

      // Clean expired cache entries
      this.cleanExpiredCache();

      // Detect only changed elements and groups
      const changedElements = this.detectChangedElements(elements);
      const changedGroups = this.detectChangedGroups(groups || []);

      if (changedElements.length === 0 && changedGroups.length === 0) {
        this.metrics.cacheHits++;
        console.log('Cache hit - no changes detected, skipping rebuild');
        return; // No changes, skip rebuild
      }

      console.log(`Cache miss - rebuilding timeline for ${changedElements.length} elements and ${changedGroups.length} groups`);
      this.metrics.cacheMisses++;
      this.metrics.elementsProcessed += changedElements.length;
      this.metrics.groupsProcessed += changedGroups.length;

      // For Phase 1, we'll do a smart full rebuild with caching
      this.performOptimizedRebuild(elements, groups || []);

      // Update cache with new hashes
      this.updateCache(elements, groups || []);

      // Update performance metrics
      const rebuildTime = performance.now() - startTime;
      this.updateMetrics(rebuildTime);

      console.log(`Timeline rebuilt in ${rebuildTime.toFixed(2)}ms`);

    } catch (error) {
      console.error('Error building animation timeline:', error);
      this.handleTimelineError(error);
    }
  }

  /**
   * Perform optimized rebuild (Phase 1 approach)
   */
  private performOptimizedRebuild(elements: AnimatedCanvasObject[], groups: CanvasGroup[]) {
    // Use the parent class's proven implementation but with our optimizations
    super.buildAnimationTimeline(elements, groups);
  }

  /**
   * Update cache with current animation hashes
   */
  private updateCache(elements: AnimatedCanvasObject[], groups: CanvasGroup[]) {
    const now = Date.now();

    // Update element cache
    elements.forEach(element => {
      const animationHash = this.hashAnimations(element.animations);
      this.elementCache.set(element.id, {
        animationHash,
        lastUpdate: now
      });
    });

    // Update group cache
    groups.forEach(group => {
      const animationHash = this.hashAnimations(group.animations);
      this.groupCache.set(group.id, {
        animationHash,
        lastUpdate: now
      });
    });
  }

  /**
   * Create hash for animations to detect changes
   */
  private hashAnimations(animations: ElementAnimation[]): string {
    if (animations.length === 0) return '';

    return JSON.stringify(animations.map(anim => ({
      id: anim.id,
      type: anim.type,
      startTime: anim.startTime,
      duration: anim.duration,
      properties: anim.properties,
      easing: anim.easing
    })));
  }

  /**
   * Check if any animations exist in elements or groups
   */
  private hasAnimations(elements: AnimatedCanvasObject[], groups?: CanvasGroup[]): boolean {
    const hasElementAnimations = elements.some(el =>
      !el.isAnimationPath && el.animations && el.animations.length > 0
    );
    const hasGroupAnimations = groups?.some(group =>
      !group.isDefaultGroup && group.animations && group.animations.length > 0
    ) ?? false;

    return hasElementAnimations || hasGroupAnimations;
  }

  /**
   * Detect which elements have changed animations since last build
   */
  private detectChangedElements(elements: AnimatedCanvasObject[]): AnimatedCanvasObject[] {
    return elements.filter(element => {
      const cached = this.elementCache.get(element.id);
      if (!cached) return true;

      const currentHash = this.hashAnimations(element.animations);
      return cached.animationHash !== currentHash;
    });
  }

  /**
   * Detect which groups have changed animations since last build
   */
  private detectChangedGroups(groups: CanvasGroup[]): CanvasGroup[] {
    return groups.filter(group => {
      const cached = this.groupCache.get(group.id);
      if (!cached) return true;

      const currentHash = this.hashAnimations(group.animations);
      return cached.animationHash !== currentHash;
    });
  }

  /**
   * Clean expired cache entries to prevent memory leaks
   */
  private cleanExpiredCache() {
    const now = Date.now();

    // Clean element cache
    for (const [key, entry] of this.elementCache.entries()) {
      if (now - entry.lastUpdate > this.CACHE_TTL || this.elementCache.size > this.maxCacheSize) {
        this.elementCache.delete(key);
      }
    }

    // Clean group cache
    for (const [key, entry] of this.groupCache.entries()) {
      if (now - entry.lastUpdate > this.CACHE_TTL || this.groupCache.size > this.maxCacheSize) {
        this.groupCache.delete(key);
      }
    }
  }

  /**
   * Update performance metrics
   */
  private updateMetrics(rebuildTime: number) {
    this.metrics.totalRebuilds++;
    this.metrics.lastRebuildTime = rebuildTime;
    this.metrics.averageRebuildTime = (
      (this.metrics.averageRebuildTime * (this.metrics.totalRebuilds - 1) + rebuildTime) /
      this.metrics.totalRebuilds
    );
  }

  /**
   * Handle timeline errors
   */
  private handleTimelineError(error: any) {
    console.error('Timeline error:', error);
    // Clear timeline and caches to prevent corruption
    this.clearTimeline();
    this.clearCaches();
  }

  /**
   * Clear all caches
   */
  private clearCaches() {
    this.elementCache.clear();
    this.groupCache.clear();
  }

  /**
   * Get performance metrics (compatible with base class interface)
   */
  getPerformanceMetrics(): TimelinePerformanceMetrics {
    return {
      totalBuilds: this.metrics.totalRebuilds,
      averageBuildTime: this.metrics.averageRebuildTime,
      lastBuildTime: this.metrics.lastRebuildTime,
      elementsProcessed: this.metrics.elementsProcessed,
      groupsProcessed: this.metrics.groupsProcessed,
      animationsCreated: this.metrics.elementsProcessed + this.metrics.groupsProcessed // Approximate total
    };
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      elementCacheSize: this.elementCache.size,
      groupCacheSize: this.groupCache.size,
      cacheHitRate: this.metrics.cacheHits / (this.metrics.cacheHits + this.metrics.cacheMisses) || 0,
      totalCacheOperations: this.metrics.cacheHits + this.metrics.cacheMisses
    };
  }

  /**
   * Enhanced clear timeline with cache cleanup
   */
  clearTimeline() {
    super.clearTimeline();
    this.clearCaches();
  }

  /**
   * Enhanced destroy with proper cleanup
   */
  destroy() {
    super.destroy();
    this.clearCaches();
  }

  /**
   * Performance report for debugging
   */
  generatePerformanceReport(): string {
    const metrics = this.getPerformanceMetrics();
    const cacheStats = this.getCacheStats();

    return `
Animation Performance Report:
- Total Rebuilds: ${metrics.totalBuilds}
- Average Rebuild Time: ${metrics.averageBuildTime.toFixed(2)}ms
- Last Rebuild Time: ${metrics.lastBuildTime.toFixed(2)}ms
- Cache Hit Rate: ${(cacheStats.cacheHitRate * 100).toFixed(1)}%
- Elements Processed: ${metrics.elementsProcessed}
- Groups Processed: ${metrics.groupsProcessed}
- Cache Size: ${cacheStats.elementCacheSize} elements, ${cacheStats.groupCacheSize} groups
    `;
  }
} 