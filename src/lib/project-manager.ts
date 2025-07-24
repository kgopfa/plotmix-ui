import {
  ProjectData,
  LegacyProjectData,
  Scene,
  ProjectValidationError,
  ProjectLoadOptions,
  ProjectSaveOptions,
  ProjectMetadata,
  isLegacyProject
} from '@/types/project';
import { ToolType } from '@/types/tool';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useUIStore } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useSceneStore } from '@/stores/use-scene-store';

export class ProjectManager {
  private static instance: ProjectManager;
  private currentVersion = "1.0.0";
  private sceneDataCache: Map<string, Scene> = new Map();

  static getInstance(): ProjectManager {
    if (!ProjectManager.instance) {
      ProjectManager.instance = new ProjectManager();
    }
    return ProjectManager.instance;
  }

  /**
   * Save complete project state to JSON (scene-based format)
   */
  saveProject(name?: string, options: ProjectSaveOptions = {}): string {
    const {
      includeUI = true,
      prettyPrint = true
    } = options;

    try {
      const canvasState = useCanvasStore.getState();
      const sceneState = useSceneStore.getState();

      // Generate project metadata
      const metadata: ProjectMetadata = {
        name: name || `Project_${new Date().toISOString().split('T')[0]}`,
        createdAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
        description: `Canvas animation project with ${canvasState.elements.length} elements`,
      };

      // Get all scenes (this will save current scene to cache)
      const allScenes = this.getAllScenes();
      const currentSceneId = sceneState.activeSceneId || 'scene-1';

      // Filter UI data if needed
      const scenes = includeUI ? allScenes : allScenes.map(scene => ({
        ...scene,
        ui: {
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
        }
      }));

      const projectData: ProjectData = {
        version: this.currentVersion,
        metadata,
        scenes: scenes,
        activeSceneId: currentSceneId,
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
   * Load project from JSON string (handles both legacy and scene-based formats)
   */
  async loadProject(jsonData: string, options: ProjectLoadOptions = {}): Promise<void> {
    const {
      skipUI = false,
      skipSelection = false,
      validateOnly = false,
      migrateVersion = true
    } = options;

    try {
      const rawData = JSON.parse(jsonData);

      // Check if this is a legacy project and migrate if needed
      let projectData: ProjectData;
      if (isLegacyProject(rawData)) {
        console.log('Detected legacy project format, migrating to scene-based format...');
        projectData = this.migrateLegacyProject(rawData);
      } else {
        projectData = rawData as ProjectData;
      }

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

      const activeScene = migratedData.scenes.find(s => s.id === migratedData.activeSceneId) || migratedData.scenes[0];
      console.log(`Project loaded: ${migratedData.metadata.name} (${activeScene.canvas.elements.length} elements)`);
    } catch (error) {
      console.error('Failed to load project:', error);
      throw new Error(`Load failed: ${error instanceof Error ? error.message : 'Invalid project file'}`);
    }
  }

  /**
   * Load project data into all stores (scene-based)
   */
  private async loadIntoStores(
    projectData: ProjectData,
    options: { skipUI: boolean; skipSelection: boolean }
  ): Promise<void> {
    const { skipUI, skipSelection } = options;

    // 1. Sync scene store with project data
    console.log('Syncing scene store...');
    const sceneStore = useSceneStore.getState();

    // Update the scene cache with loaded data
    for (const scene of projectData.scenes) {
      this.sceneDataCache.set(scene.id, scene);
    }

    // Load all scenes into the scene store (this also sets the active scene)
    sceneStore.loadScenes(
      projectData.scenes.map(scene => ({
        id: scene.id,
        name: scene.name,
        lastModified: new Date().toISOString() // Use current timestamp for lastModified
      })),
      projectData.activeSceneId
    );

    // Get the active scene data
    const activeScene = projectData.scenes.find(s => s.id === projectData.activeSceneId) || projectData.scenes[0];
    if (!activeScene) {
      throw new Error('No scenes found in project data');
    }

    // 2. Clear existing state
    console.log('Clearing existing state...');
    useCanvasStore.getState().clearCanvas();
    useSelectionStore.getState().clearSelections();

    // 3. Load canvas data from active scene - create fresh copies
    console.log('Loading canvas data...');
    const canvasStore = useCanvasStore.getState();
    const freshElements = activeScene.canvas.elements.map(element => ({
      ...element,
      animations: element.animations.map(anim => ({ ...anim }))
    }));
    const freshGroups = activeScene.canvas.groups.map(group => ({
      ...group,
      animations: group.animations.map(anim => ({ ...anim }))
    }));
    canvasStore.setElements(freshElements);
    canvasStore.setGroups(freshGroups);

    // 4. Load timeline state from active scene
    console.log('Loading timeline state...');
    const timelineStore = useTimelineStore.getState();

    // Use the store's loadProjectData method to properly handle Immer state updates
    timelineStore.loadProjectData({
      elements: freshElements,
      groups: freshGroups,
      animationStates: activeScene.timeline.animationStates,
      scale: activeScene.timeline.scale,
      duration: activeScene.timeline.duration,
      currentTime: activeScene.timeline.currentTime,
    });

    // 5. Load UI state from active scene (optional)
    if (!skipUI && activeScene.ui) {
      console.log('Loading UI state...');
      const uiStore = useUIStore.getState();

      // Panel state
      uiStore.setLeftPanelWidth(activeScene.ui.panelState.leftPanelWidth);
      uiStore.setRightPanelWidth(activeScene.ui.panelState.rightPanelWidth);
      uiStore.setTimelineHeight(activeScene.ui.panelState.timelineHeight);

      if (activeScene.ui.panelState.isTimelineCollapsed !== uiStore.panels.isTimelineCollapsed) {
        uiStore.toggleTimelineCollapse();
      }

      // Tool state
      uiStore.setActiveTool(activeScene.ui.toolState.activeTool as ToolType);
      if (activeScene.ui.toolState.isPathMode !== uiStore.tools.isPathMode) {
        uiStore.togglePathMode();
      }

      // Canvas size state (restore from canvas.canvasSize if available)
      if (activeScene.canvas.canvasSize) {
        if (activeScene.canvas.canvasSize.currentSizeId === 'custom' && activeScene.canvas.canvasSize.customSize) {
          uiStore.setCustomCanvasSize(
            activeScene.canvas.canvasSize.customSize.width,
            activeScene.canvas.canvasSize.customSize.height
          );
        } else {
          uiStore.setCanvasSize(activeScene.canvas.canvasSize.currentSizeId);
        }
      }
    }

    // 6. Restore selections from active scene (after elements are loaded)
    if (!skipSelection && activeScene.ui) {
      console.log('Restoring selections...');
      const selectionStore = useSelectionStore.getState();

      const elementsToSelect = freshElements.filter(el =>
        activeScene.ui.selectedElements.includes(el.id)
      );

      if (elementsToSelect.length > 0) {
        selectionStore.select(elementsToSelect);
      }

      // Note: Group selection will be handled automatically by the selection store
      // when elements in a group are selected
    }

    // 7. Rebuild timeline (with a small delay to ensure everything is ready)
    console.log('Rebuilding timeline...');
    setTimeout(() => {
      timelineStore.updateTracks();
      timelineStore.buildGSAPTimeline();
    }, 100);
  }

  /**
   * Validate project data structure (scene-based)
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

    // Scenes validation
    if (!Array.isArray(data.scenes)) {
      errors.push({ field: 'scenes', message: 'Scenes must be an array' });
      return errors; // Can't continue without scenes
    }

    if (data.scenes.length === 0) {
      errors.push({ field: 'scenes', message: 'Project must have at least one scene' });
      return errors;
    }

    // Active scene validation
    if (!data.activeSceneId) {
      errors.push({ field: 'activeSceneId', message: 'Missing active scene ID' });
    } else {
      const activeSceneExists = data.scenes.some(s => s.id === data.activeSceneId);
      if (!activeSceneExists) {
        errors.push({ field: 'activeSceneId', message: 'Active scene ID does not match any scene' });
      }
    }

    // Validate each scene
    data.scenes.forEach((scene, sceneIndex) => {
      if (!scene.id) {
        errors.push({ field: 'scenes', message: 'Scene missing ID', index: sceneIndex });
      }
      if (!scene.name) {
        errors.push({ field: 'scenes', message: 'Scene missing name', index: sceneIndex });
      }

      // Canvas validation
      if (!scene.canvas) {
        errors.push({ field: 'scenes', message: 'Scene missing canvas data', index: sceneIndex });
      } else {
        if (!Array.isArray(scene.canvas.elements)) {
          errors.push({ field: 'scenes', message: 'Scene canvas elements must be an array', index: sceneIndex });
        } else {
          // Validate each element in the scene
          scene.canvas.elements.forEach((element, elementIndex) => {
            if (!element.id) {
              errors.push({ field: 'scenes', message: `Scene ${sceneIndex} element missing ID`, index: elementIndex });
            }
            if (!element.type) {
              errors.push({ field: 'scenes', message: `Scene ${sceneIndex} element missing type`, index: elementIndex });
            }
            if (typeof element.x !== 'number' || typeof element.y !== 'number') {
              errors.push({ field: 'scenes', message: `Scene ${sceneIndex} element missing valid position`, index: elementIndex });
            }
          });
        }

        if (!Array.isArray(scene.canvas.groups)) {
          errors.push({ field: 'scenes', message: 'Scene canvas groups must be an array', index: sceneIndex });
        } else {
          // Validate each group in the scene
          scene.canvas.groups.forEach((group, groupIndex) => {
            if (!group.id) {
              errors.push({ field: 'scenes', message: `Scene ${sceneIndex} group missing ID`, index: groupIndex });
            }
            if (!Array.isArray(group.elementIds)) {
              errors.push({ field: 'scenes', message: `Scene ${sceneIndex} group elementIds must be an array`, index: groupIndex });
            }
          });
        }
      }

      // Timeline validation
      if (!scene.timeline) {
        errors.push({ field: 'scenes', message: 'Scene missing timeline data', index: sceneIndex });
      } else {
        if (typeof scene.timeline.scale !== 'number') {
          errors.push({ field: 'scenes', message: `Scene ${sceneIndex} timeline scale must be a number`, index: sceneIndex });
        }
        if (typeof scene.timeline.duration !== 'number') {
          errors.push({ field: 'scenes', message: `Scene ${sceneIndex} timeline duration must be a number`, index: sceneIndex });
        }
      }
    });

    return errors;
  }

  /**
   * Migrate legacy project (v1.x) to scene-based format (v2.x)
   */
  private migrateLegacyProject(legacyData: LegacyProjectData): ProjectData {
    console.log('Migrating legacy project to scene-based format...');

    // Create a single scene from the legacy project data
    const defaultSceneId = 'scene-1';
    const scene: Scene = {
      id: defaultSceneId,
      name: 'Scene 1',
      canvas: legacyData.canvas,
      timeline: legacyData.timeline,
      ui: legacyData.ui,
    };

    return {
      version: this.currentVersion,
      metadata: {
        ...legacyData.metadata,
        modifiedAt: new Date().toISOString()
      },
      scenes: [scene],
      activeSceneId: defaultSceneId,
    };
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
   * Get current project statistics (from active scene)
   */
  getProjectStats(): {
    elements: number;
    groups: number;
    animations: number;
    scenes: number;
  } {
    const canvasState = useCanvasStore.getState();

    const animations = canvasState.elements.reduce((sum, el) => sum + el.animations.length, 0) +
      canvasState.groups.reduce((sum, g) => sum + g.animations.length, 0);

    return {
      elements: canvasState.elements.length,
      groups: canvasState.groups.length,
      animations,
      scenes: useSceneStore.getState().getScenes().length,
    };
  }

  /**
   * Create a backup of current project state
   */
  createBackup(): string {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return this.saveProject(`Backup_${timestamp}`, { includeUI: false });
  }

  /**
   * Create a new scene with optional name
   */
  createScene(name?: string): string {
    const sceneStore = useSceneStore.getState();
    const canvasStore = useCanvasStore.getState();
    const timelineStore = useTimelineStore.getState();
    const selectionStore = useSelectionStore.getState();

    // Save current scene to cache before creating new one
    this.saveCurrentSceneToCache();

    // Create new scene in the scene store
    const newSceneId = sceneStore.createScene(name);

    // Clear current canvas and timeline state for the new scene
    canvasStore.clearCanvas();
    selectionStore.clearSelections();
    timelineStore.resetTimeline();

    // Initialize cache for the new empty scene
    const sceneInfo = sceneStore.getSceneById(newSceneId);
    const emptyScene: Scene = {
      id: newSceneId,
      name: sceneInfo?.name || name || `Scene ${sceneStore.getScenes().length}`,
      canvas: {
        elements: [],
        groups: [],
        dimensions: { width: 1920, height: 1080 },
        canvasSize: {
          currentSizeId: 'fhd',
          customSize: null
        }
      },
      timeline: {
        scale: 1,
        duration: 10,
        currentTime: 0,
        animationStates: {},
      },
      ui: {
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
      }
    };

    this.sceneDataCache.set(newSceneId, emptyScene);

    console.log(`Created new scene: ${newSceneId}`);
    return newSceneId;
  }

  /**
   * Delete a scene by ID
   */
  deleteScene(sceneId: string): boolean {
    const sceneStore = useSceneStore.getState();
    return sceneStore.deleteScene(sceneId);
  }

  /**
   * Duplicate a scene with optional new name
   */
  duplicateScene(sceneId: string, newName?: string): string | null {
    const sceneStore = useSceneStore.getState();

    try {
      // Save current project data to get the scene's content
      const projectData = this.saveProject();
      const parsedData = JSON.parse(projectData);

      // Find the scene to duplicate
      const sceneToClone = parsedData.scenes.find((s: Scene) => s.id === sceneId);
      if (!sceneToClone) {
        console.error(`Scene ${sceneId} not found for duplication`);
        return null;
      }

      // Create new scene in scene store
      const newSceneId = sceneStore.duplicateScene(sceneId, newName);
      if (!newSceneId) {
        return null;
      }

      // Create a copy of the scene with new ID
      const clonedScene: Scene = {
        ...sceneToClone,
        id: newSceneId,
        name: newName || `${sceneToClone.name} Copy`
      };

      // Update the project data with the new scene
      parsedData.scenes.push(clonedScene);
      parsedData.activeSceneId = newSceneId;

      // Load the updated project data (this will switch to the new scene)
      this.loadProject(JSON.stringify(parsedData), { skipUI: false, skipSelection: false });

      console.log(`Duplicated scene ${sceneId} to ${newSceneId}`);
      return newSceneId;
    } catch (error) {
      console.error('Failed to duplicate scene:', error);
      return null;
    }
  }

  /**
   * Switch to a different scene
   */
  async switchScene(sceneId: string): Promise<void> {
    const sceneStore = useSceneStore.getState();
    const currentSceneId = sceneStore.getActiveSceneId();

    if (currentSceneId === sceneId) {
      console.log(`Already on scene ${sceneId}`);
      return;
    }

    try {
      // Save current scene state to cache
      this.saveCurrentSceneToCache();

      // Find the target scene in cache
      const targetScene = this.sceneDataCache.get(sceneId);
      if (!targetScene) {
        console.error(`Scene ${sceneId} not found in cache`);
        return;
      }

      // Create project data with target scene as active
      const projectData: ProjectData = {
        version: this.currentVersion,
        metadata: {
          name: `Project with ${sceneStore.getScenes().length} scenes`,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          description: `Multi-scene project`,
        },
        scenes: this.getAllScenes(),
        activeSceneId: sceneId,
      };

      // Load the project data (this will switch to the target scene)
      await this.loadProject(JSON.stringify(projectData), { skipUI: false, skipSelection: false });

      console.log(`Switched to scene: ${sceneId}`);
    } catch (error) {
      console.error('Failed to switch scene:', error);
      throw new Error(`Failed to switch to scene ${sceneId}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Rename a scene
   */
  renameScene(sceneId: string, newName: string): boolean {
    const sceneStore = useSceneStore.getState();
    return sceneStore.renameScene(sceneId, newName);
  }

  /**
   * Get all scenes
   */
  getScenes() {
    const sceneStore = useSceneStore.getState();
    return sceneStore.getScenes();
  }

  /**
   * Get a specific scene by ID
   */
  getSceneById(sceneId: string) {
    const sceneStore = useSceneStore.getState();
    return sceneStore.getSceneById(sceneId);
  }

  /**
   * Save current scene state to cache
   */
  private saveCurrentSceneToCache(): void {
    const canvasState = useCanvasStore.getState();
    const timelineState = useTimelineStore.getState();
    const uiState = useUIStore.getState();
    const selectionState = useSelectionStore.getState();
    const sceneState = useSceneStore.getState();

    const currentSceneId = sceneState.activeSceneId;
    if (!currentSceneId) return;

    // Get scene name from scene store
    const sceneInfo = sceneState.getSceneById(currentSceneId);
    const sceneName = sceneInfo?.name || 'Scene 1';

    const scene: Scene = {
      id: currentSceneId,
      name: sceneName,
      canvas: {
        elements: canvasState.elements,
        groups: canvasState.groups,
        dimensions: {
          width: uiState.canvas.currentSizeId === 'custom'
            ? uiState.canvas.customSize?.width || 1920
            : uiState.canvas.availableSizes.find(s => s.id === uiState.canvas.currentSizeId)?.width || 1920,
          height: uiState.canvas.currentSizeId === 'custom'
            ? uiState.canvas.customSize?.height || 1080
            : uiState.canvas.availableSizes.find(s => s.id === uiState.canvas.currentSizeId)?.height || 1080
        },
        canvasSize: {
          currentSizeId: uiState.canvas.currentSizeId,
          customSize: uiState.canvas.customSize
        }
      },
      timeline: {
        scale: timelineState.ui.scale,
        duration: timelineState.playback.totalDuration,
        currentTime: timelineState.playback.currentTime,
        // Convert Map to Record for JSON serialization
        animationStates: Object.fromEntries(timelineState.animationStates),
      },
      ui: {
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
      }
    };

    this.sceneDataCache.set(currentSceneId, scene);
    console.log(`Saved scene ${currentSceneId} to cache`);
  }

  /**
   * Get all scenes from cache and current state
   */
  private getAllScenes(): Scene[] {
    // Save current scene to cache first
    this.saveCurrentSceneToCache();

    const sceneState = useSceneStore.getState();
    const allSceneInfos = sceneState.getScenes();

    const scenes: Scene[] = [];

    for (const sceneInfo of allSceneInfos) {
      const cachedScene = this.sceneDataCache.get(sceneInfo.id);
      if (cachedScene) {
        // Update name from scene store (in case it was renamed)
        scenes.push({
          ...cachedScene,
          name: sceneInfo.name
        });
      } else {
        // Create empty scene for scenes that don't have cached data yet
        const emptyScene: Scene = {
          id: sceneInfo.id,
          name: sceneInfo.name,
          canvas: {
            elements: [],
            groups: [],
            dimensions: { width: 1920, height: 1080 },
            canvasSize: {
              currentSizeId: 'fhd',
              customSize: null
            }
          },
          timeline: {
            scale: 1,
            duration: 10,
            currentTime: 0,
            animationStates: {},
          },
          ui: {
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
          }
        };
        scenes.push(emptyScene);
        this.sceneDataCache.set(sceneInfo.id, emptyScene);
      }
    }

    return scenes;
  }
} 