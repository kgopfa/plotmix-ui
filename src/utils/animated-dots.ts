import { Texture, AnimatedSprite, Container } from 'pixi.js';

interface AnimatedDotOptions {
  size: number;
  color: number;
  alpha: number;
  spacing: number;
  animationSpeed: number;
}

export class AnimatedDots {
  private container: Container;
  private dots: AnimatedSprite[] = [];
  private options: AnimatedDotOptions;
  private static textureCache: Map<string, Texture[]> = new Map();

  constructor(options: AnimatedDotOptions) {
    this.options = options;
    this.container = new Container();
  }

  /**
   * Generate simple circle dot textures for animation
   */
  private static generateDotTextures(size: number, color: number, alpha: number): Texture[] {
    const cacheKey = `${size}-${color}-${alpha}`;
    
    if (this.textureCache.has(cacheKey)) {
      return this.textureCache.get(cacheKey)!;
    }

    const textures: Texture[] = [];
    const frameCount = 8; // Number of animation frames

    for (let frame = 0; frame < frameCount; frame++) {
      const canvas = document.createElement('canvas');
      const currentAlpha = alpha * (0.3 + 0.7 * Math.sin((frame / frameCount) * Math.PI * 2));
      
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d')!;
      
      ctx.clearRect(0, 0, size, size);
      ctx.fillStyle = `rgba(${(color >> 16) & 0xFF}, ${(color >> 8) & 0xFF}, ${color & 0xFF}, ${currentAlpha})`;
      
      // Draw simple circle
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.fill();

      const texture = Texture.from(canvas);
      texture.source.scaleMode = 'nearest';
      textures.push(texture);
    }

    this.textureCache.set(cacheKey, textures);
    return textures;
  }

  /**
   * Create animated dots along a line path
   */
  createDotsAlongLine(start: { x: number; y: number }, end: { x: number; y: number }): void {
    // Clear existing dots
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];

    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (distance === 0) return;

    const numDots = Math.floor(distance / this.options.spacing);
    if (numDots === 0) return;

    // Generate textures
    const textures = AnimatedDots.generateDotTextures(this.options.size, this.options.color, this.options.alpha);

    // Create dots along the line
    for (let i = 0; i < numDots; i++) {
      const ratio = i / (numDots - 1);
      const x = start.x + dx * ratio;
      const y = start.y + dy * ratio;

      const dot = new AnimatedSprite(textures);
      dot.anchor.set(0.5);
      dot.x = x;
      dot.y = y;
      dot.animationSpeed = this.options.animationSpeed;
      
      // Stagger the animation start time for flowing effect
      dot.gotoAndPlay(i * 0.1);
      
      this.dots.push(dot);
      this.container.addChild(dot);
    }
  }

  /**
   * Create animated dots along a curved path
   */
  createDotsAlongCurve(
    start: { x: number; y: number }, 
    control: { x: number; y: number }, 
    end: { x: number; y: number }
  ): void {
    // Clear existing dots
    this.dots.forEach(dot => dot.destroy());
    this.dots = [];

    // Sample points along the quadratic curve
    const points: { x: number; y: number }[] = [];
    const steps = 20;
    
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const invT = 1 - t;
      const x = invT * invT * start.x + 2 * invT * t * control.x + t * t * end.x;
      const y = invT * invT * start.y + 2 * invT * t * control.y + t * t * end.y;
      points.push({ x, y });
    }

    // Calculate total path length
    let totalLength = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLength += Math.sqrt(dx * dx + dy * dy);
    }

    const numDots = Math.floor(totalLength / this.options.spacing);
    if (numDots === 0) return;

    // Generate textures
    const textures = AnimatedDots.generateDotTextures(this.options.size, this.options.color, this.options.alpha);

    // Create dots along the curved path
    let currentDistance = 0;
    let segmentIndex = 0;
    let segmentProgress = 0;

    for (let i = 0; i < numDots; i++) {
      const targetDistance = i * this.options.spacing;
      
      // Find the position along the path
      while (currentDistance < targetDistance && segmentIndex < points.length - 1) {
        const dx = points[segmentIndex + 1].x - points[segmentIndex].x;
        const dy = points[segmentIndex + 1].y - points[segmentIndex].y;
        const segmentLength = Math.sqrt(dx * dx + dy * dy);
        
        if (currentDistance + segmentLength >= targetDistance) {
          segmentProgress = (targetDistance - currentDistance) / segmentLength;
          break;
        }
        
        currentDistance += segmentLength;
        segmentIndex++;
        segmentProgress = 0;
      }

      if (segmentIndex >= points.length - 1) break;

      // Calculate dot position
      const startPoint = points[segmentIndex];
      const endPoint = points[segmentIndex + 1];
      const x = startPoint.x + (endPoint.x - startPoint.x) * segmentProgress;
      const y = startPoint.y + (endPoint.y - startPoint.y) * segmentProgress;

      const dot = new AnimatedSprite(textures);
      dot.anchor.set(0.5);
      dot.x = x;
      dot.y = y;
      dot.animationSpeed = this.options.animationSpeed;
      
      // Stagger the animation start time for flowing effect
      dot.gotoAndPlay(i * 0.1);
      
      this.dots.push(dot);
      this.container.addChild(dot);
    }
  }

  /**
   * Start the animation
   */
  play(): void {
    this.dots.forEach(dot => dot.play());
  }

  /**
   * Stop the animation
   */
  stop(): void {
    this.dots.forEach(dot => dot.stop());
  }

  /**
   * Get the container for adding to the stage
   */
  getContainer(): Container {
    return this.container;
  }

  /**
   * Set visibility
   */
  setVisible(visible: boolean): void {
    this.container.visible = visible;
  }

  /**
   * Set alpha
   */
  setAlpha(alpha: number): void {
    this.container.alpha = alpha;
  }

  /**
   * Destroy the animated dots
   */
  destroy(): void {
    this.dots.forEach(dot => dot.destroy());
    this.container.destroy();
  }
}
