import { create } from 'zustand';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useUIStore } from '@/stores/use-ui-store';

interface SelectionState {
  selectedElements: AnimatedCanvasObject[];
  selectedGroups: CanvasGroup[];
  currentGroups: CanvasGroup[]; // Cache current groups for automatic updates
}

interface SelectionActions {
  // Selection operations
  select: (element: AnimatedCanvasObject | AnimatedCanvasObject[] | null, addToSelection?: boolean) => void;
  selectGroup: (group: CanvasGroup, addToSelection?: boolean) => void;
  selectAll: (elements: AnimatedCanvasObject[]) => void;
  clearSelections: () => void;
  
  // Utility functions
  isSelected: (element: AnimatedCanvasObject) => boolean;
  isGroupSelected: (group: CanvasGroup) => boolean;
  getFirstSelected: () => AnimatedCanvasObject | null;
  hasMultipleSelection: () => boolean;
  
  // Group operations
  canGroup: () => boolean;
  canUngroup: () => boolean;
  createGroupFromSelected: () => CanvasGroup | null;
  updateSelectedGroups: (currentGroups: CanvasGroup[]) => void;
  
  // Internal helpers
  updateSelectedGroupsInternal: (groups: CanvasGroup[]) => void;
  calculateBounds: (elements: AnimatedCanvasObject[]) => { x: number; y: number; width: number; height: number };
}

type SelectionStore = SelectionState & SelectionActions;

export const useSelectionStore = create<SelectionStore>((set, get) => ({
  // Initial state
  selectedElements: [],
  selectedGroups: [],
  currentGroups: [],

  // Selection operations
  select: (element, addToSelection = false) => {
    const state = get();
    
    if (element === null) {
      set({ selectedElements: [], selectedGroups: [] });
    } else if (Array.isArray(element)) {
      set({ selectedElements: [...element] });
      state.updateSelectedGroupsInternal(state.currentGroups);
      
      // Auto-activate properties panel when elements are selected
      if (element.length > 0) {
        const uiStore = useUIStore.getState();
        if (!uiStore.activeRightPanel) {
          uiStore.setActiveRightPanel('properties');
        }
      }
    } else {
      let newSelectedElements: AnimatedCanvasObject[];
      
      if (addToSelection && !state.isSelected(element)) {
        newSelectedElements = [...state.selectedElements, element];
      } else if (addToSelection && state.isSelected(element)) {
        // Remove from selection if already selected
        newSelectedElements = state.selectedElements.filter(el => el.id !== element.id);
      } else {
        newSelectedElements = [element];
      }
      
      set({ selectedElements: newSelectedElements });
      state.updateSelectedGroupsInternal(state.currentGroups);
      
      // Auto-activate properties panel when an element is selected
      if (newSelectedElements.length > 0) {
        const uiStore = useUIStore.getState();
        if (!uiStore.activeRightPanel) {
          uiStore.setActiveRightPanel('properties');
        }
      }
    }
  },

  selectGroup: (group, addToSelection = false) => {
    const state = get();
    const elementsInGroup = state.currentGroups
      .find(g => g.id === group.id)?.elementIds
      .map(id => state.selectedElements.find(el => el.id === id))
      .filter(Boolean) as AnimatedCanvasObject[] || [];

    if (addToSelection) {
      const newSelectedElements = [...state.selectedElements, ...elementsInGroup];
      const newSelectedGroups = [...state.selectedGroups, group];
      set({ 
        selectedElements: newSelectedElements,
        selectedGroups: newSelectedGroups 
      });
    } else {
      set({ 
        selectedElements: elementsInGroup,
        selectedGroups: [group] 
      });
    }
    
    // Auto-activate properties panel when a group is selected
    if (elementsInGroup.length > 0) {
      const uiStore = useUIStore.getState();
      if (!uiStore.activeRightPanel) {
        uiStore.setActiveRightPanel('properties');
      }
    }
  },

  selectAll: (elements) => {
    set({ selectedElements: [...elements] });
    get().updateSelectedGroupsInternal(get().currentGroups);
    
    // Auto-activate properties panel when selecting all elements
    if (elements.length > 0) {
      const uiStore = useUIStore.getState();
      if (!uiStore.activeRightPanel) {
        uiStore.setActiveRightPanel('properties');
      }
    }
  },

  clearSelections: () => {
    set({ selectedElements: [], selectedGroups: [] });
  },

  // Utility functions
  isSelected: (element) => {
    return get().selectedElements.some(el => el.id === element.id);
  },

  isGroupSelected: (group) => {
    return get().selectedGroups.some(g => g.id === group.id);
  },

  getFirstSelected: () => {
    const selectedElements = get().selectedElements;
    return selectedElements.length > 0 ? selectedElements[0] : null;
  },

  hasMultipleSelection: () => {
    return get().selectedElements.length > 1;
  },

  // Group operations
  canGroup: () => {
    const selectedElements = get().selectedElements;
    if (selectedElements.length < 2) return false;
    
    // Check if selected elements belong to different groups
    const groupIds = new Set(selectedElements.map(el => el.groupId));
    return groupIds.size > 1;
  },

  canUngroup: () => {
    const state = get();
    if (state.selectedGroups.length !== 1) return false;
    
    const group = state.selectedGroups[0];
    // Verify the group still exists in current groups
    const currentGroup = state.currentGroups.find(g => g.id === group.id);
    return currentGroup ? !currentGroup.isDefaultGroup && currentGroup.elementIds.length > 1 : false;
  },

  createGroupFromSelected: () => {
    const state = get();
    if (!state.canGroup()) return null;

    const groupId = crypto.randomUUID();
    
    // Calculate group center based on elements' bounding box
    const bounds = state.calculateBounds(state.selectedElements);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Count only non-default groups for numbering
    const nonDefaultGroupCount = state.currentGroups.filter(g => !g.isDefaultGroup).length;

    // Determine group type based on selected elements
    const hasOnlyLines = state.selectedElements.every(el => el.type === 'line');
    const groupType = hasOnlyLines ? 'polygon' : 'custom';

    const group: CanvasGroup = {
      id: groupId,
      name: groupType === 'polygon' ? `Polygon ${nonDefaultGroupCount + 1}` : `Group ${nonDefaultGroupCount + 1}`,
      elementIds: state.selectedElements.map(el => el.id),
      x: centerX,
      y: centerY,
      rotation: 0,
      visible: true,
      type: groupType,
      isDefaultGroup: false,
      animations: []
    };

    return group;
  },

  updateSelectedGroups: (currentGroups) => {
    set({ currentGroups });
    get().updateSelectedGroupsInternal(currentGroups);
  },

  // Internal helpers
  updateSelectedGroupsInternal: (groups) => {
    const state = get();
    if (state.selectedElements.length === 0) {
      set({ selectedGroups: [] });
      return;
    }

    // Get all unique group IDs from selected elements
    const groupIds = new Set(state.selectedElements.map(el => el.groupId).filter(Boolean));
    
    // Find groups that match these IDs
    const candidateGroups = groups.filter(group => groupIds.has(group.id));
    
    // Only select a group if ALL its elements are selected (for proper group selection)
    const selectedGroups = candidateGroups.filter(group => {
      // Skip default groups - they don't represent real groups
      if (group.isDefaultGroup) return false;
      
      // Check if all elements in the group are selected
      const selectedElementIds = new Set(state.selectedElements.map(el => el.id));
      return group.elementIds.every(elementId => selectedElementIds.has(elementId));
    });

    set({ selectedGroups });
  },

  calculateBounds: (elements) => {
    if (elements.length === 0) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      const left = element.x - element.width / 2;
      const right = element.x + element.width / 2;
      const top = element.y - element.height / 2;
      const bottom = element.y + element.height / 2;

      minX = Math.min(minX, left);
      minY = Math.min(minY, top);
      maxX = Math.max(maxX, right);
      maxY = Math.max(maxY, bottom);
    }

    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  },
})); 