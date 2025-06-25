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
        console.log('⚡ Skipping timeline build - no animations found');
        this.clearTimeline();
        this.updatePerformanceMetrics(buildStartTime, 0, 0, 0);
        return;
      }

      const shapeRefs = this.canvasRef?.current?.getShapeRefs();
      if (!shapeRefs) {
        console.warn('⚠️ No shape refs available, skipping timeline build');
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
      
      console.log(`🎬 Timeline built: ${elementsProcessed} elements, ${groupsProcessed} groups, ${animationsCreated} animations in ${this.performanceMetrics.lastBuildTime.toFixed(2)}ms`);
      
    } catch (error) {
      console.error('❌ Error building timeline:', error);
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
   * Add animation to timeline with proper error handling
   */
  private addAnimationToTimeline(
    config: BaseAnimationConfig | ColorAnimationConfig | PathAnimationConfig | PhysicsAnimationConfig | PolygonAnimationConfig, 
    target: PIXI.Container,
  ) {
    if (isPathAnimationConfig(config) || isPolygonAnimationConfig(config)) {
      this.addPathAnimation(config, target);
    } else if (isColorAnimationConfig(config)) {
      this.timeline.to(
        config.oldChild,
        {
          pixi: { alpha: 0 },
          duration: config.duration,
          ease: config.ease,
        },
        config.startTime
      );

      this.timeline.to(
        config.newChild,
        {
          pixi: { alpha: 1 },
          duration: config.duration,
          ease: config.ease,
          onInterrupt: () => {
            try {
              target.removeChild(config.newChild);
            } catch (e) {
              console.warn('Error removing child on interrupt:', e);
            }
          }
        },
        config.startTime
      );
    } else if (isPhysicsAnimationConfig(config)) {
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

      this.timeline.to(
        config.target,
        {
          physics2D: physics2DConfig,
          duration: config.duration,
          ease: config.ease,
        },
        config.startTime
      );
    } else {
      this.timeline.to(
        config.target,
        {
          pixi: config.properties,
          duration: config.duration,
          ease: config.ease,
        },
        config.startTime
      );
    }
  }

  /**
   * Add group animation to timeline
   */
  private addGroupAnimationToTimeline(config: GroupAnimationConfig, groupContainer: PIXI.Container, animation: ElementAnimation) {
    if (!isGroupAnimationConfig(config)) return;

    const baseConfig = {
      duration: config.duration,
      ease: config.ease,
    };

    switch (animation.type) {
      case 'move':
        this.timeline.to(
          groupContainer,
          {
            pixi: { 
              x: config.properties.x || groupContainer.x, 
              y: config.properties.y || groupContainer.y 
            },
            ...baseConfig,
          },
          config.startTime
        );
        break;

      case 'rotate':
        this.timeline.to(
          groupContainer,
          {
            pixi: { rotation: config.properties.rotation || 0 },
            ...baseConfig,
          },
          config.startTime
        );
        break;

      case 'scale':
        this.timeline.to(
          groupContainer,
          {
            pixi: {
              scaleX: config.properties.scaleX || 1,
              scaleY: config.properties.scaleY || 1
            },
            ...baseConfig,
          },
          config.startTime
        );
        break;

      case 'fade':
        this.timeline.to(
          groupContainer,
          {
            pixi: { alpha: config.properties.alpha || 1 },
            ...baseConfig,
          },
          config.startTime
        );
        break;
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

    const { end } = pathElement.lineOptions.points;
    this.timeline.to(target, {
      pixi: { x: end.x, y: end.y },
      duration: config.duration,
      ease: config.ease,
    }, config.startTime);
  }

  private addCustomPathAnimation(config: PathAnimationConfig | PolygonAnimationConfig, target: PIXI.Container, pathElement: AnimatedCanvasObject | CanvasGroup) {
    if (!('pathPoints' in pathElement) || !pathElement.pathPoints) return;

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
    } else {
      gsap.ticker.remove(updateTick);
    }
  }

  clearTimeline() {
    this.timeline.kill();
    this.timeline.clear();
    this.timeline = gsap.timeline({ paused: true });
  }

  destroy() {
    this.timeline.kill();
    gsap.ticker.remove(this.updateTime);
    console.log('GSAPTimelineManager destroyed');
  }
} 