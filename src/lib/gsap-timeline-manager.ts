import { gsap } from 'gsap';
import type { AnimatedCanvasElement } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import * as PIXI from 'pixi.js';
import { generateAnimationConfig, isColorAnimationConfig, isPathAnimationConfig } from '@/utils/animation-generator';

gsap.registerPlugin(PixiPlugin);
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
      if (element.isPath) return;
      
      const target = shapeRefs[element.id];
      if (!target) return;

      element.animations.forEach((animation) => {
        const config = generateAnimationConfig(element, animation, target);

        if (isPathAnimationConfig(config)) {
          // Get the path element
          const pathElement = config.pathElement;
          
          // Calculate movement duration - each segment takes 1/4 of the total duration
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
          
          // Starting point for the animation around the path
          const pathStartTime = config.startTime + config.attachDelay;
          // Starting from the top-left position after initial move
          
          // 1. Move from top-left to top-right (right: add width)
          this.timeline.to(
            target,
            {
              pixi: { 
                x: "+="+pathElement.width
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
                y: "+="+pathElement.height
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
                x: "-="+pathElement.width
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
                y: "-="+pathElement.height
              },
              duration: segmentDuration,
              ease: config.ease,
            },
            pathStartTime + (segmentDuration * 3)
          );
          
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