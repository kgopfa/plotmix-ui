import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useProjectStore } from '@/stores/use-project-store';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

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
   * Load project from JSON data (single-scene format)
   */
  async loadProject(jsonData: string, options: ProjectLoadOptions = {}): Promise<void> {
    const { validateOnly = false } = options;

    try {
      const rawData = JSON.parse(jsonData);

      // Validate that the project uses single-scene format
      if (!rawData.elements && !rawData.groups) {
        throw new Error('Invalid project format: missing elements/groups');
      }

      if (validateOnly) {
        return;
      }

      // Load data into stores
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();
      const uiStore = useUIStore.getState();
      const projectStore = useProjectStore.getState();

      // Load canvas data
      const elements = Array.isArray(rawData.elements) ? rawData.elements : [];
      const groups = Array.isArray(rawData.groups) ? rawData.groups : [];
      
      canvasStore.setElements(elements);
      canvasStore.setGroups(groups);

      // Load timeline data
      const timeline = rawData.timeline || {};
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
        uiStore.loadProjectData(rawData.ui);
      }

      // Set project info if available
      if (rawData.name || rawData.title || rawData.version) {
        projectStore.setProjectInfo({
          name: rawData.name || 'Project',
          title: rawData.title,
          version: rawData.version || '1.0.0'
        });
      }

      // Set baseline
      projectStore.setBaseline(rawData);

    } catch (error) {
      console.error('Failed to load project:', error);
      throw error;
    }
  }

  /**
   * Save project to JSON string (single-scene format)
   */
  saveProject(name?: string, options: ProjectSaveOptions = {}): string {
    const { includeUI = true } = options;
    
    const canvasStore = useCanvasStore.getState();
    const timelineStore = useTimelineStore.getState();
    const uiStore = useUIStore.getState();
    const projectStore = useProjectStore.getState();

    const projectData = {
      name: name || projectStore.name,
      title: projectStore.title,
      version: projectStore.version,
      elements: canvasStore.elements,
      groups: canvasStore.groups,
      timeline: {
        scale: timelineStore.ui.scale,
        duration: timelineStore.playback.totalDuration,
        currentTime: timelineStore.playback.currentTime,
        animationStates: Object.fromEntries(timelineStore.animationStates as unknown as Iterable<readonly [PropertyKey, unknown]>),
      },
      ...(includeUI && { ui: uiStore.getProjectData() })
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
   * Get project statistics
   */
  getProjectStats(): { elements: number; groups: number; animations: number } {
    const canvasStore = useCanvasStore.getState();
    const timelineStore = useTimelineStore.getState();
    
    const elements = canvasStore.elements.length;
    const groups = canvasStore.groups.length;
    const animations = Object.keys(timelineStore.animationStates).length;
    
    return { elements, groups, animations };
  }
}