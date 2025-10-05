import { create } from 'zustand';
import { produce } from 'immer';
import { useShallow } from 'zustand/react/shallow';
import { ToolType } from '@/types/tool';
import { GridConfig } from '@/utils/grid-utils';
import { ElementSnappingConfig } from '@/hooks/use-element-snapping';

// UI State Interfaces
interface PanelState {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  leftPanelWidth: number;
  rightPanelWidth: number;
  timelineHeight: number;
  isTimelineCollapsed: boolean;
  isResizing: 'left' | 'right' | 'timeline' | null;
}

interface ToolState {
  activeTool: ToolType;
  isPathMode: boolean;
  isLineChaining: boolean;
  lineStartPoint: { x: number; y: number } | null;
  chainedLineIds: string[];
  isClosingShape: boolean;
  maskPos: { x: number; y: number } | null;
  animationTarget: {
    animationId: string;
    elementId: string;
  } | null;
  showPaths: boolean;
  pendingImageData: string | null;
  lineType: 'straight' | 'curved' | 'animated';
  selectedFont: string; // Currently selected font for text creation
  selectedFontWeight: string; // Currently selected font weight for text creation
}

interface SnappingState {
  gridConfig: GridConfig;
  elementSnapConfig: ElementSnappingConfig;
  isGridSnapTemporarilyDisabled: boolean;
  isElementSnapTemporarilyDisabled: boolean;
}

interface CanvasSize {
  id: string;
  name: string;
  width: number;
  height: number;
  aspectRatio: string;
}

interface CanvasState {
  currentSizeId: string;
  availableSizes: CanvasSize[];
  customSize: { width: number; height: number } | null;
}

interface UserPreferences {
  theme: 'light' | 'dark';
  autoSave: boolean;
  autoSaveInterval: number;
  defaultGridSize: number;
  defaultSnapThreshold: number;
  showWelcome: boolean;
  recentFiles: string[];
  keyboardShortcuts: Record<string, string>;
}

// Uploaded file interface
interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  dataUrl?: string; // For images and other files that can be displayed
  elementId?: string; // Reference to canvas element if added to canvas
}

interface UploadedFilesState {
  files: UploadedFile[];
  totalSize: number;
  maxStorage: number; // 1GB in bytes
}

interface AIPromptEntry {
  id: string;
  text: string;
  timestamp: string;
  summary?: string;
}

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

// Navigation keys corresponding to sidebar icons
export type NavKey = 'video' | 'scenes' | 'uploads' | 'ai' | 'text' | 'animations' | 'tools' | 'components' | 'audio' | 'timeline' | 'reset';

// Right sidebar keys
export type RightPanelKey = 'properties' | 'animations' | 'layers' | 'scenes' | 'lock';

interface NavigationState {
  activeNav: NavKey | null; // sticks after click
  hoverNav: NavKey | null;  // transient while hovering
  interactedNav: NavKey | null; // remains visible after interaction, even without hover
}

// Combined UI State
interface UIState {
  panels: PanelState;
  tools: ToolState;
  snapping: SnappingState;
  canvas: CanvasState;
  canvasZoom: number;
  canvasPan: { x: number; y: number };
  preferences: UserPreferences;
  keyboardShortcuts: KeyboardShortcut[];
  navigation: NavigationState;
  activeRightPanel: RightPanelKey | null;
  hoverRightPanel: RightPanelKey | null;
  showAnimationsTab: boolean;
  uploadedFiles: UploadedFilesState;
  aiPromptHistory: AIPromptEntry[];
}

// Actions
interface UIActions {
  // Panel Actions
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelWidth: (width: number) => void;
  setRightPanelWidth: (width: number) => void;
  setTimelineHeight: (height: number) => void;
  toggleTimelineCollapse: () => void;
  setResizing: (panel: 'left' | 'right' | 'timeline' | null) => void;
  
  // Tool Actions
  setActiveTool: (tool: ToolType) => void;
  togglePathMode: () => void;
  setLineChaining: (isChaining: boolean) => void;
  setLineStartPoint: (point: { x: number; y: number } | null) => void;
  addChainedLineId: (id: string) => void;
  clearChainedLineIds: () => void;
  setClosingShape: (isClosing: boolean) => void;
  setMaskPos: (pos: { x: number; y: number } | null) => void;
  setAnimationTarget: (target: { animationId: string; elementId: string } | null) => void;
  toggleShowPaths: () => void;
  setPendingImageData: (data: string | null) => void;
  setLineType: (lineType: 'straight' | 'curved' | 'animated') => void;
  setSelectedFont: (fontFamily: string) => void;
  setSelectedFontWeight: (fontWeight: string) => void;
  
  // Snapping Actions
  updateGridConfig: (config: Partial<GridConfig>) => void;
  updateElementSnapConfig: (config: Partial<ElementSnappingConfig>) => void;
  setGridSnapTemporarilyDisabled: (disabled: boolean) => void;
  setElementSnapTemporarilyDisabled: (disabled: boolean) => void;
  
  // Preferences Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => void;
  addRecentFile: (filePath: string) => void;
  removeRecentFile: (filePath: string) => void;
  updateKeyboardShortcut: (action: string, key: string) => void;
  resetPreferences: () => void;
  
  // Keyboard Shortcuts
  registerShortcut: (shortcut: KeyboardShortcut) => void;
  unregisterShortcut: (action: string) => void;
  executeShortcut: (event: KeyboardEvent) => boolean;
  getShortcutByAction: (action: string) => KeyboardShortcut | undefined;
  
  // Navigation
  setActiveNav: (nav: NavKey | null) => void;
  setHoverNav: (nav: NavKey | null) => void;
  setInteractedNav: (nav: NavKey | null) => void;
  setActiveRightPanel: (panel: RightPanelKey | null) => void;
  setHoverRightPanel: (panel: RightPanelKey | null) => void;
  
  // Animations tab (independent of navigation)
  setShowAnimationsTab: (show: boolean) => void;
  
  // Canvas Actions
  setCanvasSize: (sizeId: string) => void;
  setCustomCanvasSize: (width: number, height: number) => void;
  addCanvasSize: (size: CanvasSize) => void;
  removeCanvasSize: (sizeId: string) => void;
  // Multi-scene support
  setCanvasDimensions: (dimensions: { width: number; height: number }) => void;
  getCanvasDimensions: () => { width: number; height: number };
  setCanvasZoom: (zoom: number) => void;
  setCanvasPan: (pan: { x: number; y: number }) => void;
  
  // Uploaded Files Actions
  addUploadedFile: (file: UploadedFile) => void;
  removeUploadedFile: (fileId: string) => void;
  updateUploadedFile: (fileId: string, updates: Partial<UploadedFile>) => void;
  clearUploadedFiles: () => void;
  linkFileToElement: (fileId: string, elementId: string) => void;

  // AI Tools prompt history
  addAIPrompt: (promptText: string) => void;
  clearAIPrompts: () => void;
  setAIPrompts: (items: { id: string; text: string; timestamp: string }[]) => void;
}

type UIStore = UIState & UIActions;

// Default values
const defaultPanelState: PanelState = {
  leftPanelVisible: true,
  rightPanelVisible: true,
  leftPanelWidth: 384,
  rightPanelWidth: 384,
  timelineHeight: 240,
  isTimelineCollapsed: true,
  isResizing: null,
};

const defaultToolState: ToolState = {
  activeTool: 'select',
  isPathMode: false,
  isLineChaining: false,
  lineStartPoint: null,
  chainedLineIds: [],
  isClosingShape: false,
  maskPos: null,
  animationTarget: null,
  showPaths: true,
  pendingImageData: null,
  lineType: 'curved',
  selectedFont: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif', // Default font for text creation - Tailwind font-sans stack
  selectedFontWeight: '400', // Default font weight for text creation
};

const defaultSnappingState: SnappingState = {
  gridConfig: {
    size: 10,
    enabled: true, // Enable grid snapping by default
    visible: true, // Show grid by default
    snapThreshold: 8,
  },
  elementSnapConfig: {
    enabled: true, // Enable element snapping by default
    snapThreshold: 10,
    showGuides: true,
    enableSpacing: true,
    enableDistribution: true,
  },
  isGridSnapTemporarilyDisabled: false,
  isElementSnapTemporarilyDisabled: false,
};

const defaultCanvasState: CanvasState = {
  currentSizeId: 'fhd',
  availableSizes: [
    { id: 'fhd', name: 'Full HD (1080p)', width: 1920, height: 1080, aspectRatio: '16:9' },
    { id: '2k', name: '2K (1440p)', width: 2560, height: 1440, aspectRatio: '16:9' },
    { id: '4k', name: '4K UHD', width: 3840, height: 2160, aspectRatio: '16:9' },
  ],
  customSize: null,
};

const defaultUserPreferences: UserPreferences = {
  theme: 'light',
  autoSave: true,
  autoSaveInterval: 30,
  defaultGridSize: 10,
  defaultSnapThreshold: 10,
  showWelcome: true,
  recentFiles: [],
  keyboardShortcuts: {
    'select': 'v',
    'rectangle': 'r',
    'circle': 'c',
    'triangle': 't',
    'arc': 'shift+a',
    'line': 'l',
    'text': 'a',
    'delete': 'Delete',
    'selectAll': 'ctrl+a',
    'undo': 'ctrl+z',
    'redo': 'ctrl+y',
    'copy': 'ctrl+c',
    'paste': 'ctrl+v',
    'escape': 'Escape',
  },
};

const defaultUploadedFilesState: UploadedFilesState = {
  files: [],
  totalSize: 0,
  maxStorage: 1024 * 1024 * 1024, // 1GB in bytes
};

const defaultKeyboardShortcuts: KeyboardShortcut[] = [
  { key: 'v', action: 'select', description: 'Select Tool' },
  { key: 'r', action: 'rectangle', description: 'Rectangle Tool' },
  { key: 'c', action: 'circle', description: 'Circle Tool' },
  { key: 't', action: 'triangle', description: 'Triangle Tool' },
  { key: 'a', shiftKey: true, action: 'arc', description: 'Arc Tool' },
  { key: 'l', action: 'line', description: 'Line Tool' },
  { key: 'a', action: 'text', description: 'Text Tool' },
  { key: 'Delete', action: 'delete', description: 'Delete Selected' },
  { key: 'Backspace', action: 'delete', description: 'Delete Selected' },
  { key: 'a', ctrlKey: true, action: 'selectAll', description: 'Select All' },
  { key: 'a', metaKey: true, action: 'selectAll', description: 'Select All (Mac)' },
  { key: 'z', ctrlKey: true, action: 'undo', description: 'Undo' },
  { key: 'z', metaKey: true, action: 'undo', description: 'Undo (Mac)' },
  { key: 'y', ctrlKey: true, action: 'redo', description: 'Redo' },
  { key: 'z', ctrlKey: true, shiftKey: true, action: 'redo', description: 'Redo (Shift+Ctrl+Z)' },
  { key: 'z', metaKey: true, shiftKey: true, action: 'redo', description: 'Redo (Mac)' },
  { key: 'c', ctrlKey: true, action: 'copy', description: 'Copy' },
  { key: 'c', metaKey: true, action: 'copy', description: 'Copy (Mac)' },
  { key: 'v', ctrlKey: true, action: 'paste', description: 'Paste' },
  { key: 'v', metaKey: true, action: 'paste', description: 'Paste (Mac)' },
  { key: 'g', ctrlKey: true, action: 'group', description: 'Group Selected' },
  { key: 'g', metaKey: true, action: 'group', description: 'Group Selected (Mac)' },
  { key: 'g', ctrlKey: true, shiftKey: true, action: 'ungroup', description: 'Ungroup Selected' },
  { key: 'g', metaKey: true, shiftKey: true, action: 'ungroup', description: 'Ungroup Selected (Mac)' },
  { key: 'Escape', action: 'escape', description: 'Escape/Cancel' },
];

export const useUIStore = create<UIStore>((set, get) => {
  // Load persisted state from localStorage
  const loadPersistedState = () => {
    if (typeof window === 'undefined') return {};
    
    try {
      const persisted = localStorage.getItem('plotmix-ui-state');
      if (persisted) {
        const parsed = JSON.parse(persisted);
        return {
          selectedFont: parsed.selectedFont || 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          selectedFontWeight: parsed.selectedFontWeight || '400',
        };
      }
    } catch (error) {
      console.warn('Failed to load persisted UI state:', error);
    }
    return {};
  };

  const persistedState = loadPersistedState();

  // Detect screen size and get appropriate initial values
  const getScreenSizeValues = () => {
    if (typeof window === 'undefined') {
      // Default values for SSR
      return { zoom: 0.42, pan: { x: 2800, y: 1700 } };
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    // Define screen size presets with their optimal zoom and pan values
    const screenPresets = [
      // Small laptops (13-14 inch)
      { 
        name: 'Small Laptop (13-14")', 
        width: { min: 1200, max: 1600 }, 
        height: { min: 600, max: 900 },
        zoom: 0.42, 
        pan: { x: 2850, y: 1700 } 
      },
      // Medium laptops (15-16 inch)
      { 
        name: 'Medium Laptop (15-16")', 
        width: { min: 1600, max: 2000 }, 
        height: { min: 900, max: 1200 },
        zoom: 0.35, 
        pan: { x: 3200, y: 2000 } 
      },
      // Large laptops/desktops (17+ inch)
      { 
        name: 'Large Laptop/Desktop (17+")', 
        width: { min: 2000, max: 3000 }, 
        height: { min: 1200, max: 1800 },
        zoom: 0.28, 
        pan: { x: 4000, y: 2500 } 
      },
      // Ultra-wide/4K monitors
      { 
        name: 'Ultra-wide/4K Monitor', 
        width: { min: 3000, max: 9999 }, 
        height: { min: 1800, max: 9999 },
        zoom: 0.20, 
        pan: { x: 5000, y: 3000 } 
      }
    ];

    // Find matching preset
    const matchingPreset = screenPresets.find(preset => 
      screenWidth >= preset.width.min && screenWidth <= preset.width.max &&
      screenHeight >= preset.height.min && screenHeight <= preset.height.max
    );

    const selectedPreset = matchingPreset || screenPresets[0]; // Default to small laptop
    
    return {
      zoom: selectedPreset.zoom,
      pan: selectedPreset.pan
    };
  };

  const screenValues = getScreenSizeValues();

  const initialState = {
    // Initial state with persisted values
    panels: defaultPanelState,
    tools: {
      ...defaultToolState,
      selectedFont: persistedState.selectedFont || 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
      selectedFontWeight: persistedState.selectedFontWeight || '400',
    },
    snapping: defaultSnappingState,
    canvas: defaultCanvasState,
    canvasZoom: screenValues.zoom,
    canvasPan: screenValues.pan,
    preferences: defaultUserPreferences,
    keyboardShortcuts: defaultKeyboardShortcuts,
    navigation: { activeNav: null, hoverNav: null, interactedNav: null },
    activeRightPanel: null,
    hoverRightPanel: null,
    showAnimationsTab: false,
    uploadedFiles: defaultUploadedFilesState,
    aiPromptHistory: [],
  };

  return {
    ...initialState,

  // Panel Actions
  toggleLeftPanel: () => {
    set(produce((state) => {
      state.panels.leftPanelVisible = !state.panels.leftPanelVisible;
    }));
  },

  toggleRightPanel: () => {
    set(produce((state) => {
      state.panels.rightPanelVisible = !state.panels.rightPanelVisible;
    }));
  },

  setLeftPanelWidth: (width: number) => {
    set(produce((state) => {
      state.panels.leftPanelWidth = Math.max(320, Math.min(600, width));
    }));
  },

  setRightPanelWidth: (width: number) => {
    set(produce((state) => {
      state.panels.rightPanelWidth = Math.max(200, Math.min(600, width));
    }));
  },

  setTimelineHeight: (height: number) => {
    set(produce((state) => {
      const maxHeight = typeof window !== 'undefined' ? window.innerHeight * 0.8 : 800;
      const minHeight = 32;
      state.panels.timelineHeight = Math.max(minHeight, Math.min(maxHeight, height));
    }));
  },

  toggleTimelineCollapse: () => {
    set(produce((state) => {
      state.panels.isTimelineCollapsed = !state.panels.isTimelineCollapsed;
    }));
  },

  setResizing: (panel: 'left' | 'right' | 'timeline' | null) => {
    set(produce((state) => {
      state.panels.isResizing = panel;
    }));
  },

  // Tool Actions
  setActiveTool: (tool: ToolType) => {
    set(produce((state) => {
      // If we're in line drawing mode and switching away from line tool, exit line mode
      if ((state.tools.isLineChaining || state.tools.lineStartPoint) && tool !== 'line') {
        state.tools.isLineChaining = false;
        state.tools.lineStartPoint = null;
        state.tools.chainedLineIds = [];
        state.tools.isClosingShape = false;
      }
      
      state.tools.activeTool = tool;
      
      // Clear mask position when changing tools
      state.tools.maskPos = null;
      
      // Clear pending image data if switching away from image tool
      if (tool !== 'image') {
        state.tools.pendingImageData = null;
      }
      
      // Note: Path mode should only be exited manually, not when switching tools
      // Note: Selection clearing will be handled by the main component since it needs access to canvas state
    }));
  },

  togglePathMode: () => {
    set(produce((state) => {
      state.tools.isPathMode = !state.tools.isPathMode;
    }));
  },

  setLineChaining: (isChaining: boolean) => {
    set(produce((state) => {
      state.tools.isLineChaining = isChaining;
      if (!isChaining) {
        state.tools.lineStartPoint = null;
        state.tools.chainedLineIds = [];
        state.tools.isClosingShape = false;
      }
    }));
  },

  setLineStartPoint: (point: { x: number; y: number } | null) => {
    set(produce((state) => {
      state.tools.lineStartPoint = point;
    }));
  },

  addChainedLineId: (id: string) => {
    set(produce((state) => {
      state.tools.chainedLineIds.push(id);
    }));
  },

  clearChainedLineIds: () => {
    set(produce((state) => {
      state.tools.chainedLineIds = [];
    }));
  },

  setClosingShape: (isClosing: boolean) => {
    set(produce((state) => {
      state.tools.isClosingShape = isClosing;
    }));
  },

  setMaskPos: (pos: { x: number; y: number } | null) => {
    set(produce((state) => {
      state.tools.maskPos = pos;
    }));
  },

  setAnimationTarget: (target: { animationId: string; elementId: string } | null) => {
    set(produce((state) => {
      state.tools.animationTarget = target;
    }));
  },

  toggleShowPaths: () => {
    set(produce((state) => {
      state.tools.showPaths = !state.tools.showPaths;
    }));
  },

  setPendingImageData: (data: string | null) => {
    set(produce((state) => {
      state.tools.pendingImageData = data;
    }));
  },

  setLineType: (lineType: 'straight' | 'curved' | 'animated') => {
    set(produce((state) => {
      state.tools.lineType = lineType;
    }));
  },

  setSelectedFont: (fontFamily: string) => {
    set(produce((state) => {
      state.tools.selectedFont = fontFamily;
    }));
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const currentState = localStorage.getItem('plotmix-ui-state') || '{}';
        const parsed = JSON.parse(currentState);
        parsed.selectedFont = fontFamily;
        localStorage.setItem('plotmix-ui-state', JSON.stringify(parsed));
      } catch (error) {
        console.warn('Failed to persist selected font:', error);
      }
    }
  },

  setSelectedFontWeight: (fontWeight: string) => {
    set(produce((state) => {
      state.tools.selectedFontWeight = fontWeight;
    }));
    
    // Persist to localStorage
    if (typeof window !== 'undefined') {
      try {
        const currentState = localStorage.getItem('plotmix-ui-state') || '{}';
        const parsed = JSON.parse(currentState);
        parsed.selectedFontWeight = fontWeight;
        localStorage.setItem('plotmix-ui-state', JSON.stringify(parsed));
      } catch (error) {
        console.warn('Failed to persist selected font weight:', error);
      }
    }
  },

  // Snapping Actions
  updateGridConfig: (config: Partial<GridConfig>) => {
    set(produce((state) => {
      Object.assign(state.snapping.gridConfig, config);
    }));
  },

  updateElementSnapConfig: (config: Partial<ElementSnappingConfig>) => {
    set(produce((state) => {
      Object.assign(state.snapping.elementSnapConfig, config);
    }));
  },

  setGridSnapTemporarilyDisabled: (disabled: boolean) => {
    set(produce((state) => {
      state.snapping.isGridSnapTemporarilyDisabled = disabled;
    }));
  },

  setElementSnapTemporarilyDisabled: (disabled: boolean) => {
    set(produce((state) => {
      state.snapping.isElementSnapTemporarilyDisabled = disabled;
    }));
  },

  // Preferences Actions
  updatePreferences: (preferences: Partial<UserPreferences>) => {
    set(produce((state) => {
      Object.assign(state.preferences, preferences);
    }));
  },

  addRecentFile: (filePath: string) => {
    set(produce((state) => {
      const recentFiles = state.preferences.recentFiles.filter((file: string) => file !== filePath);
      recentFiles.unshift(filePath);
      state.preferences.recentFiles = recentFiles.slice(0, 10); // Keep only 10 recent files
    }));
  },

  removeRecentFile: (filePath: string) => {
    set(produce((state) => {
      state.preferences.recentFiles = state.preferences.recentFiles.filter((file: string) => file !== filePath);
    }));
  },

  updateKeyboardShortcut: (action: string, key: string) => {
    set(produce((state) => {
      state.preferences.keyboardShortcuts[action] = key;
    }));
  },

  resetPreferences: () => {
    set(produce((state) => {
      state.preferences = { ...defaultUserPreferences };
    }));
  },

  // Keyboard Shortcuts
  registerShortcut: (shortcut: KeyboardShortcut) => {
    set(produce((state) => {
      const existingIndex = state.keyboardShortcuts.findIndex((s: KeyboardShortcut) => s.action === shortcut.action);
      if (existingIndex >= 0) {
        state.keyboardShortcuts[existingIndex] = shortcut;
      } else {
        state.keyboardShortcuts.push(shortcut);
      }
    }));
  },

  unregisterShortcut: (action: string) => {
    set(produce((state) => {
      state.keyboardShortcuts = state.keyboardShortcuts.filter((s: KeyboardShortcut) => s.action !== action);
    }));
  },

  executeShortcut: (event: KeyboardEvent): boolean => {
    const state = get();
    const shortcut = state.keyboardShortcuts.find((s: KeyboardShortcut) => {
      return s.key === event.key &&
             !!s.ctrlKey === event.ctrlKey &&
             !!s.shiftKey === event.shiftKey &&
             !!s.metaKey === event.metaKey;
    });

    if (shortcut) {
      // Prevent default behavior
      event.preventDefault();
      
      // Execute the action based on the shortcut
      switch (shortcut.action) {
        case 'select':
          state.setActiveTool('select');
          break;
        case 'rectangle':
          state.setActiveTool('rectangle');
          break;
        case 'circle':
          state.setActiveTool('circle');
          break;
        case 'triangle':
          state.setActiveTool('triangle');
          break;
        case 'arc':
          state.setActiveTool('arc');
          break;
        case 'line':
          state.setActiveTool('line');
          break;
        case 'text':
          state.setActiveTool('text');
          break;
        case 'escape':
          if (state.tools.isLineChaining || state.tools.lineStartPoint) {
            // Exit line drawing mode completely
            state.setLineChaining(false);
            state.setLineStartPoint(null);
            state.clearChainedLineIds();
            state.setClosingShape(false);
          } else {
            state.setActiveTool('select');
          }
          if (state.tools.isPathMode) {
            state.togglePathMode();
          }
          break;
        default:
          return false;
      }
      return true;
    }
    return false;
  },

  getShortcutByAction: (action: string): KeyboardShortcut | undefined => {
    const state = get();
    return state.keyboardShortcuts.find((s: KeyboardShortcut) => s.action === action);
  },

  // Navigation
  setActiveNav: (nav: NavKey | null) => {
    set(produce((state) => {
      state.navigation.activeNav = nav;
    }));
  },

  setHoverNav: (nav: NavKey | null) => {
    set(produce((state) => {
      state.navigation.hoverNav = nav;
    }));
  },

  setInteractedNav: (nav: NavKey | null) => {
    set(produce((state) => {
      state.navigation.interactedNav = nav;
    }));
  },

  // Right panel action
  setActiveRightPanel: (panel: RightPanelKey | null) => {
    set(produce((state) => {
      state.activeRightPanel = panel;
    }));
  },

  setHoverRightPanel: (panel: RightPanelKey | null) => {
    set(produce((state) => {
      state.hoverRightPanel = panel;
    }));
  },

  // Animations tab action
  setShowAnimationsTab: (show: boolean) => {
    set(produce((state) => {
      state.showAnimationsTab = show;
    }));
  },

  // Canvas Actions
  setCanvasSize: (sizeId: string) => {
    set(produce((state) => {
      state.canvas.currentSizeId = sizeId;
      state.canvas.customSize = null; // Clear custom size when selecting predefined size
    }));
  },

  setCustomCanvasSize: (width: number, height: number) => {
    set(produce((state) => {
      state.canvas.customSize = { width, height };
      state.canvas.currentSizeId = 'custom';
    }));
  },

  addCanvasSize: (size: CanvasSize) => {
    set(produce((state) => {
      const existingIndex = state.canvas.availableSizes.findIndex((s: CanvasSize) => s.id === size.id);
      if (existingIndex >= 0) {
        state.canvas.availableSizes[existingIndex] = size;
      } else {
        state.canvas.availableSizes.push(size);
      }
    }));
  },

  removeCanvasSize: (sizeId: string) => {
    set(produce((state) => {
      state.canvas.availableSizes = state.canvas.availableSizes.filter((s: CanvasSize) => s.id !== sizeId);
      // If we're removing the current size, switch to the first available
      if (state.canvas.currentSizeId === sizeId && state.canvas.availableSizes.length > 0) {
        state.canvas.currentSizeId = state.canvas.availableSizes[0].id;
      }
    }));
  },

  // Multi-scene canvas dimensions support
  setCanvasDimensions: (dimensions: { width: number; height: number }) => {
    set(produce((state) => {
      // Set as custom size to support arbitrary dimensions from multi-scene projects
      state.canvas.customSize = dimensions;
      state.canvas.currentSizeId = 'custom';
    }));
  },

  getCanvasDimensions: () => {
    const state = get();
    if (state.canvas.customSize) {
      return state.canvas.customSize;
    }
    const currentSize = state.canvas.availableSizes.find(s => s.id === state.canvas.currentSizeId);
    return currentSize ? { width: currentSize.width, height: currentSize.height } : { width: 1920, height: 1080 };
  },

  setCanvasZoom: (zoom: number) => {
    set(produce((state) => {
      // Clamp to a reasonable range
      const clamped = Math.max(0.05, Math.min(10, zoom));
      state.canvasZoom = clamped;
    }));
  },

  setCanvasPan: (pan: { x: number; y: number }) => {
    set(produce((state) => {
      state.canvasPan = { x: pan.x, y: pan.y };
    }));
  },

  // Lock Actions
  toggleCanvasLock: () => {
    set(produce((state) => {
      state.isCanvasLocked = !state.isCanvasLocked;
    }));
  },

  setCanvasLock: (locked: boolean) => {
    set(produce((state) => {
      state.isCanvasLocked = locked;
    }));
  },

  // Uploaded Files Actions
  addUploadedFile: (file: UploadedFile) => {
    set(produce((state) => {
      // Check if we have enough storage space
      const newTotalSize = state.uploadedFiles.totalSize + file.size;
      if (newTotalSize > state.uploadedFiles.maxStorage) {
        throw new Error('Storage limit exceeded');
      }
      
      state.uploadedFiles.files.push(file);
      state.uploadedFiles.totalSize = newTotalSize;
    }));
  },

  removeUploadedFile: (fileId: string) => {
    set(produce((state) => {
      const fileIndex = state.uploadedFiles.files.findIndex((f: UploadedFile) => f.id === fileId);
      if (fileIndex !== -1) {
        const removedFile = state.uploadedFiles.files[fileIndex];
        state.uploadedFiles.totalSize -= removedFile.size;
        state.uploadedFiles.files.splice(fileIndex, 1);
      }
    }));
  },

  updateUploadedFile: (fileId: string, updates: Partial<UploadedFile>) => {
    set(produce((state) => {
      const file = state.uploadedFiles.files.find((f: UploadedFile) => f.id === fileId);
      if (file) {
        Object.assign(file, updates);
      }
    }));
  },

  clearUploadedFiles: () => {
    set(produce((state) => {
      state.uploadedFiles.files = [];
      state.uploadedFiles.totalSize = 0;
    }));
  },

  linkFileToElement: (fileId: string, elementId: string) => {
    set(produce((state) => {
      const file = state.uploadedFiles.files.find((f: UploadedFile) => f.id === fileId);
      if (file) {
        file.elementId = elementId;
      }
    }));
  },

  // AI Tools prompt history
  addAIPrompt: (promptText: string) => {
    set(produce((state) => {
      const entry: AIPromptEntry = {
        id: Math.random().toString(36).slice(2),
        text: promptText,
        timestamp: new Date().toISOString(),
      };
      state.aiPromptHistory.unshift(entry);
      // Keep only the latest 50 entries
      if (state.aiPromptHistory.length > 50) {
        state.aiPromptHistory = state.aiPromptHistory.slice(0, 50);
      }
    }));
  },

  clearAIPrompts: () => {
    set(produce((state) => {
      state.aiPromptHistory = [];
    }));
  },

  setAIPrompts: (items: { id: string; text: string; timestamp: string }[]) => {
    set(produce((state) => {
      state.aiPromptHistory = items.slice(0, 200);
    }));
  },
  };
});

// Selector hooks for specific parts of the UI state
export const usePanelState = () => useUIStore((state) => state.panels);
export const useToolState = () => useUIStore((state) => state.tools);
export const useSnappingState = () => useUIStore((state) => state.snapping);
export const useCanvasState = () => useUIStore((state) => state.canvas);
export const useUserPreferences = () => useUIStore((state) => state.preferences);
export const usePreferencesActions = () => useUIStore((state) => ({
  updatePreferences: state.updatePreferences,
  addRecentFile: state.addRecentFile,
  removeRecentFile: state.removeRecentFile,
  updateKeyboardShortcut: state.updateKeyboardShortcut,
  resetPreferences: state.resetPreferences,
}));
export const useNavigationState = () => useUIStore((state) => state.navigation);
export const useActiveNav = () => useUIStore((state) => state.navigation.activeNav);
export const useHoverNav = () => useUIStore((state) => state.navigation.hoverNav);
export const useInteractedNav = () => useUIStore((state) => state.navigation.interactedNav);
export const useSetActiveNav = () => useUIStore((state) => state.setActiveNav);
export const useSetHoverNav = () => useUIStore((state) => state.setActiveNav);
export const useSetInteractedNav = () => useUIStore((state) => state.setInteractedNav);
export const useActiveRightPanel = () => useUIStore((state) => state.activeRightPanel);
export const useSetActiveRightPanel = () => useUIStore((state) => state.setActiveRightPanel);
export const useHoverRightPanel = () => useUIStore((state) => state.hoverRightPanel);
export const useSetHoverRightPanel = () => useUIStore((state) => state.setHoverRightPanel);

// Action hooks
export const usePanelActions = () => useUIStore(
  useShallow((state) => ({
    toggleLeftPanel: state.toggleLeftPanel,
    toggleRightPanel: state.toggleRightPanel,
    setLeftPanelWidth: state.setLeftPanelWidth,
    setRightPanelWidth: state.setRightPanelWidth,
    setTimelineHeight: state.setTimelineHeight,
    toggleTimelineCollapse: state.toggleTimelineCollapse,
    setResizing: state.setResizing,
  }))
);

export const useToolActions = () => useUIStore(
  useShallow((state) => ({
    setActiveTool: state.setActiveTool,
    togglePathMode: state.togglePathMode,
    setLineChaining: state.setLineChaining,
    setLineStartPoint: state.setLineStartPoint,
    addChainedLineId: state.addChainedLineId,
    clearChainedLineIds: state.clearChainedLineIds,
    setClosingShape: state.setClosingShape,
    setMaskPos: state.setMaskPos,
    setAnimationTarget: state.setAnimationTarget,
    toggleShowPaths: state.toggleShowPaths,
    setPendingImageData: state.setPendingImageData,
    setLineType: state.setLineType,
    setSelectedFont: state.setSelectedFont,
    setSelectedFontWeight: state.setSelectedFontWeight,
  }))
);

export const useSnappingActions = () => useUIStore(
  useShallow((state) => ({
    updateGridConfig: state.updateGridConfig,
    updateElementSnapConfig: state.updateElementSnapConfig,
    setGridSnapTemporarilyDisabled: state.setGridSnapTemporarilyDisabled,
    setElementSnapTemporarilyDisabled: state.setElementSnapTemporarilyDisabled,
  }))
);

export const useCanvasActions = () => useUIStore(
  useShallow((state) => ({
    setCanvasSize: state.setCanvasSize,
    setCustomCanvasSize: state.setCustomCanvasSize,
    addCanvasSize: state.addCanvasSize,
    removeCanvasSize: state.removeCanvasSize,
  }))
);

export const useUploadedFilesActions = () => useUIStore(
  useShallow((state) => ({
    addUploadedFile: state.addUploadedFile,
    removeUploadedFile: state.removeUploadedFile,
    updateUploadedFile: state.updateUploadedFile,
    clearUploadedFiles: state.clearUploadedFiles,
    linkFileToElement: state.linkFileToElement,
  }))
);

export const useUploadedFiles = () => useUIStore((state) => state.uploadedFiles);

export const useAIPromptHistory = () => useUIStore((state) => state.aiPromptHistory);
export const useAIPromptHistoryActions = () => useUIStore(
  useShallow((state) => ({
    addAIPrompt: state.addAIPrompt,
    clearAIPrompts: state.clearAIPrompts,
    setAIPrompts: state.setAIPrompts,
  }))
);

export const useKeyboardShortcutsStore = () => {
  const shortcuts = useUIStore((state) => state.keyboardShortcuts);
  const executeShortcut = useUIStore((state) => state.executeShortcut);
  const registerShortcut = useUIStore((state) => state.registerShortcut);
  const unregisterShortcut = useUIStore((state) => state.unregisterShortcut);
  const getShortcutByAction = useUIStore((state) => state.getShortcutByAction);
  
  return {
    shortcuts,
    executeShortcut,
    registerShortcut,
    unregisterShortcut,
    getShortcutByAction,
  };
};