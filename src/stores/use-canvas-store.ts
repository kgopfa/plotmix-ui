import { create } from 'zustand';
import { produce } from 'immer';
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
  
  // History operations
  saveSnapshot: () => void;
  undo: () => void;
  redo: () => void;
  
  // Subscription management
  subscribe: (callback: (state: { elements: AnimatedCanvasObject[]; groups: CanvasGroup[] }) => void) => () => void;
}

type CanvasStore = CanvasState & CanvasActions;

// Subscription management
const subscribers = new Set<(state: { elements: AnimatedCanvasObject[]; groups: CanvasGroup[] }) => void>();

const notifySubscribers = (state: { elements: AnimatedCanvasObject[]; groups: CanvasGroup[] }) => {
  subscribers.forEach(callback => {
    try {
      callback(state);
    } catch (error) {
      console.warn('Canvas store subscriber error:', error);
    }
  });
};

export const useCanvasStore = create<CanvasStore>()(
  (set, get) => ({
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
      set(produce((state) => {
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
          const addedElement = state.elements.find((el: AnimatedCanvasObject) => el.id === element.id);
          if (addedElement) {
            addedElement.groupId = defaultGroup.id;
          }
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    updateElement: (id, updates) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          Object.assign(element, updates);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    removeElement: (id) => {
      set(produce((state) => {
        // Remove element from elements array
        state.elements = state.elements.filter((el: AnimatedCanvasObject) => el.id !== id);
        
        // Remove element from any groups and clean up empty groups
        state.groups = state.groups.map((group: CanvasGroup) => ({
          ...group,
          elementIds: group.elementIds.filter(elementId => elementId !== id)
        })).filter((group: CanvasGroup) => group.elementIds.length > 0 || !group.isDefaultGroup);
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    duplicateElement: (id) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          const duplicatedElement: AnimatedCanvasObject = {
            ...element,
            id: crypto.randomUUID(),
            name: `${element.name} Copy`,
            x: element.x + 20,
            y: element.y + 20,
            animations: element.animations.map((anim: ElementAnimation) => ({
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
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    moveElement: (id, position) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          element.x = position.x;
          element.y = position.y;
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    resizeElement: (id, size) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          element.width = size.width;
          element.height = size.height;
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    rotateElement: (id, rotation) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          element.rotation = rotation;
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    setElementVisibility: (id, visible) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
        if (element) {
          element.visible = visible;
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Group operations
    addGroup: (group) => {
      set(produce((state) => {
        state.groups.push(group);
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    updateGroup: (id, updates) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === id);
        if (group) {
          Object.assign(group, updates);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    removeGroup: (id) => {
      set(produce((state) => {
        // Remove group from groups array
        state.groups = state.groups.filter((g: CanvasGroup) => g.id !== id);
        
        // Update elements to remove group reference
        state.elements = state.elements.map((el: AnimatedCanvasObject) => 
          el.groupId === id ? { ...el, groupId: undefined } : el
        );
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    moveGroup: (id, position) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === id);
        if (group) {
          const deltaX = position.x - group.x;
          const deltaY = position.y - group.y;
          
          group.x = position.x;
          group.y = position.y;
          
          // Move all elements in the group
          group.elementIds.forEach((elementId: string) => {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
            if (element) {
              element.x += deltaX;
              element.y += deltaY;
            }
          });
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    setGroupVisibility: (id, visible) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === id);
        if (group) {
          group.visible = visible;
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Element-Group relationship operations
    addElementsToGroup: (elementIds, groupId) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          // Add elements to group
          elementIds.forEach((elementId: string) => {
            if (!group.elementIds.includes(elementId)) {
              group.elementIds.push(elementId);
            }
          });
          
          // Update elements with group reference
          state.elements = state.elements.map((el: AnimatedCanvasObject) => 
            elementIds.includes(el.id) ? { ...el, groupId } : el
          );
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    removeElementsFromGroup: (elementIds, groupId) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          // Remove elements from group
          group.elementIds = group.elementIds.filter((id: string) => !elementIds.includes(id));
          
          // Update elements to remove group reference
          state.elements = state.elements.map((el: AnimatedCanvasObject) => 
            elementIds.includes(el.id) ? { ...el, groupId: undefined } : el
          );
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    createGroupFromElements: (elementIds, groupOptions = {}) => {
      const elements = get().elements.filter((el: AnimatedCanvasObject) => elementIds.includes(el.id));
      if (elements.length === 0) {
        throw new Error('No elements found to group');
      }

      const group: CanvasGroup = {
        id: crypto.randomUUID(),
        name: groupOptions.name || `Group ${Date.now()}`,
        elementIds,
        x: elements.reduce((sum, el) => sum + el.x, 0) / elements.length,
        y: elements.reduce((sum, el) => sum + el.y, 0) / elements.length,
        rotation: 0,
        visible: true,
        type: 'custom',
        isDefaultGroup: false,
        animations: [],
        ...groupOptions
      };

      set(produce((state) => {
        state.groups.push(group);
        
        // Update elements with group reference
        state.elements = state.elements.map((el: AnimatedCanvasObject) => 
          elementIds.includes(el.id) ? { ...el, groupId: group.id } : el
        );
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
      
      return group;
    },

    ungroupElements: (groupId) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          // Remove group reference from elements and create individual default groups
          group.elementIds.forEach((elementId: string) => {
            const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
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
          state.groups = state.groups.filter((g: CanvasGroup) => g.id !== groupId);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Animation operations
    addElementAnimation: (elementId, animation) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
        if (element) {
          element.animations.push(animation);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    updateElementAnimation: (elementId, animationId, updates) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
        if (element) {
          const animation = element.animations.find((anim: ElementAnimation) => anim.id === animationId);
          if (animation) {
            Object.assign(animation, updates);
            if (updates.properties) {
              animation.properties = { ...animation.properties, ...updates.properties };
            }
          }
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    removeElementAnimation: (elementId, animationId) => {
      set(produce((state) => {
        const element = state.elements.find((el: AnimatedCanvasObject) => el.id === elementId);
        if (element) {
          element.animations = element.animations.filter((anim: ElementAnimation) => anim.id !== animationId);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    addGroupAnimation: (groupId, animation) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          group.animations.push(animation);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    updateGroupAnimation: (groupId, animationId, updates) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          const animation = group.animations.find((anim: ElementAnimation) => anim.id === animationId);
          if (animation) {
            Object.assign(animation, updates);
            if (updates.properties) {
              animation.properties = { ...animation.properties, ...updates.properties };
            }
          }
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    removeGroupAnimation: (groupId, animationId) => {
      set(produce((state) => {
        const group = state.groups.find((g: CanvasGroup) => g.id === groupId);
        if (group) {
          group.animations = group.animations.filter((anim: ElementAnimation) => anim.id !== animationId);
        }
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Bulk operations
    updateMultipleElements: (updates) => {
      set(produce((state) => {
        updates.forEach(({ id, updates: elementUpdates }) => {
          const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
          if (element) {
            Object.assign(element, elementUpdates);
          }
        });
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    moveMultipleElements: (movements) => {
      set(produce((state) => {
        movements.forEach(({ id, x, y }) => {
          const element = state.elements.find((el: AnimatedCanvasObject) => el.id === id);
          if (element) {
            element.x = x;
            element.y = y;
          }
        });
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
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
      set(produce((state) => {
        state.elements = elements;
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    setGroups: (groups) => {
      set(produce((state) => {
        state.groups = groups;
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    clearCanvas: () => {
      set(produce((state) => {
        state.elements = [];
        state.groups = [];
        state.pendingOperations.clear();
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Optimistic updates
    startOptimisticOperation: (operationId) => {
      set(produce((state) => {
        state.pendingOperations.add(operationId);
      }));
    },

    completeOptimisticOperation: (operationId) => {
      set(produce((state) => {
        state.pendingOperations.delete(operationId);
      }));
    },

    rollbackOptimisticOperation: (operationId) => {
      set(produce((state) => {
        state.pendingOperations.delete(operationId);
        // TODO: Implement rollback logic based on operation type
      }));
    },

    // History operations (for future enhancement)
    saveSnapshot: () => {
      set(produce((state) => {
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
      }));
    },

    undo: () => {
      set(produce((state) => {
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
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    redo: () => {
      set(produce((state) => {
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
      }));
      
      // Notify subscribers
      notifySubscribers({ elements: get().elements, groups: get().groups });
    },

    // Subscription management
    subscribe: (callback) => {
      subscribers.add(callback);
      
      // Return unsubscribe function
      return () => {
        subscribers.delete(callback);
      };
    },
  })
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
      redo: state.redo
    }))
  );
}; 