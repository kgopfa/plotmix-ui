import { AnimatedCanvasObject, CanvasGroup, TimelineAnimation, ElementAnimation } from '@/types/canvas';

/**
 * Migration utilities for converting between old and new timeline structures
 */

/**
 * Convert old structure (animations on elements/groups) to new structure (centralized timeline)
 */
export function migrateToCentralizedTimeline(
  elements: AnimatedCanvasObject[],
  groups: CanvasGroup[]
): TimelineAnimation[] {
  const animationMap = new Map<string, TimelineAnimation>();

  // Process element animations
  elements.forEach(element => {
    if (element.animations && element.animations.length > 0) {
      element.animations.forEach(animation => {
        const timelineAnimId = `${element.id}-${animation.type}`;
        
        if (!animationMap.has(timelineAnimId)) {
          animationMap.set(timelineAnimId, {
            id: timelineAnimId,
            displayName: `${element.name} ${animation.type}`,
            target: {
              type: 'element',
              id: element.id
            },
            tracks: [],
            startAt: animation.startTime
          });
        }

        const timelineAnim = animationMap.get(timelineAnimId)!;
        timelineAnim.tracks.push(animation);
      });
    }
  });

  // Process group animations
  groups.forEach(group => {
    if (group.animations && group.animations.length > 0) {
      group.animations.forEach(animation => {
        const timelineAnimId = `${group.id}-${animation.type}`;
        
        if (!animationMap.has(timelineAnimId)) {
          animationMap.set(timelineAnimId, {
            id: timelineAnimId,
            displayName: `${group.name} ${animation.type}`,
            target: {
              type: 'group',
              id: group.id
            },
            tracks: [],
            startAt: animation.startTime
          });
        }

        const timelineAnim = animationMap.get(timelineAnimId)!;
        timelineAnim.tracks.push(animation);
      });
    }
  });

  return Array.from(animationMap.values());
}

/**
 * Convert new structure (centralized timeline) back to old structure (animations on elements/groups)
 * This is useful for backward compatibility or when you need to work with legacy code
 */
export function migrateFromCentralizedTimeline(
  timelineAnimations: TimelineAnimation[],
  elements: AnimatedCanvasObject[],
  groups: CanvasGroup[]
): { elements: AnimatedCanvasObject[], groups: CanvasGroup[] } {
  // Create maps for quick lookup
  const elementMap = new Map(elements.map(el => [el.id, { ...el, animations: [] }]));
  const groupMap = new Map(groups.map(group => [group.id, { ...group, animations: [] }]));

  // Process timeline animations and assign them back to elements/groups
  timelineAnimations.forEach(timelineAnim => {
    const targetId = timelineAnim.target.id;
    const targetType = timelineAnim.target.type;

    if (targetType === 'element') {
      const element = elementMap.get(targetId);
      if (element) {
        element.animations.push(...timelineAnim.tracks);
      }
    } else if (targetType === 'group') {
      const group = groupMap.get(targetId);
      if (group) {
        group.animations.push(...timelineAnim.tracks);
      }
    }
  });

  return {
    elements: Array.from(elementMap.values()),
    groups: Array.from(groupMap.values())
  };
}

/**
 * Create a new timeline animation for a specific target
 */
export function createTimelineAnimation(
  targetId: string,
  targetType: 'element' | 'group',
  animation: ElementAnimation,
  targetName?: string
): TimelineAnimation {
  return {
    id: `${targetId}-${animation.type}`,
    displayName: `${targetName || targetId} ${animation.type}`,
    target: {
      type: targetType,
      id: targetId
    },
    tracks: [animation],
    startAt: animation.startTime
  };
}

/**
 * Add an animation to an existing timeline animation or create a new one
 */
export function addAnimationToTimeline(
  timelineAnimations: TimelineAnimation[],
  targetId: string,
  targetType: 'element' | 'group',
  animation: ElementAnimation,
  targetName?: string
): TimelineAnimation[] {
  const timelineAnimId = `${targetId}-${animation.type}`;
  const existingIndex = timelineAnimations.findIndex(anim => anim.id === timelineAnimId);

  if (existingIndex >= 0) {
    // Add to existing timeline animation
    const updatedAnimations = [...timelineAnimations];
    updatedAnimations[existingIndex].tracks.push(animation);
    return updatedAnimations;
  } else {
    // Create new timeline animation
    const newTimelineAnimation = createTimelineAnimation(targetId, targetType, animation, targetName);
    return [...timelineAnimations, newTimelineAnimation];
  }
}

/**
 * Remove an animation from timeline animations
 */
export function removeAnimationFromTimeline(
  timelineAnimations: TimelineAnimation[],
  animationId: string
): TimelineAnimation[] {
  return timelineAnimations
    .map(anim => ({
      ...anim,
      tracks: anim.tracks.filter(track => track.id !== animationId)
    }))
    .filter(anim => anim.tracks.length > 0);
}

/**
 * Update an animation in timeline animations
 */
export function updateAnimationInTimeline(
  timelineAnimations: TimelineAnimation[],
  animationId: string,
  updates: Partial<ElementAnimation>
): TimelineAnimation[] {
  return timelineAnimations.map(anim => ({
    ...anim,
    tracks: anim.tracks.map(track => 
      track.id === animationId ? { ...track, ...updates } : track
    )
  }));
}

/**
 * Get all animations for a specific target from timeline animations
 */
export function getAnimationsForTarget(
  timelineAnimations: TimelineAnimation[],
  targetId: string,
  targetType: 'element' | 'group'
): ElementAnimation[] {
  return timelineAnimations
    .filter(anim => anim.target.id === targetId && anim.target.type === targetType)
    .flatMap(anim => anim.tracks);
}

/**
 * Calculate total duration of timeline animations
 */
export function calculateTimelineDuration(timelineAnimations: TimelineAnimation[]): number {
  let maxDuration = 0;
  
  timelineAnimations.forEach(anim => {
    anim.tracks.forEach(track => {
      const endTime = track.startTime + track.duration;
      maxDuration = Math.max(maxDuration, endTime);
    });
  });
  
  return maxDuration;
}

/**
 * Sort timeline animations by start time
 */
export function sortTimelineAnimationsByStartTime(timelineAnimations: TimelineAnimation[]): TimelineAnimation[] {
  return [...timelineAnimations].sort((a, b) => a.startAt - b.startAt);
}

/**
 * Validate timeline animation structure
 */
export function validateTimelineAnimation(timelineAnimation: TimelineAnimation): string[] {
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

  return errors;
}
