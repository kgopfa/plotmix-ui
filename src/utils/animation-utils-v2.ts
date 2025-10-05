import { TimelineAnimation, ElementAnimation } from '@/types/canvas';

/**
 * Animation utilities for the new centralized timeline structure
 */

/**
 * Calculate effective duration considering repeats, delays, and yoyo
 */
export function calculateEffectiveDurationV2(animation: ElementAnimation): number {
  const baseDuration = animation.duration;
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  const yoyo = animation.yoyo ?? false;

  if (repeat === 0) {
    return baseDuration;
  }

  if (repeat === -1) {
    // Infinite repeat - return a reasonable duration for display
    return baseDuration * 10; // Show 10 cycles
  }

  const totalCycles = 1 + repeat;
  const totalDelayTime = repeat * repeatDelay;
  
  if (yoyo) {
    // Yoyo doubles the effective duration per cycle
    return (baseDuration * 2 * totalCycles) + totalDelayTime;
  } else {
    return (baseDuration * totalCycles) + totalDelayTime;
  }
}

/**
 * Calculate effective end time for an animation
 */
export function calculateEffectiveEndTimeV2(animation: ElementAnimation): number {
  return animation.startTime + calculateEffectiveDurationV2(animation);
}

/**
 * Calculate compressed cycle duration for repeats
 */
export function calculateCompressedCycleDurationV2(animation: ElementAnimation): number {
  const repeat = animation.repeat ?? 0;
  const repeatDelay = animation.repeatDelay ?? 0;
  const yoyo = animation.yoyo ?? false;

  if (repeat === 0) {
    return animation.duration;
  }

  if (repeat === -1) {
    return animation.duration / 10; // Show 10 cycles within duration
  }

  const totalCycles = 1 + repeat;
  const totalDelayTime = repeat * repeatDelay;
  const availableAnimationTime = animation.duration - totalDelayTime;
  
  if (yoyo) {
    // Yoyo doubles the cycle duration
    return Math.max(0.1, availableAnimationTime / (totalCycles * 2));
  } else {
    return Math.max(0.1, availableAnimationTime / totalCycles);
  }
}

/**
 * Get all animations for a specific target from timeline animations
 */
export function getAnimationsForTargetV2(
  timelineAnimations: TimelineAnimation[],
  targetId: string,
  targetType: 'element' | 'group'
): ElementAnimation[] {
  return timelineAnimations
    .filter(anim => anim.target.id === targetId && anim.target.type === targetType)
    .flatMap(anim => anim.tracks);
}

/**
 * Get timeline animation by target and animation type
 */
export function getTimelineAnimationByTargetV2(
  timelineAnimations: TimelineAnimation[],
  targetId: string,
  targetType: 'element' | 'group',
  animationType: string
): TimelineAnimation | undefined {
  return timelineAnimations.find(anim => 
    anim.target.id === targetId && 
    anim.target.type === targetType &&
    anim.tracks.some(track => track.type === animationType)
  );
}

/**
 * Calculate total duration of all timeline animations
 */
export function calculateTotalTimelineDurationV2(timelineAnimations: TimelineAnimation[]): number {
  let maxDuration = 0;
  
  timelineAnimations.forEach(anim => {
    anim.tracks.forEach(track => {
      const endTime = calculateEffectiveEndTimeV2(track);
      maxDuration = Math.max(maxDuration, endTime);
    });
  });
  
  return maxDuration;
}

/**
 * Sort timeline animations by start time
 */
export function sortTimelineAnimationsByStartTimeV2(timelineAnimations: TimelineAnimation[]): TimelineAnimation[] {
  return [...timelineAnimations].sort((a, b) => a.startAt - b.startAt);
}

/**
 * Get animations that are active at a specific time
 */
export function getActiveAnimationsAtTimeV2(
  timelineAnimations: TimelineAnimation[],
  time: number
): Array<{ animation: TimelineAnimation, track: ElementAnimation }> {
  const activeAnimations: Array<{ animation: TimelineAnimation, track: ElementAnimation }> = [];
  
  timelineAnimations.forEach(anim => {
    anim.tracks.forEach(track => {
      const endTime = calculateEffectiveEndTimeV2(track);
      if (time >= track.startTime && time <= endTime) {
        activeAnimations.push({ animation: anim, track });
      }
    });
  });
  
  return activeAnimations;
}

/**
 * Validate timeline animation structure
 */
export function validateTimelineAnimationV2(timelineAnimation: TimelineAnimation): string[] {
  const errors: string[] = [];

  if (!timelineAnimation.id) {
    errors.push('Timeline animation must have an ID');
  }

  if (!timelineAnimation.target) {
    errors.push('Timeline animation must have a target');
  } else {
    if (!timelineAnimation.target.id) {
      errors.push('Timeline animation target must have an ID');
    }
    if (!timelineAnimation.target.type || !['element', 'group'].includes(timelineAnimation.target.type)) {
      errors.push('Timeline animation target must have a valid type (element or group)');
    }
  }

  if (!timelineAnimation.tracks || timelineAnimation.tracks.length === 0) {
    errors.push('Timeline animation must have at least one track');
  }

  if (timelineAnimation.startAt < 0) {
    errors.push('Timeline animation startAt must be non-negative');
  }

  // Validate each track
  timelineAnimation.tracks.forEach((track, index) => {
    if (!track.id) {
      errors.push(`Track ${index} must have an ID`);
    }
    if (!track.type) {
      errors.push(`Track ${index} must have a type`);
    }
    if (track.startTime < 0) {
      errors.push(`Track ${index} startTime must be non-negative`);
    }
    if (track.duration <= 0) {
      errors.push(`Track ${index} duration must be positive`);
    }
  });

  return errors;
}

/**
 * Create a timeline animation from individual element/group animations
 */
export function createTimelineAnimationFromTracksV2(
  targetId: string,
  targetType: 'element' | 'group',
  targetName: string,
  tracks: ElementAnimation[]
): TimelineAnimation {
  if (tracks.length === 0) {
    throw new Error('Cannot create timeline animation with no tracks');
  }

  // Use the earliest start time as the animation start time
  const startAt = Math.min(...tracks.map(track => track.startTime));

  return {
    id: `${targetId}-${tracks[0].type}`,
    displayName: `${targetName} ${tracks[0].type}`,
    target: {
      type: targetType,
      id: targetId
    },
    tracks,
    startAt
  };
}

/**
 * Merge timeline animations for the same target
 */
export function mergeTimelineAnimationsV2(timelineAnimations: TimelineAnimation[]): TimelineAnimation[] {
  const mergedMap = new Map<string, TimelineAnimation>();

  timelineAnimations.forEach(anim => {
    const key = `${anim.target.type}-${anim.target.id}`;
    
    if (mergedMap.has(key)) {
      const existing = mergedMap.get(key)!;
      existing.tracks.push(...anim.tracks);
      // Update start time to be the earliest
      existing.startAt = Math.min(existing.startAt, anim.startAt);
    } else {
      mergedMap.set(key, { ...anim });
    }
  });

  return Array.from(mergedMap.values());
}

/**
 * Split timeline animation into individual animations by track
 */
export function splitTimelineAnimationV2(timelineAnimation: TimelineAnimation): TimelineAnimation[] {
  return timelineAnimation.tracks.map(track => ({
    id: `${timelineAnimation.id}-${track.id}`,
    displayName: `${timelineAnimation.displayName} ${track.type}`,
    target: timelineAnimation.target,
    tracks: [track],
    startAt: track.startTime
  }));
}

/**
 * Get timeline animation statistics
 */
export function getTimelineAnimationStatsV2(timelineAnimations: TimelineAnimation[]): {
  totalAnimations: number;
  totalTracks: number;
  totalDuration: number;
  animationTypes: Record<string, number>;
  targetTypes: Record<string, number>;
} {
  const stats = {
    totalAnimations: timelineAnimations.length,
    totalTracks: 0,
    totalDuration: 0,
    animationTypes: {} as Record<string, number>,
    targetTypes: {} as Record<string, number>
  };

  timelineAnimations.forEach(anim => {
    stats.totalTracks += anim.tracks.length;
    stats.totalDuration = Math.max(stats.totalDuration, calculateTotalTimelineDurationV2([anim]));
    
    // Count target types
    stats.targetTypes[anim.target.type] = (stats.targetTypes[anim.target.type] || 0) + 1;
    
    // Count animation types
    anim.tracks.forEach(track => {
      stats.animationTypes[track.type] = (stats.animationTypes[track.type] || 0) + 1;
    });
  });

  return stats;
}

/**
 * Filter timeline animations by target type
 */
export function filterTimelineAnimationsByTargetTypeV2(
  timelineAnimations: TimelineAnimation[],
  targetType: 'element' | 'group'
): TimelineAnimation[] {
  return timelineAnimations.filter(anim => anim.target.type === targetType);
}

/**
 * Filter timeline animations by animation type
 */
export function filterTimelineAnimationsByAnimationTypeV2(
  timelineAnimations: TimelineAnimation[],
  animationType: string
): TimelineAnimation[] {
  return timelineAnimations.filter(anim => 
    anim.tracks.some(track => track.type === animationType)
  );
}

/**
 * Get timeline animation bounds (earliest start, latest end)
 */
export function getTimelineAnimationBoundsV2(timelineAnimations: TimelineAnimation[]): {
  startTime: number;
  endTime: number;
  duration: number;
} {
  if (timelineAnimations.length === 0) {
    return { startTime: 0, endTime: 0, duration: 0 };
  }

  let startTime = Infinity;
  let endTime = -Infinity;

  timelineAnimations.forEach(anim => {
    startTime = Math.min(startTime, anim.startAt);
    
    anim.tracks.forEach(track => {
      const trackEndTime = calculateEffectiveEndTimeV2(track);
      endTime = Math.max(endTime, trackEndTime);
    });
  });

  return {
    startTime: startTime === Infinity ? 0 : startTime,
    endTime: endTime === -Infinity ? 0 : endTime,
    duration: endTime - startTime
  };
}
