import { gsap } from 'gsap';
import type { AnimatedCanvasElement } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import * as PIXI from 'pixi.js';
import { generateAnimationConfig, isColorAnimationConfig } from '@/utils/animation-generator';

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

  buildTimeline(elements: AnimatedCanvasElement[]) {
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) return;

    this.timeline.clear();

    elements.forEach((element) => {
      const target = shapeRefs[element.id];
      if (!target) return;

      element.animations.forEach((animation) => {
        const config = generateAnimationConfig(element, animation, target);

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