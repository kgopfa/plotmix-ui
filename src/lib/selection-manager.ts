import { AnimatedCanvasObject } from '@/types/canvas';

interface SelectionState {
  selectedObjects: AnimatedCanvasObject[];
  primarySelection: AnimatedCanvasObject | null; // The last selected object for inspector
}

type SelectionListener = (selectionState: SelectionState) => void;

export class SelectionManager {
  private static instance: SelectionManager;
  private selectedObjects: AnimatedCanvasObject[] = [];
  private primarySelection: AnimatedCanvasObject | null = null;
  private listeners: Set<SelectionListener> = new Set();

  private constructor() {}

  static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager();
    }
    return SelectionManager.instance;
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    listener(this.getSelectionState());
    return () => this.listeners.delete(listener);
  }

  private getSelectionState(): SelectionState {
    return {
      selectedObjects: [...this.selectedObjects],
      primarySelection: this.primarySelection
    };
  }

  private notifyListeners(): void {
    const state = this.getSelectionState();
    this.listeners.forEach(listener => listener(state));
  }

  // Single selection (clears all others)
  select(element: AnimatedCanvasObject | null): void {
    if (element === null) {
      this.selectedObjects = [];
      this.primarySelection = null;
    } else {
      this.selectedObjects = [element];
      this.primarySelection = element;
    }
    this.notifyListeners();
  }

  // Multi-selection with Ctrl/Cmd key
  toggleSelection(element: AnimatedCanvasObject): void {
    const index = this.selectedObjects.findIndex(obj => obj.id === element.id);
    
    if (index >= 0) {
      // Remove from selection
      this.selectedObjects.splice(index, 1);
      // If this was the primary selection, set new primary
      if (this.primarySelection?.id === element.id) {
        this.primarySelection = this.selectedObjects.length > 0 ? this.selectedObjects[this.selectedObjects.length - 1] : null;
      }
    } else {
      // Add to selection
      this.selectedObjects.push(element);
      this.primarySelection = element; // Make it the primary selection
    }
    
    this.notifyListeners();
  }

  // Add to selection without clearing existing
  addToSelection(element: AnimatedCanvasObject): void {
    if (!this.isSelected(element)) {
      this.selectedObjects.push(element);
      this.primarySelection = element;
      this.notifyListeners();
    }
  }

  // Remove from selection
  removeFromSelection(element: AnimatedCanvasObject): void {
    const index = this.selectedObjects.findIndex(obj => obj.id === element.id);
    if (index >= 0) {
      this.selectedObjects.splice(index, 1);
      if (this.primarySelection?.id === element.id) {
        this.primarySelection = this.selectedObjects.length > 0 ? this.selectedObjects[this.selectedObjects.length - 1] : null;
      }
      this.notifyListeners();
    }
  }

  // Clear all selections
  clearSelection(): void {
    this.selectedObjects = [];
    this.primarySelection = null;
    this.notifyListeners();
  }

  // Get all selected objects
  getSelectedObjects(): AnimatedCanvasObject[] {
    return [...this.selectedObjects];
  }

  // Get primary selection (for inspector)
  getPrimarySelection(): AnimatedCanvasObject | null {
    return this.primarySelection;
  }

  // Get selected IDs for canvas rendering
  getSelectedIds(): string[] {
    return this.selectedObjects.map(obj => obj.id);
  }

  // Check if element is selected
  isSelected(element: AnimatedCanvasObject): boolean {
    return this.selectedObjects.some(obj => obj.id === element.id);
  }

  // Get selection count
  getSelectionCount(): number {
    return this.selectedObjects.length;
  }

  // Check if multiple objects are selected
  hasMultipleSelection(): boolean {
    return this.selectedObjects.length > 1;
  }

  // Backward compatibility method
  getSelected(): AnimatedCanvasObject | null {
    return this.primarySelection;
  }
} 