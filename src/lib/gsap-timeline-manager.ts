import { gsap } from 'gsap';
import type { AnimatedCanvasElement } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import * as PIXI from 'pixi.js';
import { generateAnimationConfig, isColorAnimationConfig, isPathAnimationConfig } from '@/utils/animation-generator';

gsap.registerPlugin(PixiPlugin, MotionPathPlugin);
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

  buildAnimationTimeline(elements: AnimatedCanvasElement[]) {
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) return;

    this.timeline.clear();

    elements.forEach((element) => {
      if (element.isAnimationPath) return;

      const target = shapeRefs[element.id];
      if (!target) return;

      element.animations.forEach((animation) => {
        const config = generateAnimationConfig(element, animation, target);

        if (isPathAnimationConfig(config)) {
          const pathElement = config.pathElement;

          if (pathElement.type === 'rectangle') {
            const segmentDuration = config.duration / 4;

            // Initial move to the top-left corner with the attachDelay
            this.timeline.to(
              target,
              {
                pixi: config.properties,
                duration: config.attachDelay,
                ease: config.ease,
              },
              config.startTime
            );

            const pathStartTime = config.startTime + config.attachDelay;

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
            
            // Initial move to the path's starting point
            this.timeline.to(
              target,
              {
                pixi: config.properties,
                duration: config.attachDelay,
                ease: config.ease,
              },
              config.startTime
            );

            const pathStartTime = config.startTime + config.attachDelay;

            // For triangles, we need to move along the three edges
            // Using relative movements like we did for rectangles
            
            // 1. First edge - move to the right and down
            this.timeline.to(
              target,
              {
                pixi: {
                  x: "+=" + pathElement.width,
                  y: "+=" + pathElement.height
                },
                duration: segmentDuration,
                ease: config.ease,
              },
              pathStartTime
            );

            // 2. Second edge - move to the left
            this.timeline.to(
              target,
              {
                pixi: {
                  x: "-=" + pathElement.width
                },
                duration: segmentDuration,
                ease: config.ease,
              },
              pathStartTime + segmentDuration
            );

            // 3. Third edge - move back to the starting point
            this.timeline.to(
              target,
              {
                pixi: {
                  x: "+=" + pathElement.width,
                  y: "-=" + pathElement.height
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
            const centerX = pathElement.x;
            const centerY = pathElement.y;
            
            // Initial move to the starting point of the circle (12 o'clock position)
            this.timeline.to(
              target,
              {
                pixi: {
                  x: centerX,
                  y: centerY - radius
                },
                duration: config.attachDelay,
                ease: config.ease,
              },
              config.startTime
            );
            
            const pathStartTime = config.startTime + config.attachDelay;
            
            const state = { angle: -Math.PI/2 }; // Start at 12 o'clock position (top)
            
            this.timeline.to(
              state, 
              {
                angle: Math.PI * 1.5, // Full circle from -π/2 to 3π/2
                duration: config.duration,
                ease: config.ease,
                onUpdate: () => {
                  // Get the current target from the GSAP timeline
                  if (target) {
                    // Calculate position based on current angle
                    const x = centerX + radius * Math.cos(state.angle);
                    const y = centerY + radius * Math.sin(state.angle);
                    
                    // Set the position directly
                    target.x = x;
                    target.y = y;
                  }
                }
              },
              pathStartTime
            );
          }

          if (pathElement.type === 'line') {
            // For lines, we need to animate from start point to end point
            if (!pathElement.lineOptions || !pathElement.lineOptions.points) {
              console.error('Line element missing points for animation');
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
            
            // Initial move to the starting point
            this.timeline.to(
              target,
              {
                pixi: {
                  x: pathPoints[0].x,
                  y: pathPoints[0].y
                },
                duration: config.attachDelay,
                ease: config.ease,
              },
              config.startTime
            );
            
            const pathStartTime = config.startTime + config.attachDelay;
            
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
                  if (target) {
                    target.x = proxy.x;
                    target.y = proxy.y;
                  }
                }
              },
              pathStartTime
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

    this.timeline.pause(0);
  }

  updateTime(elapsedTime: number) {
    this.timeline.time(elapsedTime);
  }

  handlePlayback(isPlaying: boolean, updateTick: () => void) {
    if (isPlaying) {
      gsap.ticker.add(updateTick);
    } else {
      gsap.ticker.remove(updateTick);
    }
  }
} 