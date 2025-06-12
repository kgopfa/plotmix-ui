import { Container } from "pixi.js";

export interface CanvasElement {
  id: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'text';
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
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
}

export type AnimatableProperties = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fillColor?: string;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
  radius?: number;
  cornerRadius?: number;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  rotation?: number;
  pivotX?: number;
  pivotY?: number;
  pathPoints?: Array<{x: number, y: number}>;
  pathDirection?: 'clockwise' | 'counterclockwise';
  yoyo?: boolean;
  pathElement?: AnimatedCanvasObject;
  attachDelay?: number; // Time to move to the starting corner of the path
  // Text animation properties
  text?: string;
  fontSize?: number;
  letterSpacing?: number;
};

export type AnimationType = 'rotate' | 'scale' | 'move' | 'color' | 'fade' | 'path' | 'typewriter' | 'textScale';

export interface ElementAnimation {
  id: string;
  type: AnimationType;
  startTime: number; // seconds
  duration: number; // seconds
  properties: AnimatableProperties;
  easing?: GsapEase;
}

export interface BaseAnimationConfig {
  target: Container;
  properties: AnimatableProperties;
  duration: number;
  startTime: number;
  ease: string;
}

export interface AnimatedCanvasObject {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'line' | 'path' | 'image' | 'text';
  x: number;
  y: number;
  width: number;
  height: number;
  fill: string;
  radius?: number;
  stroke?: string;
  strokeWidth?: number;
  cornerRadius?: number;
  rotation?: number;
  opacity?: number;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  pivotX?: number;
  pivotY?: number;
  lineOptions?: {
    points: {start: {x: number, y: number}, end: {x: number, y: number}};
    arrow: boolean;
    dotted: boolean;
  };
  pathPoints?: Array<{x: number, y: number}>;
  imageData?: string;
  animations: ElementAnimation[];
  isAnimationPath?: boolean;
  // Text-specific properties
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  lineHeight?: number;
  groupId?: string; // Every object belongs to a group
}

export interface CanvasGroup {
  id: string;
  name: string;
  elementIds: string[]; // IDs of objects in this group
  x: number; // Group position (center)
  y: number;
  rotation?: number; // Group rotation
  isDefaultGroup: boolean; // True for auto-created single-object groups
  animations: ElementAnimation[]; // Group animations
}

export type ElementAnimationTarget = 'element' | 'group';

export interface GroupAnimatableProperties {
  x?: number;
  y?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  alpha?: number;
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