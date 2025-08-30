import { ElementAnimation } from '@/types/canvas';
import { MAX_SCENE_DURATION } from '@/types/project';

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

/**
 * Generates a human-readable display name for an animation with an incrementing counter
 * @param animationType - The type of animation (e.g., 'path', 'move', 'scale')
 * @param existingAnimations - Array of existing animations to check for counter
 * @returns A display name like "path-1", "move-2", etc.
 */
export function generateAnimationDisplayName(
  animationType: string, 
  existingAnimations: ElementAnimation[]
): string {
  // Count existing animations of the same type
  const sameTypeCount = existingAnimations.filter(
    anim => anim.displayName.startsWith(`${animationType}-`)
  ).length;
  
  // Return the next number in sequence
  return `${animationType}-${sameTypeCount + 1}`;
}

/**
 * Updates display names for all animations to ensure they have proper sequential numbering
 * @param animations - Array of animations to update
 * @returns Updated array with corrected display names
 */
export function updateAnimationDisplayNames(animations: ElementAnimation[]): ElementAnimation[] {
  const typeCounts: Record<string, number> = {};
  
  return animations.map(animation => {
    const baseType = animation.displayName?.split('-')[0];
    typeCounts[baseType] = (typeCounts[baseType] || 0) + 1;
    
    return {
      ...animation,
      displayName: `${baseType}-${typeCounts[baseType]}`
    };
  });
} 

/**
 * Validates and clamps scene duration to valid bounds
 * @param duration - Duration in seconds
 * @returns Clamped duration between 1 and MAX_SCENE_DURATION
 */
export function clampSceneDuration(duration: number): number {
  return Math.max(1, Math.min(MAX_SCENE_DURATION, duration));
}

/**
 * Checks if a duration is within valid scene bounds
 * @param duration - Duration in seconds
 * @returns True if duration is valid
 */
export function isValidSceneDuration(duration: number): boolean {
  return duration >= 1 && duration <= MAX_SCENE_DURATION;
} 