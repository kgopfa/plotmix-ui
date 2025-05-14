import gsap from 'gsap';
import type { AnimatedCanvasElement } from '@/types/canvas';
import type { CanvasRef } from '@/components/canvas';

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
  
    elements.forEach((el) => {
      const target = shapeRefs[el.id];
      if (!target) return;
  
      el.animations.forEach((anim) => {
        let properties = { ...anim.properties };
        
        // Handle relative movement
        if (anim.type === 'move') {
          properties = {
            x: el.x + (Number(properties.x) ?? 0),
            y: el.y + (Number(properties.y) ?? 0)
          };
        }
  
        this.timeline.to(
          target,
          {
            ...properties,
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