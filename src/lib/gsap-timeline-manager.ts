import gsap from 'gsap';
import type { AnimatableProperties, AnimatedCanvasElement, ElementAnimation } from '@/types/canvas';
import type { CanvasRef } from '@/components/editor/canvas';
import { PixiPlugin } from "gsap/PixiPlugin";
import * as PIXI from 'pixi.js';

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

  private generateAnimationProperties(animation: ElementAnimation, element: AnimatedCanvasElement): Partial<AnimatableProperties> {
    const animeProps = { ...animation.properties };
    
    switch (animation.type) {
      case 'move':
        return {
          x: element.x + (Number(animeProps.x) ?? 0),
          y: element.y + (Number(animeProps.y) ?? 0)
        };
      
      case 'scale':
        return {
          scaleX: Number(animeProps.scaleX) ?? 1,
          scaleY: Number(animeProps.scaleY) ?? 1
        };
      
      case 'rotate':
        return {
          rotation: (Number(animeProps.rotation) ?? 0)
        };
      
      case 'fade':
        return {
          alpha: animeProps.alpha ?? 1
        };
      
      case 'color':
        return {
          fillColor: animeProps.fillColor ?? element.fill
        };
      
      default:
        return {};
    }
  }

  buildTimeline(elements: AnimatedCanvasElement[]) {
    const shapeRefs = this.canvasRef?.current?.getShapeRefs();
    if (!shapeRefs) return;
  
    this.timeline.clear();
  
    elements.forEach((el) => {
      const target = shapeRefs[el.id];
      if (!target) return;
  
      el.animations.forEach((anim) => {
        const animationProps = this.generateAnimationProperties(anim, el);
  
        this.timeline.to(
          target,
          {
            pixi: animationProps,
            duration: anim.duration,
            ease: anim.easing ?? 'power1.out',
          },
          anim.startTime
        );
      });
    });
  
    this.timeline.pause(0);
  }

  updateTime(elapsedTime: number) {
    this.timeline.time(elapsedTime, false);
  }

  handlePlayback(isPlaying: boolean, updateTick: () => void) {
    if (isPlaying) {
      gsap.ticker.add(updateTick);
    } else {
      gsap.ticker.remove(updateTick);
    }
  }
} 