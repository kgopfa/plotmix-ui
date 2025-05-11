import { AnimatedCanvasElement } from '@/components/editor/Canvas';

export type AnimationProperty = number | string | boolean;

export interface TimelineAnimation {
  id: string;
  elementId: string;
  startTime: number;  // in seconds
  duration: number;   // in seconds
  type: 'move' | 'scale' | 'rotate' | 'fade' | 'color';
  properties: {
    from: Record<string, AnimationProperty>;
    to: Record<string, AnimationProperty>;
  };
  easing?: string;
}

export interface TimelineState {
  tracks: AnimatedCanvasElement[];
  duration: number;  // total timeline duration in seconds
  scale: number;     // pixels per second
} 