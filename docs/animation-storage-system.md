# Animation Storage System

## Overview

The animation system in PlotMix stores comprehensive animation data across multiple layers: individual elements, groups, and the timeline. This document explains how animations are structured, stored, and managed throughout the application.

## Animation Data Structure

### Core Animation Interface

```typescript
interface ElementAnimation {
  // Basic identification
  id: string;
  displayName: string;
  
  // Animation type and timing
  type: AnimationType;
  startTime: number;
  duration: number;
  
  // Animation properties
  properties: AnimatableProperties;
  easing?: GsapEase;
  
  // Repeat and special effects
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  yoyoReturnEasing?: GsapEase;
  
  // Stagger properties for group animations
  stagger?: number;
  staggerFrom?: 'start' | 'end' | 'center';
  staggerEase?: GsapEase;
}
```

## Animation Types

### Supported Animation Types

| Type | Description | Use Case |
|------|-------------|----------|
| `'rotate'` | Rotation animation | Spinning elements, rotating objects |
| `'scale'` | Scaling animation | Growing/shrinking elements |
| `'move'` | Position animation | Moving elements across canvas |
| `'color'` | Color transition | Color changes, highlighting |
| `'fade'` | Opacity animation | Fade in/out effects |
| `'path'` | Path following | Complex movement patterns |
| `'typewriter'` | Text typing effect | Text animations |
| `'textScale'` | Text scaling | Text emphasis effects |
| `'physics'` | Physics-based animation | Natural movement, bouncing |

### Animation Type Examples

```typescript
// Rotation animation
{
  type: 'rotate',
  properties: { rotation: 360 },
  duration: 2,
  easing: 'power2.out'
}

// Move animation
{
  type: 'move',
  properties: { x: 200, y: 100 },
  duration: 1.5,
  easing: 'back.out'
}

// Scale animation
{
  type: 'scale',
  properties: { scaleX: 1.5, scaleY: 1.5 },
  duration: 0.8,
  easing: 'elastic.out'
}
```

## Animatable Properties

### Core Properties

```typescript
type AnimatableProperties = {
  // Position and size
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  
  // Visual properties
  fillColor?: string;
  alpha?: number;
  
  // Transform properties
  scaleX?: number;
  scaleY?: number;
  rotation?: number;
  pivotX?: number;
  pivotY?: number;
  
  // Shape-specific properties
  radius?: number;
  cornerRadius?: number;
  
  // Shadow properties
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowOpacity?: number;
  
  // Path properties
  pathPoints?: Array<{x: number, y: number}>;
  pathDirection?: 'clockwise' | 'counterclockwise';
  pathElement?: AnimatedCanvasObject | CanvasGroup;
  isPolygonPath?: boolean;
  
  // Text properties
  text?: string;
  fontSize?: number;
  letterSpacing?: number;
  
  // Physics properties
  velocity?: number;
  angle?: number;
  gravity?: number;
  acceleration?: number;
  accelerationAngle?: number;
  friction?: number;
  xProp?: string;
  yProp?: string;
};
```

## Animation Storage Locations

### 1. Element-Level Storage

Animations are stored directly on elements:

```typescript
interface AnimatedCanvasObject {
  // ... other properties
  animations: ElementAnimation[];
  isAnimationPath?: boolean;
}
```

**Access**: `element.animations`

### 2. Group-Level Storage

Groups can have their own animations:

```typescript
interface CanvasGroup {
  // ... other properties
  animations: ElementAnimation[];
  isAnimationPath?: boolean;
}
```

**Access**: `group.animations`

### 3. Timeline Store Storage

The timeline store manages animation state and playback:

```typescript
interface TimelineStoreState {
  // Animation states for each animation
  animationStates: Map<string, AnimationState>;
  
  // Timeline data
  tracks: TimelineTrackData[];
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
}
```

## Animation State Management

### Animation State Interface

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

### Timeline Store Methods

```typescript
// Get animation state
getAnimationState: (animationId: string) => AnimationState | null;

// Update animation state
updateAnimationState: (animationId: string, updates: Partial<AnimationState>) => void;

// Get project data including animations
getProjectData: () => {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  animationStates: Map<string, AnimationState>;
  // ... other data
};
```

## Animation Creation and Management

### Creating Animations

```typescript
// Create a simple move animation
const moveAnimation: ElementAnimation = {
  id: crypto.randomUUID(),
  displayName: "Move Right",
  type: "move",
  startTime: 0,
  duration: 2,
  properties: {
    x: 300,
    y: 200
  },
  easing: "power2.out"
};

// Add to element
element.animations.push(moveAnimation);
```

### Group Animations with Stagger

```typescript
// Create staggered animation for group
const groupAnimation: ElementAnimation = {
  id: crypto.randomUUID(),
  displayName: "Staggered Fade",
  type: "fade",
  startTime: 0,
  duration: 1,
  properties: {
    alpha: 0
  },
  easing: "power2.out",
  stagger: 0.1, // 0.1 second delay between elements
  staggerFrom: "start"
};
```

## Animation Persistence

### Project Save/Load

Animations are automatically included in project data:

```typescript
// Saving project includes all animations
const projectData = {
  elements: elements.map(element => ({
    ...element,
    animations: element.animations // All animations preserved
  })),
  groups: groups.map(group => ({
    ...group,
    animations: group.animations // All group animations preserved
  })),
  animationStates: animationStates // Timeline animation states
};
```

### Animation State Caching

The timeline store caches animation states for performance:

```typescript
// Cache animation state
const animationState: AnimationState = {
  baseDuration: 2,
  repeat: 3,
  repeatDelay: 0.5,
  yoyo: true,
  effectiveDuration: 8, // Calculated: (2 + 0.5) * 3 + 2
  effectiveEndTime: 8
};

animationStates.set(animationId, animationState);
```

## Animation Examples

### Element Animation Examples

#### Simple Fade Animation
```typescript
{
  id: "fade-1",
  displayName: "Fade In",
  type: "fade",
  startTime: 0,
  duration: 1,
  properties: {
    alpha: 1
  },
  easing: "power2.out"
}
```

#### Complex Path Animation
```typescript
{
  id: "path-1",
  displayName: "Follow Path",
  type: "path",
  startTime: 0,
  duration: 3,
  properties: {
    pathPoints: [
      { x: 0, y: 0 },
      { x: 100, y: 50 },
      { x: 200, y: 0 },
      { x: 300, y: 100 }
    ],
    pathDirection: "clockwise"
  },
  easing: "power2.inOut"
}
```

#### Text Typewriter Animation
```typescript
{
  id: "typewriter-1",
  displayName: "Type Text",
  type: "typewriter",
  startTime: 0,
  duration: 2,
  properties: {
    text: "Hello World"
  },
  easing: "none"
}
```

### Group Animation Examples

#### Staggered Scale Animation
```typescript
{
  id: "group-scale-1",
  displayName: "Staggered Scale",
  type: "scale",
  startTime: 0,
  duration: 0.5,
  properties: {
    scaleX: 1.2,
    scaleY: 1.2
  },
  easing: "back.out",
  stagger: 0.1,
  staggerFrom: "start"
}
```

#### Collective Rotation
```typescript
{
  id: "group-rotate-1",
  displayName: "Group Rotation",
  type: "rotate",
  startTime: 0,
  duration: 2,
  properties: {
    rotation: 360
  },
  easing: "power2.inOut",
  repeat: 2,
  yoyo: true
}
```

## Animation Performance Considerations

### State Caching
- Animation states are cached in the timeline store
- Effective durations are pre-calculated
- Reduces runtime computation

### Lazy Loading
- Animation data is loaded on demand
- Heavy animations can be deferred

### Memory Management
- Animation objects are shared when possible
- Cleanup occurs when animations are removed

## Best Practices

1. **Animation Naming**: Use descriptive `displayName` for animations
2. **Timing**: Consider animation timing and overlaps
3. **Performance**: Use appropriate easing functions
4. **Grouping**: Use group animations for collective effects
5. **Staggering**: Use stagger for sequential element animations
6. **Repeating**: Use repeat and yoyo for continuous effects

## Related Documentation

- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
- [Canvas Groups Data Structure](./canvas-groups-data-structure.md)
- [Timeline State Management](./timeline-state-management.md)
- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
