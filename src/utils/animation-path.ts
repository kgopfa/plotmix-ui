import { Graphics, Matrix, Texture, Color, LineCap, LineJoin } from 'pixi.js';

type Dashes = number[];

interface AnimationPathOptions {
    dash?: Dashes;
    width?: number;
    color?: Color | string | number;
    alpha?: number;
    scale?: number;
    useTexture?: boolean;
    cap?: LineCap;
    join?: LineJoin;
    alignment?: number;
    exactPixelWidth?: boolean; // Force exact pixel width regardless of scale
}

const defaultOptions: AnimationPathOptions = {
    dash: [10, 5],
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false,
    cap: "butt",
    join: "miter",
    alignment: 0.5,
    exactPixelWidth: true
};

export class AnimationPath {
    private graphics: Graphics;
    private options: AnimationPathOptions;
    private lineLength = 0;
    private cursor = { x: 0, y: 0 };
    private start = { x: 0, y: 0 };
    private dashSize: number;
    private dashOffset = 0; // Track current position in dash pattern
    private static textureCache: Record<string, Texture> = {};
    private devicePixelRatio: number;

    constructor(graphics: Graphics, options: AnimationPathOptions = {}) {
        this.graphics = graphics;
        this.options = { ...defaultOptions, ...options };
        this.dashSize = this.options.dash!.reduce((a, b) => a + b);
        this.devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        // Don't call setLineStyle here - wait until we're ready to stroke
    }

    private getStrokeOptions(angle?: number): Parameters<Graphics['stroke']>[0] {
        const opts = this.options;
        const color = typeof opts.color === 'string' ? new Color(opts.color).toNumber() : opts.color;
        
        // Calculate actual line width
        let actualWidth = opts.width!;
        if (opts.exactPixelWidth) {
            // Force exact pixel width by accounting for device pixel ratio and avoiding scale multiplication
            actualWidth = opts.width! / this.devicePixelRatio;
        } else {
            actualWidth = opts.width! * opts.scale!;
        }
        
        const strokeOpts: Parameters<Graphics['stroke']>[0] = {
            width: actualWidth,
            color,
            alpha: opts.alpha,
            cap: opts.cap,
            join: opts.join,
            alignment: opts.alignment
        };

        if (this.options.useTexture) {
            const texture = AnimationPath.getTexture(this.options, this.dashSize);
            strokeOpts.texture = texture;
            
            if (angle !== undefined) {
                const matrix = new Matrix();
                matrix.rotate(angle);
                matrix.translate(this.cursor.x, this.cursor.y);
                strokeOpts.matrix = matrix;
            }
        }

        return strokeOpts;
    }

    moveTo(x: number, y: number): this {
        this.lineLength = 0;
        this.cursor = { x, y };
        this.start = { x, y };
        this.dashOffset = 0; // Reset dash offset on move
        this.graphics.moveTo(x, y);
        return this;
    }

    lineTo(x: number, y: number): this {
        const dx = x - this.cursor.x;
        const dy = y - this.cursor.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        
        if (length === 0) return this;
        
        const angle = Math.atan2(dy, dx);

        if (this.options.useTexture) {
            // For texture-based dashing, we can draw the line directly
            this.graphics.lineTo(x, y);
            const strokeOpts = this.getStrokeOptions(angle);
            this.graphics.stroke(strokeOpts);
        } else {
            // Manual dashing - break the line into segments
            this.drawDashedLine(this.cursor.x, this.cursor.y, x, y);
        }

        this.cursor = { x, y };
        this.lineLength += length;
        return this;
    }

    private drawDashedLine(x1: number, y1: number, x2: number, y2: number): void {
        const dx = x2 - x1;
        const dy = y2 - y1;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);
        
        let remaining = length;
        let currentX = x1;
        let currentY = y1;
        
        while (remaining > 0) {
            // Find current dash/gap in the pattern
            const patternPos = this.dashOffset % this.dashSize;
            let dashIndex = 0;
            let accumulatedLength = 0;
            
            // Find which dash/gap we're in
            for (let i = 0; i < this.options.dash!.length; i++) {
                const segmentLength = this.options.dash![i] * this.options.scale!;
                if (patternPos < accumulatedLength + segmentLength) {
                    dashIndex = i;
                    break;
                }
                accumulatedLength += segmentLength;
            }
            
            const currentSegmentLength = this.options.dash![dashIndex] * this.options.scale!;
            const remainingInSegment = currentSegmentLength - (patternPos - accumulatedLength);
            const segmentToUse = Math.min(remaining, remainingInSegment);
            
            const endX = currentX + Math.cos(angle) * segmentToUse;
            const endY = currentY + Math.sin(angle) * segmentToUse;
            
            if (dashIndex % 2 === 0) {
                // Draw dash (even indices)
                this.graphics.lineTo(endX, endY);
                this.graphics.stroke(this.getStrokeOptions());
            } else {
                // Skip gap (odd indices)
                this.graphics.moveTo(endX, endY);
            }
            
            currentX = endX;
            currentY = endY;
            remaining -= segmentToUse;
            this.dashOffset += segmentToUse;
        }
    }

    closePath(): this {
        return this.lineTo(this.start.x, this.start.y);
    }

    drawCircle(x: number, y: number, radius: number, points = 32): this {
        const angleStep = (Math.PI * 2) / points;
        this.moveTo(x + radius, y);
        
        for (let i = 1; i <= points; i++) {
            const angle = angleStep * i;
            this.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
        }
        
        return this.closePath();
    }

    drawEllipse(x: number, y: number, width: number, height: number, points = 32): this {
        const angleStep = (Math.PI * 2) / points;
        this.moveTo(x + width, y);
        
        for (let i = 1; i <= points; i++) {
            const angle = angleStep * i;
            this.lineTo(
                x + Math.cos(angle) * width,
                y + Math.sin(angle) * height
            );
        }
        
        return this.closePath();
    }

    drawRect(x: number, y: number, width: number, height: number): this {
        return this.moveTo(x, y)
            .lineTo(x + width, y)
            .lineTo(x + width, y + height)
            .lineTo(x, y + height)
            .closePath();
    }

    private static getTexture(options: AnimationPathOptions, dashSize: number): Texture {
        const devicePixelRatio = (typeof window !== 'undefined' && window.devicePixelRatio) || 1;
        const key = `${options.dash!.join('-')}-${options.width}-${devicePixelRatio}-${options.exactPixelWidth}`;
        
        if (AnimationPath.textureCache[key]) return AnimationPath.textureCache[key];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // Calculate actual dimensions for crisp rendering
        const actualWidth = options.exactPixelWidth ? options.width! : options.width! * devicePixelRatio;
        const canvasHeight = Math.max(Math.ceil(actualWidth), 1);
        
        canvas.width = dashSize * devicePixelRatio;
        canvas.height = canvasHeight * devicePixelRatio;
        
        // Scale context for high DPI
        ctx.scale(devicePixelRatio, devicePixelRatio);
        
        ctx.clearRect(0, 0, canvas.width / devicePixelRatio, canvas.height / devicePixelRatio);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = actualWidth;
        ctx.lineCap = options.cap as CanvasLineCap;
        ctx.lineJoin = options.join as CanvasLineJoin;
        
        // Enable crisp pixel rendering
        ctx.imageSmoothingEnabled = false;
        
        ctx.beginPath();
        let x = 0;
        const y = (canvas.height / devicePixelRatio) / 2;
        
        for (let i = 0; i < options.dash!.length; i += 2) {
            const dashLength = options.dash![i];
            const gapLength = options.dash![i + 1] || 0;
            
            // Draw dash
            ctx.moveTo(x, y);
            ctx.lineTo(x + dashLength, y);
            x += dashLength;
            
            // Skip gap
            x += gapLength;
        }
        
        ctx.stroke();
        
        const texture = Texture.from(canvas);
        texture.source.scaleMode = 'nearest';
        AnimationPath.textureCache[key] = texture;
        
        return texture;
    }
}
