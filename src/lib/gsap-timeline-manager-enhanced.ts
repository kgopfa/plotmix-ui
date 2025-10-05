/* eslint-disable @typescript-eslint/no-explicit-any */
import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation, TimelineAnimation } from '@/types/canvas';
import { GSAPTimelineManagerV2, type TimelinePerformanceMetrics } from './gsap-timeline-manager-v2';

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
export class GSAPTimelineManagerEnhanced extends GSAPTimelineManagerV2 {
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
  buildAnimationTimeline(timelineAnimations: TimelineAnimation[], elements: AnimatedCanvasObject[], groups?: CanvasGroup[]) {
    const startTime = performance.now();

    try {
      // Performance check - skip if no animations and already optimized
      if (!this.hasAnimations(timelineAnimations)) {
        if (this.timeline.duration() === 0) {
          return;
        } else {
          this.clearTimeline();
          return;
        }
      }

      // Clean expired cache entries
      this.cleanExpiredCache();

      // Detect only changed timeline animations
      const changedAnimations = this.detectChangedAnimations(timelineAnimations);

      // Force rebuild if we have animations but no timeline content
      const hasTimelineContent = this.timeline.duration() > 0;
      const forceRebuild = !hasTimelineContent && this.hasAnimations(timelineAnimations);

      if (changedAnimations.length === 0 && !forceRebuild) {
        this.metrics.cacheHits++;
        return; // No changes, skip rebuild
      }

      this.metrics.cacheMisses++;
      this.metrics.elementsProcessed += elements.length;
      this.metrics.groupsProcessed += (groups || []).length;

      // For Phase 1, we'll do a smart full rebuild with caching
      this.performOptimizedRebuild(timelineAnimations, elements, groups || []);

      // Update cache with new hashes
      this.updateCache(timelineAnimations);

      // Update performance metrics
      const rebuildTime = performance.now() - startTime;
      this.updateMetrics(rebuildTime);

    } catch (error) {
      this.handleTimelineError(error);
    }
  }

  /**
   * Perform optimized rebuild (Phase 1 approach)
   */
  private performOptimizedRebuild(timelineAnimations: TimelineAnimation[], elements: AnimatedCanvasObject[], groups: CanvasGroup[]) {
    // Use the parent class's proven implementation but with our optimizations
    super.buildAnimationTimeline(timelineAnimations, elements, groups);
  }

  /**
   * Update cache with current animation hashes
   */
  private updateCache(timelineAnimations: TimelineAnimation[]) {
    const now = Date.now();

    // Update animation cache
    timelineAnimations.forEach(animation => {
      const animationHash = this.hashTimelineAnimation(animation);
      this.elementCache.set(animation.id, {
        animationHash,
        lastUpdate: now
      });
    });
  }

  /**
   * Create hash for timeline animation to detect changes
   */
  private hashTimelineAnimation(animation: TimelineAnimation): string {
    return JSON.stringify({
      id: animation.id,
      displayName: animation.displayName,
      target: animation.target,
      startAt: animation.startAt,
      tracks: animation.tracks.map(track => ({
        id: track.id,
        type: track.type,
        startTime: track.startTime,
        duration: track.duration,
        properties: track.properties,
        easing: track.easing,
        repeat: track.repeat,
        repeatDelay: track.repeatDelay,
        yoyo: track.yoyo
      }))
    });
  }

  /**
   * Check if any animations exist in timeline
   */
  private hasAnimations(timelineAnimations?: TimelineAnimation[]): boolean {
    return timelineAnimations ? timelineAnimations.length > 0 : false;
  }

  /**
   * Detect which timeline animations have changed since last build
   */
  private detectChangedAnimations(timelineAnimations: TimelineAnimation[]): TimelineAnimation[] {
    return timelineAnimations.filter(animation => {
      const cached = this.elementCache.get(animation.id);
      if (!cached) return true;

      const currentHash = this.hashTimelineAnimation(animation);
      return cached.animationHash !== currentHash;
    });
  }

  /**
   * Clean expired cache entries to prevent memory leaks
   */
  private cleanExpiredCache() {
    const now = Date.now();

    // Clean animation cache
    for (const [key, entry] of this.elementCache.entries()) {
      if (now - entry.lastUpdate > this.CACHE_TTL || this.elementCache.size > this.maxCacheSize) {
        this.elementCache.delete(key);
      }
    }

    // Clean group cache (keeping for compatibility)
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
   * Force clear caches - useful when animations are modified externally
   */
  forceClearCache() {
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