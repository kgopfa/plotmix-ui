import { ElementAnimation } from '@/types/canvas';
import { MAX_SCENE_DURATION } from '@/types/project';

/**
 * Calculate the effective total duration of an animation including repeats
 * NOTE: For timeline visualization, we now use just the base duration.
 * Repeats happen WITHIN the specified duration, not extending it.
 */
export function calculateEffectiveDuration(animation: ElementAnimation): number {
  // Validate animation properties to prevent NaN and handle float precision
  if (!animation || typeof animation.duration !== 'number' || isNaN(animation.duration)) {
    return 1; // Default 1 second duration
  }
  
  // Handle float precision issues - round to 3 decimal places to avoid floating point errors
  const roundedDuration = Math.round(animation.duration * 1000) / 1000;
  
  // Ensure duration is positive and reasonable
  const validDuration = Math.max(0.1, Math.min(roundedDuration, MAX_SCENE_DURATION));
  
  // Always return base duration - repeats compress within this time
  return validDuration;
}

/**
 * Calculate the effective end time of an animation
 */
export function calculateEffectiveEndTime(animation: ElementAnimation): number {
  // Validate animation properties to prevent NaN and handle float precision
  if (!animation || typeof animation.startTime !== 'number' || isNaN(animation.startTime)) {
    return 1; // Default end time at 1 second
  }
  
  if (typeof animation.duration !== 'number' || isNaN(animation.duration)) {
    return Math.max(0, animation.startTime + 1); // Default 1 second duration
  }
  
  // Handle float precision issues - round to 3 decimal places to avoid floating point errors
  const roundedStartTime = Math.round(animation.startTime * 1000) / 1000;
  const roundedDuration = Math.round(animation.duration * 1000) / 1000;
  
  // Ensure start time is non-negative
  const validStartTime = Math.max(0, roundedStartTime);
  
  // Ensure duration is positive and reasonable
  const validDuration = Math.max(0.1, Math.min(roundedDuration, MAX_SCENE_DURATION));
  
  // Calculate end time with proper float handling
  const endTime = validStartTime + validDuration;
  
  // Round the final result to avoid floating point precision issues
  return Math.round(endTime * 1000) / 1000;
}

/**
 * Calculate the compressed duration for individual animation cycles when using repeats.
 * This is used for GSAP timeline setup where repeats should fit within the total duration.
 */
export function calculateCompressedCycleDuration(animation: ElementAnimation): number {
  // Validate animation properties to prevent NaN and handle float precision
  if (!animation || typeof animation.duration !== 'number' || isNaN(animation.duration)) {
    return 1; // Default 1 second duration
  }
  
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  
  // Validate repeat and repeatDelay values
  if (typeof repeat !== 'number' || isNaN(repeat) || typeof repeatDelay !== 'number' || isNaN(repeatDelay)) {
    return Math.max(0.1, animation.duration);
  }
  
  // Handle float precision issues - round to 3 decimal places to avoid floating point errors
  const roundedDuration = Math.round(animation.duration * 1000) / 1000;
  const roundedRepeatDelay = Math.round(repeatDelay * 1000) / 1000;
  
  if (repeat === 0) {
    // No repeats - use full duration
    return Math.max(0.1, roundedDuration);
  }
  
  if (repeat === -1) {
    // Infinite repeat - each cycle uses a small fraction of duration
    return Math.max(0.1, roundedDuration / 10); // Show 10 cycles within the duration
  }
  
  // Calculate cycle duration to fit all repeats + delays within total duration
  // Total cycles = 1 initial + repeat count
  const totalCycles = 1 + repeat;
  const totalDelayTime = repeat * roundedRepeatDelay;
  const availableAnimationTime = roundedDuration - totalDelayTime;
  
  // Ensure we don't get negative or zero values
  if (availableAnimationTime <= 0) {
    return Math.max(0.1, roundedDuration / Math.max(1, totalCycles));
  }
  
  const cycleDuration = availableAnimationTime / totalCycles;
  
  // Round the final result to avoid floating point precision issues
  return Math.max(0.1, Math.round(cycleDuration * 1000) / 1000);
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

/**
 * Safely adds two numbers with float precision handling
 * This prevents NaN results from floating point arithmetic
 */
export function safeAdd(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) {
    return 0;
  }
  
  const result = a + b;
  return Math.round(result * 1000) / 1000;
}

/**
 * Safely multiplies two numbers with float precision handling
 * This prevents NaN results from floating point arithmetic
 */
export function safeMultiply(a: number, b: number): number {
  if (isNaN(a) || isNaN(b)) {
    return 0;
  }
  
  const result = a * b;
  return Math.round(result * 1000) / 1000;
}

/**
 * Validates and sanitizes a time value to prevent NaN
 */
export function validateTime(time: number): number {
  if (typeof time !== 'number' || isNaN(time) || !isFinite(time)) {
    return 0;
  }
  
  // Round to 3 decimal places to avoid floating point precision issues
  return Math.round(time * 1000) / 1000;
}

/**
 * Validates and sanitizes a duration value to prevent NaN
 */
export function validateDuration(duration: number): number {
  if (typeof duration !== 'number' || isNaN(duration) || !isFinite(duration)) {
    return 1; // Default 1 second duration
  }
  
  // Ensure duration is positive and reasonable
  const validDuration = Math.max(0.1, Math.min(duration, MAX_SCENE_DURATION));
  
  // Round to 3 decimal places to avoid floating point precision issues
  return Math.round(validDuration * 1000) / 1000;
} 