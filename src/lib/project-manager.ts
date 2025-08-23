import {
  ProjectData,
  Scene,
  ProjectValidationError,
  ProjectLoadOptions,
  ProjectSaveOptions,
  ProjectMetadata,
  MAX_SCENE_DURATION
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
          isTimelineCollapsed: true,
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



      return jsonData;

    } catch (error) {
      console.error('Failed to save project:', error);
      throw new Error(`Save failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Load project from JSON string (scene-based format only)
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

      // Validate that the project uses the current schema format
      if (!rawData.scenes || !Array.isArray(rawData.scenes) || rawData.scenes.length === 0) {
        throw new Error('Invalid project format: missing scenes array');
      }

      const projectData = rawData as ProjectData;

      // Validate the data
      const validationErrors = this.validateProjectData(projectData);
      if (validationErrors.length > 0) {
        throw new Error(`Validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
      }

      // Handle version migration if needed
      const migratedData = migrateVersion ? this.migrateProjectData(projectData) : projectData;

      if (validateOnly) {
        return;
      }

      // Load data into stores in the correct order
      await this.loadIntoStores(migratedData, { skipUI, skipSelection });

      const activeScene = migratedData.scenes.find(s => s.id === migratedData.activeSceneId) || migratedData.scenes[0];

    } catch (error) {
      console.error('Failed to load project:', error);
      throw new Error(`Load failed: ${error instanceof Error ? error.message : 'Invalid project file'}`);
    }
  }

  /**
   * Load project data into the application (scene-based format)
   */
  loadProjectData(data: ProjectData, options: ProjectLoadOptions = {}): void {
    const {
      skipUI = false,
      skipSelection = false,
      skipTimeline = false
    } = options;

    try {
      // Validate project data
      const validationErrors = this.validateProjectData(data);
      if (validationErrors.length > 0) {
        const errorMessage = validationErrors.map(e => `${e.field}: ${e.message}`).join(', ');
        throw new Error(`Project validation failed: ${errorMessage}`);
      }

      // Get the active scene
      const activeScene = data.scenes.find(s => s.id === data.activeSceneId);
      if (!activeScene) {
        throw new Error(`Active scene ${data.activeSceneId} not found in project data`);
      }

      // 1. Update scene store with all scene information
      const sceneStore = useSceneStore.getState();
      const sceneInfos = data.scenes.map(scene => ({
        id: scene.id,
        name: scene.name,
        lastModified: scene.lastModified || new Date().toISOString()
      }));
      sceneStore.loadScenes(sceneInfos, data.activeSceneId);

      // 2. Cache all scene data for future scene switching
      data.scenes.forEach(scene => {
        this.sceneDataCache.set(scene.id, scene);
      });

      // 3. Load active scene data into canvas store
      const canvasStore = useCanvasStore.getState();
      canvasStore.loadSceneData(activeScene.id, activeScene.sceneCanvas.elements, activeScene.sceneCanvas.groups);

      // 4. Load active scene timeline data
      if (!skipTimeline) {
        const timelineStore = useTimelineStore.getState();
        timelineStore.loadSceneTimeline(activeScene.id, {
          elements: activeScene.sceneCanvas.elements,
          groups: activeScene.sceneCanvas.groups,
          animationStates: activeScene.timeline.animationStates,
          scale: activeScene.timeline.scale,
          duration: activeScene.timeline.duration,
          currentTime: activeScene.timeline.currentTime,
        });
      }

      // 5. Load UI state from active scene (optional)
      if (!skipUI && activeScene.ui) {
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

        // Canvas size state (restore from sceneCanvas.canvasSize if available)
        if (activeScene.sceneCanvas.canvasSize) {
          if (activeScene.sceneCanvas.canvasSize.currentSizeId === 'custom' && activeScene.sceneCanvas.canvasSize.customSize) {
            uiStore.setCustomCanvasSize(
              activeScene.sceneCanvas.canvasSize.customSize.width,
              activeScene.sceneCanvas.canvasSize.customSize.height
            );
          } else {
            uiStore.setCanvasSize(activeScene.sceneCanvas.canvasSize.currentSizeId);
          }
        }
      }

      // 6. Restore selections from active scene (after elements are loaded)
      if (!skipSelection && activeScene.ui) {
        const selectionStore = useSelectionStore.getState();

        const elementsToSelect = activeScene.sceneCanvas.elements.filter(el =>
          activeScene.ui.selectedElements.includes(el.id)
        );

        if (elementsToSelect.length > 0) {
          selectionStore.select(elementsToSelect);
        }

        // Note: Group selection will be handled automatically by the selection store
        // when elements in a group are selected
      }

      // 7. Rebuild timeline (with a small delay to ensure everything is ready)
      if (!skipTimeline) {
        setTimeout(() => {
          const timelineStore = useTimelineStore.getState();
          timelineStore.updateTracks();
          timelineStore.buildGSAPTimeline();
        }, 100);
      }

      console.log(`Project loaded successfully with ${data.scenes.length} scenes, active scene: ${activeScene.name}`);

    } catch (error) {
      console.error('Failed to load project data:', error);
      throw new Error(`Load failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Switch to a different scene within the current project
   */
  switchToScene(sceneId: string): void {
    try {
      const sceneStore = useSceneStore.getState();
      const canvasStore = useCanvasStore.getState();
      const timelineStore = useTimelineStore.getState();

      // Get the scene data from cache
      const sceneData = this.sceneDataCache.get(sceneId);
      if (!sceneData) {
        throw new Error(`Scene ${sceneId} data not found in cache`);
      }

      // Save current scene data before switching
      const currentSceneId = sceneStore.activeSceneId;
      if (currentSceneId) {
        const currentCanvasData = canvasStore.saveCurrentSceneData();
        const currentTimelineData = timelineStore.saveCurrentSceneTimeline();
        
        // Cache the current scene data
        this.sceneDataCache.set(currentSceneId, {
          ...sceneData,
          canvas: {
            elements: currentCanvasData.elements,
            groups: currentCanvasData.groups,
            dimensions: { width: 1920, height: 1080 },
            canvasSize: { currentSizeId: 'fhd', customSize: null }
          },
          timeline: currentTimelineData,
          lastModified: new Date().toISOString()
        });
      }

      // Switch to the new scene
      sceneStore.setActiveScene(sceneId);
      canvasStore.setCurrentScene(sceneId);
      timelineStore.setCurrentScene(sceneId);

      // Load the new scene data
      canvasStore.loadSceneData(sceneId, sceneData.sceneCanvas.elements, sceneData.sceneCanvas.groups);
      timelineStore.loadSceneTimeline(sceneId, {
        elements: sceneData.sceneCanvas.elements,
        groups: sceneData.sceneCanvas.groups,
        animationStates: sceneData.timeline.animationStates,
        scale: sceneData.timeline.scale,
        duration: sceneData.timeline.duration,
        currentTime: sceneData.timeline.currentTime,
      });

      // Update scene modified timestamp
      sceneStore.updateSceneModified(sceneId);

      console.log(`Switched to scene: ${sceneData.name}`);

    } catch (error) {
      console.error('Failed to switch scene:', error);
      throw new Error(`Scene switch failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
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
      if (!scene.sceneCanvas) {
        errors.push({ field: 'scenes', message: 'Scene missing sceneCanvas data', index: sceneIndex });
      } else {
        if (!Array.isArray(scene.sceneCanvas.elements)) {
          errors.push({ field: 'scenes', message: 'Scene sceneCanvas elements must be an array', index: sceneIndex });
        } else {
          // Validate each element in the scene
          scene.sceneCanvas.elements.forEach((element, elementIndex) => {
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

        if (!Array.isArray(scene.sceneCanvas.groups)) {
          errors.push({ field: 'scenes', message: 'Scene sceneCanvas groups must be an array', index: sceneIndex });
        } else {
          // Validate each group in the scene
          scene.sceneCanvas.groups.forEach((group, groupIndex) => {
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
   * Migrate project data from older versions
   */
  private migrateProjectData(data: ProjectData): ProjectData {
    // For now, return as-is. Future versions can add migration logic here
    if (data.version !== this.currentVersion) {
      // Version mismatch warning removed for performance
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
        duration: MAX_SCENE_DURATION, // Maximum scene duration: 2 minutes (120 seconds)
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
        isTimelineCollapsed: true,
        },
        toolState: {
          activeTool: 'select',
          isPathMode: false,
          showPaths: true,
        }
      }
    };

    this.sceneDataCache.set(newSceneId, emptyScene);


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


      return newSceneId;
    } catch (error) {
      console.error('Failed to duplicate scene:', error);
      return null;
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
            duration: MAX_SCENE_DURATION, // Maximum scene duration: 2 minutes (120 seconds)
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
              isTimelineCollapsed: true,
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