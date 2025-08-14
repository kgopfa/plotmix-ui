# Project Persistence Guide

## Overview

The project persistence system in PlotMix handles saving and loading complete project state, including all canvas elements, groups, animations, scenes, and UI state. This document explains how the `ProjectManager` works and how to use it effectively.

## Project Manager Architecture

The `ProjectManager` is a singleton class that coordinates between all stores to save and load project data:

```typescript
class ProjectManager {
  private static instance: ProjectManager;
  private currentVersion = "1.0.0";
  private sceneDataCache: Map<string, Scene> = new Map();
}
```

## Project Data Structure

### Current Project Format (v2.0)

```typescript
interface ProjectData {
  version: string;
  metadata: ProjectMetadata;
  scenes: Scene[];
  activeSceneId: string;
}
```

### Scene Structure

```typescript
interface Scene {
  id: string;
  name: string;
  canvas: ProjectCanvas;
  timeline: ProjectTimeline;
  ui: ProjectUI;
}
```

### Canvas Data

```typescript
interface ProjectCanvas {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  dimensions: {
    width: number;
    height: number;
  };
  canvasSize: {
    currentSizeId: string;
    customSize?: { width: number; height: number } | null;
  };
}
```

### Timeline Data

```typescript
interface ProjectTimeline {
  scale: number;
  duration: number;
  currentTime: number;
  animationStates: Record<string, AnimationState>;
}
```

### UI Data

```typescript
interface ProjectUI {
  zoom: number;
  selectedElements: string[];
  selectedGroups: string[];
  panelState: {
    leftPanelVisible: boolean;
    rightPanelVisible: boolean;
    leftPanelWidth: number;
    rightPanelWidth: number;
    timelineHeight: number;
    isTimelineCollapsed: boolean;
  };
  toolState: {
    activeTool: string;
    isPathMode: boolean;
    showPaths: boolean;
  };
}
```

## Saving Projects

### Basic Save Operation

```typescript
// Get project manager instance
const projectManager = ProjectManager.getInstance();

// Save project to JSON string
const jsonData = projectManager.saveProject("My Project");
```

### Save with Options

```typescript
const saveOptions: ProjectSaveOptions = {
  includeUI: true,        // Include UI state (default: true)
  compress: false,        // Compress JSON (default: false)
  prettyPrint: true       // Pretty print JSON (default: true)
};

const jsonData = projectManager.saveProject("My Project", saveOptions);
```

### Save Process

1. **Collect Current State**: Gathers data from all stores
2. **Generate Metadata**: Creates project metadata
3. **Cache Current Scene**: Saves current scene to cache
4. **Serialize Data**: Converts to JSON format
5. **Return JSON**: Returns serialized project data

```typescript
saveProject(name?: string, options: ProjectSaveOptions = {}): string {
  const canvasState = useCanvasStore.getState();
  const sceneState = useSceneStore.getState();

  // Generate metadata
  const metadata: ProjectMetadata = {
    name: name || `Project_${new Date().toISOString().split('T')[0]}`,
    createdAt: new Date().toISOString(),
    modifiedAt: new Date().toISOString(),
    description: `Canvas animation project with ${canvasState.elements.length} elements`,
  };

  // Get all scenes
  const allScenes = this.getAllScenes();
  const currentSceneId = sceneState.activeSceneId || 'scene-1';

  // Create project data
  const projectData: ProjectData = {
    version: this.currentVersion,
    metadata,
    scenes: allScenes,
    activeSceneId: currentSceneId,
  };

  // Serialize to JSON
  return JSON.stringify(projectData, null, 2);
}
```

## Loading Projects

### Basic Load Operation

```typescript
// Load project from JSON string
await projectManager.loadProject(jsonData);
```

### Load with Options

```typescript
const loadOptions: ProjectLoadOptions = {
  skipUI: false,           // Skip loading UI state (default: false)
  skipSelection: false,    // Skip restoring selections (default: false)
  validateOnly: false,     // Only validate, don't load (default: false)
  migrateVersion: true     // Attempt to migrate older versions (default: true)
};

await projectManager.loadProject(jsonData, loadOptions);
```

### Load Process

1. **Parse JSON**: Parse the project data
2. **Validate Data**: Check data integrity
3. **Migrate if Needed**: Handle version migrations
4. **Load into Stores**: Populate all stores with data
5. **Rebuild Timeline**: Reconstruct timeline state

```typescript
async loadProject(jsonData: string, options: ProjectLoadOptions = {}): Promise<void> {
  try {
    // Parse JSON
    const data = JSON.parse(jsonData);
    
    // Validate data
    const errors = this.validateProjectData(data);
    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.map(e => e.message).join(', ')}`);
    }
    
    // Migrate if needed
    const migratedData = this.migrateProjectData(data);
    
    // Load into stores
    await this.loadIntoStores(migratedData, options);
    
  } catch (error) {
    console.error('Failed to load project:', error);
    throw error;
  }
}
```

## Scene Management

### Scene Switching

```typescript
// Switch to a different scene
await projectManager.switchScene("scene-2");
```

### Scene Operations

```typescript
// Create new scene
const sceneId = projectManager.createScene("New Scene");

// Delete scene
const deleted = projectManager.deleteScene("scene-1");

// Duplicate scene
const newSceneId = projectManager.duplicateScene("scene-1", "Scene 1 Copy");

// Rename scene
const renamed = projectManager.renameScene("scene-1", "Updated Scene Name");
```

### Scene Caching

The project manager maintains a cache of scene data:

```typescript
private sceneDataCache: Map<string, Scene> = new Map();

// Save current scene to cache
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

## Version Migration

### Legacy Project Support

The system supports loading legacy project formats:

```typescript
// Check if project is legacy format
if (isLegacyProject(data)) {
  // Migrate legacy project to new format
  const migratedData = this.migrateLegacyProject(data);
  return migratedData;
}
```

### Migration Process

```typescript
private migrateLegacyProject(legacyData: LegacyProjectData): ProjectData {
  // Create default scene from legacy data
  const defaultScene: Scene = {
    id: 'scene-1',
    name: 'Scene 1',
    canvas: legacyData.canvas,
    timeline: legacyData.timeline,
    ui: legacyData.ui
  };

  return {
    version: this.currentVersion,
    metadata: legacyData.metadata,
    scenes: [defaultScene],
    activeSceneId: 'scene-1'
  };
}
```

## Data Validation

### Validation Rules

```typescript
private validateProjectData(data: ProjectData): ProjectValidationError[] {
  const errors: ProjectValidationError[] = [];
  
  // Check required fields
  if (!data.version) {
    errors.push({ field: 'version', message: 'Version is required' });
  }
  
  if (!data.metadata) {
    errors.push({ field: 'metadata', message: 'Metadata is required' });
  }
  
  if (!data.scenes || data.scenes.length === 0) {
    errors.push({ field: 'scenes', message: 'At least one scene is required' });
  }
  
  // Validate scenes
  data.scenes.forEach((scene, index) => {
    if (!scene.id) {
      errors.push({ field: 'scenes', message: 'Scene ID is required', index });
    }
    
    if (!scene.canvas) {
      errors.push({ field: 'scenes', message: 'Scene canvas is required', index });
    }
  });
  
  return errors;
}
```

## Project Statistics

### Get Project Info

```typescript
const stats = projectManager.getProjectStats();
console.log(stats);
// Output: { elements: 15, groups: 3, animations: 8, scenes: 2 }
```

### Statistics Implementation

```typescript
getProjectStats(): {
  elements: number;
  groups: number;
  animations: number;
  scenes: number;
} {
  const allScenes = this.getAllScenes();
  
  let totalElements = 0;
  let totalGroups = 0;
  let totalAnimations = 0;
  
  allScenes.forEach(scene => {
    totalElements += scene.canvas.elements.length;
    totalGroups += scene.canvas.groups.length;
    
    // Count animations
    scene.canvas.elements.forEach(element => {
      totalAnimations += element.animations.length;
    });
    
    scene.canvas.groups.forEach(group => {
      totalAnimations += group.animations.length;
    });
  });
  
  return {
    elements: totalElements,
    groups: totalGroups,
    animations: totalAnimations,
    scenes: allScenes.length
  };
}
```

## Backup and Recovery

### Create Backup

```typescript
// Create backup of current project
const backupData = projectManager.createBackup();
```

### Backup Implementation

```typescript
createBackup(): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `backup_${timestamp}`;
  return this.saveProject(backupName, { includeUI: true });
}
```

## Best Practices

### Saving Projects

1. **Regular Saves**: Save projects frequently
2. **Descriptive Names**: Use meaningful project names
3. **Include UI State**: Usually want to preserve UI state
4. **Backup Strategy**: Create backups before major changes

### Loading Projects

1. **Validation**: Always validate loaded data
2. **Error Handling**: Handle load errors gracefully
3. **Migration**: Support older project formats
4. **Performance**: Consider loading large projects asynchronously

### Scene Management

1. **Scene Organization**: Use scenes to organize content
2. **Scene Naming**: Use descriptive scene names
3. **Scene Switching**: Save current scene before switching
4. **Scene Caching**: Leverage scene caching for performance

## Error Handling

### Common Errors

```typescript
// Invalid JSON
try {
  await projectManager.loadProject(invalidJson);
} catch (error) {
  console.error('Invalid project data:', error.message);
}

// Validation errors
try {
  await projectManager.loadProject(projectData);
} catch (error) {
  if (error.message.includes('Validation failed')) {
    console.error('Project validation failed:', error.message);
  }
}

// Migration errors
try {
  await projectManager.loadProject(legacyProject);
} catch (error) {
  if (error.message.includes('Migration failed')) {
    console.error('Project migration failed:', error.message);
  }
}
```

## Related Documentation

- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
- [Scene Management System](./scene-management-system.md)
- [Timeline State Management](./timeline-state-management.md)
- [Canvas Elements Data Structure](./canvas-elements-data-structure.md)
