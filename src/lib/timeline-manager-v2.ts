import { AnimatedCanvasObject, CanvasGroup, TimelineAnimation, ElementAnimation, AnimationType } from '@/types/canvas';
import { TimelineState, TimelineTrackData } from '../types/timeline';
import { calculateEffectiveEndTime } from '@/utils/animation-utils';
import { MAX_SCENE_DURATION } from '@/types/project';

type TimelineUpdateListener = (state: TimelineState) => void;

/**
 * Enhanced Timeline Manager for centralized timeline structure
 * 
 * This manager works with the new structure where:
 * - Timeline is an array of TimelineAnimation objects
 * - Each animation targets elements/groups by ID
 * - Elements and groups no longer have individual animation arrays
 */
export class TimelineManagerV2 {
  private static instance: TimelineManagerV2;
  private state: TimelineState = {
    tracks: [],
    trackData: [],
    duration: MAX_SCENE_DURATION,
    scale: 100
  };
  private previousState: TimelineState | null = null;
  private listeners: Set<TimelineUpdateListener> = new Set();
  private updateTimeout: number | null = null;
  private pendingUpdates: boolean = false;

  private constructor() {}

  static getInstance(): TimelineManagerV2 {
    if (!TimelineManagerV2.instance) {
      TimelineManagerV2.instance = new TimelineManagerV2();
    }
    return TimelineManagerV2.instance;
  }

  subscribe(listener: TimelineUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  private hasStateChanged(): boolean {
    if (!this.previousState) return true;
    
    return (
      this.state.duration !== this.previousState.duration ||
      this.state.scale !== this.previousState.scale ||
      this.state.tracks.length !== this.previousState.tracks.length ||
      this.state.trackData.length !== this.previousState.trackData.length
    );
  }

  private scheduleUpdate(): void {
    if (!this.hasStateChanged()) {
      return;
    }

    if (this.updateTimeout) {
      window.clearTimeout(this.updateTimeout);
    }
    
    if (!this.pendingUpdates) {
      this.pendingUpdates = true;
      this.updateTimeout = window.setTimeout(() => {
        this.notifyListeners();
        this.previousState = {
          tracks: [...this.state.tracks],
          trackData: [...this.state.trackData],
          duration: this.state.duration,
          scale: this.state.scale
        };
        this.pendingUpdates = false;
      }, 16);
    }
  }

  /**
   * Set timeline animations and generate track data
   */
  setTimelineAnimations(timelineAnimations: TimelineAnimation[], elements: AnimatedCanvasObject[], groups: CanvasGroup[]): void {
    // Create a map of elements and groups for quick lookup
    const elementMap = new Map(elements.map(el => [el.id, el]));
    const groupMap = new Map(groups.map(group => [group.id, group]));

    // Generate track data from timeline animations
    const trackData: TimelineTrackData[] = [];
    const processedTargets = new Set<string>();

    timelineAnimations.forEach(timelineAnim => {
      const targetId = timelineAnim.target.id;
      const targetType = timelineAnim.target.type;

      // Skip if we've already processed this target
      if (processedTargets.has(targetId)) {
        return;
      }

      let targetItem: AnimatedCanvasObject | CanvasGroup | undefined;
      let trackName: string;

      if (targetType === 'element') {
        targetItem = elementMap.get(targetId);
        trackName = targetItem?.name || `Element ${targetId}`;
      } else {
        targetItem = groupMap.get(targetId);
        trackName = targetItem?.name || `Group ${targetId}`;
      }

      if (!targetItem) {
        console.warn(`Target ${targetType} with ID ${targetId} not found`);
        return;
      }

      // Collect all animations for this target from timeline
      const targetAnimations = timelineAnimations
        .filter(anim => anim.target.id === targetId)
        .flatMap(anim => anim.tracks);

      if (targetAnimations.length === 0) {
        return;
      }

      const track: TimelineTrackData = {
        id: targetId,
        type: targetType,
        name: trackName,
        item: targetItem,
        animations: targetAnimations.map(anim => ({
          id: anim.id,
          type: anim.type,
          startTime: anim.startTime,
          duration: anim.duration,
          properties: anim.properties,
          easing: anim.easing as any
        }))
      };

      trackData.push(track);
      processedTargets.add(targetId);
    });

    this.state.trackData = trackData;
    this.updateDuration();
    this.scheduleUpdate();
  }

  /**
   * Add a timeline animation
   */
  addTimelineAnimation(timelineAnimation: TimelineAnimation, elements: AnimatedCanvasObject[], groups: CanvasGroup[]): void {
    // This would need to be implemented to add a single animation
    // For now, we'll rebuild the entire track data
    const currentTimelineAnimations = this.getTimelineAnimations();
    currentTimelineAnimations.push(timelineAnimation);
    this.setTimelineAnimations(currentTimelineAnimations, elements, groups);
  }

  /**
   * Remove a timeline animation
   */
  removeTimelineAnimation(animationId: string, elements: AnimatedCanvasObject[], groups: CanvasGroup[]): void {
    const currentTimelineAnimations = this.getTimelineAnimations();
    const filteredAnimations = currentTimelineAnimations.map(anim => ({
      ...anim,
      tracks: anim.tracks.filter(track => track.id !== animationId)
    })).filter(anim => anim.tracks.length > 0);

    this.setTimelineAnimations(filteredAnimations, elements, groups);
  }

  /**
   * Get timeline animations from current track data
   * This reconstructs the timeline structure from track data
   */
  getTimelineAnimations(): TimelineAnimation[] {
    const animationMap = new Map<string, TimelineAnimation>();

    this.state.trackData.forEach(track => {
      track.animations.forEach(anim => {
        const timelineAnimId = `${track.id}-${anim.type}`;
        
        if (!animationMap.has(timelineAnimId)) {
          animationMap.set(timelineAnimId, {
            id: timelineAnimId,
            displayName: `${track.name} ${anim.type}`,
            target: {
              type: track.type,
              id: track.id
            },
            tracks: [],
            startAt: anim.startTime
          });
        }

        const timelineAnim = animationMap.get(timelineAnimId)!;
        timelineAnim.tracks.push({
          id: anim.id,
          displayName: anim.type,
          type: anim.type as AnimationType,
          startTime: anim.startTime,
          duration: anim.duration,
          properties: anim.properties,
          easing: anim.easing as any
        });
      });
    });

    return Array.from(animationMap.values());
  }

  setScale(scale: number): void {
    this.state.scale = scale;
    this.scheduleUpdate();
  }

  private updateDuration(): void {
    let maxDuration = 0;
    
    // Check all animations in track data
    this.state.trackData.forEach(track => {
      track.animations.forEach(animation => {
        const endTime = calculateEffectiveEndTime(animation as ElementAnimation);
        maxDuration = Math.max(maxDuration, endTime);
      });
    });
    
    // Ensure duration is between 1 second and maximum scene duration
    this.state.duration = Math.max(1, Math.min(MAX_SCENE_DURATION, Math.ceil(maxDuration)));
  }

  getState(): TimelineState {
    return this.state;
  }

  exportTimeline(): string {
    return JSON.stringify({
      timelineAnimations: this.getTimelineAnimations(),
      playback: {
        scale: this.state.scale,
        duration: this.state.duration
      }
    });
  }

  importTimeline(json: string): void {
    try {
      // This would need elements and groups to properly reconstruct
      console.warn('Import timeline requires elements and groups context');
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const data = JSON.parse(json);
    } catch (error) {
      console.error('Failed to import timeline:', error);
    }
  }

  setTracks(tracks: AnimatedCanvasObject[]): void {
    this.state.tracks = tracks.filter(track => !track.isAnimationPath);
    this.updateDuration();
    this.notifyListeners();
  }

  setTrackData(elements: AnimatedCanvasObject[], groups: CanvasGroup[]): void {
    // This method is kept for backward compatibility
    // It creates empty track data since elements/groups no longer have animations
    const elementTracks: TimelineTrackData[] = elements
      .filter(element => !element.isAnimationPath)
      .map(element => ({
        id: element.id,
        type: 'element' as const,
        name: element.name,
        item: element,
        animations: []
      }));

    const groupTracks: TimelineTrackData[] = groups
      .filter(group => !group.isDefaultGroup && !group.isAnimationPath)
      .map(group => ({
        id: group.id,
        type: 'group' as const,
        name: group.name,
        item: group,
        animations: []
      }));

    this.state.trackData = [...elementTracks, ...groupTracks];
    this.updateDuration();
    this.notifyListeners();
  }

  addGroupTrack(group: CanvasGroup): void {
    if (group.isDefaultGroup) return;
    
    const existingIndex = this.state.trackData.findIndex(track => track.id === group.id);
    const groupTrack: TimelineTrackData = {
      id: group.id,
      type: 'group',
      name: group.name,
      item: group,
      animations: []
    };

    if (existingIndex >= 0) {
      this.state.trackData[existingIndex] = groupTrack;
    } else {
      this.state.trackData.push(groupTrack);
    }
    
    this.updateDuration();
    this.scheduleUpdate();
  }

  removeGroupTrack(groupId: string): void {
    this.state.trackData = this.state.trackData.filter(track => track.id !== groupId);
    this.updateDuration();
    this.scheduleUpdate();
  }

  setDuration(duration: number): void {
    const clampedDuration = Math.max(1, Math.min(MAX_SCENE_DURATION, duration));
    
    if (clampedDuration !== duration) {
      console.warn(`Scene duration ${duration}s was clamped to ${clampedDuration}s (max: ${MAX_SCENE_DURATION}s)`);
    }
    
    this.state.duration = clampedDuration;
    this.scheduleUpdate();
  }

  getMaxDuration(): number {
    return MAX_SCENE_DURATION;
  }
}
