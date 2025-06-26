import { ElementAnimation } from '@/types/canvas';

/**
 * Calculate the effective total duration of an animation including repeats
 * NOTE: For timeline visualization, we now use just the base duration.
 * Repeats happen WITHIN the specified duration, not extending it.
 */
export function calculateEffectiveDuration(animation: ElementAnimation): number {
  // Always return base duration - repeats compress within this time
  return animation.duration;
}

/**
 * Calculate the effective end time of an animation
 */
export function calculateEffectiveEndTime(animation: ElementAnimation): number {
  return animation.startTime + animation.duration; // Use base duration only
}

/**
 * Calculate the compressed duration for individual animation cycles when using repeats.
 * This is used for GSAP timeline setup where repeats should fit within the total duration.
 */
export function calculateCompressedCycleDuration(animation: ElementAnimation): number {
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  
  if (repeat === 0) {
    // No repeats - use full duration
    return animation.duration;
  }
  
  if (repeat === -1) {
    // Infinite repeat - each cycle uses a small fraction of duration
    return animation.duration / 10; // Show 10 cycles within the duration
  }
  
  // Calculate cycle duration to fit all repeats + delays within total duration
  // Total cycles = 1 initial + repeat count
  const totalCycles = 1 + repeat;
  const totalDelayTime = repeat * repeatDelay;
  const availableAnimationTime = animation.duration - totalDelayTime;
  
  return Math.max(0.1, availableAnimationTime / totalCycles);
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
  cycleDuration: number;
} {
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  
  return {
    isRepeating: repeat !== 0,
    repeatCount: repeat,
    isInfinite: repeat === -1,
    totalDuration: animation.duration, // Always base duration
    repeatDelay,
    cycleDuration: calculateCompressedCycleDuration(animation)
  };
} 