import { 
  ProjectData, 
  ProjectValidationError, 
  ProjectLoadOptions, 
  ProjectSaveOptions,
  ProjectMetadata,
  ProjectCanvas,
  ProjectTimeline,
  ProjectUI
} from '@/types/project';
import { ToolType } from '@/types/tool';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';

export class ProjectManager {
  private static instance: ProjectManager;
  private currentVersion = "1.0.0";

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Save complete project state to JSON
   */
  saveProject(name?: string, options: ProjectSaveOptions = {}): string {
    const {
      includeUI = true,
      prettyPrint = true
    } = options;
    
    // TODO: Implement compression if needed
    // const { compress = false } = options;

    try {
      const canvasState = useCanvasStore.getState();
      const timelineState = useTimelineStore.getState();
      const uiState = useUIStore.getState();
      const selectionState = useSelectionStore.getState();

      // Generate project metadata
      const metadata: ProjectMetadata = {
        name: name || `Project_${new Date().toISOString().split('T')[0]}`,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        description: `Canvas animation project with ${canvasState.elements.length} elements`,
      };

      // Canvas data (always included)
      const canvas: ProjectCanvas = {
        elements: canvasState.elements,
        groups: canvasState.groups,
        dimensions: {
          width: 1920, // TODO: Get from actual canvas dimensions
          height: 1080
        }
      };

      // Timeline data (always included)
      const timeline: ProjectTimeline = {
        scale: timelineState.ui.scale,
        duration: timelineState.playback.totalDuration,
        currentTime: timelineState.playback.currentTime,
        // Convert Map to Record for JSON serialization
        animationStates: Object.fromEntries(timelineState.animationStates),
      };

      // UI data (optional)
      const ui: ProjectUI = includeUI ? {
        zoom: 1, // TODO: Get from actual canvas zoom state
        selectedElements: selectionState.selectedElements.map(el => el.id),
        selectedGroups: selectionState.selectedGroups.map(g => g.id),
        panelState: {
          leftPanelVisible: uiState.panels.leftPanelVisible,
          rightPanelVisible: uiState.panels.rightPanelVisible,
          leftPanelWidth: uiState.panels.leftPanelWidth,
          rightPanelWidth: uiState.panels.rightPanelWidth,
          timelineHeight: uiState.panels.timelineHeight,
          isTimelineCollapsed: uiState.panels.isTimelineCollapsed,
        },
        toolState: {
          activeTool: uiState.tools.activeTool,
          isPathMode: uiState.tools.isPathMode,
          showPaths: uiState.tools.showPaths,
        }
      } : {
        zoom: 1,
        selectedElements: [],
        selectedGroups: [],
        panelState: {
          leftPanelVisible: true,
          rightPanelVisible: true,
          leftPanelWidth: 320,
          rightPanelWidth: 320,
          timelineHeight: 240,
          isTimelineCollapsed: false,
        },
        toolState: {
          activeTool: 'select',
          isPathMode: false,
          showPaths: true,
        }
      };

      const projectData: ProjectData = {
        version: this.currentVersion,
        metadata,
        canvas,
        timeline,
        ui,
      };

      // Serialize to JSON
      const jsonData = prettyPrint 
        ? JSON.stringify(projectData, null, 2)
        : JSON.stringify(projectData);

      console.log(`Project saved: ${metadata.name} (${canvasState.elements.length} elements, ${canvasState.groups.length} groups)`);
      
      return jsonData;

    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load project from JSON string
   */
  async loadProject(jsonData: string, options: ProjectLoadOptions = {}): Promise<void> {
    const {
      skipUI = false,
      skipSelection = false,
      validateOnly = false,
      migrateVersion = true
    } = options;

    try {
      const projectData: ProjectData = JSON.parse(jsonData);
      
      // Validate the data
      const validationErrors = this.validateProjectData(projectData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Handle version migration if needed
      const migratedData = migrateVersion ? this.migrateProjectData(projectData) : projectData;

      if (validateOnly) {
        console.log('Project validation successful');
        return;
      }
      
      // Load data into stores in the correct order
      await this.loadIntoStores(migratedData, { skipUI, skipSelection });
      
      console.log(`Project loaded: ${migratedData.metadata.name} (${migratedData.canvas.elements.length} elements)`);
    } catch (error) {
      console.error('Failed to load project:', error);
      throw new Error(`Load failed: ${error instanceof Error ? error.message : 'Invalid project file'}`);
    }
  }

  /**
   * Load project data into all stores
   */
  private async loadIntoStores(
    projectData: ProjectData, 
    options: { skipUI: boolean; skipSelection: boolean }
  ): Promise<void> {
    const { skipUI, skipSelection } = options;

    // 1. Clear existing state
    console.log('Clearing existing state...');
    useCanvasStore.getState().clearCanvas();
    useSelectionStore.getState().clearSelections();
    
    // 2. Load canvas data first (source of truth) - create fresh copies
    console.log('Loading canvas data...');
    const canvasStore = useCanvasStore.getState();
    const freshElements = projectData.canvas.elements.map(element => ({
      ...element,
      animations: element.animations.map(anim => ({ ...anim }))
    }));
    const freshGroups = projectData.canvas.groups.map(group => ({
      ...group,
      animations: group.animations.map(anim => ({ ...anim }))
    }));
    canvasStore.setElements(freshElements);
    canvasStore.setGroups(freshGroups);
    
    // 3. Load timeline state
    console.log('Loading timeline state...');
    const timelineStore = useTimelineStore.getState();
    
    // Use the store's loadProjectData method to properly handle Immer state updates
    timelineStore.loadProjectData({
      elements: freshElements,
      groups: freshGroups,
      animationStates: projectData.timeline.animationStates,
      scale: projectData.timeline.scale,
      duration: projectData.timeline.duration,
      currentTime: projectData.timeline.currentTime,
    });
    
    // 4. Load UI state (optional)
    if (!skipUI && projectData.ui) {
      console.log('Loading UI state...');
      const uiStore = useUIStore.getState();
      
      // Panel state
      uiStore.setLeftPanelWidth(projectData.ui.panelState.leftPanelWidth);
      uiStore.setRightPanelWidth(projectData.ui.panelState.rightPanelWidth);
      uiStore.setTimelineHeight(projectData.ui.panelState.timelineHeight);
      
      if (projectData.ui.panelState.isTimelineCollapsed !== uiStore.panels.isTimelineCollapsed) {
        uiStore.toggleTimelineCollapse();
      }
      
      // Tool state
      uiStore.setActiveTool(projectData.ui.toolState.activeTool as ToolType);
      if (projectData.ui.toolState.isPathMode !== uiStore.tools.isPathMode) {
        uiStore.togglePathMode();
      }
    }
    
    // 5. Restore selections (after elements are loaded)
    if (!skipSelection && projectData.ui) {
      console.log('Restoring selections...');
      const selectionStore = useSelectionStore.getState();
      
      const elementsToSelect = freshElements.filter(el => 
        projectData.ui.selectedElements.includes(el.id)
      );
      
      if (elementsToSelect.length > 0) {
        selectionStore.select(elementsToSelect);
      }
      
      // Note: Group selection will be handled automatically by the selection store
      // when elements in a group are selected
    }
    
    // 6. Rebuild timeline (with a small delay to ensure everything is ready)
    console.log('Rebuilding timeline...');
    setTimeout(() => {
      timelineStore.updateTracks();
      timelineStore.buildGSAPTimeline();
    }, 100);
  }

  /**
   * Validate project data structure
   */
  private validateProjectData(data: ProjectData): ProjectValidationError[] {
    const errors: ProjectValidationError[] = [];

    // Version validation
    if (!data.version) {
      errors.push({ field: 'version', message: 'Missing version field' });
    }

    // Metadata validation
    if (!data.metadata?.name) {
      errors.push({ field: 'metadata.name', message: 'Missing project name' });
    }

    // Canvas validation
    if (!data.canvas) {
      errors.push({ field: 'canvas', message: 'Missing canvas data' });
      return errors; // Can't continue without canvas data
    }

    if (!Array.isArray(data.canvas.elements)) {
      errors.push({ field: 'canvas.elements', message: 'Canvas elements must be an array' });
    } else {
      // Validate each element
      data.canvas.elements.forEach((element, index) => {
        if (!element.id) {
          errors.push({ field: 'canvas.elements', message: 'Element missing ID', index });
        }
        if (!element.type) {
          errors.push({ field: 'canvas.elements', message: 'Element missing type', index });
        }
        if (typeof element.x !== 'number' || typeof element.y !== 'number') {
          errors.push({ field: 'canvas.elements', message: 'Element missing valid position', index });
        }
      });
    }

    if (!Array.isArray(data.canvas.groups)) {
      errors.push({ field: 'canvas.groups', message: 'Canvas groups must be an array' });
    } else {
      // Validate each group
      data.canvas.groups.forEach((group, index) => {
        if (!group.id) {
          errors.push({ field: 'canvas.groups', message: 'Group missing ID', index });
        }
        if (!Array.isArray(group.elementIds)) {
          errors.push({ field: 'canvas.groups', message: 'Group elementIds must be an array', index });
        }
      });
    }

    // Timeline validation
    if (!data.timeline) {
      errors.push({ field: 'timeline', message: 'Missing timeline data' });
    } else {
      if (typeof data.timeline.scale !== 'number') {
        errors.push({ field: 'timeline.scale', message: 'Timeline scale must be a number' });
      }
      if (typeof data.timeline.duration !== 'number') {
        errors.push({ field: 'timeline.duration', message: 'Timeline duration must be a number' });
      }
    }

    return errors;
  }

  /**
   * Migrate project data from older versions
   */
  private migrateProjectData(data: ProjectData): ProjectData {
    // For now, return as-is. Future versions can add migration logic here
    if (data.version !== this.currentVersion) {
      console.warn(`Project version ${data.version} differs from current ${this.currentVersion}. Some features may not work correctly.`);
    }
    
    return {
      ...data,
      // Update version to current
      version: this.currentVersion,
      metadata: {
        ...data.metadata,
        modifiedAt: new Date().toISOString()
      }
    };
  }

  /**
   * Get current project statistics
   */
  getProjectStats(): {
    elements: number;
    groups: number;
    animations: number;
    characters: number;
  } {
    const canvasState = useCanvasStore.getState();
    
    const animations = canvasState.elements.reduce((sum, el) => sum + el.animations.length, 0) +
                     canvasState.groups.reduce((sum, g) => sum + g.animations.length, 0);
    
    const characters = canvasState.elements.filter(el => el.type === 'character').length;

    return {
      elements: canvasState.elements.length,
      groups: canvasState.groups.length,
      animations,
      characters
    };
  }

  /**
   * Create a backup of current project state
   */
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.saveProject(`Backup_${timestamp}`, { includeUI: false });
  }
} 