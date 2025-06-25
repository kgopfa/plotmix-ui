import { gsap } from 'gsap';

/**
 * Timeline Pool Statistics Interface
 */
export interface TimelinePoolStats {
  available: number;
  active: number;
  capacity: number;
  totalCreated: number;
  totalReused: number;
  efficiency: number; // reuse rate
}

/**
 * Timeline Pool for efficient timeline management
 * 
 * This class manages a pool of GSAP timelines to avoid the overhead
 * of creating and destroying timeline instances frequently.
 */
export class TimelinePool {
  private availableTimelines: gsap.core.Timeline[] = [];
  private activeTimelines = new Map<string, gsap.core.Timeline>();
  private poolSize: number;
  private totalCreated = 0;
  private totalReused = 0;

  constructor(poolSize = 100) {
    this.poolSize = poolSize;
  }

  /**
   * Get a timeline from the pool or create a new one
   */
  getTimeline(elementId: string): gsap.core.Timeline {
    let timeline = this.availableTimelines.pop();
    
    if (!timeline) {
      timeline = gsap.timeline({ paused: true });
      this.totalCreated++;
    } else {
      timeline.clear();
      this.totalReused++;
    }

    this.activeTimelines.set(elementId, timeline);
    return timeline;
  }

  /**
   * Release a timeline back to the pool
   */
  releaseTimeline(elementId: string): void {
    const timeline = this.activeTimelines.get(elementId);
    if (!timeline) return;

    this.activeTimelines.delete(elementId);
    
    // Clear the timeline and return to pool if not at capacity
    timeline.clear();
    timeline.pause();
    
    if (this.availableTimelines.length < this.poolSize) {
      this.availableTimelines.push(timeline);
    } else {
      // Pool is full, destroy the timeline
      timeline.kill();
    }
  }

  /**
   * Get pool statistics for monitoring
   */
  getPoolStats(): TimelinePoolStats {
    const total = this.totalCreated + this.totalReused;
    const efficiency = total > 0 ? this.totalReused / total : 0;

    return {
      available: this.availableTimelines.length,
      active: this.activeTimelines.size,
      capacity: this.poolSize,
      totalCreated: this.totalCreated,
      totalReused: this.totalReused,
      efficiency
    };
  }

  /**
   * Warm up the pool by pre-creating timelines
   */
  warmUp(count: number = Math.min(10, this.poolSize)): void {
    for (let i = 0; i < count && this.availableTimelines.length < this.poolSize; i++) {
      const timeline = gsap.timeline({ paused: true });
      this.availableTimelines.push(timeline);
      this.totalCreated++;
    }
  }

  /**
   * Clear the entire pool
   */
  clear(): void {
    // Clear active timelines
    for (const [elementId] of this.activeTimelines) {
      this.releaseTimeline(elementId);
    }

    // Destroy all available timelines
    this.availableTimelines.forEach(timeline => timeline.kill());
    this.availableTimelines.length = 0;

    // Reset statistics
    this.totalCreated = 0;
    this.totalReused = 0;
  }

  /**
   * Resize the pool capacity
   */
  resize(newSize: number): void {
    this.poolSize = Math.max(1, newSize);
    
    // If pool is now too large, remove excess timelines
    while (this.availableTimelines.length > this.poolSize) {
      const timeline = this.availableTimelines.pop();
      if (timeline) timeline.kill();
    }
  }

  /**
   * Get a performance report
   */
  generateReport(): string {
    const stats = this.getPoolStats();
    return `
Timeline Pool Report:
- Active Timelines: ${stats.active}
- Available Timelines: ${stats.available}
- Pool Capacity: ${stats.capacity}
- Total Created: ${stats.totalCreated}
- Total Reused: ${stats.totalReused}
- Efficiency Rate: ${(stats.efficiency * 100).toFixed(1)}%
- Pool Utilization: ${((stats.active / stats.capacity) * 100).toFixed(1)}%
    `;
  }
} 