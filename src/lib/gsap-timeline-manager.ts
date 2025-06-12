import { gsap } from 'gsap';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import * as PIXI from 'pixi.js';
import { 
  generateAnimationConfig, 
  generateGroupAnimationConfig,
  isColorAnimationConfig, 
  isPathAnimationConfig,
  isGroupAnimationConfig
} from '@/utils/animation-generator';
import { GroupManager } from '@/lib/group-manager';

gsap.registerPlugin(PixiPlugin, MotionPathPlugin);
PixiPlugin.registerPIXI(PIXI);

export class GSAPTimelineManager {
  private timeline: gsap.core.Timeline;
  private canvasRef: React.RefObject<CanvasRef | null> | null = null;
  private groupManager: GroupManager;

  constructor() {
    this.timeline = gsap.timeline({ paused: true });
    this.groupManager = GroupManager.getInstance();
  }

  setCanvasRef(ref: React.RefObject<CanvasRef | null>) {
    this.canvasRef = ref;
  }

  buildAnimationTimeline(elements: AnimatedCanvasObject[], groups?: CanvasGroup[]) {
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) {
      console.warn('No shape refs available, skipping timeline build');
      return;
    }

    console.log('Building timeline for', elements.length, 'elements');
    
    // Kill all existing tweens and clear timeline
    this.timeline.kill();
    this.timeline.clear();
    this.timeline = gsap.timeline({ paused: true });

    // Process element animations
    elements.forEach((element) => {
      if (element.isAnimationPath) return;

      const target = shapeRefs[element.id];
      if (!target || target.destroyed || !target.parent) {
        console.warn(`Skipping animation for element ${element.id} - invalid target`);
        return;
      }

      element.animations.forEach((animation) => {
        const config = generateAnimationConfig(element, animation, target);

        if (isPathAnimationConfig(config)) {
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
            const sideLength = (2 * height) / Math.sqrt(3);
            const halfWidth = sideLength / 2;
            
            // Calculate triangle vertices relative to center
            const topPoint = { x: pathElement.x, y: pathElement.y - height/2 };
            const bottomLeft = { x: pathElement.x - halfWidth, y: pathElement.y + height/2 };
            const bottomRight = { x: pathElement.x + halfWidth, y: pathElement.y + height/2 };

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
            const state = { angle: -Math.PI/2 }; // Start at 12 o'clock position (top)
            
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
            
            const { start, end } = pathElement.lineOptions.points;
            
            // Initial move to the start point of the line
            this.timeline.to(
              target,
              {
                pixi: {
                  x: start.x,
                  y: start.y
                },
                duration: config.attachDelay,
                ease: config.ease,
              },
              config.startTime
            );
            
            const pathStartTime = config.startTime + config.attachDelay;
            
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
              pathStartTime
            );
          }
          
          if (pathElement.type === 'path' && pathElement.pathPoints) {
            // Convert pathPoints to the format for animation
            const pathPoints = pathElement.pathPoints.map(p => ({
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

    // Process group animations
    if (groups) {
      groups.forEach((group) => {
        if (group.isDefaultGroup || group.animations.length === 0) return;

        group.animations.forEach((animation) => {
          // Get all element targets in this group
          const groupElements = this.groupManager.getElementsInGroup(group.id, elements);
          const elementTargets = groupElements
            .map(el => shapeRefs[el.id])
            .filter(target => target && !target.destroyed && target.parent);

          if (elementTargets.length === 0) return;

          const config = generateGroupAnimationConfig(group, animation, elementTargets);

          if (isGroupAnimationConfig(config)) {
            // Apply animation to all elements in the group
            config.elementTargets.forEach((target) => {
              if (animation.type === 'move') {
                // For move animations, calculate relative offset from group center
                const element = groupElements.find(el => shapeRefs[el.id] === target);
                if (element) {
                  const offsetX = element.x - group.x;
                  const offsetY = element.y - group.y;
                  const newX = (config.properties.x || group.x) + offsetX;
                  const newY = (config.properties.y || group.y) + offsetY;
                  
                  this.timeline.to(
                    target,
                    {
                      pixi: { x: newX, y: newY },
                      duration: config.duration,
                      ease: config.ease,
                    },
                    config.startTime
                  );
                }
              } else if (animation.type === 'rotate') {
                // For rotate animations, rotate around group center
                const element = groupElements.find(el => shapeRefs[el.id] === target);
                if (element) {
                  this.timeline.to(
                    target,
                    {
                      pixi: { 
                        rotation: config.properties.rotation || 0,
                        transformOrigin: `${group.x}px ${group.y}px`
                      },
                      duration: config.duration,
                      ease: config.ease,
                    },
                    config.startTime
                  );
                }
              } else {
                // For scale and fade, apply directly
                this.timeline.to(
                  target,
                  {
                    pixi: config.properties,
                    duration: config.duration,
                    ease: config.ease,
                  },
                  config.startTime
                );
              }
            });
          }
        });
      });
    }

    this.timeline.pause(0);
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