import { create } from 'zustand';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useUIStore } from '@/stores/use-ui-store';
import { useCanvasStore } from '@/stores/use-canvas-store';

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
  cleanupStaleSelections: () => { validSelectedElements: AnimatedCanvasObject[], validSelectedGroups: CanvasGroup[] };
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
      // Determine if selection is actually changing
      const prevIds = new Set(state.selectedElements.map(el => el.id));
      const nextIds = new Set(element.map(el => el.id));
      const isSameSelection = prevIds.size === nextIds.size && [...prevIds].every(id => nextIds.has(id));

      set({ selectedElements: [...element] });
      state.updateSelectedGroupsInternal(state.currentGroups);
      
      // Removed auto-activation of properties panel - users will open panels themselves
    } else {
      let newSelectedElements: AnimatedCanvasObject[];
      
      const prevIds = new Set(state.selectedElements.map(el => el.id));
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
      
      // Removed auto-activation of properties panel - users will open panels themselves
    }
  },

  selectGroup: (group, addToSelection = false) => {
    const state = get();
    // Get all elements from the canvas store to find the group elements
    const canvasElements = useCanvasStore.getState().elements;
    const elementsInGroup = canvasElements.filter((el: AnimatedCanvasObject) => el.groupId === group.id);

    const prevIds = new Set(state.selectedElements.map(el => el.id));
    const nextIdsPreview = new Set((addToSelection ? [...state.selectedElements, ...elementsInGroup] : elementsInGroup).map(el => el.id));
    const isSameSelection = prevIds.size === nextIdsPreview.size && [...prevIds].every(id => nextIdsPreview.has(id));

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
    
    // Removed auto-activation of properties panel - users will open panels themselves
  },

  selectAll: (elements) => {
    const state = get();
    const prevIds = new Set(state.selectedElements.map(el => el.id));
    const nextIds = new Set(elements.map(el => el.id));
    const isSameSelection = prevIds.size === nextIds.size && [...prevIds].every(id => nextIds.has(id));

    set({ selectedElements: [...elements] });
    get().updateSelectedGroupsInternal(get().currentGroups);
    
    // Removed auto-activation of properties panel - users will open panels themselves
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
    const { validSelectedElements } = get().cleanupStaleSelections();
    return validSelectedElements.length > 0 ? validSelectedElements[0] : null;
  },

  hasMultipleSelection: () => {
    const { validSelectedElements } = get().cleanupStaleSelections();
    return validSelectedElements.length > 1;
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
    // Don't create polygon groups anymore since polygons are now single elements
    const groupType = 'custom';

    const group: CanvasGroup = {
      id: groupId,
      name: `Group ${nonDefaultGroupCount + 1}`,
      elementIds: state.selectedElements.map(el => el.id),
      x: centerX,
      y: centerY,
      rotation: 0,
      visible: true,
      opacity: 1,
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

  // Helper function to clean up stale selections
  cleanupStaleSelections: () => {
    const state = get();
    const canvasElements = useCanvasStore.getState().elements;
    const canvasGroups = useCanvasStore.getState().groups;
    
    // Remove elements that no longer exist in the canvas
    const validSelectedElements = state.selectedElements.filter(el => 
      canvasElements.some(canvasEl => canvasEl.id === el.id)
    );
    
    // Remove groups that no longer exist in the canvas
    const validSelectedGroups = state.selectedGroups.filter(group => 
      canvasGroups.some(canvasGroup => canvasGroup.id === group.id)
    );
    
    // Update state if cleanup was needed
    if (validSelectedElements.length !== state.selectedElements.length || 
        validSelectedGroups.length !== state.selectedGroups.length) {
      set({ 
        selectedElements: validSelectedElements,
        selectedGroups: validSelectedGroups 
      });
    }
    
    return { validSelectedElements, validSelectedGroups };
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