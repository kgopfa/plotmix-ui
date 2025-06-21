import { gsap } from 'gsap';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
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
  PathAnimationConfig
} from '@/utils/animation-generator';


gsap.registerPlugin(PixiPlugin, Physics2DPlugin, MotionPathPlugin);
PixiPlugin.registerPIXI(PIXI);

export class GSAPTimelineManager {
  private timeline: gsap.core.Timeline;
  private canvasRef: React.RefObject<CanvasRef | null> | null = null;

  constructor() {
    this.timeline = gsap.timeline({ paused: true });
  }

  setCanvasRef(ref: React.RefObject<CanvasRef | null>) {
    this.canvasRef = ref;
  }

  buildAnimationTimeline(elements: AnimatedCanvasObject[], groups?: CanvasGroup[]) {
    // Performance optimization: Check if any animations exist before building timeline
    const hasElementAnimations = elements.some(el =>
      !el.isAnimationPath && el.animations && el.animations.length > 0
    );
    const hasGroupAnimations = groups?.some(group =>
      !group.isDefaultGroup && group.animations && group.animations.length > 0
    );

    // Skip timeline building if no animations exist
    if (!hasElementAnimations && !hasGroupAnimations) {
      console.log('Skipping timeline build - no animations found');
      // Clear any existing timeline to ensure clean state
      this.timeline.kill();
      this.timeline.clear();
      this.timeline = gsap.timeline({ paused: true });
      return;
    }

    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) {
      return;
    }

    // Kill all existing tweens and clear timeline
    this.timeline.kill();
    this.timeline.clear();
    this.timeline = gsap.timeline({ paused: true });

    // Process element animations - only for elements that have animations
    elements.forEach((element) => {
      if (element.isAnimationPath) return;

      // Special handling for textGroup animations - apply to all character children
      if (element.type === 'textGroup') {
        if (element.animations.length === 0) return;

        // Find all character children for this textGroup
        const characterChildren = elements.filter(el =>
          el.type === 'character' && el.parentTextGroupId === element.id
        );

        if (characterChildren.length === 0) {
          return;
        }

        element.animations.forEach((animation) => {
          // Apply the animation to each character child
          characterChildren.forEach((character) => {
            const characterTarget = shapeRefs[character.id];
            if (!characterTarget || characterTarget.destroyed || !characterTarget.parent) {
              return;
            }

            const config = generateAnimationConfig(character, animation, characterTarget);

            if (isColorAnimationConfig(config)) {
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
                    characterTarget.removeChild(config.newChild);
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
              
              // Add optional properties only if they exist
              if (config.acceleration !== undefined) physics2DConfig.acceleration = config.acceleration;
              if (config.accelerationAngle !== undefined) physics2DConfig.accelerationAngle = config.accelerationAngle;
              if (config.friction !== undefined) physics2DConfig.friction = config.friction;
              if (config.xProp) physics2DConfig.xProp = config.xProp;
              if (config.yProp) physics2DConfig.yProp = config.yProp;
              
              this.timeline.to(
                characterTarget,
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
          });
        });

        return; // Skip regular processing for textGroup
      }

      const target = shapeRefs[element.id];
      if (!target || target.destroyed || !target.parent) {
        return;
      }

      element.animations.forEach((animation) => {
        const config = generateAnimationConfig(element, animation, target);

        if (isPathAnimationConfig(config)) {
          this.addPathAnimation(config, target, element);
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
                target.removeChild(config.newChild);
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
          
          // Add optional properties only if they exist
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
      });
    });

    // Process group animations using group containers
    const groupContainers = this.canvasRef?.current?.getGroupContainers();
    if (groups && groupContainers) {
      groups.forEach((group) => {
        if (group.isDefaultGroup || group.animations.length === 0) return;

        const groupContainer = groupContainers[group.id];
        if (!groupContainer) return;

        group.animations.forEach((animation) => {
          const config = generateGroupAnimationConfig(group, animation, [groupContainer]);

          if (isGroupAnimationConfig(config)) {
            const baseConfig = {
              duration: config.duration,
              ease: config.ease,
            };

            if (animation.type === 'move') {
              // Animate the container position directly
              const targetX = config.properties.x || group.x;
              const targetY = config.properties.y || group.y;

              this.timeline.to(
                groupContainer,
                {
                  pixi: { x: targetX, y: targetY },
                  ...baseConfig,
                },
                config.startTime
              );
            } else if (animation.type === 'rotate') {
              // Animate container rotation - use degrees directly (same as individual elements)
              const targetRotation = config.properties.rotation || 0;

              this.timeline.to(
                groupContainer,
                {
                  pixi: { rotation: targetRotation },
                  ...baseConfig,
                },
                config.startTime
              );
            } else if (animation.type === 'scale') {
              // Animate container scale
              const targetScaleX = config.properties.scaleX || 1;
              const targetScaleY = config.properties.scaleY || 1;

              this.timeline.to(
                groupContainer,
                {
                  pixi: {
                    scaleX: targetScaleX,
                    scaleY: targetScaleY
                  },
                  ...baseConfig,
                },
                config.startTime
              );
            } else if (animation.type === 'fade') {
              // Animate container alpha
              const targetAlpha = config.properties.alpha || 1;

              this.timeline.to(
                groupContainer,
                {
                  pixi: { alpha: targetAlpha },
                  ...baseConfig,
                },
                config.startTime
              );
            }
          }
        });
      });
    }

    this.timeline.pause(0);
  }

  private addPathAnimation(config: PathAnimationConfig, target: PIXI.Container, element: AnimatedCanvasObject) {
    const pathElement = config.pathElement;

    if (pathElement.type === 'rectangle') {
      const segmentDuration = config.duration / 4;
      const pathStartTime = config.startTime;

      // 1. Move from top-left to top-right (right: add width)
      this.timeline.to(
        target,
        {
          pixi: {
            x: "+=" + pathElement.width
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime
      );

      // 2. Move from top-right to bottom-right (down: add height)
      this.timeline.to(
        target,
        {
          pixi: {
            y: "+=" + pathElement.height
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime + segmentDuration
      );

      // 3. Move from bottom-right to bottom-left (left: subtract width)
      this.timeline.to(
        target,
        {
          pixi: {
            x: "-=" + pathElement.width
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime + (segmentDuration * 2)
      );

      // 4. Move from bottom-left to top-left (up: subtract height)
      this.timeline.to(
        target,
        {
          pixi: {
            y: "-=" + pathElement.height
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime + (segmentDuration * 3)
      );
    }

    if (pathElement.type === 'triangle') {
      const segmentDuration = config.duration / 3;
      const height = pathElement.height;
      const width = pathElement.width;
      const halfWidth = width / 2;

      // Calculate triangle vertices relative to center
      const topPoint = { x: pathElement.x, y: pathElement.y - height / 2 };
      const bottomLeft = { x: pathElement.x - halfWidth, y: pathElement.y + height / 2 };
      const bottomRight = { x: pathElement.x + halfWidth, y: pathElement.y + height / 2 };

      const pathStartTime = config.startTime;

      // 1. Move from top to bottom-right
      this.timeline.to(
        target,
        {
          pixi: {
            x: bottomRight.x,
            y: bottomRight.y
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime
      );

      // 2. Move from bottom-right to bottom-left
      this.timeline.to(
        target,
        {
          pixi: {
            x: bottomLeft.x,
            y: bottomLeft.y
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime + segmentDuration
      );

      // 3. Move from bottom-left back to top
      this.timeline.to(
        target,
        {
          pixi: {
            x: topPoint.x,
            y: topPoint.y
          },
          duration: segmentDuration,
          ease: config.ease,
        },
        pathStartTime + (segmentDuration * 2)
      );
    }

    if (pathElement.type === 'circle') {
      // For circles, we'll use angle interpolation for smooth circular motion
      const radius = pathElement.radius || pathElement.width / 2;
      const state = { angle: -Math.PI / 2 }; // Start at 12 o'clock position (top)

      this.timeline.to(
        state,
        {
          angle: Math.PI * 1.5, // Full circle from -π/2 to 3π/2
          duration: config.duration,
          ease: config.ease,
          onUpdate: () => {
            // Get the current target from the GSAP timeline
            if (target && target.parent && !target.destroyed) {
              // Calculate position based on current angle
              const x = element.x + radius * Math.cos(state.angle);
              const y = element.y + radius * Math.sin(state.angle);

              // Set the position directly
              target.x = x;
              target.y = y;
            }
          }
        },
        config.startTime
      );
    }

    if (pathElement.type === 'line') {
      // For lines, we need to animate from start point to end point
      if (!pathElement.lineOptions || !pathElement.lineOptions.points) {
        return;
      }

      const { end } = pathElement.lineOptions.points;

      // Animate from start to end point
      this.timeline.to(
        target,
        {
          pixi: {
            x: end.x,
            y: end.y
          },
          duration: config.duration,
          ease: config.ease,
        },
        config.startTime
      );
    }

    if (pathElement.type === 'path' && pathElement.pathPoints) {
             // Convert pathPoints to the format for animation
       const pathPoints = pathElement.pathPoints.map((p: {x: number, y: number}) => ({
         x: pathElement.x + p.x,
         y: pathElement.y + p.y
       }));

      // Use MotionPathPlugin with proper SVG path format
      // Convert points to SVG path string
      let svgPath = `M${pathPoints[0].x},${pathPoints[0].y} `;

      for (let i = 1; i < pathPoints.length; i++) {
        svgPath += `L${pathPoints[i].x},${pathPoints[i].y} `;
      }

      // Create a proxy object that MotionPathPlugin can animate
      const proxy = { x: 0, y: 0 };

      this.timeline.to(
        proxy,
        {
          motionPath: {
            path: svgPath,
            autoRotate: false,
          },
          duration: config.duration,
          ease: config.ease,
          onUpdate: () => {
            if (target && target.parent && !target.destroyed) {
              target.x = proxy.x;
              target.y = proxy.y;
            }
          }
        },
        config.startTime
      );
    }
  }

  updateTime(elapsedTime: number) {
    try {
      this.timeline.time(elapsedTime);
    } catch (error) {
      console.warn('Error updating timeline:', error);
      // Clear the timeline if it's corrupted
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
  }
} 