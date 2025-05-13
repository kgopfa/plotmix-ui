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

export type AnimatableProperties = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  opacity?: number;
  radius?: number;
  cornerRadius?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  rotation?: number;
};

export type AnimationType = 'rotate' | 'scale' | 'move' | 'color' | 'fade';

export interface ElementAnimation {
  id: string;
  type: AnimationType;
  startTime: number; // seconds
  duration: number; // seconds
  properties: AnimatableCSSProperties;
  easing?: GsapEase;
}

export interface AnimatableCSSProperties {
  // Transform-related properties
  x?: number | string;
  y?: number | string;
  z?: number | string;
  xPercent?: number;
  yPercent?: number;
  zPercent?: number;
  rotation?: number;
  rotationX?: number;
  rotationY?: number;
  rotationZ?: number;
  skewX?: number;
  skewY?: number;
  scale?: number;
  scaleX?: number;
  scaleY?: number;
  scaleZ?: number;
  transformPerspective?: number;
  transformOrigin?: string;

  // Opacity and color
  opacity?: number;
  backgroundColor?: string;
  borderColor?: string;
  color?: string;

  // Box model
  width?: number | string;
  height?: number | string;
  top?: number | string;
  left?: number | string;
  right?: number | string;
  bottom?: number | string;
  margin?: string;
  padding?: string;
  borderRadius?: string;
  boxShadow?: string;

  // Filters
  filter?: string;

  // SVG-specific
  fill?: string;
  stroke?: string;
  strokeWidth?: number | string;

  // Text
  fontSize?: number | string;
  letterSpacing?: number | string;
  lineHeight?: number | string;
  textShadow?: string;
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

export const EASING_OPTIONS: GsapEase[] = [
  'none',
  'power1.in',
  'power1.out',
  'power1.inOut',
  'power2.in',
  'power2.out',
  'power2.inOut',
  'power3.in',
  'power3.out',
  'power3.inOut',
  'power4.in',
  'power4.out',
  'power4.inOut',
  'back.in',
  'back.out',
  'back.inOut',
  'bounce.in',
  'bounce.out',
  'bounce.inOut',
  'circ.in',
  'circ.out',
  'circ.inOut',
  'elastic.in',
  'elastic.out',
  'elastic.inOut',
  'expo.in',
  'expo.out',
  'expo.inOut',
  'sine.in',
  'sine.out',
  'sine.inOut',
];

export type GsapEase =
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
