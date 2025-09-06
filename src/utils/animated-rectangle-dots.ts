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
  private pathPoints: Array<{ x: number; y: number }> = [];
  private pathLength: number = 0;
  private spawnInterval: number = 0;

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
    this.pathPoints = [start, end];
    this.calculatePathLength();
    this.setupContinuousAnimation();
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
    
    this.pathPoints = points;
    this.calculatePathLength();
    this.setupContinuousAnimation();
  }

  /**
   * Calculate the total length of the path
   */
  private calculatePathLength(): void {
    this.pathLength = 0;
    for (let i = 0; i < this.pathPoints.length - 1; i++) {
      const dx = this.pathPoints[i + 1].x - this.pathPoints[i].x;
      const dy = this.pathPoints[i + 1].y - this.pathPoints[i].y;
      this.pathLength += Math.sqrt(dx * dx + dy * dy);
    }
  }

  /**
   * Create a single moving dot
   */
  private createMovingDot(): Graphics {
    const dot = new Graphics();
    
    // Draw a small rectangle
    const halfSize = this.options.dotSize / 2;
    dot.rect(-halfSize, -halfSize, this.options.dotSize, this.options.dotSize);
    dot.fill({
      color: this.options.color,
      alpha: this.options.alpha
    });
    
    // Position at the start of the path
    const startPosition = this.getPositionAndAngleAlongPath(this.pathPoints, 0);
    if (startPosition) {
      dot.x = startPosition.x;
      dot.y = startPosition.y;
      dot.rotation = startPosition.angle;
    }
    
    return dot;
  }

  /**
   * Get position and angle along path at a specific distance
   */
  private getPositionAndAngleAlongPath(points: Array<{ x: number; y: number }>, targetDistance: number): { x: number; y: number; angle: number } | null {
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
        const angle = Math.atan2(dy, dx); // Calculate angle of the line segment
        
        return {
          x: start.x + dx * segmentProgress,
          y: start.y + dy * segmentProgress,
          angle: angle
        };
      }
      
      currentDistance += segmentLength;
    }
    
    return null;
  }

  /**
   * Create a single dot (small rectangle) with rotation
   */
  private createDot(x: number, y: number, angle: number): Graphics {
    const dot = new Graphics();
    
    // Draw a small rectangle
    const halfSize = this.options.dotSize / 2;
    dot.rect(-halfSize, -halfSize, this.options.dotSize, this.options.dotSize);
    dot.fill({
      color: this.options.color,
      alpha: this.options.alpha
    });
    
    // Position and rotate the dot
    dot.x = x;
    dot.y = y;
    dot.rotation = angle;
    
    return dot;
  }

  /**
   * Set up continuous animation with moving dots
   */
  private setupContinuousAnimation(): void {
    this.timeline.clear();
    
    if (this.pathLength === 0) return;
    
    // Create a continuous stream by spawning dots at regular intervals
    this.createContinuousStream();
  }

  /**
   * Create a continuous stream of dots
   */
  private createContinuousStream(): void {
    // Calculate the time interval between spawning new dots
    // This ensures consistent spacing: if a dot travels the full path in animationSpeed seconds,
    // and we want spacing between dots, then spawn interval = spacing/pathLength * animationSpeed
    this.spawnInterval = (this.options.spacing / this.pathLength) * this.options.animationSpeed;
    
    // Create the first dot immediately
    this.spawnDot();
    
    // Then spawn dots at regular intervals
    this.timeline.to({}, {
      duration: this.spawnInterval,
      repeat: -1,
      onRepeat: () => {
        this.spawnDot();
      }
    });
  }

  /**
   * Spawn a new dot and animate it along the path
   */
  private spawnDot(): void {
    const dot = this.createMovingDot();
    this.dots.push(dot);
    this.container.addChild(dot);
    
    // Create a separate timeline for this dot
    const dotTimeline = gsap.timeline();
    
    // Create a proxy object to track this dot's progress
    const proxy = { progress: 0 };
    
    // Animate the dot along the entire path
    dotTimeline.to(proxy, {
      progress: 1,
      duration: this.options.animationSpeed,
      ease: 'none',
      onUpdate: () => {
        const distance = proxy.progress * this.pathLength;
        const position = this.getPositionAndAngleAlongPath(this.pathPoints, distance);
        
        if (position) {
          dot.x = position.x;
          dot.y = position.y;
          dot.rotation = position.angle;
        }
      },
      onComplete: () => {
        // Remove the dot when it reaches the end
        this.removeDot(dot);
      }
    });
  }

  /**
   * Get the current spacing between dots
   */
  getCurrentSpacing(): number {
    return this.options.spacing;
  }

  /**
   * Set the spacing between dots (will restart animation)
   */
  setSpacing(spacing: number): void {
    this.options.spacing = spacing;
    this.setupContinuousAnimation();
  }

  /**
   * Remove a dot from the animation
   */
  private removeDot(dot: Graphics): void {
    const index = this.dots.indexOf(dot);
    if (index > -1) {
      this.dots.splice(index, 1);
    }
    this.container.removeChild(dot);
    dot.destroy();
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
    this.setupContinuousAnimation();
  }

  /**
   * Update dot properties
   */
  updateOptions(options: Partial<AnimatedRectangleDotsOptions>): void {
    this.options = { ...this.options, ...options };
    
    // Update existing dots (preserve rotation)
    this.dots.forEach(dot => {
      const currentRotation = dot.rotation;
      dot.clear();
      const halfSize = this.options.dotSize / 2;
      dot.rect(-halfSize, -halfSize, this.options.dotSize, this.options.dotSize);
      dot.fill({
        color: this.options.color,
        alpha: this.options.alpha
      });
      dot.rotation = currentRotation; // Restore rotation
    });
    
    this.setupContinuousAnimation();
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
