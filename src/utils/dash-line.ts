import { Graphics, Matrix, Texture, Color, LineCap, LineJoin } from 'pixi.js';

type Dashes = number[];

interface DashLineOptions {
    dash?: Dashes;
    width?: number;
    color?: Color | string | number;
    alpha?: number;
    scale?: number;
    useTexture?: boolean;
    cap?: LineCap;
    join?: LineJoin;
    alignment?: number;
}

const defaultOptions: DashLineOptions = {
    dash: [10, 5],
    width: 1,
    color: 0xffffff,
    alpha: 1,
    scale: 1,
    useTexture: false,
    cap: "butt",
    join: "miter",
    alignment: 0.5
};

export class DashLine {
    private graphics: Graphics;
    private options: DashLineOptions;
    private lineLength = 0;
    private cursor = { x: 0, y: 0 };
    private start = { x: 0, y: 0 };
    private dashSize: number;
    private activeTexture?: Texture;
    private static textureCache: Record<string, Texture> = {};

    constructor(graphics: Graphics, options: DashLineOptions = {}) {
        this.graphics = graphics;
        this.options = { ...defaultOptions, ...options };
        this.dashSize = this.options.dash!.reduce((a, b) => a + b);
        this.setLineStyle();
    }

    private setLineStyle(angle?: number) {
        const opts = this.options;
        const color = typeof opts.color === 'string' ? new Color(opts.color).toNumber() : opts.color;
        
        const strokeOpts: Parameters<Graphics['stroke']>[0] = {
            width: opts.width! * opts.scale!,
            color,
            alpha: opts.alpha,
            cap: opts.cap,
            join: opts.join,
            alignment: opts.alignment
        };

        if (this.options.useTexture) {
            const texture = DashLine.getTexture(this.options, this.dashSize);
            strokeOpts.texture = texture;
            
            if (angle !== undefined) {
                const matrix = new Matrix();
                matrix.rotate(angle);
                matrix.translate(this.cursor.x, this.cursor.y);
                strokeOpts.matrix = matrix;
            }
        }

        this.graphics.stroke(strokeOpts);
    }

    moveTo(x: number, y: number): this {
        this.lineLength = 0;
        this.cursor = { x, y };
        this.start = { x, y };
        this.graphics.moveTo(x, y);
        return this;
    }

    lineTo(x: number, y: number): this {
        const dx = x - this.cursor.x;
        const dy = y - this.cursor.y;
        const length = Math.sqrt(dx * dx + dy * dy);
        const angle = Math.atan2(dy, dx);

        if (this.options.useTexture) {
            this.setLineStyle(angle);
            this.graphics.lineTo(x, y);
        } else {
            let remaining = length;
            let dashIndex = 0;
            let dashStart = 0;

            while (remaining > 0) {
                const dashLength = this.options.dash![dashIndex] * this.options.scale! - dashStart;
                const segment = Math.min(remaining, dashLength);
                
                const x1 = this.cursor.x + Math.cos(angle) * segment;
                const y1 = this.cursor.y + Math.sin(angle) * segment;

                if (dashIndex % 2 === 0) {
                    this.graphics.lineTo(x1, y1);
                } else {
                    this.graphics.moveTo(x1, y1);
                }

                remaining -= segment;
                dashStart = 0;
                dashIndex = (dashIndex + 1) % this.options.dash!.length;
                this.cursor = { x: x1, y: y1 };
            }
        }

        this.lineLength += length;
        return this;
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

    private static getTexture(options: DashLineOptions, dashSize: number): Texture {
        const key = options.dash!.join('-');
        if (DashLine.textureCache[key]) return DashLine.textureCache[key];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        canvas.width = dashSize;
        canvas.height = options.width!;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = options.width!;
        ctx.beginPath();
        
        let x = 0;
        ctx.moveTo(x, options.width! / 2);
        
        for (let i = 0; i < options.dash!.length; i += 2) {
            x += options.dash![i];
            ctx.lineTo(x, options.width! / 2);
            x += options.dash![i + 1] || 0;
            ctx.moveTo(x, options.width! / 2);
        }
        
        ctx.stroke();
        
        const texture = Texture.from(canvas);
        texture.source.scaleMode = 'nearest';
        DashLine.textureCache[key] = texture;
        
        return texture;
    }
}
