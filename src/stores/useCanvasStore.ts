import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { useShallow } from 'zustand/react/shallow';
import { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';

interface CanvasState {
  // Core state
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  
  // Loading and optimistic update state
  isLoading: boolean;
  pendingOperations: Set<string>;
  
  // History for undo/redo (future enhancement)
  history: {
    past: Array<{ elements: AnimatedCanvasObject[]; groups: CanvasGroup[] }>;
    future: Array<{ elements: AnimatedCanvasObject[]; groups: CanvasGroup[] }>;
  };
}

interface CanvasActions {
  // Element operations
  addElement: (element: AnimatedCanvasObject) => void;
  updateElement: (id: string, updates: Partial<AnimatedCanvasObject>) => void;
  removeElement: (id: string) => void;
  duplicateElement: (id: string) => void;
  moveElement: (id: string, position: { x: number; y: number }) => void;
  resizeElement: (id: string, size: { width: number; height: number }) => void;
  rotateElement: (id: string, rotation: number) => void;
  setElementVisibility: (id: string, visible: boolean) => void;
  
  // Group operations
  addGroup: (group: CanvasGroup) => void;
  updateGroup: (id: string, updates: Partial<CanvasGroup>) => void;
  removeGroup: (id: string) => void;
  moveGroup: (id: string, position: { x: number; y: number }) => void;
  setGroupVisibility: (id: string, visible: boolean) => void;
  
  // Element-Group relationship operations
  addElementsToGroup: (elementIds: string[], groupId: string) => void;
  removeElementsFromGroup: (elementIds: string[], groupId: string) => void;
  createGroupFromElements: (elementIds: string[], groupOptions?: Partial<CanvasGroup>) => CanvasGroup;
  ungroupElements: (groupId: string) => void;
  
  // Animation operations
  addElementAnimation: (elementId: string, animation: ElementAnimation) => void;
  updateElementAnimation: (elementId: string, animationId: string, updates: Partial<ElementAnimation>) => void;
  removeElementAnimation: (elementId: string, animationId: string) => void;
  addGroupAnimation: (groupId: string, animation: ElementAnimation) => void;
  updateGroupAnimation: (groupId: string, animationId: string, updates: Partial<ElementAnimation>) => void;
  removeGroupAnimation: (groupId: string, animationId: string) => void;
  
  // Bulk operations
  updateMultipleElements: (updates: Array<{ id: string; updates: Partial<AnimatedCanvasObject> }>) => void;
  moveMultipleElements: (movements: Array<{ id: string; x: number; y: number }>) => void;
  
  // Utility operations
  findElement: (id: string) => AnimatedCanvasObject | undefined;
  findGroup: (id: string) => CanvasGroup | undefined;
  getElementById: (id: string) => AnimatedCanvasObject | undefined;
  getGroupById: (id: string) => CanvasGroup | undefined;
  getElementsInGroup: (groupId: string) => AnimatedCanvasObject[];
  getAllElements: () => AnimatedCanvasObject[];
  getAllGroups: () => CanvasGroup[];
  
  // State management
  setElements: (elements: AnimatedCanvasObject[]) => void;
  setGroups: (groups: CanvasGroup[]) => void;
  clearCanvas: () => void;
  
  // Optimistic updates
  startOptimisticOperation: (operationId: string) => void;
  completeOptimisticOperation: (operationId: string) => void;
  rollbackOptimisticOperation: (operationId: string) => void;
  
  // History operations (for future enhancement)
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
}

type CanvasStore = CanvasState & CanvasActions;

export const useCanvasStore = create<CanvasStore>()(
  immer((set, get) => ({
    // Initial state
    elements: [],
    groups: [],
    isLoading: false,
    pendingOperations: new Set(),
    history: {
      past: [],
      future: []
    },

    // Element operations
    addElement: (element) => {
      set((state) => {
        state.elements.push(element);
        
        // Auto-create default group if element doesn't have one
        if (!element.groupId) {
          const defaultGroup: CanvasGroup = {
            id: crypto.randomUUID(),
            name: `${element.name} Group`,
            elementIds: [element.id],
            x: element.x,
            y: element.y,
            rotation: 0,
            visible: true,
            type: 'custom',
            isDefaultGroup: true,
            animations: []
          };
          state.groups.push(defaultGroup);
          
          // Update element with group ID
          const addedElement = state.elements.find(el => el.id === element.id);
          if (addedElement) {
            addedElement.groupId = defaultGroup.id;
          }
        }
      });
    },

    updateElement: (id, updates) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          Object.assign(element, updates);
        }
      });
    },

    removeElement: (id) => {
      set((state) => {
        // Remove element from elements array
        state.elements = state.elements.filter(el => el.id !== id);
        
        // Remove element from any groups and clean up empty groups
        state.groups = state.groups.map(group => ({
          ...group,
          elementIds: group.elementIds.filter(elementId => elementId !== id)
        })).filter(group => group.elementIds.length > 0 || !group.isDefaultGroup);
      });
    },

    duplicateElement: (id) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          const duplicatedElement: AnimatedCanvasObject = {
            ...element,
            id: crypto.randomUUID(),
            name: `${element.name} Copy`,
            x: element.x + 20,
            y: element.y + 20,
            animations: element.animations.map(anim => ({
              ...anim,
              id: crypto.randomUUID()
            }))
          };
          state.elements.push(duplicatedElement);
          
          // Create a new group for the duplicated element
          const newGroup: CanvasGroup = {
            id: crypto.randomUUID(),
            name: `${duplicatedElement.name} Group`,
            elementIds: [duplicatedElement.id],
            x: duplicatedElement.x,
            y: duplicatedElement.y,
            rotation: 0,
            visible: true,
            type: 'custom',
            isDefaultGroup: true,
            animations: []
          };
          state.groups.push(newGroup);
          duplicatedElement.groupId = newGroup.id;
        }
      });
    },

    moveElement: (id, position) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          element.x = position.x;
          element.y = position.y;
        }
      });
    },

    resizeElement: (id, size) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          element.width = size.width;
          element.height = size.height;
        }
      });
    },

    rotateElement: (id, rotation) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          element.rotation = rotation;
        }
      });
    },

    setElementVisibility: (id, visible) => {
      set((state) => {
        const element = state.elements.find(el => el.id === id);
        if (element) {
          element.visible = visible;
        }
      });
    },

    // Group operations
    addGroup: (group) => {
      set((state) => {
        state.groups.push(group);
      });
    },

    updateGroup: (id, updates) => {
      set((state) => {
        const group = state.groups.find(g => g.id === id);
        if (group) {
          Object.assign(group, updates);
        }
      });
    },

    removeGroup: (id) => {
      set((state) => {
        // Remove group from groups array
        state.groups = state.groups.filter(g => g.id !== id);
        
        // Update elements to remove group reference
        state.elements = state.elements.map(el => 
          el.groupId === id ? { ...el, groupId: undefined } : el
        );
      });
    },

    moveGroup: (id, position) => {
      set((state) => {
        const group = state.groups.find(g => g.id === id);
        if (group) {
          const deltaX = position.x - group.x;
          const deltaY = position.y - group.y;
          
          group.x = position.x;
          group.y = position.y;
          
          // Move all elements in the group
          group.elementIds.forEach(elementId => {
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
              element.x += deltaX;
              element.y += deltaY;
            }
          });
        }
      });
    },

    setGroupVisibility: (id, visible) => {
      set((state) => {
        const group = state.groups.find(g => g.id === id);
        if (group) {
          group.visible = visible;
          
          // Update visibility of all elements in the group
          group.elementIds.forEach(elementId => {
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
              element.visible = visible;
            }
          });
        }
      });
    },

    // Element-Group relationship operations
    addElementsToGroup: (elementIds, groupId) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          elementIds.forEach(elementId => {
            if (!group.elementIds.includes(elementId)) {
              group.elementIds.push(elementId);
            }
            
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
              element.groupId = groupId;
            }
          });
        }
      });
    },

    removeElementsFromGroup: (elementIds, groupId) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.elementIds = group.elementIds.filter(id => !elementIds.includes(id));
          
          elementIds.forEach(elementId => {
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
              element.groupId = undefined;
            }
          });
          
          // Remove group if it becomes empty and is a default group
          if (group.elementIds.length === 0 && group.isDefaultGroup) {
            state.groups = state.groups.filter(g => g.id !== groupId);
          }
        }
      });
    },

    createGroupFromElements: (elementIds, groupOptions = {}) => {
      const state = get();
      const elements = elementIds.map(id => state.elements.find(el => el.id === id)).filter(Boolean) as AnimatedCanvasObject[];
      
      if (elements.length === 0) {
        throw new Error('No valid elements found for grouping');
      }
      
      // Calculate group bounds
      const bounds = elements.reduce((acc, el) => {
        const left = el.x - el.width / 2;
        const right = el.x + el.width / 2;
        const top = el.y - el.height / 2;
        const bottom = el.y + el.height / 2;
        
        return {
          minX: Math.min(acc.minX, left),
          maxX: Math.max(acc.maxX, right),
          minY: Math.min(acc.minY, top),
          maxY: Math.max(acc.maxY, bottom)
        };
      }, {
        minX: Infinity,
        maxX: -Infinity,
        minY: Infinity,
        maxY: -Infinity
      });
      
      const centerX = (bounds.minX + bounds.maxX) / 2;
      const centerY = (bounds.minY + bounds.maxY) / 2;
      
      const newGroup: CanvasGroup = {
        id: crypto.randomUUID(),
        name: `Group ${state.groups.filter(g => !g.isDefaultGroup).length + 1}`,
        elementIds: elementIds,
        x: centerX,
        y: centerY,
        rotation: 0,
        visible: true,
        type: 'custom',
        isDefaultGroup: false,
        animations: [],
        ...groupOptions
      };
      
      set((state) => {
        // Add the new group
        state.groups.push(newGroup);
        
        // Update elements to reference the new group
        elementIds.forEach(elementId => {
          const element = state.elements.find(el => el.id === elementId);
          if (element) {
            element.groupId = newGroup.id;
          }
        });
        
        // Remove old default groups for these elements
        state.groups = state.groups.filter(group => {
          if (!group.isDefaultGroup) return true;
          const hasElementInNewGroup = group.elementIds.some(id => elementIds.includes(id));
          return !hasElementInNewGroup;
        });
      });
      
      return newGroup;
    },

    ungroupElements: (groupId) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          // Remove group reference from elements and create individual default groups
          group.elementIds.forEach(elementId => {
            const element = state.elements.find(el => el.id === elementId);
            if (element) {
              element.groupId = undefined;
              
              // Create a new default group for this element
              const defaultGroup: CanvasGroup = {
                id: crypto.randomUUID(),
                name: `${element.name} Group`,
                elementIds: [element.id],
                x: element.x,
                y: element.y,
                rotation: 0,
                visible: true,
                type: 'custom',
                isDefaultGroup: true,
                animations: []
              };
              state.groups.push(defaultGroup);
              element.groupId = defaultGroup.id;
            }
          });
          
          // Remove the original group
          state.groups = state.groups.filter(g => g.id !== groupId);
        }
      });
    },

    // Animation operations
    addElementAnimation: (elementId, animation) => {
      set((state) => {
        const element = state.elements.find(el => el.id === elementId);
        if (element) {
          element.animations.push(animation);
        }
      });
    },

    updateElementAnimation: (elementId, animationId, updates) => {
      set((state) => {
        const element = state.elements.find(el => el.id === elementId);
        if (element) {
          const animation = element.animations.find(anim => anim.id === animationId);
          if (animation) {
            Object.assign(animation, updates);
            if (updates.properties) {
              animation.properties = { ...animation.properties, ...updates.properties };
            }
          }
        }
      });
    },

    removeElementAnimation: (elementId, animationId) => {
      set((state) => {
        const element = state.elements.find(el => el.id === elementId);
        if (element) {
          element.animations = element.animations.filter(anim => anim.id !== animationId);
        }
      });
    },

    addGroupAnimation: (groupId, animation) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.animations.push(animation);
        }
      });
    },

    updateGroupAnimation: (groupId, animationId, updates) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          const animation = group.animations.find(anim => anim.id === animationId);
          if (animation) {
            Object.assign(animation, updates);
            if (updates.properties) {
              animation.properties = { ...animation.properties, ...updates.properties };
            }
          }
        }
      });
    },

    removeGroupAnimation: (groupId, animationId) => {
      set((state) => {
        const group = state.groups.find(g => g.id === groupId);
        if (group) {
          group.animations = group.animations.filter(anim => anim.id !== animationId);
        }
      });
    },

    // Bulk operations
    updateMultipleElements: (updates) => {
      set((state) => {
        updates.forEach(({ id, updates: elementUpdates }) => {
          const element = state.elements.find(el => el.id === id);
          if (element) {
            Object.assign(element, elementUpdates);
          }
        });
      });
    },

    moveMultipleElements: (movements) => {
      set((state) => {
        movements.forEach(({ id, x, y }) => {
          const element = state.elements.find(el => el.id === id);
          if (element) {
            element.x = x;
            element.y = y;
          }
        });
      });
    },

    // Utility operations
    findElement: (id) => {
      return get().elements.find(el => el.id === id);
    },

    findGroup: (id) => {
      return get().groups.find(g => g.id === id);
    },

    getElementById: (id) => {
      return get().elements.find(el => el.id === id);
    },

    getGroupById: (id) => {
      return get().groups.find(g => g.id === id);
    },

    getElementsInGroup: (groupId) => {
      const { elements, groups } = get();
      const group = groups.find(g => g.id === groupId);
      if (!group) return [];
      
      return elements.filter(el => group.elementIds.includes(el.id));
    },

    getAllElements: () => {
      return get().elements;
    },

    getAllGroups: () => {
      return get().groups;
    },

    // State management
    setElements: (elements) => {
      set((state) => {
        state.elements = elements;
      });
    },

    setGroups: (groups) => {
      set((state) => {
        state.groups = groups;
      });
    },

    clearCanvas: () => {
      set((state) => {
        state.elements = [];
        state.groups = [];
        state.pendingOperations.clear();
      });
    },

    // Optimistic updates
    startOptimisticOperation: (operationId) => {
      set((state) => {
        state.pendingOperations.add(operationId);
      });
    },

    completeOptimisticOperation: (operationId) => {
      set((state) => {
        state.pendingOperations.delete(operationId);
      });
    },

    rollbackOptimisticOperation: (operationId) => {
      set((state) => {
        state.pendingOperations.delete(operationId);
        // TODO: Implement rollback logic based on operation type
      });
    },

    // History operations (for future enhancement)
    saveSnapshot: () => {
      set((state) => {
        const snapshot = {
          elements: JSON.parse(JSON.stringify(state.elements)),
          groups: JSON.parse(JSON.stringify(state.groups))
        };
        state.history.past.push(snapshot);
        state.history.future = []; // Clear future when new action is performed
        
        // Limit history size
        if (state.history.past.length > 50) {
          state.history.past.shift();
        }
      });
    },

    undo: () => {
      set((state) => {
        if (state.history.past.length > 0) {
          const current = {
            elements: JSON.parse(JSON.stringify(state.elements)),
            groups: JSON.parse(JSON.stringify(state.groups))
          };
          state.history.future.unshift(current);
          
          const previous = state.history.past.pop()!;
          state.elements = previous.elements;
          state.groups = previous.groups;
        }
      });
    },

    redo: () => {
      set((state) => {
        if (state.history.future.length > 0) {
          const current = {
            elements: JSON.parse(JSON.stringify(state.elements)),
            groups: JSON.parse(JSON.stringify(state.groups))
          };
          state.history.past.push(current);
          
          const next = state.history.future.shift()!;
          state.elements = next.elements;
          state.groups = next.groups;
        }
      });
    },

    canUndo: () => {
      return get().history.past.length > 0;
    },

    canRedo: () => {
      return get().history.future.length > 0;
    }
  }))
);

// Export utility hooks for common operations
export const useCanvasElements = () => {
  return useCanvasStore(state => state.elements);
};

export const useCanvasGroups = () => {
  return useCanvasStore(state => state.groups);
};

export const useCanvasOperations = () => {
  return useCanvasStore(
    useShallow(state => ({
      addElement: state.addElement,
      updateElement: state.updateElement,
      removeElement: state.removeElement,
      duplicateElement: state.duplicateElement,
      moveElement: state.moveElement,
      resizeElement: state.resizeElement,
      rotateElement: state.rotateElement,
      setElementVisibility: state.setElementVisibility,
      
      addGroup: state.addGroup,
      updateGroup: state.updateGroup,
      removeGroup: state.removeGroup,
      moveGroup: state.moveGroup,
      setGroupVisibility: state.setGroupVisibility,
      
      createGroupFromElements: state.createGroupFromElements,
      ungroupElements: state.ungroupElements,
      
      updateMultipleElements: state.updateMultipleElements,
      moveMultipleElements: state.moveMultipleElements,
      
      clearCanvas: state.clearCanvas
    }))
  );
};

export const useCanvasQueries = () => {
  return useCanvasStore(
    useShallow(state => ({
      findElement: state.findElement,
      findGroup: state.findGroup,
      getElementById: state.getElementById,
      getGroupById: state.getGroupById,
      getElementsInGroup: state.getElementsInGroup,
      getAllElements: state.getAllElements,
      getAllGroups: state.getAllGroups
    }))
  );
};

export const useCanvasHistory = () => {
  return useCanvasStore(
    useShallow(state => ({
      saveSnapshot: state.saveSnapshot,
      undo: state.undo,
      redo: state.redo,
      canUndo: state.canUndo,
      canRedo: state.canRedo
    }))
  );
}; 