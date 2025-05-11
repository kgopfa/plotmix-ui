export interface TimeManagerState {
  isPlaying: boolean;
  elapsedTime: number;
}

type TimeUpdateListener = (state: TimeManagerState) => void;

export class TimeManager {
  private static instance: TimeManager;
  private startTime: number | null = null;
  private elapsedTime: number = 0;
  private animationFrame: number | null = null;
  private isPlaying: boolean = false;
  private listeners: Set<TimeUpdateListener> = new Set();

  private constructor() {}

  static getInstance(): TimeManager {
    if (!TimeManager.instance) {
      TimeManager.instance = new TimeManager();
    }
    return TimeManager.instance;
  }

  subscribe(listener: TimeUpdateListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    const state = this.getState();
    this.listeners.forEach(listener => listener(state));
  }

  play(): void {
    if (!this.isPlaying) {
      this.isPlaying = true;
      this.startTime = Date.now() - this.elapsedTime * 1000;
      this.updateTime();
      this.notifyListeners();
    }
  }

  pause(): void {
    if (this.isPlaying) {
      this.isPlaying = false;
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame);
        this.animationFrame = null;
      }
      this.notifyListeners();
    }
  }

  stop(): void {
    this.pause();
    this.elapsedTime = 0;
    this.startTime = null;
    this.notifyListeners();
  }

  private updateTime(): void {
    if (!this.isPlaying || !this.startTime) return;

    this.elapsedTime = (Date.now() - this.startTime) / 1000;
    this.notifyListeners();
    this.animationFrame = requestAnimationFrame(() => this.updateTime());
  }

  getState(): TimeManagerState {
    return {
      isPlaying: this.isPlaying,
      elapsedTime: this.elapsedTime
    };
  }
} 