import { ElementAnimation } from '@/types/canvas';

/**
 * Calculate the effective total duration of an animation including repeats
 */
export function calculateEffectiveDuration(animation: ElementAnimation): number {
  const baseDuration = animation.duration;
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  
  if (repeat === 0) {
    return baseDuration;
  }
  
  if (repeat === -1) {
    // For infinite repeat, show a reasonable representation (e.g., 10x base duration)
    return baseDuration * 10;
  }
  
  // Total duration = base + (repeats × base) + (repeats × delay)
  return baseDuration + (repeat * baseDuration) + (repeat * repeatDelay);
}

/**
 * Calculate the effective end time of an animation
 */
export function calculateEffectiveEndTime(animation: ElementAnimation): number {
  return animation.startTime + calculateEffectiveDuration(animation);
}

/**
 * Check if an animation repeats
 */
export function isRepeatingAnimation(animation: ElementAnimation): boolean {
  return (animation.repeat ?? 0) !== 0;
}

/**
 * Get repeat information for display
 */
export function getRepeatInfo(animation: ElementAnimation): {
  isRepeating: boolean;
  repeatCount: number;
  isInfinite: boolean;
  totalDuration: number;
  repeatDelay: number;
} {
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  
  return {
    isRepeating: repeat !== 0,
    repeatCount: repeat,
    isInfinite: repeat === -1,
    totalDuration: calculateEffectiveDuration(animation),
    repeatDelay
  };
} 