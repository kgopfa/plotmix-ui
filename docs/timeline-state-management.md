# Timeline State Management

## Overview

The timeline state management system in PlotMix handles animation timeline data, playback state, and timeline UI state. This document explains how the `useTimelineStore` works and how it coordinates with other stores to manage animations.

## Timeline Duration Limits

The timeline system enforces a **maximum scene duration of 2 minutes (120 seconds)**. This limit is applied consistently across:
- Individual scenes
- Animation tracks
- Playback controls
- Export/import operations

Duration validation ensures:
- `minimum`: 1 second (for basic functionality)
- `maximum`: 120 seconds (2 minutes per scene)
- `automatic clamping`: Values outside this range are automatically adjusted

## Timeline Store Architecture

The timeline management is handled by the `useTimelineStore` Zustand store:

```typescript
interface TimelineStoreState {
  // Core timeline data
  tracks: TimelineTrackData[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  
  // Playback state
  playback: PlaybackState;
  
  // UI state
  ui: TimelineUIState;
  
  // Timeline managers
  timeManager: TimeManager;
  gsapManager: GSAPTimelineManagerEnhanced;
  timelineManager: TimelineManager;
  
  // Real-time subscription state
  subscriptions: {
    timeManager: (() => void) | null;
    gsapManager: (() => void) | null;
    canvasStore: (() => void) | null;
  };
  
  // Loading and error state
  isLoading: boolean;
  error: string | null;
  
  // Animation duration management
  animationStates: Map<string, AnimationState>;
}
```

## Core Data Structures

### Playback State

```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  playbackRate: number;
  isLooping: boolean;
  direction: 'forward' | 'reverse';
}
```

### Timeline UI State

```typescript
interface TimelineUIState {
  scale: number;
  scrollPosition: number;
  selectedTrackIds: string[];
  isDragging: boolean;
  dragStartTime: number | null;
  zoomLevel: number;
}
```

### Animation State

```typescript
interface AnimationState {
  // Source of truth
  baseDuration: number;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  
  // Computed/cached values
  effectiveDuration: number;
  effectiveEndTime: number;
}
```

### Timeline Track Data

```typescript
interface TimelineTrackData {
  id: string;
  name: string;
  type: 'element' | 'group';
  targetId: string;
  animations: ElementAnimation[];
  visible: boolean;
  expanded: boolean;
  color?: string;
}
```

## Timeline Store Operations

### Initialization

```typescript
export const useTimelineStore = create<TimelineStore>()(
  (set, get) => ({
    // Initial state
    tracks: [],
    elements: [],
    groups: [],
    playback: {
      isPlaying: false,
      currentTime: 0,
      totalDuration: 10,
      playbackRate: 1,
      isLooping: false,
      direction: 'forward'
    },
    ui: {
      scale: 1,
      scrollPosition: 0,
      selectedTrackIds: [],
      isDragging: false,
      dragStartTime: null,
      zoomLevel: 1
    },
    animationStates: new Map(),
    isLoading: false,
    error: null,
    subscriptions: {
      timeManager: null,
      gsapManager: null,
      canvasStore: null
    }
  })
);
```

### Playback Controls

#### Play/Pause
```typescript
play: () => {
  set(produce((state) => {
    state.playback.isPlaying = true;
  }));
  
  // Start timeline playback
  get().timeManager.start();
},

pause: () => {
  set(produce((state) => {
    state.playback.isPlaying = false;
  }));
  
  // Pause timeline playback
  get().timeManager.pause();
},

stop: () => {
  set(produce((state) => {
    state.playback.isPlaying = false;
    state.playback.currentTime = 0;
  }));
  
  // Stop timeline playback
  get().timeManager.stop();
}
```

#### Time Control
```typescript
setCurrentTime: (time: number) => {
  set(produce((state) => {
    state.playback.currentTime = Math.max(0, Math.min(time, state.playback.totalDuration));
  }));
  
  // Update timeline position
  get().timeManager.setTime(time);
},

setPlaybackRate: (rate: number) => {
  set(produce((state) => {
    state.playback.playbackRate = Math.max(0.1, Math.min(rate, 10));
  }));
  
  // Update timeline playback rate
  get().timeManager.setPlaybackRate(rate);
}
```

### Timeline Management

#### Track Operations
```typescript
addTrack: (track: TimelineTrackData) => {
  set(produce((state) => {
    state.tracks.push(track);
  }));
  
  // Rebuild timeline
  get().buildGSAPTimeline();
},

removeTrack: (trackId: string) => {
  set(produce((state) => {
    state.tracks = state.tracks.filter(track => track.id !== trackId);
  }));
  
  // Rebuild timeline
  get().buildGSAPTimeline();
},

updateTrack: (trackId: string, updates: Partial<TimelineTrackData>) => {
  set(produce((state) => {
    const track = state.tracks.find(t => t.id === trackId);
    if (track) {
      Object.assign(track, updates);
    }
  }));
  
  // Rebuild timeline if needed
  if (updates.animations) {
    get().buildGSAPTimeline();
  }
}
```

#### Timeline Building
```typescript
buildGSAPTimeline: () => {
  const { tracks, elements, groups, playback } = get();
  
  // Clear existing timeline
  get().gsapManager.clear();
  
  // Build new timeline from tracks
  tracks.forEach(track => {
    const target = track.type === 'element' 
      ? elements.find(el => el.id === track.targetId)
      : groups.find(g => g.id === track.targetId);
      
    if (target) {
      track.animations.forEach(animation => {
        get().gsapManager.addAnimation(target, animation);
      });
    }
  });
  
  // Update total duration
  const maxDuration = get().gsapManager.getMaxDuration();
  set(produce((state) => {
    state.playback.totalDuration = maxDuration;
  }));
}
```

### Animation State Management

#### Animation State Operations
```typescript
updateAnimationState: (animationId: string, updates: Partial<AnimationState>) => {
  set(produce((state) => {
    const currentState = state.animationStates.get(animationId);
    if (currentState) {
      const updatedState = { ...currentState, ...updates };
      
      // Recalculate effective values
      updatedState.effectiveDuration = calculateEffectiveDuration(updatedState);
      updatedState.effectiveEndTime = calculateEffectiveEndTime(updatedState);
      
      state.animationStates.set(animationId, updatedState);
    }
  }));
},

getAnimationState: (animationId: string) => {
  return get().animationStates.get(animationId) ?? null;
},

calculateEffectiveDuration: (state: AnimationState) => {
  const { baseDuration, repeat = 1, repeatDelay = 0, yoyo = false } = state;
  
  if (yoyo) {
    return baseDuration * repeat * 2 + repeatDelay * (repeat - 1);
  } else {
    return baseDuration * repeat + repeatDelay * (repeat - 1);
  }
}
```

### Project Data Integration

#### Loading Project Data
```typescript
loadProjectData: (data: {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  animationStates: Record<string, AnimationState>;
  scale: number;
  duration: number;
  currentTime: number;
}) => {
  set(produce((state) => {
    // Load core data - create deep copies to avoid frozen object issues
    state.elements = data.elements.map(element => ({
      ...element,
      animations: element.animations.map(anim => ({ ...anim }))
    }));
    state.groups = data.groups.map(group => ({
      ...group,
      animations: group.animations.map(anim => ({ ...anim }))
    }));
    
    // Clear and reload animation states
    state.animationStates.clear();
    Object.entries(data.animationStates).forEach(([key, value]) => {
      state.animationStates.set(key, {
        baseDuration: value.baseDuration,
        repeat: value.repeat,
        repeatDelay: value.repeatDelay,
        yoyo: value.yoyo,
        effectiveDuration: value.effectiveDuration,
        effectiveEndTime: value.effectiveEndTime,
      });
    });
    
    // Update timeline UI
    state.ui.scale = data.scale;
    state.playback.totalDuration = data.duration;
    state.playback.currentTime = data.currentTime;
  }));
  
  // Update tracks and rebuild timeline
  get().updateTracks();
  get().buildGSAPTimeline();
}
```

#### Getting Project Data
```typescript
getProjectData: () => {
  const state = get();
  return {
    elements: state.elements,
    groups: state.groups,
    animationStates: state.animationStates,
    scale: state.ui.scale,
    duration: state.playback.totalDuration,
    currentTime: state.playback.currentTime,
  };
}
```

## Timeline Manager Integration

### Time Manager
```typescript
// Time manager handles real-time updates
timeManager: new TimeManager({
  onTimeUpdate: (time: number) => {
    set(produce((state) => {
      state.playback.currentTime = time;
    }));
  },
  onPlaybackEnd: () => {
    set(produce((state) => {
      state.playback.isPlaying = false;
      if (state.playback.isLooping) {
        state.playback.currentTime = 0;
        get().timeManager.start();
      }
    }));
  }
})
```

### GSAP Timeline Manager
```typescript
// GSAP manager handles animation execution
gsapManager: new GSAPTimelineManagerEnhanced({
  onAnimationStart: (animationId: string) => {
    console.log(`Animation started: ${animationId}`);
  },
  onAnimationComplete: (animationId: string) => {
    console.log(`Animation completed: ${animationId}`);
  }
})
```

## Timeline UI Operations

### Zoom and Scale
```typescript
setScale: (scale: number) => {
  set(produce((state) => {
    state.ui.scale = Math.max(0.1, Math.min(scale, 10));
  }));
},

setZoomLevel: (level: number) => {
  set(produce((state) => {
    state.ui.zoomLevel = Math.max(0.1, Math.min(level, 5));
    state.ui.scale = Math.pow(2, level - 1);
  }));
}
```

### Track Selection
```typescript
selectTrack: (trackId: string) => {
  set(produce((state) => {
    state.ui.selectedTrackIds = [trackId];
  }));
},

selectMultipleTracks: (trackIds: string[]) => {
  set(produce((state) => {
    state.ui.selectedTrackIds = trackIds;
  }));
},

clearTrackSelection: () => {
  set(produce((state) => {
    state.ui.selectedTrackIds = [];
  }));
}
```

### Timeline Scrolling
```typescript
setScrollPosition: (position: number) => {
  set(produce((state) => {
    state.ui.scrollPosition = Math.max(0, position);
  }));
},

scrollToTime: (time: number) => {
  const { ui } = get();
  const scrollPosition = time * ui.scale - ui.scrollPosition;
  get().setScrollPosition(scrollPosition);
}
```

## Real-time Synchronization

### Canvas Store Subscription
```typescript
// Subscribe to canvas store changes
subscribeToCanvasStore: () => {
  const unsubscribe = useCanvasStore.subscribe(
    (state) => ({ elements: state.elements, groups: state.groups }),
    (newState) => {
      set(produce((timelineState) => {
        timelineState.elements = newState.elements;
        timelineState.groups = newState.groups;
      }));
      
      // Rebuild timeline when canvas changes
      get().updateTracks();
      get().buildGSAPTimeline();
    }
  );
  
  set(produce((state) => {
    state.subscriptions.canvasStore = unsubscribe;
  }));
}
```

### Timeline Updates
```typescript
updateTracks: () => {
  const { elements, groups } = get();
  
  // Create tracks from elements with animations
  const elementTracks = elements
    .filter(element => element.animations.length > 0)
    .map(element => ({
      id: `element-${element.id}`,
      name: element.name,
      type: 'element' as const,
      targetId: element.id,
      animations: element.animations,
      visible: true,
      expanded: false,
      color: getTrackColor(element.type)
    }));
  
  // Create tracks from groups with animations
  const groupTracks = groups
    .filter(group => group.animations.length > 0)
    .map(group => ({
      id: `group-${group.id}`,
      name: group.name,
      type: 'group' as const,
      targetId: group.id,
      animations: group.animations,
      visible: true,
      expanded: false,
      color: getTrackColor(group.type)
    }));
  
  set(produce((state) => {
    state.tracks = [...elementTracks, ...groupTracks];
  }));
}
```

## Performance Optimizations

### Lazy Loading
```typescript
// Only load animation states when needed
loadAnimationStates: (animationIds: string[]) => {
  const { animationStates } = get();
  
  animationIds.forEach(id => {
    if (!animationStates.has(id)) {
      // Calculate and cache animation state
      const state = calculateAnimationState(id);
      animationStates.set(id, state);
    }
  });
}
```

### Debounced Updates
```typescript
// Debounce timeline rebuilds
const debouncedRebuild = debounce(() => {
  get().buildGSAPTimeline();
}, 100);

updateTrackDebounced: (trackId: string, updates: Partial<TimelineTrackData>) => {
  get().updateTrack(trackId, updates);
  debouncedRebuild();
}
```

## Error Handling

### Timeline Errors
```typescript
setError: (error: string | null) => {
  set(produce((state) => {
    state.error = error;
  }));
},

clearError: () => {
  set(produce((state) => {
    state.error = null;
  }));
}
```

### Animation Validation
```typescript
validateAnimation: (animation: ElementAnimation) => {
  const errors: string[] = [];
  
  if (animation.duration <= 0) {
    errors.push('Animation duration must be positive');
  }
  
  if (animation.startTime < 0) {
    errors.push('Animation start time cannot be negative');
  }
  
  if (animation.repeat && animation.repeat < 0) {
    errors.push('Animation repeat count cannot be negative');
  }
  
  return errors;
}
```

## Best Practices

### Timeline Organization
1. **Track Naming**: Use descriptive track names
2. **Animation Grouping**: Group related animations on the same track
3. **Timeline Scaling**: Use appropriate scale for the project duration

### Performance
1. **Animation Limits**: Avoid too many simultaneous animations
2. **State Caching**: Cache animation states for performance
3. **Lazy Loading**: Load animation data on demand

### Synchronization
1. **Store Sync**: Keep timeline store in sync with canvas store
2. **Real-time Updates**: Use subscriptions for real-time updates
3. **Error Handling**: Handle timeline errors gracefully

## Related Documentation

- [Animation Storage System](./animation-storage-system.md)
- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
- [Project Persistence Guide](./project-persistence-guide.md)
- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
