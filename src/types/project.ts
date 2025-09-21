import { AnimatedCanvasObject, CanvasGroup } from './canvas';

// Maximum scene duration in seconds (2 minutes)
export const MAX_SCENE_DURATION = 120;

export interface AnimationState {
  // Source of truth
  baseDuration: number;
  repeat?: number;
  repeatDelay?: number;
  yoyo?: boolean;
  
  // Computed/cached values
  effectiveDuration: number;
  effectiveEndTime: number;
}

export interface ProjectMetadata {
  name: string;
  createdAt: string;
  modifiedAt: string;
  description?: string;
  author?: string;
  tags?: string[];
}

export interface ProjectDimensions {
  width: number;
  height: number;
}

export interface SceneCanvas {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  timeline: ProjectTimeline;
}

export interface ProjectScene {
  sceneId: string;
  sceneName: string;
  sceneCanvas: SceneCanvas;
}

export interface ProjectCanvas {
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

export interface ProjectTimeline {
  scale: number;
  duration: number;
  currentTime: number;
  animationStates: Record<string, AnimationState>; // Serialized from Map
}

export interface ProjectUI {
  zoom: number;
  selectedElements: string[];       // Element IDs
  selectedGroups: string[];        // Group IDs
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

// Multi-scene project structure (NEW)
export interface MultiSceneProjectData {
  version: string;
  name?: string;
  title?: string;
  dimensions: ProjectDimensions;
  scenes: ProjectScene[];
  ui?: ProjectUI;
}

// Single-scene project structure (LEGACY - will cause errors)
export interface ProjectData {
  version: string;
  name?: string;
  title?: string;
  elements: import('@/types/canvas').AnimatedCanvasObject[];
  groups: import('@/types/canvas').CanvasGroup[];
  timeline: ProjectTimeline;
  ui?: ProjectUI;
}

export interface ProjectValidationError {
  field: string;
  message: string;
  index?: number;
}

export interface ProjectLoadOptions {
  skipUI?: boolean;           // Skip loading UI state
  skipSelection?: boolean;    // Skip restoring selections
  validateOnly?: boolean;     // Only validate, don't load
  migrateVersion?: boolean;   // Attempt to migrate older versions
}

export interface ProjectSaveOptions {
  includeUI?: boolean;        // Include UI state (default: true)
  compress?: boolean;         // Compress the JSON (default: false)
  prettyPrint?: boolean;      // Pretty print JSON (default: true)
} 