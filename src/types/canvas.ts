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
  pathElement?: AnimatedCanvasObject | CanvasGroup;
  isPolygonPath?: boolean; // Whether this is a polygon path animation (for handling line segments)
  // Text animation properties
  text?: string;
  fontSize?: number;
  letterSpacing?: number;
  // Physics animation properties
  velocity?: number;
  angle?: number;
  gravity?: number;
  acceleration?: number;
  accelerationAngle?: number;
  friction?: number;
  xProp?: string;
  yProp?: string;
};

export type AnimationType = 'rotate' | 'scale' | 'move' | 'color' | 'fade' | 'path' | 'typewriter' | 'textScale' | 'physics';

export interface ElementAnimation {
  id: string;
  displayName: string; // Human-readable name like "path-1", "move-2", etc.
  type: AnimationType;
  startTime: number;
  duration: number;
  properties: AnimatableProperties;
  easing?: GsapEase;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  yoyoReturnEasing?: GsapEase;
  // Stagger properties for group animations
  stagger?: number; // Delay between each element in the group (in seconds)
  staggerFrom?: 'start' | 'end' | 'center'; // Direction of stagger
  staggerEase?: GsapEase; // Easing for the stagger effect
}

export interface BaseAnimationConfig {
  target: Container;
  properties: AnimatableProperties;
  duration: number;
  startTime: number;
  ease: string;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  yoyoReturnEase?: string;
}

export interface AnimatedCanvasObject {
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'arc' | 'line' | 'path' | 'image' | 'text' ;
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
  visible?: boolean; // Element visibility - defaults to true
  zIndex?: number; // Z-index for layering - higher values appear on top
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  shadowAngle?: number;
  pivotX?: number;
  pivotY?: number;
  lineOptions?: {
    points: {start: {x: number, y: number}, end: {x: number, y: number}};
    controlPoint?: {x: number, y: number}; // Optional control point for curved lines
    arrow: boolean;
    dotted: boolean;
    isCurved?: boolean; // Flag to indicate if line is curved vs straight
  };
  pathPoints?: Array<{x: number, y: number}>;
  imageData?: string;
  // Arc-specific properties  
  arcOptions?: Record<string, never>; // Empty object - arc shape determined by width/height
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
  // Rich text properties for Pixi v8
  textStroke?: string;
  textStrokeWidth?: number;
  textStrokeJoin?: 'round' | 'miter' | 'bevel';
  textDropShadow?: {
    color: string;
    blur: number;
    angle: number;
    distance: number;
    alpha: number;
  };
  textGradient?: {
    type: 'linear' | 'radial';
    colors: Array<{ color: string; offset: number }>;
    angle?: number; // For linear gradients
    center?: { x: number; y: number }; // For radial gradients
    radius?: number; // For radial gradients
  };
  letterSpacing?: number;
  wordWrap?: boolean;
  wordWrapWidth?: number;
  groupId?: string;
  // Parent-child relationship
  parent?: string | null; // ID of parent element or group
}

export interface CanvasGroup {
  id: string;
  name: string;
  elementIds: string[]; // IDs of objects in this group
  x: number; // Group position (center)
  y: number;
  rotation?: number; // Group rotation
  visible?: boolean; // Group visibility - defaults to true
  opacity?: number; // Group opacity - defaults to 1
  type: 'text' | 'custom' | 'polygon'; // Group type determines presentation and behavior
  isDefaultGroup: boolean; // True for auto-created single-object groups
  isAnimationPath?: boolean; // True for groups that are animation paths
  animations: ElementAnimation[]; // Group animations
  // Text group specific properties (when type === 'text')
  characters?: string[]; // For text groups, the individual characters
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  textAlign?: string;
  letterSpacing?: number;
  // Polygon group specific properties (when type === 'polygon')
  isClosed?: boolean; // Whether the polygon path is closed
  // Parent-child relationship
  parent?: string | null; // ID of parent element or group
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