import { gsap } from 'gsap';
import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';
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
 * Interface for canvas ref that provides access to shape and group containers
 * Used by the timeline manager to access PIXI containers for animations
 */
export interface TimelineCanvasRef {
  getShapeRefs: () => Record<string, PIXI.Container>;
  getGroupContainers: () => Record<string, PIXI.Container>;
  getMainContainer: () => PIXI.Container | null;
}

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
  protected canvasRef: React.RefObject<TimelineCanvasRef | null> | null = null;

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
  }

  setCanvasRef(ref: React.RefObject<TimelineCanvasRef | null>) {
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

        animationsCreated += this.processElementAnimations(element, elements, shapeRefs);
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

    } catch (error) {
      console.error('🎬 Error in timeline build:', error);
      this.clearTimeline();
    }
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
      this.addRepeatedPhysicsAnimation(config, target, cycleDuration, repeat, repeatDelay, yoyo);
    } else {
      // Handle repeats manually for standard animations
      this.addRepeatedStandardAnimation(config, target, cycleDuration, repeat, repeatDelay, yoyo);
    }
  }

  /**
   * Add repeated color animation cycles with proper yoyo support
   */
  private addRepeatedColorAnimation(
    config: ColorAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    if (yoyo) {
      // When yoyo is enabled, each cycle includes forward + return
      this.addYoyoColorAnimation(config, target, cycleDuration, repeat, repeatDelay);
    } else {
      // Normal repeated animation without yoyo
      this.addNormalColorAnimation(config, target, cycleDuration, repeat, repeatDelay);
    }
  }

  /**
   * Add yoyo color animation: forward + return within each cycle
   */
  private addYoyoColorAnimation(
    config: ColorAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      // Each cycle duration is split: half for forward, half for return
      const halfCycleDuration = cycleDuration / 2;

      // Forward journey: old to new color
      this.timeline.to(
        config.oldChild,
        {
          pixi: { alpha: 0 },
          duration: halfCycleDuration,
          ease: config.ease
        },
        currentTime
      );

      this.timeline.to(
        config.newChild,
        {
          pixi: { alpha: 1 },
          duration: halfCycleDuration,
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

      // Return journey: new to old color
      this.timeline.to(
        config.newChild,
        {
          pixi: { alpha: 0 },
          duration: halfCycleDuration,
          ease: config.yoyoReturnEase ?? config.ease
        },
        currentTime + halfCycleDuration
      );

      this.timeline.to(
        config.oldChild,
        {
          pixi: { alpha: 1 },
          duration: halfCycleDuration,
          ease: config.yoyoReturnEase ?? config.ease
        },
        currentTime + halfCycleDuration
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add normal color animation without yoyo
   */
  private addNormalColorAnimation(
    config: ColorAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
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

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add repeated physics animation cycles with proper yoyo support
   */
  private addRepeatedPhysicsAnimation(
    config: PhysicsAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    if (yoyo) {
      // When yoyo is enabled, each cycle includes forward + return
      this.addYoyoPhysicsAnimation(config, target, cycleDuration, repeat, repeatDelay);
    } else {
      // Normal repeated animation without yoyo
      this.addNormalPhysicsAnimation(config, target, cycleDuration, repeat, repeatDelay);
    }
  }

  /**
   * Add yoyo physics animation: forward + return within each cycle
   */
  private addYoyoPhysicsAnimation(
    config: PhysicsAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    // Store original values
    const originalValues: Record<string, number> = {};
    originalValues.x = target.x;
    originalValues.y = target.y;

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
      // Each cycle duration is split: half for forward, half for return
      const halfCycleDuration = cycleDuration / 2;

      // Forward journey: apply physics
      this.timeline.to(
        config.target,
        {
          physics2D: physics2DConfig,
          duration: halfCycleDuration,
          ease: config.ease
        },
        currentTime
      );

      // Return journey: animate back to original position
      this.timeline.to(
        config.target,
        {
          pixi: originalValues,
          duration: halfCycleDuration,
          ease: config.yoyoReturnEase ?? config.ease
        },
        currentTime + halfCycleDuration
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add normal physics animation without yoyo
   */
  private addNormalPhysicsAnimation(
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
   * Add standard animation with proper yoyo support
   */
  private addRepeatedStandardAnimation(
    config: BaseAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number,
    yoyo: boolean
  ) {
    if (yoyo) {
      // When yoyo is enabled, each cycle includes forward + return
      this.addYoyoStandardAnimation(config, target, cycleDuration, repeat, repeatDelay);
    } else {
      // Normal repeated animation without yoyo
      this.addNormalStandardAnimation(config, target, cycleDuration, repeat, repeatDelay);
    }
  }

  /**
   * Add yoyo animation: forward + return within each cycle
   */
  private addYoyoStandardAnimation(
    config: BaseAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    // Store original values - access PIXI properties directly
    const originalValues: Record<string, unknown> = {};
    Object.keys(config.properties).forEach(key => {
      let currentValue: unknown;

      // Handle PIXI scale properties specifically
      if (key === 'scaleX') {
        currentValue = target.scale.x;
      } else if (key === 'scaleY') {
        currentValue = target.scale.y;
      } else {
        // Access other PIXI properties normally
        const pixiTarget = target as PIXI.Container & Record<string, unknown>;
        currentValue = pixiTarget[key];
      }

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
          originalValues[key] = 0;
        } else if (key === 'x' || key === 'y') {
          const pixiTarget = target as PIXI.Container & Record<string, unknown>;
          originalValues[key] = pixiTarget[key] || 0;
        } else {
          originalValues[key] = 0;
        }
      }
    });

    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      // Each cycle duration is split: half for forward, half for return
      const halfCycleDuration = cycleDuration / 2;

      // Forward journey: current values → target values
      this.timeline.to(
        config.target,
        {
          pixi: config.properties,
          duration: halfCycleDuration,
          ease: config.ease
        },
        currentTime
      );

      // Return journey: target values → original values
      // Debug logging for scale animations
      if ('scaleX' in config.properties || 'scaleY' in config.properties) {
        console.log('Scale Animation Debug:');
        console.log('Forward properties:', config.properties);
        console.log('Return properties:', originalValues);
        console.log('Target scale object:', target.scale);
      }

      // Create return properties in the same format as forward properties
      const returnProperties = { ...originalValues };

      // For scale animations, let's try both approaches to see which works
      if ('scaleX' in config.properties || 'scaleY' in config.properties) {
        console.log('Trying scaleX/scaleY format for return');

        // Alternative approach 1: try setting scale object directly
        // returnProperties = {
        //   scale: {
        //     x: originalValues.scaleX || target.scale.x,
        //     y: originalValues.scaleY || target.scale.y
        //   }
        // };

        // Alternative approach 2: Use GSAP's built-in yoyo instead of manual
        // Instead of manual yoyo, let's try using GSAP's native yoyo for this specific case
        console.log('Testing GSAP native yoyo for scale...');

        // Skip the return animation and instead create a yoyo animation
        // Use half the cycle duration so total time (forward + return) = cycleDuration
        this.timeline.to(
          config.target,
          {
            pixi: config.properties,
            duration: cycleDuration / 2, // Half duration so yoyo fits within cycleDuration
            ease: config.ease,
            yoyo: true,
            repeat: 1 // One repeat to create the return effect
          },
          currentTime
        );

        // Skip the manual return animation for this test
        currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
        continue; // Skip the rest of this cycle
      }

      this.timeline.to(
        config.target,
        {
          pixi: returnProperties,
          duration: halfCycleDuration,
          ease: config.yoyoReturnEase ?? config.ease
        },
        currentTime + halfCycleDuration
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add normal animation without yoyo
   */
  private addNormalStandardAnimation(
    config: BaseAnimationConfig,
    target: PIXI.Container,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      this.timeline.to(
        config.target,
        {
          pixi: config.properties,
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
   * Add group animation to timeline with proper yoyo support
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

    // Check if stagger is enabled
    const stagger = config.stagger ?? 0;
    const hasStagger = stagger > 0;

    if (hasStagger) {
      // Apply stagger animation to individual elements
      if (yoyo) {
        this.addStaggeredYoyoGroupAnimation(config, animation, cycleDuration, repeat, repeatDelay);
      } else {
        this.addStaggeredNormalGroupAnimation(config, animation, cycleDuration, repeat, repeatDelay);
      }
    } else {
      // Apply animation to entire group container (existing behavior)
      if (yoyo) {
        this.addYoyoGroupAnimation(config, groupContainer, animation, cycleDuration, repeat, repeatDelay);
      } else {
        this.addNormalGroupAnimation(config, groupContainer, animation, cycleDuration, repeat, repeatDelay);
      }
    }
  }

  /**
   * Add yoyo group animation: forward + return within each cycle
   */
  private addYoyoGroupAnimation(
    config: GroupAnimationConfig,
    groupContainer: PIXI.Container,
    animation: ElementAnimation,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    // Store original values
    const originalValues: Record<string, number> = {};
    if (animation.type === 'move') {
      originalValues.x = groupContainer.x;
      originalValues.y = groupContainer.y;
    } else if (animation.type === 'rotate') {
      originalValues.rotation = groupContainer.rotation || 0;
    } else if (animation.type === 'scale') {
      originalValues.scaleX = groupContainer.scale.x || 1;
      originalValues.scaleY = groupContainer.scale.y || 1;
    } else if (animation.type === 'fade') {
      originalValues.alpha = groupContainer.alpha || 1;
    }

    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      // Each cycle duration is split: half for forward, half for return
      const halfCycleDuration = cycleDuration / 2;

      // Get target animation properties
      let targetProps: Record<string, number> = {};
      switch (animation.type) {
        case 'move':
          targetProps = {
            x: config.properties.x || groupContainer.x,
            y: config.properties.y || groupContainer.y
          };
          break;
        case 'rotate':
          targetProps = { rotation: config.properties.rotation || 0 };
          break;
        case 'scale':
          targetProps = {
            scaleX: config.properties.scaleX || 1,
            scaleY: config.properties.scaleY || 1
          };
          break;
        case 'fade':
          targetProps = { alpha: config.properties.alpha !== undefined ? config.properties.alpha : 1 };
          break;
      }

      // Forward journey: current values → target values
      this.timeline.to(
        groupContainer,
        {
          pixi: targetProps,
          duration: halfCycleDuration,
          ease: config.ease
        },
        currentTime
      );

      // Return journey: target values → original values
      this.timeline.to(
        groupContainer,
        {
          pixi: originalValues,
          duration: halfCycleDuration,
          ease: config.yoyoReturnEase ?? config.ease
        },
        currentTime + halfCycleDuration
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add normal group animation without yoyo
   */
  private addNormalGroupAnimation(
    config: GroupAnimationConfig,
    groupContainer: PIXI.Container,
    animation: ElementAnimation,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    // Get target animation properties
    let targetProps: Record<string, number> = {};
    switch (animation.type) {
      case 'move':
        targetProps = {
          x: config.properties.x || groupContainer.x,
          y: config.properties.y || groupContainer.y
        };
        break;
      case 'rotate':
        targetProps = { rotation: config.properties.rotation || 0 };
        break;
      case 'scale':
        targetProps = {
          scaleX: config.properties.scaleX || 1,
          scaleY: config.properties.scaleY || 1
        };
        break;
      case 'fade':
        targetProps = { alpha: config.properties.alpha !== undefined ? config.properties.alpha : 1 };
        break;
    }

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      this.timeline.to(
        groupContainer,
        {
          pixi: targetProps,
          duration: cycleDuration,
          ease: config.ease
        },
        currentTime
      );

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  /**
   * Add staggered normal group animation to individual elements
   */
  private addStaggeredNormalGroupAnimation(
    config: GroupAnimationConfig,
    animation: ElementAnimation,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    const stagger = config.stagger ?? 0;
    const staggerFrom = config.staggerFrom ?? 'start';

    // Get individual element containers
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) return;

    const groupElements = config.group.elementIds
      .map(id => shapeRefs[id])
      .filter(container => container && !container.destroyed);

    if (groupElements.length === 0) return;

    // Calculate stagger timing based on direction
    const totalStaggerTime = (groupElements.length - 1) * stagger;
    let staggerStartTime = config.startTime;
    
    if (staggerFrom === 'end') {
      staggerStartTime = config.startTime - totalStaggerTime;
    } else if (staggerFrom === 'center') {
      staggerStartTime = config.startTime - (totalStaggerTime / 2);
    }

    // Get target animation properties
    let targetProps: Record<string, number> = {};
    switch (animation.type) {
      case 'move':
        targetProps = {
          x: config.properties.x || 0,
          y: config.properties.y || 0
        };
        break;
      case 'rotate':
        targetProps = { rotation: config.properties.rotation || 0 };
        break;
      case 'scale':
        targetProps = {
          scaleX: config.properties.scaleX || 1,
          scaleY: config.properties.scaleY || 1
        };
        break;
      case 'fade':
        targetProps = { alpha: config.properties.alpha !== undefined ? config.properties.alpha : 1 };
        break;
    }

    // Apply animation to each element with stagger
    groupElements.forEach((elementContainer, index) => {
      const elementStartTime = staggerStartTime + (index * stagger);
      
      for (let cycle = 0; cycle < totalCycles; cycle++) {
        const cycleStartTime = elementStartTime + (cycle * (cycleDuration + repeatDelay));
        
        this.timeline.to(
          elementContainer,
          {
            pixi: targetProps,
            duration: cycleDuration,
            ease: config.ease
          },
          cycleStartTime
        );
      }
    });
  }

  /**
   * Add staggered yoyo group animation to individual elements
   */
  private addStaggeredYoyoGroupAnimation(
    config: GroupAnimationConfig,
    animation: ElementAnimation,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    const stagger = config.stagger ?? 0;
    const staggerFrom = config.staggerFrom ?? 'start';

    // Get individual element containers
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) return;

    const groupElements = config.group.elementIds
      .map(id => shapeRefs[id])
      .filter(container => container && !container.destroyed);

    if (groupElements.length === 0) return;

    // Calculate stagger timing based on direction
    const totalStaggerTime = (groupElements.length - 1) * stagger;
    let staggerStartTime = config.startTime;
    
    if (staggerFrom === 'end') {
      staggerStartTime = config.startTime - totalStaggerTime;
    } else if (staggerFrom === 'center') {
      staggerStartTime = config.startTime - (totalStaggerTime / 2);
    }

    // Get target animation properties
    let targetProps: Record<string, number> = {};
    switch (animation.type) {
      case 'move':
        targetProps = {
          x: config.properties.x || 0,
          y: config.properties.y || 0
        };
        break;
      case 'rotate':
        targetProps = { rotation: config.properties.rotation || 0 };
        break;
      case 'scale':
        targetProps = {
          scaleX: config.properties.scaleX || 1,
          scaleY: config.properties.scaleY || 1
        };
        break;
      case 'fade':
        targetProps = { alpha: config.properties.alpha !== undefined ? config.properties.alpha : 1 };
        break;
    }

    // Apply yoyo animation to each element with stagger
    groupElements.forEach((elementContainer, index) => {
      const elementStartTime = staggerStartTime + (index * stagger);
      
      for (let cycle = 0; cycle < totalCycles; cycle++) {
        const cycleStartTime = elementStartTime + (cycle * (cycleDuration + repeatDelay));
        const halfCycleDuration = cycleDuration / 2;

        // Forward journey
        this.timeline.to(
          elementContainer,
          {
            pixi: targetProps,
            duration: halfCycleDuration,
            ease: config.ease
          },
          cycleStartTime
        );

        // Return journey (yoyo)
        this.timeline.to(
          elementContainer,
          {
            pixi: { x: 0, y: 0, rotation: 0, scaleX: 1, scaleY: 1, alpha: 1 }, // Reset to original
            duration: halfCycleDuration,
            ease: config.yoyoReturnEase ?? config.ease
          },
          cycleStartTime + halfCycleDuration
        );
      }
    });
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

    const { end } = pathElement.lineOptions.points;
    const repeat = config.repeat ?? 0;
    const repeatDelay = config.repeatDelay ?? 0;
    const yoyo = config.yoyo ?? false;

    // Calculate compressed cycle duration for repeats
    let cycleDuration = config.duration;
    if (repeat !== 0) {
      if (repeat === -1) {
        cycleDuration = config.duration / 10;
      } else {
        const totalCycles = 1 + repeat;
        const totalDelayTime = repeat * repeatDelay;
        const availableAnimationTime = config.duration - totalDelayTime;
        cycleDuration = Math.max(0.1, availableAnimationTime / totalCycles);
      }
    }

    if (yoyo) {
      this.addYoyoLinePathAnimation(config, target, end, cycleDuration, repeat, repeatDelay);
    } else {
      this.addNormalLinePathAnimation(config, target, end, cycleDuration, repeat, repeatDelay);
    }
  }

  private addYoyoLinePathAnimation(
    config: PathAnimationConfig | PolygonAnimationConfig,
    target: PIXI.Container,
    endPoint: { x: number, y: number },
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    // Store original values
    const originalValues = { x: target.x, y: target.y };
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const halfCycleDuration = cycleDuration / 2;

      // Forward journey: current position → end position
      this.timeline.to(target, {
        pixi: { x: endPoint.x, y: endPoint.y },
        duration: halfCycleDuration,
        ease: config.ease
      }, currentTime);

      // Return journey: end position → original position
      this.timeline.to(target, {
        pixi: originalValues,
        duration: halfCycleDuration,
        ease: config.yoyoReturnEase ?? config.ease
      }, currentTime + halfCycleDuration);

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  private addNormalLinePathAnimation(
    config: PathAnimationConfig | PolygonAnimationConfig,
    target: PIXI.Container,
    endPoint: { x: number, y: number },
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      this.timeline.to(target, {
        pixi: { x: endPoint.x, y: endPoint.y },
        duration: cycleDuration,
        ease: config.ease
      }, currentTime);

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  private addCustomPathAnimation(config: PathAnimationConfig | PolygonAnimationConfig, target: PIXI.Container, pathElement: AnimatedCanvasObject | CanvasGroup) {
    if (!('pathPoints' in pathElement) || !pathElement.pathPoints) return;

    const repeat = config.repeat ?? 0;
    const repeatDelay = config.repeatDelay ?? 0;
    const yoyo = config.yoyo ?? false;

    // Calculate compressed cycle duration for repeats
    let cycleDuration = config.duration;
    if (repeat !== 0) {
      if (repeat === -1) {
        cycleDuration = config.duration / 10;
      } else {
        const totalCycles = 1 + repeat;
        const totalDelayTime = repeat * repeatDelay;
        const availableAnimationTime = config.duration - totalDelayTime;
        cycleDuration = Math.max(0.1, availableAnimationTime / totalCycles);
      }
    }

    const pathPoints = pathElement.pathPoints.map((p: { x: number, y: number }) => ({
      x: pathElement.x + p.x,
      y: pathElement.y + p.y
    }));

    let svgPath = `M${pathPoints[0].x},${pathPoints[0].y} `;
    for (let i = 1; i < pathPoints.length; i++) {
      svgPath += `L${pathPoints[i].x},${pathPoints[i].y} `;
    }

    if (yoyo) {
      this.addYoyoCustomPathAnimation(config, target, svgPath, cycleDuration, repeat, repeatDelay);
    } else {
      this.addNormalCustomPathAnimation(config, target, svgPath, cycleDuration, repeat, repeatDelay);
    }
  }

  private addYoyoCustomPathAnimation(
    config: PathAnimationConfig | PolygonAnimationConfig,
    target: PIXI.Container,
    svgPath: string,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    // Store original values
    const originalValues = { x: target.x, y: target.y };
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const halfCycleDuration = cycleDuration / 2;

      // Forward journey: follow the path
      const forwardProxy = { x: target.x, y: target.y };
      this.timeline.to(forwardProxy, {
        motionPath: { path: svgPath, autoRotate: false },
        duration: halfCycleDuration,
        ease: config.ease,
        onUpdate: () => {
          if (target && target.parent && !target.destroyed) {
            target.x = forwardProxy.x;
            target.y = forwardProxy.y;
          }
        }
      }, currentTime);

      // Return journey: animate back to original position
      this.timeline.to(target, {
        pixi: originalValues,
        duration: halfCycleDuration,
        ease: config.yoyoReturnEase ?? config.ease
      }, currentTime + halfCycleDuration);

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
  }

  private addNormalCustomPathAnimation(
    config: PathAnimationConfig | PolygonAnimationConfig,
    target: PIXI.Container,
    svgPath: string,
    cycleDuration: number,
    repeat: number,
    repeatDelay: number
  ) {
    const totalCycles = repeat === -1 ? 10 : (1 + repeat);
    let currentTime = config.startTime;

    for (let cycle = 0; cycle < totalCycles; cycle++) {
      const proxy = { x: target.x, y: target.y };
      this.timeline.to(proxy, {
        motionPath: { path: svgPath, autoRotate: false },
        duration: cycleDuration,
        ease: config.ease,
        onUpdate: () => {
          if (target && target.parent && !target.destroyed) {
            target.x = proxy.x;
            target.y = proxy.y;
          }
        }
      }, currentTime);

      currentTime += cycleDuration + (cycle < totalCycles - 1 ? repeatDelay : 0);
    }
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