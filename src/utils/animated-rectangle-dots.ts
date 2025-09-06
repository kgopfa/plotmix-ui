import { Graphics, Container } from 'pixi.js';
import { gsap } from 'gsap';

interface AnimatedRectangleDotsOptions {
  width: number;
  color: number;
  alpha: number;
  dotSize: number;
  spacing: number;
  animationSpeed: number;
}

export class AnimatedRectangleDots {
  private container: Container;
  private dots: Graphics[] = [];
  private options: AnimatedRectangleDotsOptions;
  private timeline: gsap.core.Timeline;
  private isPlaying: boolean = false;

  constructor(options: AnimatedRectangleDotsOptions) {
    this.options = options;
    this.container = new Container();
    this.timeline = gsap.timeline({ paused: true });
  }

  /**
   * Create animated rectangle dots along a line
   */
  createLine(
    start: { x: number; y: number },
    end: { x: number; y: number }
  ): void {
    this.clearDots();
    this.createDotsAlongPath([start, end]);
    this.setupAnimation();
  }

  /**
   * Create animated rectangle dots along a curved path
   */
  createCurve(
    start: { x: number; y: number },
    control: { x: number; y: number },
    end: { x: number; y: number }
  ): void {
    this.clearDots();
    
    // Generate points along the quadratic curve
    const points: Array<{ x: number; y: number }> = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const invT = 1 - t;
      const x = invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x;
      const y = invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y;
      points.push({ x, y });
    }
    
    this.createDotsAlongPath(points);
    this.setupAnimation();
  }

  /**
   * Create dots along a path of points
   */
  private createDotsAlongPath(points: Array<{ x: number; y: number }>): void {
    if (points.length < 2) return;

    // Calculate total path length
    let totalLength = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const dx = points[i + 1].x - points[i].x;
      const dy = points[i + 1].y - points[i].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    // Calculate number of dots based on spacing
    const numDots = Math.floor(totalLength / this.options.spacing);
    if (numDots === 0) return;

    // Create dots along the path
    for (let i = 0; i < numDots; i++) {
      const targetDistance = i * this.options.spacing;
      const position = this.getPositionAlongPath(points, targetDistance);
      
      if (position) {
        const dot = this.createDot(position.x, position.y);
        this.dots.push(dot);
        this.container.addChild(dot);
      }
    }
  }

  /**
   * Get position along path at a specific distance
   */
  private getPositionAlongPath(points: Array<{ x: number; y: number }>, targetDistance: number): { x: number; y: number } | null {
    let currentDistance = 0;
    
    for (let i = 0; i < points.length - 1; i++) {
      const start = points[i];
      const end = points[i + 1];
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const segmentLength = Math.sqrt(dx * dx + dy * dy);
      
      if (currentDistance + segmentLength >= targetDistance) {
        // Position is in this segment
        const segmentProgress = (targetDistance - currentDistance) / segmentLength;
        return {
          x: start.x + dx * segmentProgress,
          y: start.y + dy * segmentProgress
        };
      }
      
      currentDistance += segmentLength;
    }
    
    return null;
  }

  /**
   * Create a single dot (small rectangle)
   */
  private createDot(x: number, y: number): Graphics {
    const dot = new Graphics();
    
    // Draw a small rectangle
    const halfSize = this.options.dotSize / 2;
    dot.rect(-halfSize, -halfSize, this.options.dotSize, this.options.dotSize);
    dot.fill({
      color: this.options.color,
      alpha: this.options.alpha
    });
    
    // Position the dot
    dot.x = x;
    dot.y = y;
    
    return dot;
  }

  /**
   * Set up the animation timeline
   */
  private setupAnimation(): void {
    this.timeline.clear();
    
    // Animate each dot with a stagger effect
    this.dots.forEach((dot, index) => {
      // Start each dot with a slight delay for flowing effect
      const delay = index * 0.1;
      
      this.timeline.to(dot, {
        alpha: 0,
        duration: 0.3,
        ease: 'none'
      }, delay);
      
      this.timeline.to(dot, {
        alpha: this.options.alpha,
        duration: 0.3,
        ease: 'none'
      }, delay + 0.3);
    });
    
    // Repeat infinitely
    this.timeline.repeat(-1);
  }

  /**
   * Clear all dots
   */
  private clearDots(): void {
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];
    this.container.removeChildren();
  }

  /**
   * Start the animation
   */
  play(): void {
    if (!this.isPlaying) {
      this.timeline.play();
      this.isPlaying = true;
    }
  }

  /**
   * Pause the animation
   */
  pause(): void {
    if (this.isPlaying) {
      this.timeline.pause();
      this.isPlaying = false;
    }
  }

  /**
   * Stop and reset the animation
   */
  stop(): void {
    this.timeline.pause();
    this.timeline.progress(0);
    this.isPlaying = false;
  }

  /**
   * Set animation speed
   */
  setAnimationSpeed(speed: number): void {
    this.options.animationSpeed = speed;
    this.setupAnimation();
  }

  /**
   * Update dot properties
   */
  updateOptions(options: Partial<AnimatedRectangleDotsOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Update existing dots
    this.dots.forEach(dot => {
      dot.clear();
      const halfSize = this.options.dotSize / 2;
      dot.rect(-halfSize, -halfSize, this.options.dotSize, this.options.dotSize);
      dot.fill({
        color: this.options.color,
        alpha: this.options.alpha
      });
    });
    
    this.setupAnimation();
  }

  /**
   * Get the container for adding to the scene
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Destroy the animated dots and clean up resources
   */
  destroy(): void {
    this.timeline.kill();
    this.clearDots();
    this.container.destroy();
  }
}
