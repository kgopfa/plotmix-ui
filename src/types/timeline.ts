import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

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

export type TimelineTrackItem = AnimatedCanvasObject | CanvasGroup;

export interface TimelineTrackData {
  id: string;
  type: 'element' | 'group';
  name: string;
  item: TimelineTrackItem;
  animations: Array<{
    id: string;
    type: string;
    startTime: number;
    duration: number;
    properties: Record<string, unknown>;
    easing?: string;
  }>;
}

export interface TimelineState {
  tracks: AnimatedCanvasObject[]; // Keep for backward compatibility
  trackData: TimelineTrackData[]; // New unified track system
  duration: number;  // total timeline duration in seconds
  scale: number;     // pixels per second
} 