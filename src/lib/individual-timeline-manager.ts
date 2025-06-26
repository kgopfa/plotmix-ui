/* eslint-disable @typescript-eslint/no-explicit-any */
import { gsap } from 'gsap';
import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { TimelinePool, type TimelinePoolStats } from './timeline-pool';
import {
  generateAnimationConfig,
  generateGroupAnimationConfig,
  isColorAnimationConfig,
  isPathAnimationConfig,
  isPhysicsAnimationConfig,
  isGroupAnimationConfig,
  isPolygonAnimationConfig,
  PathAnimationConfig,
  PolygonAnimationConfig
} from '@/utils/animation-generator';
import { calculateCompressedCycleDuration } from '@/utils/animation-utils';

/**
 * Performance statistics for the Individual Timeline Manager
 */
export interface IndividualTimelineStats {
  activeElements: number;
  activeGroups: number;
  poolStats: TimelinePoolStats;
  masterDuration: number;
  isPlaying: boolean;
  totalAnimations: number;
  memoryUsage: number;
}

/**
 * Individual Timeline Manager - Phase 2 Implementation
 * 
 * This manager creates individual timelines for each element and group,
 * providing maximum granularity and performance optimization.
 * 
 * Key features:
 * - Individual timelines per element/group
 * - Timeline pooling for memory efficiency
 * - Batch updates for performance
 * - True incremental updates
 * - Advanced performance monitoring
 */
export class IndividualTimelineManager {
  private elementTimelines = new Map<string, gsap.core.Timeline>();
  private groupTimelines = new Map<string, gsap.core.Timeline>();
  private masterTimeline: gsap.core.Timeline;
  private timelinePool: TimelinePool;
  private canvasRef: React.RefObject<CanvasRef | null> | null = null;

  // Performance tracking
  private animationCounts = new Map<string, number>();
  private lastUpdateTime = 0;
  private totalOperations = 0;

  constructor(poolSize = 100) {
    this.masterTimeline = gsap.timeline({ paused: true });
    this.timelinePool = new TimelinePool(poolSize);

    // Warm up the pool for better initial performance
    this.timelinePool.warmUp(10);

    console.log('IndividualTimelineManager initialized with pool size:', poolSize);
  }

  setCanvasRef(ref: React.RefObject<CanvasRef | null>) {
    this.canvasRef = ref;
  }

  /**
   * Main interface for updating element animations
   */
  updateElementAnimations(elementId: string, animations: ElementAnimation[], allElements: AnimatedCanvasObject[]) {
    const startTime = performance.now();

    try {
      // Get shape reference
      const shapeRefs = this.canvasRef?.current?.getShapeRefs();
      const target = shapeRefs?.[elementId];

      if (!target && animations.length > 0) {
        console.warn(`No target found for element ${elementId}`);
        return;
      }

      // Remove existing timeline
      this.removeElementTimeline(elementId);

      // Skip if no animations
      if (animations.length === 0) {
        this.animationCounts.delete(elementId);
        return;
      }

      // Get element data
      const element = allElements.find(el => el.id === elementId);
      if (!element) {
        console.warn(`Element ${elementId} not found in allElements`);
        return;
      }

      // Create new timeline from pool
      const timeline = this.timelinePool.getTimeline(elementId);

      // Special handling for textGroup animations
      if (element.type === 'textGroup' && shapeRefs) {
        this.addTextGroupAnimations(timeline, element, animations, shapeRefs);
      } else {
        // Add regular element animations
        animations.forEach(animation => {
          const config = generateAnimationConfig(element, animation, target!, allElements);
          this.addAnimationToTimeline(timeline, config, target!);
        });
      }

      // Add timeline to master and track it
      this.elementTimelines.set(elementId, timeline);
      this.masterTimeline.add(timeline, 0);
      this.animationCounts.set(elementId, animations.length);

      const duration = performance.now() - startTime;
      this.totalOperations++;

      console.log(`Updated element ${elementId} with ${animations.length} animations in ${duration.toFixed(2)}ms`);

    } catch (error) {
      console.error(`Error updating element ${elementId}:`, error);
      this.handleTimelineError(elementId);
    }
  }

  /**
   * Update group animations
   */
  updateGroupAnimations(groupId: string, animations: ElementAnimation[], group: CanvasGroup) {
    const startTime = performance.now();

    try {
      // Get group container
      const groupContainers = this.canvasRef?.current?.getGroupContainers();
      const groupContainer = groupContainers?.[groupId];

      if (!groupContainer && animations.length > 0) {
        console.warn(`No group container found for group ${groupId}`);
        return;
      }

      // Remove existing timeline
      this.removeGroupTimeline(groupId);

      // Skip if no animations or is default group
      if (animations.length === 0 || group.isDefaultGroup) {
        this.animationCounts.delete(groupId);
        return;
      }

      // Create new timeline from pool
      const timeline = this.timelinePool.getTimeline(groupId);

      // Add group animations
      animations.forEach(animation => {
        const config = generateGroupAnimationConfig(group, animation, [groupContainer!]);
        this.addGroupAnimationToTimeline(timeline, config, groupContainer!, animation);
      });

      // Add timeline to master and track it
      this.groupTimelines.set(groupId, timeline);
      this.masterTimeline.add(timeline, 0);
      this.animationCounts.set(groupId, animations.length);

      const duration = performance.now() - startTime;
      this.totalOperations++;

      console.log(`Updated group ${groupId} with ${animations.length} animations in ${duration.toFixed(2)}ms`);

    } catch (error) {
      console.error(`Error updating group ${groupId}:`, error);
      this.handleTimelineError(groupId);
    }
  }

  /**
   * Batch update for performance
   */
  batchUpdateElements(updates: Array<{
    elementId: string,
    animations: ElementAnimation[]
  }>, allElements: AnimatedCanvasObject[]) {

    console.log(`Starting batch update for ${updates.length} elements`);
    const batchStartTime = performance.now();

    // Temporarily pause master timeline during batch updates
    const wasPlaying = !this.masterTimeline.paused();
    if (wasPlaying) this.masterTimeline.pause();

    let processedCount = 0;
    updates.forEach(({ elementId, animations }) => {
      this.updateElementAnimations(elementId, animations, allElements);
      processedCount++;
    });

    if (wasPlaying) this.masterTimeline.play();

    const batchDuration = performance.now() - batchStartTime;
    console.log(`Batch update completed: ${processedCount} elements in ${batchDuration.toFixed(2)}ms`);
  }

  /**
   * Batch update for groups
   */
  batchUpdateGroups(updates: Array<{
    groupId: string,
    animations: ElementAnimation[],
    group: CanvasGroup
  }>) {
    console.log(`Starting batch group update for ${updates.length} groups`);
    const batchStartTime = performance.now();

    const wasPlaying = !this.masterTimeline.paused();
    if (wasPlaying) this.masterTimeline.pause();

    let processedCount = 0;
    updates.forEach(({ groupId, animations, group }) => {
      this.updateGroupAnimations(groupId, animations, group);
      processedCount++;
    });

    if (wasPlaying) this.masterTimeline.play();

    const batchDuration = performance.now() - batchStartTime;
    console.log(`Batch group update completed: ${processedCount} groups in ${batchDuration.toFixed(2)}ms`);
  }

  /**
   * Remove element timeline and return to pool
   */
  removeElementTimeline(elementId: string) {
    const timeline = this.elementTimelines.get(elementId);
    if (timeline) {
      this.masterTimeline.remove(timeline);
      this.timelinePool.releaseTimeline(elementId);
      this.elementTimelines.delete(elementId);
      this.animationCounts.delete(elementId);
    }
  }

  /**
   * Remove group timeline and return to pool
   */
  removeGroupTimeline(groupId: string) {
    const timeline = this.groupTimelines.get(groupId);
    if (timeline) {
      this.masterTimeline.remove(timeline);
      this.timelinePool.releaseTimeline(groupId);
      this.groupTimelines.delete(groupId);
      this.animationCounts.delete(groupId);
    }
  }

  /**
   * Add text group animations (special handling for character children)
   */
  private addTextGroupAnimations(
    timeline: gsap.core.Timeline,
    element: AnimatedCanvasObject,
    animations: ElementAnimation[],
    shapeRefs: Record<string, any>
  ) {
    // Find character children for textGroup
    const allElements = Object.keys(shapeRefs).map(id => ({ id }));
    const characterChildren = allElements.filter((el: any) =>
      shapeRefs[el.id]?.type === 'character' && shapeRefs[el.id]?.parentTextGroupId === element.id
    );

    animations.forEach((animation) => {
      if (characterChildren.length === 0) {
        // Apply to textGroup itself if no characters found
        const target = shapeRefs[element.id];
        if (!target || target.destroyed || !target.parent) return;

        const config = generateAnimationConfig(element, animation, target, [element]);
        this.addAnimationToTimeline(timeline, config, target);
      } else {
        // Apply to each character child
        characterChildren.forEach((character: any) => {
          const characterTarget = shapeRefs[character.id];
          if (!characterTarget || characterTarget.destroyed || !characterTarget.parent) return;

          const config = generateAnimationConfig(element, animation, characterTarget, [element]);
          this.addAnimationToTimeline(timeline, config, characterTarget);
        });
      }
    });
  }

  /**
   * Add animation to timeline with proper GSAP configuration
   */
  private addAnimationToTimeline(
    timeline: gsap.core.Timeline,
    config: any,
    target: any
  ) {
    // Get repeat properties directly from config (they're passed from generateAnimationConfig)
    const repeat = config.repeat ?? 0;
    const repeatDelay = config.repeatDelay ?? 0;
    const yoyo = config.yoyo ?? false;
    
    // Calculate compressed cycle duration for repeats
    let cycleDuration = config.duration;
    if (repeat !== 0) {
      if (repeat === -1) {
        // Infinite repeat - each cycle uses a small fraction of duration
        cycleDuration = config.duration / 10; // Show 10 cycles within the duration
      } else {
        // Calculate cycle duration to fit all repeats + delays within total duration
        const totalCycles = 1 + repeat;
        const totalDelayTime = repeat * repeatDelay;
        const availableAnimationTime = config.duration - totalDelayTime;
        cycleDuration = Math.max(0.1, availableAnimationTime / totalCycles);
      }
    }

    if (isPathAnimationConfig(config) || isPolygonAnimationConfig(config)) {
      this.addPathAnimation(timeline, config, target);
    } else if (isColorAnimationConfig(config)) {
      // Handle repeats manually for color animations
      this.addRepeatedColorAnimation(timeline, config, target, cycleDuration, repeat, repeatDelay, yoyo);
    } else if (isPhysicsAnimationConfig(config)) {
      // Handle repeats manually for physics animations
      this.addRepeatedPhysicsAnimation(timeline, config, target, cycleDuration, repeat, repeatDelay);
    } else {
      // Handle repeats manually for standard animations
      this.addRepeatedStandardAnimation(timeline, config, target, cycleDuration, repeat, repeatDelay, yoyo);
    }
  }

  /**
   * Add repeated color animation cycles
   */
  private addRepeatedColorAnimation(
    timeline: gsap.core.Timeline,
    config: any,
    target: any,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;

      if (isReverse) {
        // Reverse cycle: new to old
        timeline.to(
          config.newChild,
          {
            pixi: { alpha: 0 },
            duration: cycleDuration,
            ease: config.ease
          },
          currentTime
        );

        timeline.to(
          config.oldChild,
          {
            pixi: { alpha: 1 },
            duration: cycleDuration,
            ease: config.ease
          },
          currentTime
        );
      } else {
        // Forward cycle: old to new
        timeline.to(
          config.oldChild,
          {
            pixi: { alpha: 0 },
            duration: cycleDuration,
            ease: config.ease
          },
          currentTime
        );

        timeline.to(
          config.newChild,
          {
            pixi: { alpha: 1 },
            duration: cycleDuration,
            ease: config.ease,
            onInterrupt: cycle === 0 ? () => {
              target.removeChild(config.newChild);
            } : undefined
          },
          currentTime
        );
      }

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add repeated physics animation cycles
   */
  private addRepeatedPhysicsAnimation(
    timeline: gsap.core.Timeline,
    config: any,
    target: any,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    const physics2DConfig: Record<string, string | number> = {
      velocity: config.velocity,
      angle: config.angle,
      gravity: config.gravity
    };

    if (config.acceleration !== undefined) physics2DConfig.acceleration = config.acceleration;
    if (config.accelerationAngle !== undefined) physics2DConfig.accelerationAngle = config.accelerationAngle;
    if (config.friction !== undefined) physics2DConfig.friction = config.friction;
    if (config.xProp) physics2DConfig.xProp = config.xProp;
    if (config.yProp) physics2DConfig.yProp = config.yProp;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      timeline.to(
        config.target,
        {
          physics2D: physics2DConfig,
          duration: cycleDuration,
          ease: config.ease
        },
        currentTime
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add repeated standard animation cycles
   */
  private addRepeatedStandardAnimation(
    timeline: gsap.core.Timeline,
    config: any,
    target: any,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    // Store original values for yoyo effect
    const originalValues: any = {};
    if (yoyo) {
      Object.keys(config.properties).forEach(key => {
        const currentValue = target[key];
        
        if (currentValue !== undefined) {
          originalValues[key] = currentValue;
        } else {
          // Set sensible defaults for missing properties
          if (key === 'scaleX' || key === 'scaleY') {
            originalValues[key] = 1;
          } else if (key === 'alpha') {
            originalValues[key] = 1;
          } else if (key === 'rotation') {
            originalValues[key] = 0;
          } else if (key === 'pivotX' || key === 'pivotY') {
            // For pivot, use the target element's properties or defaults
            originalValues[key] = currentValue || 0;
          } else {
            originalValues[key] = 0;
          }
        }
      });
    }

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;
      
      let animationProps = config.properties;
      if (isReverse) {
        // For reverse cycles, animate back to original values
        animationProps = originalValues;
      }



      timeline.to(
        config.target,
        {
          pixi: animationProps,
          duration: cycleDuration,
          ease: config.ease
        },
        currentTime
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Reverse animation properties for yoyo effect
   */
  private reverseAnimationProperties(properties: any, target: any): any {
    const reversed: any = {};
    
    // Get current values from target to reverse to
    Object.keys(properties).forEach(key => {
      if (key === 'x' || key === 'y') {
        // For position, reverse to current position (before animation started)
        reversed[key] = target[key] || 0;
      } else if (key === 'scaleX' || key === 'scaleY') {
        // For scale, reverse to 1 (default scale)
        reversed[key] = 1;
      } else if (key === 'rotation') {
        // For rotation, reverse to 0
        reversed[key] = 0;
      } else if (key === 'alpha') {
        // For alpha, reverse to 1 (fully opaque)
        reversed[key] = 1;
      } else if (key === 'width' || key === 'height') {
        // For dimensions, reverse to original size (we'll approximate)
        reversed[key] = target[key] || properties[key];
      } else {
        // For other properties, try to reverse to current value
        reversed[key] = target[key] !== undefined ? target[key] : properties[key];
      }
    });
    
    return reversed;
  }

  /**
   * Add group animation to timeline
   */
  private addGroupAnimationToTimeline(
    timeline: gsap.core.Timeline,
    config: any,
    groupContainer: any,
    animation: ElementAnimation
  ) {
    if (!isGroupAnimationConfig(config)) return;

    // Calculate compressed cycle duration for repeats
    const cycleDuration = calculateCompressedCycleDuration(animation);
    const repeat = animation.repeat ?? 0;
    const repeatDelay = animation.repeatDelay ?? 0;
    const yoyo = animation.yoyo ?? false;

    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    // Store original values for yoyo effect
    const originalValues: any = {};
    if (yoyo) {
      if (animation.type === 'move') {
        originalValues.x = groupContainer.x;
        originalValues.y = groupContainer.y;
      } else if (animation.type === 'rotate') {
        originalValues.rotation = groupContainer.rotation || 0;
      } else if (animation.type === 'scale') {
        originalValues.scaleX = groupContainer.scaleX || 1;
        originalValues.scaleY = groupContainer.scaleY || 1;
      } else if (animation.type === 'fade') {
        originalValues.alpha = groupContainer.alpha || 1;
      }
    }

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;
      
      // Determine animation properties for this cycle
      let animationProps: any = {};
      
      if (animation.type === 'move') {
        if (isReverse) {
          animationProps = { x: originalValues.x, y: originalValues.y };
        } else {
          animationProps = { x: config.properties.x, y: config.properties.y };
        }
      } else if (animation.type === 'rotate') {
        if (isReverse) {
          animationProps = { rotation: originalValues.rotation };
        } else {
          animationProps = { rotation: config.properties.rotation || 0 };
        }
      } else if (animation.type === 'scale') {
        if (isReverse) {
          animationProps = { scaleX: originalValues.scaleX, scaleY: originalValues.scaleY };
        } else {
          animationProps = { scaleX: config.properties.scaleX || 1, scaleY: config.properties.scaleY || 1 };
        }
      } else if (animation.type === 'fade') {
        if (isReverse) {
          animationProps = { alpha: originalValues.alpha };
        } else {
          animationProps = { alpha: config.properties.alpha || 1 };
        }
      }

      timeline.to(
        groupContainer,
        {
          pixi: animationProps,
          duration: cycleDuration,
          ease: config.ease
        },
        currentTime
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add path animation to timeline (reusing logic from base class)
   */
  private addPathAnimation(
    timeline: gsap.core.Timeline,
    config: PathAnimationConfig | PolygonAnimationConfig,
    target: any
  ) {
    const pathElement = config.pathElement;

    if (pathElement.type === 'rectangle') {
      const segmentDuration = config.duration / 4;
      const pathStartTime = config.startTime;

      timeline.to(target, {
        pixi: { x: "+=" + pathElement.width },
        duration: segmentDuration,
        ease: config.ease,
      }, pathStartTime);

      timeline.to(target, {
        pixi: { y: "+=" + pathElement.height },
        duration: segmentDuration,
        ease: config.ease,
      }, pathStartTime + segmentDuration);

      timeline.to(target, {
        pixi: { x: "-=" + pathElement.width },
        duration: segmentDuration,
        ease: config.ease,
      }, pathStartTime + (segmentDuration * 2));

      timeline.to(target, {
        pixi: { y: "-=" + pathElement.height },
        duration: segmentDuration,
        ease: config.ease,
      }, pathStartTime + (segmentDuration * 3));
    }

    // Add other path types as needed (circle, triangle, etc.)
    // For brevity, including rectangle only - can extend with other shapes
  }

  /**
   * Performance monitoring
   */
  getPerformanceStats(): IndividualTimelineStats {
    const poolStats = this.timelinePool.getPoolStats();
    const totalAnimations = Array.from(this.animationCounts.values()).reduce((sum, count) => sum + count, 0);

    return {
      activeElements: this.elementTimelines.size,
      activeGroups: this.groupTimelines.size,
      poolStats,
      masterDuration: this.masterTimeline.duration(),
      isPlaying: !this.masterTimeline.paused(),
      totalAnimations,
      memoryUsage: this.estimateMemoryUsage()
    };
  }

  /**
   * Estimate memory usage
   */
  private estimateMemoryUsage(): number {
    // Rough estimation based on active timelines and pool size
    const activeTimelines = this.elementTimelines.size + this.groupTimelines.size;
    const poolSize = this.timelinePool.getPoolStats().available;
    return (activeTimelines + poolSize) * 1024; // Rough estimate in bytes
  }

  /**
   * Standard timeline interface methods
   */
  updateTime(elapsedTime: number) {
    try {
      this.masterTimeline.time(elapsedTime);
      this.lastUpdateTime = elapsedTime;
    } catch (error) {
      console.warn('Error updating timeline:', error);
      this.handleTimelineError();
    }
  }

  handlePlayback(isPlaying: boolean, updateTick: () => void) {
    if (isPlaying) {
      gsap.ticker.add(updateTick);
      this.masterTimeline.play();
      console.log('Playback started');
    } else {
      gsap.ticker.remove(updateTick);
      this.masterTimeline.pause();
      console.log('Playback paused');
    }
  }

  clearTimeline() {
    console.log('Clearing all timelines');

    // Clear all element timelines
    this.elementTimelines.forEach((timeline, elementId) => {
      this.timelinePool.releaseTimeline(elementId);
    });
    this.elementTimelines.clear();

    // Clear group timelines
    this.groupTimelines.forEach((timeline, groupId) => {
      this.timelinePool.releaseTimeline(groupId);
    });
    this.groupTimelines.clear();

    // Clear animation counts
    this.animationCounts.clear();

    // Clear master timeline
    this.masterTimeline.clear();
  }

  /**
   * Handle timeline errors
   */
  private handleTimelineError(elementId?: string) {
    console.error('Timeline error detected', elementId ? `for element ${elementId}` : '');

    if (elementId) {
      // Clear specific element timeline
      this.removeElementTimeline(elementId);
    } else {
      // Clear all timelines on critical error
      this.clearTimeline();
    }
  }

  destroy() {
    console.log('Destroying IndividualTimelineManager');
    this.clearTimeline();
    this.timelinePool.clear();
    this.masterTimeline.kill();
    gsap.ticker.remove(this.updateTime);
  }

  /**
   * Generate comprehensive performance report
   */
  generatePerformanceReport(): string {
    const stats = this.getPerformanceStats();
    const poolReport = this.timelinePool.generateReport();

    return `
Individual Timeline Manager Performance Report:
- Active Element Timelines: ${stats.activeElements}
- Active Group Timelines: ${stats.activeGroups}
- Total Animations: ${stats.totalAnimations}
- Master Timeline Duration: ${stats.masterDuration.toFixed(2)}s
- Is Playing: ${stats.isPlaying}
- Total Operations: ${this.totalOperations}
- Last Update Time: ${this.lastUpdateTime.toFixed(2)}s
- Estimated Memory Usage: ${(stats.memoryUsage / 1024).toFixed(2)}KB

${poolReport}
    `;
  }
} 