export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  radius?: number;
  cornerRadius?: number;
  opacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowEnabled?: boolean;
}

export interface ElementAnimation {
  id: string;
  startTime: number; // seconds
  duration: number; // seconds
  properties: Partial<Pick<CanvasElement, 'x' | 'y' | 'width' | 'height' | 'fill' | 'opacity' | 'radius' | 'cornerRadius' | 'shadowBlur' | 'shadowOffsetX' | 'shadowOffsetY' | 'shadowOpacity'>>;
  easing?: string; // GSAP-compatible easing (e.g., 'power2.inOut')
}

export interface AnimatedCanvasElement {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  opacity?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  animations: Array<{
    id: string;
    startTime: number;
    duration: number;
    type: string;
    properties: Partial<Pick<CanvasElement, 'x' | 'y' | 'width' | 'height' | 'fill' | 'opacity' | 'radius' | 'cornerRadius' | 'shadowBlur' | 'shadowOffsetX' | 'shadowOffsetY' | 'shadowOpacity'>>;
  }>;
}