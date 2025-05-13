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
  easing?: GsapEase;
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
  animations: ElementAnimation[];
}

type GsapEase =
  | 'none'
  | 'power1.in'
  | 'power1.out'
  | 'power1.inOut'
  | 'power2.in'
  | 'power2.out'
  | 'power2.inOut'
  | 'power3.in'
  | 'power3.out'
  | 'power3.inOut'
  | 'power4.in'
  | 'power4.out'
  | 'power4.inOut'
  | 'back.in'
  | 'back.out'
  | 'back.inOut'
  | 'bounce.in'
  | 'bounce.out'
  | 'bounce.inOut'
  | 'circ.in'
  | 'circ.out'
  | 'circ.inOut'
  | 'elastic.in'
  | 'elastic.out'
  | 'elastic.inOut'
  | 'expo.in'
  | 'expo.out'
  | 'expo.inOut'
  | 'sine.in'
  | 'sine.out'
  | 'sine.inOut'
  | 'steps'
  | 'rough'
  | 'slow'
  | 'expoScale'
  | 'CustomEase'
  | 'CustomBounce'
  | 'CustomWiggle';
