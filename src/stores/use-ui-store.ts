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
}

interface SnappingState {
  gridConfig: GridConfig;
  elementSnapConfig: ElementSnappingConfig;
  isGridSnapTemporarilyDisabled: boolean;
  isElementSnapTemporarilyDisabled: boolean;
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

interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: string;
  description: string;
}

// Navigation keys corresponding to sidebar icons
export type NavKey = 'video' | 'scenes' | 'uploads' | 'ai' | 'tools' | 'audio' | 'timeline';

// Right sidebar keys
export type RightPanelKey = 'properties' | 'animations' | 'history';

interface NavigationState {
  activeNav: NavKey | null; // sticks after click
  hoverNav: NavKey | null;  // transient while hovering
}

// Combined UI State
interface UIState {
  panels: PanelState;
  tools: ToolState;
  snapping: SnappingState;
  preferences: UserPreferences;
  keyboardShortcuts: KeyboardShortcut[];
  navigation: NavigationState;
  activeRightPanel: RightPanelKey | null;
  hoverRightPanel: RightPanelKey | null;
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
  setActiveRightPanel: (panel: RightPanelKey) => void;
  setHoverRightPanel: (panel: RightPanelKey | null) => void;
}

type UIStore = UIState & UIActions;

// Default values
const defaultPanelState: PanelState = {
  leftPanelVisible: true,
  rightPanelVisible: true,
  leftPanelWidth: 384,
  rightPanelWidth: 320,
  timelineHeight: 240,
  isTimelineCollapsed: false,
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
};

const defaultSnappingState: SnappingState = {
  gridConfig: {
    size: 10,
    enabled: true,
    visible: false,
    snapThreshold: 8,
  },
  elementSnapConfig: {
    enabled: true,
    snapThreshold: 10,
    showGuides: true,
    enableSpacing: true,
    enableDistribution: true,
  },
  isGridSnapTemporarilyDisabled: false,
  isElementSnapTemporarilyDisabled: false,
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
  { key: 'Escape', action: 'escape', description: 'Escape/Cancel' },
];

export const useUIStore = create<UIStore>((set, get) => ({
      // Initial state
      panels: defaultPanelState,
      tools: defaultToolState,
      snapping: defaultSnappingState,
      preferences: defaultUserPreferences,
      keyboardShortcuts: defaultKeyboardShortcuts,
      navigation: { activeNav: null, hoverNav: null },
      activeRightPanel: 'properties',
      hoverRightPanel: null,

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
      state.panels.leftPanelWidth = Math.max(384, Math.min(600, width));
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

  // Right panel action
  setActiveRightPanel: (panel: RightPanelKey) => {
    set(produce((state) => {
      state.activeRightPanel = panel;
    }));
  },

  setHoverRightPanel: (panel: RightPanelKey | null) => {
    set(produce((state) => {
      state.hoverRightPanel = panel;
    }));
  },
}));

// Selector hooks for specific parts of the UI state
export const usePanelState = () => useUIStore((state) => state.panels);
export const useToolState = () => useUIStore((state) => state.tools);
export const useSnappingState = () => useUIStore((state) => state.snapping);
export const useUserPreferences = () => useUIStore((state) => state.preferences);
export const useNavigationState = () => useUIStore((state) => state.navigation);
export const useActiveNav = () => useUIStore((state) => state.navigation.activeNav);
export const useHoverNav = () => useUIStore((state) => state.navigation.hoverNav);
export const useSetActiveNav = () => useUIStore((state) => state.setActiveNav);
export const useSetHoverNav = () => useUIStore((state) => state.setHoverNav);
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