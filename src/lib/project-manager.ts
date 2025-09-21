import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useProjectStore } from '@/stores/use-project-store';
import type { MultiSceneProjectData } from '@/types/project';

export interface ProjectLoadOptions {
  validateOnly?: boolean;
}

export interface ProjectSaveOptions {
  includeUI?: boolean;
}

export class ProjectManager {
  private static instance: ProjectManager;

  private constructor() {}

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Load project from JSON data (NEW: multi-scene format ONLY)
   */
  async loadProject(jsonData: string, options: ProjectLoadOptions = {}): Promise<void> {
    const { validateOnly = false } = options;

    try {
      const rawData = JSON.parse(jsonData) as MultiSceneProjectData;

      // BREAKING CHANGE: Only accept new multi-scene format
      if (!rawData.dimensions || !rawData.scenes || !Array.isArray(rawData.scenes)) {
        throw new Error('Invalid project format: Expected new multi-scene structure with dimensions and scenes array. Legacy single-scene format is no longer supported.');
      }

      if (rawData.scenes.length === 0) {
        throw new Error('Invalid project format: At least one scene is required');
      }

      // Validate scene structure
      for (const scene of rawData.scenes) {
        if (!scene.sceneId || !scene.sceneName || !scene.sceneCanvas) {
          throw new Error(`Invalid scene structure: Missing required fields (sceneId, sceneName, sceneCanvas)`);
        }
        if (!scene.sceneCanvas.elements || !scene.sceneCanvas.groups || !scene.sceneCanvas.timeline) {
          throw new Error(`Invalid scene canvas: Missing required fields (elements, groups, timeline)`);
        }
      }

      if (validateOnly) {
        return;
      }

      // Load data into stores
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();
      const uiStore = useUIStore.getState();
      const projectStore = useProjectStore.getState();

      // Set project dimensions (shared across all scenes)
      uiStore.setCanvasDimensions(rawData.dimensions);

      // Load first scene by default
      const firstScene = rawData.scenes[0];
      const { elements, groups, timeline } = firstScene.sceneCanvas;
      
      // Set current scene in canvas store
      canvasStore.setCurrentScene(firstScene.sceneId);
      canvasStore.loadSceneData(firstScene.sceneId, elements, groups);

      // Load timeline data for the current scene
      timelineStore.loadProjectData({
        elements: elements,
        groups: groups,
        animationStates: timeline.animationStates || {},
        scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
        duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
        currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
      });

      // Load UI state if available
      if (rawData.ui) {
        // TODO: Implement loadProjectData method in UI store
        console.warn('UI state loading not yet implemented for multi-scene projects');
      }

      // Set project info
      projectStore.setProjectInfo({
        name: rawData.name || 'Project',
        title: rawData.title,
        version: rawData.version || '1.0.0'
      });

      // Store all scenes in project store for scene management
      projectStore.setScenes(rawData.scenes, rawData.dimensions);

      // Set baseline with new structure
      projectStore.setBaseline(rawData as unknown as Record<string, unknown>);

    } catch (error) {
      // Enhance error messages for better debugging
      if (error instanceof Error) {
        if (error.message.includes('Legacy format')) {
          console.error('MIGRATION REQUIRED:', error.message);
        } else {
          console.error('Failed to load project:', error.message);
        }
      }
      throw error;
    }
  }

  /**
   * Save project to JSON string (NEW: multi-scene format ONLY)
   */
  saveProject(name?: string, options: ProjectSaveOptions = {}): string {
    const { includeUI = true } = options;
    
    const canvasStore = useCanvasStore.getState();
    const timelineStore = useTimelineStore.getState();
    const uiStore = useUIStore.getState();
    const projectStore = useProjectStore.getState();

    // Save current scene data first
    const currentSceneData = canvasStore.saveCurrentSceneData();
    const currentTimeline = {
      scale: timelineStore.ui.scale,
      duration: timelineStore.playback.totalDuration,
      currentTime: timelineStore.playback.currentTime,
      animationStates: Object.fromEntries(timelineStore.animationStates as unknown as Iterable<readonly [PropertyKey, unknown]>),
    };

    // Get dimensions from UI store
    const dimensions = uiStore.getCanvasDimensions();

    // Build multi-scene project structure
    const projectData: MultiSceneProjectData = {
      name: name || projectStore.name,
      title: projectStore.title,
      version: projectStore.version || '1.0.0',
      dimensions,
      scenes: [
        {
          sceneId: currentSceneData.sceneId || 'scene-1',
          sceneName: 'Scene 1', // TODO: Get from scene management
          sceneCanvas: {
            elements: currentSceneData.elements,
            groups: currentSceneData.groups,
            timeline: currentTimeline as any // TODO: Fix timeline type compatibility
          }
        }
      ],
      // TODO: Implement getProjectData method in UI store
      // ...(includeUI && { ui: uiStore.getProjectData() })
    };

    return JSON.stringify(projectData, null, 2);
  }

  /**
   * Create a backup of the current project
   */
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `backup-${timestamp}`;
    return this.saveProject(name, { includeUI: true });
  }

  /**
   * Get project statistics (updated for multi-scene)
   */
  getProjectStats(): { scenes: number; elements: number; groups: number; animations: number } {
    const canvasStore = useCanvasStore.getState();
    const timelineStore = useTimelineStore.getState();
    const projectStore = useProjectStore.getState();
    
    const scenes = projectStore.getSceneCount();
    const elements = canvasStore.elements.length;
    const groups = canvasStore.groups.length;
    const animations = Object.keys(timelineStore.animationStates).length;
    
    return { scenes, elements, groups, animations };
  }

  /**
   * LEGACY SUPPORT: Detect if project data is in old single-scene format
   * This method will throw an error to force migration
   */
  private validateProjectFormat(rawData: Record<string, unknown>): void {
    // Check if it's the old single-scene format
    if (rawData.elements && rawData.groups && !rawData.scenes) {
      throw new Error(
        'LEGACY FORMAT DETECTED: This project uses the old single-scene format. ' +
        'Please migrate to the new multi-scene format: ' +
        '{ dimensions: {...}, scenes: [{ sceneId, sceneName, sceneCanvas: { elements, groups, timeline } }] }'
      );
    }
  }
}