# Timeline Refactoring: Centralized Animation Structure

## Overview

The timeline and animation system has been refactored to use a centralized timeline structure where animations are stored in a dedicated timeline array rather than being attached to individual elements and groups.

## Key Changes

### Before (Old Structure)
```typescript
// Elements and groups had individual animation arrays
interface AnimatedCanvasObject {
  id: string;
  name: string;
  // ... other properties
  animations: ElementAnimation[]; // ❌ REMOVED
}

interface CanvasGroup {
  id: string;
  name: string;
  // ... other properties
  animations: ElementAnimation[]; // ❌ REMOVED
}

// Timeline was just playback state
interface ProjectTimeline {
  scale: number;
  duration: number;
  currentTime: number;
}
```

### After (New Structure)
```typescript
// Elements and groups no longer have animations
interface AnimatedCanvasObject {
  id: string;
  name: string;
  // ... other properties
  // ✅ animations property removed
}

interface CanvasGroup {
  id: string;
  name: string;
  // ... other properties
  // ✅ animations property removed
}

// New centralized timeline structure
interface TimelineAnimation {
  id: string;
  displayName: string;
  target: {
    type: 'element' | 'group';
    id: string; // ID of the element or group
  };
  tracks: ElementAnimation[]; // Array of animation tracks
  startAt: number; // When this animation starts
}

// Separate playback state
interface TimelinePlayback {
  scale: number;
  duration: number;
  currentTime: number;
  isPlaying?: boolean;
  isPaused?: boolean;
  isStopped?: boolean;
  playbackSpeed?: number;
}

// Updated scene structure
interface SceneCanvas {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  timeline: TimelineAnimation[]; // ✅ Array of animations
  playback: TimelinePlayback; // ✅ Separate playback state
}
```

## Example Usage

### Creating a Scene with Animations

```typescript
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
import { TimelineAnimation, ElementAnimation } from '@/types/canvas';

// Example scene data
const sceneData = {
  elements: [
    { 
      id: "rect1", 
      type: "rectangle", 
      x: 100, 
      y: 100, 
      width: 50, 
      height: 50,
      fill: "#ff0000"
      // ✅ No animations property
    },
    { 
      id: "text1", 
      type: "text", 
      x: 200, 
      y: 120, 
      text: "Hello World"
      // ✅ No animations property
    }
  ],
  groups: [
    { 
      id: "groupA", 
      name: "My Group",
      elementIds: ["rect1", "text1"],
      type: "custom"
      // ✅ No animations property
    }
  ],
  timeline: [
    {
      id: "rect1-move",
      displayName: "Rectangle Move",
      target: { 
        type: "element", 
        id: "rect1" 
      },
      tracks: [
        {
          id: "move-1",
          displayName: "move-1",
          type: "move",
          startTime: 0,
          duration: 2,
          properties: { x: 300, y: 200 },
          easing: "power2.out"
        }
      ],
      startAt: 0
    },
    {
      id: "groupA-scale",
      displayName: "Group Scale",
      target: { 
        type: "group", 
        id: "groupA" 
      },
      tracks: [
        {
          id: "scale-1",
          displayName: "scale-1",
          type: "scale",
          startTime: 2,
          duration: 1.5,
          properties: { scaleX: 1.5, scaleY: 1.5 },
          easing: "back.out",
          repeat: 2,
          yoyo: true
        }
      ],
      startAt: 2
    }
  ],
  playback: {
    scale: 100,
    duration: 5,
    currentTime: 0,
    isPlaying: false,
    isPaused: false,
    isStopped: true,
    playbackSpeed: 1
  }
};

// Load the scene
const timelineStore = useTimelineStoreV2.getState();
timelineStore.loadSceneTimeline("scene1", sceneData);
```

### Working with Timeline Animations

```typescript
import { useTimelineAnimationsV2 } from '@/stores/use-timeline-store-v2';

function AnimationManager() {
  const {
    timelineAnimations,
    addTimelineAnimation,
    updateTimelineAnimation,
    removeTimelineAnimation,
    duplicateTimelineAnimation
  } = useTimelineAnimationsV2();

  // Add a new animation
  const addMoveAnimation = (elementId: string) => {
    const newAnimation: TimelineAnimation = {
      id: `${elementId}-move-${Date.now()}`,
      displayName: `Move ${elementId}`,
      target: { type: "element", id: elementId },
      tracks: [
        {
          id: `move-${Date.now()}`,
          displayName: "move",
          type: "move",
          startTime: 0,
          duration: 2,
          properties: { x: 300, y: 200 },
          easing: "power2.out"
        }
      ],
      startAt: 0
    };
    
    addTimelineAnimation(newAnimation);
  };

  // Update an existing animation
  const updateAnimationDuration = (animationId: string, newDuration: number) => {
    const animation = timelineAnimations.find(anim => anim.id === animationId);
    if (animation) {
      updateTimelineAnimation(animationId, {
        tracks: animation.tracks.map(track => ({
          ...track,
          duration: newDuration
        }))
      });
    }
  };

  // Remove an animation
  const removeAnimation = (animationId: string) => {
    removeTimelineAnimation(animationId);
  };

  return (
    <div>
      <h3>Timeline Animations ({timelineAnimations.length})</h3>
      {timelineAnimations.map(animation => (
        <div key={animation.id}>
          <h4>{animation.displayName}</h4>
          <p>Target: {animation.target.type} - {animation.target.id}</p>
          <p>Tracks: {animation.tracks.length}</p>
          <p>Start: {animation.startAt}s</p>
          <button onClick={() => removeAnimation(animation.id)}>
            Remove
          </button>
          <button onClick={() => duplicateTimelineAnimation(animation.id)}>
            Duplicate
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Migration from Old Structure

```typescript
import { migrateToCentralizedTimeline, migrateFromCentralizedTimeline } from '@/utils/timeline-migration';

// Convert old structure to new structure
const oldElements = [
  {
    id: "rect1",
    name: "Rectangle",
    animations: [
      {
        id: "move-1",
        type: "move",
        startTime: 0,
        duration: 2,
        properties: { x: 300, y: 200 }
      }
    ]
  }
];

const oldGroups = [
  {
    id: "group1",
    name: "Group",
    animations: [
      {
        id: "scale-1",
        type: "scale",
        startTime: 2,
        duration: 1,
        properties: { scaleX: 1.5, scaleY: 1.5 }
      }
    ]
  }
];

// Migrate to new structure
const timelineAnimations = migrateToCentralizedTimeline(oldElements, oldGroups);

// Clean elements and groups (remove animations)
const cleanElements = oldElements.map(el => ({ ...el, animations: [] }));
const cleanGroups = oldGroups.map(group => ({ ...group, animations: [] }));

// Convert back to old structure (if needed)
const { elements, groups } = migrateFromCentralizedTimeline(
  timelineAnimations, 
  cleanElements, 
  cleanGroups
);
```

### Using Animation Utilities

```typescript
import {
  calculateEffectiveDurationV2,
  calculateTotalTimelineDurationV2,
  getActiveAnimationsAtTimeV2,
  getTimelineAnimationStatsV2
} from '@/utils/animation-utils-v2';

// Calculate effective duration (considering repeats, yoyo, etc.)
const animation: ElementAnimation = {
  id: "scale-1",
  type: "scale",
  startTime: 0,
  duration: 1,
  properties: { scaleX: 1.5, scaleY: 1.5 },
  repeat: 2,
  yoyo: true,
  repeatDelay: 0.5
};

const effectiveDuration = calculateEffectiveDurationV2(animation);
// Result: (1 * 2 * 3) + (2 * 0.5) = 6 + 1 = 7 seconds

// Get timeline statistics
const stats = getTimelineAnimationStatsV2(timelineAnimations);
console.log(stats);
// {
//   totalAnimations: 2,
//   totalTracks: 2,
//   totalDuration: 5,
//   animationTypes: { "move": 1, "scale": 1 },
//   targetTypes: { "element": 1, "group": 1 }
// }

// Get animations active at a specific time
const activeAnimations = getActiveAnimationsAtTimeV2(timelineAnimations, 1.5);
// Returns array of { animation, track } objects that are active at time 1.5s
```

## Benefits of the New Structure

1. **Centralized Management**: All animations are in one place, making it easier to manage and debug
2. **Better Organization**: Animations are organized by target and can be easily filtered/sorted
3. **Cleaner Data Model**: Elements and groups focus on their visual properties, not animation logic
4. **Easier Serialization**: Timeline data is separate from element/group data
5. **Better Performance**: No need to traverse all elements/groups to find animations
6. **More Flexible**: Easy to add animations that target multiple elements or complex timing

## Migration Strategy

1. **Phase 1**: Use migration utilities to convert existing data
2. **Phase 2**: Update UI components to use new store (V2)
3. **Phase 3**: Gradually replace old timeline store with V2
4. **Phase 4**: Remove old timeline store and migration utilities

The new structure provides a much cleaner and more maintainable approach to managing animations in the timeline system.
