import { AnimatedCanvasElement } from '@/types/canvas';
import { TimelineState } from '../types/timeline';

type TimelineUpdateListener = (state: TimelineState) => void;

export class TimelineManager {
  private static instance: TimelineManager;
  private state: TimelineState = {
    tracks: [],
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

  addTrack(track: AnimatedCanvasElement): void {
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
    this.state.tracks.forEach(track => {
      track.animations.forEach(animation => {
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
        ...data,
        scale: data.scale || 100
      };
      this.updateDuration();
      this.scheduleUpdate();
    } catch (error) {
      console.error('Failed to import timeline:', error);
    }
  }

  setTracks(tracks: AnimatedCanvasElement[]): void {
    this.state.tracks = tracks;
    this.updateDuration();
    this.notifyListeners();
  }
} 