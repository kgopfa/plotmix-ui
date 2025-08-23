# Scene Management System

## Overview

The scene management system in PlotMix allows users to create multiple scenes within a single project, each with its own independent canvas state, timeline, and UI settings. This document explains how scenes work and how to manage them effectively.

## Scene Duration Limits

Each scene has a **maximum duration of 2 minutes (120 seconds)**. This limit ensures:
- Optimal performance during playback
- Reasonable file sizes for project storage
- Compatibility with video export formats
- Consistent user experience across scenes

The system automatically enforces this limit when:
- Creating new scenes
- Importing project data
- Adjusting timeline duration
- Adding animations that extend beyond the limit

## Scene Store Architecture

The scene management is handled by the `useSceneStore` Zustand store:

```typescript
interface SceneState {
  activeSceneId: string | null;
  scenes: SceneInfo[];
  
  // Actions
  setActiveScene: (sceneId: string) => void;
  getActiveSceneId: () => string | null;
  createScene: (name?: string) => string;
  deleteScene: (sceneId: string) => boolean;
  renameScene: (sceneId: string, newName: string) => boolean;
  duplicateScene: (sceneId: string, newName?: string) => string | null;
  getScenes: () => SceneInfo[];
  getSceneById: (sceneId: string) => SceneInfo | undefined;
  updateSceneModified: (sceneId: string) => void;
  loadScenes: (scenesData: Array<{ id: string; name: string; lastModified?: string }>, activeSceneId: string) => void;
}
```

## Scene Information Structure

### Scene Info Interface

```typescript
interface SceneInfo {
  id: string;
  name: string;
  lastModified: string;
}
```

### Scene Data Structure

Each scene contains complete project state:

```typescript
interface Scene {
  id: string;
  name: string;
  canvas: ProjectCanvas;      // Elements, groups, canvas settings
  timeline: ProjectTimeline;  // Animation timeline, playback state
  ui: ProjectUI;             // UI state, panel settings, selections
}
```

## Scene Operations

### Creating Scenes

#### Basic Scene Creation
```typescript
const sceneStore = useSceneStore.getState();
const newSceneId = sceneStore.createScene("My New Scene");
```

#### Auto-Named Scene Creation
```typescript
// Creates "Scene 2", "Scene 3", etc.
const sceneId = sceneStore.createScene();
```

#### Scene Creation Implementation
```typescript
createScene: (name?: string) => {
  const { scenes } = get();
  const sceneNumber = scenes.length + 1;
  const newSceneId = `scene-${Date.now()}`;
  const newSceneName = name || `Scene ${sceneNumber}`;
  
  const newScene: SceneInfo = {
    id: newSceneId,
    name: newSceneName,
    lastModified: new Date().toISOString()
  };
  
  set({
    scenes: [...scenes, newScene],
    activeSceneId: newSceneId
  });
  
  return newSceneId;
}
```

### Switching Between Scenes

#### Basic Scene Switching
```typescript
const sceneStore = useSceneStore.getState();
sceneStore.setActiveScene("scene-2");
```

#### Scene Switching with Project Manager
```typescript
const projectManager = ProjectManager.getInstance();
await projectManager.switchScene("scene-2");
```

#### Scene Switching Process
1. **Save Current Scene**: Current scene state is cached
2. **Load Target Scene**: Target scene data is loaded into stores
3. **Update Active Scene**: Active scene reference is updated
4. **Rebuild Timeline**: Timeline is reconstructed

```typescript
async switchScene(sceneId: string): Promise<void> {
  // Save current scene to cache
  this.saveCurrentSceneToCache();
  
  // Load target scene from cache
  const targetScene = this.sceneDataCache.get(sceneId);
  if (!targetScene) {
    throw new Error(`Scene ${sceneId} not found in cache`);
  }
  
  // Load scene data into stores
  await this.loadSceneIntoStores(targetScene);
  
  // Update active scene
  useSceneStore.getState().setActiveScene(sceneId);
}
```

### Deleting Scenes

#### Basic Scene Deletion
```typescript
const sceneStore = useSceneStore.getState();
const deleted = sceneStore.deleteScene("scene-1");
```

#### Deletion with Validation
```typescript
deleteScene: (sceneId: string) => {
  const { scenes, activeSceneId } = get();
  
  // Don't allow deleting the last scene
  if (scenes.length <= 1) {
    console.warn('Cannot delete the last scene');
    return false;
  }
  
  const sceneToDelete = scenes.find(s => s.id === sceneId);
  if (!sceneToDelete) {
    console.warn(`Scene ${sceneId} not found`);
    return false;
  }
  
  const updatedScenes = scenes.filter(s => s.id !== sceneId);
  let newActiveSceneId = activeSceneId;
  
  // If deleting active scene, switch to first available scene
  if (activeSceneId === sceneId) {
    newActiveSceneId = updatedScenes[0].id;
  }
  
  set({
    scenes: updatedScenes,
    activeSceneId: newActiveSceneId
  });
  
  return true;
}
```

### Duplicating Scenes

#### Basic Scene Duplication
```typescript
const sceneStore = useSceneStore.getState();
const newSceneId = sceneStore.duplicateScene("scene-1", "Scene 1 Copy");
```

#### Duplication Implementation
```typescript
duplicateScene: (sceneId: string, newName?: string) => {
  const { scenes } = get();
  const sourceScene = scenes.find(s => s.id === sceneId);
  
  if (!sourceScene) {
    console.warn(`Scene ${sceneId} not found`);
    return null;
  }
  
  const newSceneId = `scene-${Date.now()}`;
  const newSceneName = newName || `${sourceScene.name} Copy`;
  
  const newScene: SceneInfo = {
    id: newSceneId,
    name: newSceneName,
    lastModified: new Date().toISOString()
  };
  
  set({
    scenes: [...scenes, newScene],
    activeSceneId: newSceneId
  });
  
  // Duplicate scene data in cache
  const sourceSceneData = this.sceneDataCache.get(sceneId);
  if (sourceSceneData) {
    const duplicatedSceneData = {
      ...sourceSceneData,
      id: newSceneId,
      name: newSceneName
    };
    this.sceneDataCache.set(newSceneId, duplicatedSceneData);
  }
  
  return newSceneId;
}
```

### Renaming Scenes

#### Basic Scene Renaming
```typescript
const sceneStore = useSceneStore.getState();
const renamed = sceneStore.renameScene("scene-1", "Updated Scene Name");
```

#### Renaming Implementation
```typescript
renameScene: (sceneId: string, newName: string) => {
  const { scenes } = get();
  const sceneIndex = scenes.findIndex(s => s.id === sceneId);
  
  if (sceneIndex === -1) {
    console.warn(`Scene ${sceneId} not found`);
    return false;
  }
  
  const updatedScenes = [...scenes];
  updatedScenes[sceneIndex] = {
    ...updatedScenes[sceneIndex],
    name: newName,
    lastModified: new Date().toISOString()
  };
  
  set({ scenes: updatedScenes });
  return true;
}
```

## Scene State Management

### Scene Data Caching

The project manager maintains a cache of scene data:

```typescript
private sceneDataCache: Map<string, Scene> = new Map();
```

### Saving Scene to Cache

```typescript
private saveCurrentSceneToCache(): void {
  const canvasState = useCanvasStore.getState();
  const timelineState = useTimelineStore.getState();
  const uiState = useUIStore.getState();
  const sceneState = useSceneStore.getState();
  
  const currentScene: Scene = {
    id: sceneState.activeSceneId!,
    name: sceneState.scenes.find(s => s.id === sceneState.activeSceneId)?.name || "Scene",
    canvas: {
      elements: canvasState.elements,
      groups: canvasState.groups,
      dimensions: { width: 1920, height: 1080 },
      canvasSize: { currentSizeId: "fhd" }
    },
    timeline: {
      scale: timelineState.ui.scale,
      duration: timelineState.playback.totalDuration,
      currentTime: timelineState.playback.currentTime,
      animationStates: Object.fromEntries(timelineState.animationStates)
    },
    ui: {
      zoom: uiState.zoom,
      selectedElements: useSelectionStore.getState().selectedElements,
      selectedGroups: useSelectionStore.getState().selectedGroups,
      panelState: uiState.panelState,
      toolState: uiState.toolState
    }
  };
  
  this.sceneDataCache.set(currentScene.id, currentScene);
}
```

### Loading Scene from Cache

```typescript
private async loadSceneIntoStores(scene: Scene): Promise<void> {
  // Clear existing state
  useCanvasStore.getState().clearCanvas();
  useSelectionStore.getState().clearSelections();
  
  // Load canvas data
  const canvasStore = useCanvasStore.getState();
  canvasStore.setElements(scene.sceneCanvas.elements);
  canvasStore.setElements(scene.sceneCanvas.groups);
  
  // Load timeline state
  const timelineStore = useTimelineStore.getState();
  timelineStore.loadProjectData({
    elements: scene.sceneCanvas.elements,
    groups: scene.sceneCanvas.groups,
    animationStates: scene.timeline.animationStates,
    scale: scene.timeline.scale,
    duration: scene.timeline.duration,
    currentTime: scene.timeline.currentTime,
  });
  
  // Load UI state
  const uiStore = useUIStore.getState();
  uiStore.setZoom(scene.ui.zoom);
  uiStore.setPanelState(scene.ui.panelState);
  uiStore.setToolState(scene.ui.toolState);
  
  // Load selections
  const selectionStore = useSelectionStore.getState();
  selectionStore.setSelectedElements(scene.ui.selectedElements);
  selectionStore.setSelectedGroups(scene.ui.selectedGroups);
}
```

## Scene Initialization

### Default Scene Creation

```typescript
const DEFAULT_SCENE_ID = 'scene-1';
const INITIAL_TIMESTAMP = '2024-01-01T00:00:00.000Z';

const createInitialState = (): Pick<SceneState, 'activeSceneId' | 'scenes'> => ({
  activeSceneId: DEFAULT_SCENE_ID,
  scenes: [
    {
      id: DEFAULT_SCENE_ID,
      name: 'Scene 1',
      lastModified: INITIAL_TIMESTAMP
    }
  ]
});
```

### Scene Loading from Project

```typescript
loadScenes: (scenesData: Array<{ id: string; name: string; lastModified?: string }>, activeSceneId: string) => {
  const scenes = scenesData.map(scene => ({
    id: scene.id,
    name: scene.name,
    lastModified: scene.lastModified || new Date().toISOString()
  }));
  
  set({
    scenes,
    activeSceneId
  });
}
```

## Scene Usage Patterns

### Scene Organization Strategies

#### By Content Type
```typescript
// Organize scenes by content type
sceneStore.createScene("Introduction");
sceneStore.createScene("Main Content");
sceneStore.createScene("Conclusion");
```

#### By Animation Sequence
```typescript
// Organize scenes by animation sequence
sceneStore.createScene("Scene 1 - Fade In");
sceneStore.createScene("Scene 2 - Main Animation");
sceneStore.createScene("Scene 3 - Fade Out");
```

#### By Version
```typescript
// Organize scenes by version
sceneStore.createScene("Version 1");
sceneStore.createScene("Version 2");
sceneStore.createScene("Final Version");
```

### Scene Workflow

#### Typical Scene Workflow
1. **Create Scene**: Start with a new scene
2. **Add Content**: Add elements and groups
3. **Animate**: Create animations and timeline
4. **Test**: Preview the scene
5. **Duplicate**: Create variations if needed
6. **Organize**: Rename and organize scenes

#### Scene Iteration
```typescript
// Create initial scene
const scene1 = sceneStore.createScene("Initial Design");

// Work on scene...

// Create iteration
const scene2 = sceneStore.duplicateScene(scene1, "Design Iteration 1");

// Work on iteration...

// Create final version
const scene3 = sceneStore.duplicateScene(scene2, "Final Design");
```

## Scene Performance Considerations

### Memory Management
- Scene data is cached in memory for fast switching
- Large scenes may impact performance
- Consider scene cleanup for unused scenes

### Scene Size Optimization
- Keep scenes focused on specific content
- Avoid extremely large scenes with many elements
- Use scene organization to break up complex projects

## Best Practices

### Scene Naming
1. **Descriptive Names**: Use clear, descriptive scene names
2. **Consistent Naming**: Follow a consistent naming convention
3. **Version Control**: Include version numbers in names when appropriate

### Scene Organization
1. **Logical Grouping**: Group related scenes together
2. **Workflow Order**: Arrange scenes in logical workflow order
3. **Backup Scenes**: Keep backup scenes for important work

### Scene Management
1. **Regular Cleanup**: Remove unused scenes
2. **Scene Limits**: Avoid creating too many scenes
3. **Scene Switching**: Save work before switching scenes

## Error Handling

### Common Scene Errors

```typescript
// Scene not found
try {
  sceneStore.setActiveScene("nonexistent-scene");
} catch (error) {
  console.error('Scene not found:', error.message);
}

// Cannot delete last scene
try {
  sceneStore.deleteScene("last-scene");
} catch (error) {
  console.error('Cannot delete last scene:', error.message);
}

// Scene switching errors
try {
  await projectManager.switchScene("invalid-scene");
} catch (error) {
  console.error('Scene switching failed:', error.message);
}
```

## Related Documentation

- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
- [Project Persistence Guide](./project-persistence-guide.md)
- [Timeline State Management](./timeline-state-management.md)
- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
