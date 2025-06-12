import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { TimelineState, TimelineTrackData } from '../types/timeline';

type TimelineUpdateListener = (state: TimelineState) => void;

export class TimelineManager {
  private static instance: TimelineManager;
  private state: TimelineState = {
    tracks: [],
    trackData: [],
    duration: 10,
    scale: 100
  };
  private listeners: Set<TimelineUpdateListener> = new Set();
  private updateTimeout: number | null = null;
  private pendingUpdates: boolean = false;

  private constructor() {}

  static getInstance(): TimelineManager {
    if (!TimelineManager.instance) {
      TimelineManager.instance = new TimelineManager();
    }
    return TimelineManager.instance;
  }

  subscribe(listener: TimelineUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }

  private scheduleUpdate(): void {
    if (this.updateTimeout) {
      window.clearTimeout(this.updateTimeout);
    }
    
    if (!this.pendingUpdates) {
      this.pendingUpdates = true;
      this.updateTimeout = window.setTimeout(() => {
        this.notifyListeners();
        this.pendingUpdates = false;
      }, 16); // Roughly one frame at 60fps
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.state));
  }

  addTrack(track: AnimatedCanvasObject): void {
    if (track.isAnimationPath) return;
    
    this.state.tracks.push(track);
    this.updateDuration();
    this.scheduleUpdate();
  }

  removeTrack(trackId: string): void {
    this.state.tracks = this.state.tracks.filter(t => t.id !== trackId);
    this.updateDuration();
    this.scheduleUpdate();
  }

  setScale(scale: number): void {
    this.state.scale = scale;
    this.scheduleUpdate();
  }

  private updateDuration(): void {
    let maxDuration = 0;
    
    // Check element animations
    this.state.tracks.forEach(track => {
      track.animations.forEach(animation => {
        const endTime = animation.startTime + animation.duration;
        maxDuration = Math.max(maxDuration, endTime);
      });
    });
    
    // Check group animations
    this.state.trackData.forEach(trackData => {
      trackData.animations.forEach(animation => {
        const endTime = animation.startTime + animation.duration;
        maxDuration = Math.max(maxDuration, endTime);
      });
    });
    
    this.state.duration = Math.max(10, Math.ceil(maxDuration));
  }

  getState(): TimelineState {
    return this.state;
  }

  exportTimeline(): string {
    return JSON.stringify(this.state);
  }

  importTimeline(json: string): void {
    try {
      const data = JSON.parse(json);
      this.state = {
        tracks: data.tracks || [],
        trackData: data.trackData || [],
        duration: data.duration || 10,
        scale: data.scale || 100
      };
      this.updateDuration();
      this.scheduleUpdate();
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
    const elementTracks: TimelineTrackData[] = elements
      .filter(element => !element.isAnimationPath)
      .map(element => ({
        id: element.id,
        type: 'element' as const,
        name: element.name,
        item: element,
        animations: element.animations.map(anim => ({
          id: anim.id,
          type: anim.type,
          startTime: anim.startTime,
          duration: anim.duration,
          properties: anim.properties,
          easing: anim.easing
        }))
      }));

    const groupTracks: TimelineTrackData[] = groups
      .filter(group => !group.isDefaultGroup) // Only show non-default groups
      .map(group => ({
        id: group.id,
        type: 'group' as const,
        name: group.name,
        item: group,
        animations: group.animations.map(anim => ({
          id: anim.id,
          type: anim.type,
          startTime: anim.startTime,
          duration: anim.duration,
          properties: anim.properties,
          easing: anim.easing
        }))
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
      animations: group.animations.map(anim => ({
        id: anim.id,
        type: anim.type,
        startTime: anim.startTime,
        duration: anim.duration,
        properties: anim.properties,
        easing: anim.easing
      }))
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
} 