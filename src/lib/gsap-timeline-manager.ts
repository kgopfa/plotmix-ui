import { gsap } from 'gsap';
import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import { Physics2DPlugin } from "gsap/Physics2DPlugin";
import { MotionPathPlugin } from "gsap/MotionPathPlugin";
import * as PIXI from 'pixi.js';
import {
  generateAnimationConfig,
  generateGroupAnimationConfig,
  isColorAnimationConfig,
  isPathAnimationConfig,
  isPhysicsAnimationConfig,
  isGroupAnimationConfig,
  isPolygonAnimationConfig,
  PathAnimationConfig,
  PolygonAnimationConfig,
  ColorAnimationConfig,
  PhysicsAnimationConfig,
  GroupAnimationConfig
} from '@/utils/animation-generator';
import type { BaseAnimationConfig } from '@/types/canvas';
import { calculateCompressedCycleDuration } from '@/utils/animation-utils';

gsap.registerPlugin(PixiPlugin, Physics2DPlugin, MotionPathPlugin);
PixiPlugin.registerPIXI(PIXI);

/**
 * Performance metrics for timeline operations
 */
export interface TimelinePerformanceMetrics {
  totalBuilds: number;
  averageBuildTime: number;
  lastBuildTime: number;
  elementsProcessed: number;
  groupsProcessed: number;
  animationsCreated: number;
}

/**
 * Enhanced GSAP Timeline Manager
 * 
 * This is the modernized version of the basic timeline manager with:
 * - Performance monitoring
 * - Better error handling  
 * - Optimized animation processing
 * - Phase 2 architecture compatibility
 */
export class GSAPTimelineManager {
  protected timeline: gsap.core.Timeline;
  protected canvasRef: React.RefObject<CanvasRef | null> | null = null;

  // Performance tracking
  private performanceMetrics: TimelinePerformanceMetrics = {
    totalBuilds: 0,
    averageBuildTime: 0,
    lastBuildTime: 0,
    elementsProcessed: 0,
    groupsProcessed: 0,
    animationsCreated: 0
  };

  constructor() {
    this.timeline = gsap.timeline({ paused: true });
    console.log('GSAPTimelineManager initialized');
  }

  setCanvasRef(ref: React.RefObject<CanvasRef | null>) {
    this.canvasRef = ref;
  }

  /**
   * Build animation timeline with performance monitoring
   */
  buildAnimationTimeline(elements: AnimatedCanvasObject[], groups?: CanvasGroup[]) {
    const buildStartTime = performance.now();

    try {
      // Performance optimization: Check if any animations exist before building timeline
      const hasElementAnimations = elements.some(el =>
        !el.isAnimationPath && el.animations && el.animations.length > 0
      );
      const hasGroupAnimations = groups?.some(group =>
        !group.isDefaultGroup && group.animations && group.animations.length > 0
      );

      // Skip timeline building if no animations exist
      if (!hasElementAnimations && !hasGroupAnimations) {
        this.clearTimeline();
        this.updatePerformanceMetrics(buildStartTime, 0, 0, 0);
        return;
      }

      const shapeRefs = this.canvasRef?.current?.getShapeRefs();
      if (!shapeRefs) {
        return;
      }

      // Clear existing timeline
      this.clearTimeline();

      let animationsCreated = 0;
      let elementsProcessed = 0;
      let groupsProcessed = 0;

      // Process element animations
      elements.forEach((element) => {
        if (element.isAnimationPath || !element.animations || element.animations.length === 0) {
          return;
        }

        elementsProcessed++;

        // Special handling for textGroup animations
        if (element.type === 'textGroup') {
          animationsCreated += this.processTextGroupAnimations(element, elements, shapeRefs);
        } else {
          animationsCreated += this.processElementAnimations(element, elements, shapeRefs);
        }
      });

      // Process group animations
      if (groups) {
        const groupContainers = this.canvasRef?.current?.getGroupContainers();
        if (groupContainers) {
          groups.forEach((group) => {
            if (!group.isDefaultGroup && group.animations && group.animations.length > 0) {
              groupsProcessed++;
              animationsCreated += this.processGroupAnimations(group, groupContainers);
            }
          });
        }
      }

      this.timeline.pause(0);

      // Update performance metrics
      this.updatePerformanceMetrics(buildStartTime, elementsProcessed, groupsProcessed, animationsCreated);

    } catch {
      this.clearTimeline();
    }
  }

  /**
   * Process text group animations (apply to character children)
   */
  private processTextGroupAnimations(
    element: AnimatedCanvasObject,
    elements: AnimatedCanvasObject[],
    shapeRefs: Record<string, PIXI.Container>
  ): number {
    let animationsCreated = 0;

    // Find all character children for this textGroup
    const characterChildren = elements.filter(el =>
      el.type === 'character' && el.parentTextGroupId === element.id
    );

    if (characterChildren.length === 0) {
      return 0;
    }

    element.animations.forEach((animation) => {
      characterChildren.forEach((character) => {
        const characterTarget = shapeRefs[character.id];
        if (!characterTarget || characterTarget.destroyed || !characterTarget.parent) {
          return;
        }

        try {
          const config = generateAnimationConfig(character, animation, characterTarget, elements);
          this.addAnimationToTimeline(config, characterTarget);
          animationsCreated++;
        } catch (error) {
          console.warn(`⚠️ Error processing character animation for ${character.id}:`, error);
        }
      });
    });

    return animationsCreated;
  }

  /**
   * Process regular element animations
   */
  private processElementAnimations(
    element: AnimatedCanvasObject,
    elements: AnimatedCanvasObject[],
    shapeRefs: Record<string, PIXI.Container>
  ): number {
    let animationsCreated = 0;

    const target = shapeRefs[element.id];
    if (!target || target.destroyed || !target.parent) {
      return 0;
    }

    element.animations.forEach((animation) => {
      try {
        const config = generateAnimationConfig(element, animation, target, elements);
        this.addAnimationToTimeline(config, target);
        animationsCreated++;
      } catch (error) {
        console.warn(`⚠️ Error processing animation for element ${element.id}:`, error);
      }
    });

    return animationsCreated;
  }

  /**
   * Process group animations
   */
  private processGroupAnimations(group: CanvasGroup, groupContainers: Record<string, PIXI.Container>): number {
    let animationsCreated = 0;

    const groupContainer = groupContainers[group.id];
    if (!groupContainer) return 0;

    group.animations.forEach((animation) => {
      try {
        const config = generateGroupAnimationConfig(group, animation, [groupContainer]);
        this.addGroupAnimationToTimeline(config, groupContainer, animation);
        animationsCreated++;
      } catch (error) {
        console.warn(`⚠️ Error processing group animation for ${group.id}:`, error);
      }
    });

    return animationsCreated;
  }

  /**
   * Add animation to timeline with proper error handling and repeat support
   */
  private addAnimationToTimeline(
    config: BaseAnimationConfig | ColorAnimationConfig | PathAnimationConfig | PhysicsAnimationConfig | PolygonAnimationConfig,
    target: PIXI.Container,
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
      this.addPathAnimation(config, target);
    } else if (isColorAnimationConfig(config)) {
      // Handle repeats manually for color animations
      this.addRepeatedColorAnimation(config, target, cycleDuration, repeat, repeatDelay, yoyo);
    } else if (isPhysicsAnimationConfig(config)) {
      // Handle repeats manually for physics animations
      this.addRepeatedPhysicsAnimation(config, target, cycleDuration, repeat, repeatDelay);
    } else {
      // Handle repeats manually for standard animations
      this.addRepeatedStandardAnimation(config, target, cycleDuration, repeat, repeatDelay, yoyo);
    }
  }

  /**
   * Add repeated color animation cycles
   */
  private addRepeatedColorAnimation(
    config: ColorAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat); // Cap infinite at 10 cycles
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;

      if (isReverse) {
        // Reverse cycle: new to old
        this.timeline.to(
          config.newChild,
          {
            pixi: { alpha: 0 },
            duration: cycleDuration,
            ease: config.ease
          },
          currentTime
        );

        this.timeline.to(
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
        this.timeline.to(
          config.oldChild,
          {
            pixi: { alpha: 0 },
            duration: cycleDuration,
            ease: config.ease
          },
          currentTime
        );

        this.timeline.to(
          config.newChild,
          {
            pixi: { alpha: 1 },
            duration: cycleDuration,
            ease: config.ease,
            onInterrupt: cycle === 0 ? () => {
              try {
                target.removeChild(config.newChild);
              } catch (e) {
                console.warn('Error removing child on interrupt:', e);
              }
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
    config: PhysicsAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
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
      this.timeline.to(
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
    config: BaseAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;
      
      let animationProps = config.properties;
      if (isReverse) {
        // For reverse cycles, we need to animate back to the original values
        // This is a simplified approach - you might need more sophisticated reverse logic
        animationProps = this.reverseAnimationProperties(config.properties);
      }

      this.timeline.to(
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
  private reverseAnimationProperties(properties: Record<string, unknown>): Record<string, unknown> {
    // This is a simplified reversal - you might need more sophisticated logic
    // For now, we'll just return the original properties
    // In a real implementation, you'd need to track original values and reverse to them
    return properties;
  }

  /**
   * Add group animation to timeline with repeat support
   */
  private addGroupAnimationToTimeline(
    config: GroupAnimationConfig, 
    groupContainer: PIXI.Container, 
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

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const isReverse = yoyo && cycle % 2 === 1;
      
      // Determine animation properties for this cycle
      let animationProps: Record<string, number> = {};
      
      switch (animation.type) {
        case 'move':
          animationProps = {
            x: config.properties.x || groupContainer.x,
            y: config.properties.y || groupContainer.y
          };
          if (isReverse && cycle > 0) {
            // Return to original position
            animationProps = { x: groupContainer.x, y: groupContainer.y };
          }
          break;

        case 'rotate':
          animationProps = { rotation: config.properties.rotation || 0 };
          if (isReverse && cycle > 0) {
            animationProps = { rotation: 0 };
          }
          break;

        case 'scale':
          animationProps = {
            scaleX: config.properties.scaleX || 1,
            scaleY: config.properties.scaleY || 1
          };
          if (isReverse && cycle > 0) {
            animationProps = { scaleX: 1, scaleY: 1 };
          }
          break;

        case 'fade':
          animationProps = { alpha: config.properties.alpha || 1 };
          if (isReverse && cycle > 0) {
            animationProps = { alpha: 1 };
          }
          break;
      }

      this.timeline.to(
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
   * Enhanced path animation handling
   */
  protected addPathAnimation(config: PathAnimationConfig | PolygonAnimationConfig, target: PIXI.Container) {
    const pathElement = config.pathElement;

    try {
      switch (pathElement.type) {
        case 'line':
          this.addLinePathAnimation(config, target, pathElement);
          break;
        case 'path':
          this.addCustomPathAnimation(config, target, pathElement);
          break;
        default:
          if (isPolygonAnimationConfig(config)) {
            this.addPolygonPathAnimation(config, target);
          }
      }
    } catch (error) {
      console.warn(`⚠️ Error adding path animation for ${pathElement.type}:`, error);
    }
  }

  private addLinePathAnimation(config: PathAnimationConfig | PolygonAnimationConfig, target: PIXI.Container, pathElement: AnimatedCanvasObject | CanvasGroup) {
    if (!('lineOptions' in pathElement) || !pathElement.lineOptions?.points?.end) return;

    // Build repeat configuration
    const repeatConfig: Record<string, number | boolean> = {};
    if (config.repeat !== undefined && config.repeat !== 0) {
      repeatConfig.repeat = config.repeat;
    }
    if (config.repeatDelay !== undefined) {
      repeatConfig.repeatDelay = config.repeatDelay;
    }
    if (config.yoyo !== undefined) {
      repeatConfig.yoyo = config.yoyo;
    }

    const { end } = pathElement.lineOptions.points;
    this.timeline.to(target, {
      pixi: { x: end.x, y: end.y },
      duration: config.duration,
      ease: config.ease,
      ...repeatConfig
    }, config.startTime);
  }

  private addCustomPathAnimation(config: PathAnimationConfig | PolygonAnimationConfig, target: PIXI.Container, pathElement: AnimatedCanvasObject | CanvasGroup) {
    if (!('pathPoints' in pathElement) || !pathElement.pathPoints) return;

    // Build repeat configuration
    const repeatConfig: Record<string, number | boolean> = {};
    if (config.repeat !== undefined && config.repeat !== 0) {
      repeatConfig.repeat = config.repeat;
    }
    if (config.repeatDelay !== undefined) {
      repeatConfig.repeatDelay = config.repeatDelay;
    }
    if (config.yoyo !== undefined) {
      repeatConfig.yoyo = config.yoyo;
    }

    const pathPoints = pathElement.pathPoints.map((p: { x: number, y: number }) => ({
      x: pathElement.x + p.x,
      y: pathElement.y + p.y
    }));

    let svgPath = `M${pathPoints[0].x},${pathPoints[0].y} `;
    for (let i = 1; i < pathPoints.length; i++) {
      svgPath += `L${pathPoints[i].x},${pathPoints[i].y} `;
    }

    const proxy = { x: 0, y: 0 };
    this.timeline.to(proxy, {
      motionPath: { path: svgPath, autoRotate: false },
      duration: config.duration,
      ease: config.ease,
      ...repeatConfig,
      onUpdate: () => {
        if (target && target.parent && !target.destroyed) {
          target.x = proxy.x;
          target.y = proxy.y;
        }
      }
    }, config.startTime);
  }

  private addPolygonPathAnimation(config: PolygonAnimationConfig, target: PIXI.Container) {
    if (!config.properties.pathPoints) return;

    const pathPoints = config.properties.pathPoints;
    const segmentDuration = config.duration / pathPoints.length;

    pathPoints.forEach((point: { x: number, y: number }, index: number) => {
      this.timeline.to(target, {
        pixi: { x: point.x, y: point.y },
        duration: segmentDuration,
        ease: config.ease,
      }, config.startTime + (segmentDuration * index));
    });
  }

  /**
   * Update performance metrics
   */
  private updatePerformanceMetrics(startTime: number, elements: number, groups: number, animations: number) {
    const buildTime = performance.now() - startTime;

    this.performanceMetrics.totalBuilds++;
    this.performanceMetrics.lastBuildTime = buildTime;
    this.performanceMetrics.averageBuildTime =
      (this.performanceMetrics.averageBuildTime * (this.performanceMetrics.totalBuilds - 1) + buildTime) /
      this.performanceMetrics.totalBuilds;
    this.performanceMetrics.elementsProcessed = elements;
    this.performanceMetrics.groupsProcessed = groups;
    this.performanceMetrics.animationsCreated = animations;
  }

  /**
   * Get performance metrics
   */
  getPerformanceMetrics(): TimelinePerformanceMetrics {
    return { ...this.performanceMetrics };
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(): string {
    const metrics = this.performanceMetrics;
    return `
GSAP Timeline Manager Performance Report:
- Total Builds: ${metrics.totalBuilds}
- Average Build Time: ${metrics.averageBuildTime.toFixed(2)}ms
- Last Build Time: ${metrics.lastBuildTime.toFixed(2)}ms
- Elements Processed: ${metrics.elementsProcessed}
- Groups Processed: ${metrics.groupsProcessed}
- Animations Created: ${metrics.animationsCreated}
- Build Efficiency: ${metrics.animationsCreated > 0 ? (metrics.animationsCreated / metrics.lastBuildTime * 1000).toFixed(2) : 0} animations/sec
    `;
  }

  updateTime(elapsedTime: number) {
    try {
      this.timeline.time(elapsedTime);
    } catch (error) {
      console.warn('⚠️ Error updating timeline:', error);
      this.clearTimeline();
    }
  }

  handlePlayback(isPlaying: boolean, updateTick: () => void) {
    if (isPlaying) {
      gsap.ticker.add(updateTick);
      this.timeline.play();
    } else {
      gsap.ticker.remove(updateTick);
      this.timeline.pause();
    }
  }

  stop() {
    gsap.ticker.remove(() => { });
    this.timeline.pause();
    this.timeline.time(0);
  }

  clearTimeline() {
    this.timeline.kill();
    this.timeline.clear();
    this.timeline = gsap.timeline({ paused: true });
  }

  destroy() {
    this.timeline.kill();
    gsap.ticker.remove(this.updateTime);
  }
} 