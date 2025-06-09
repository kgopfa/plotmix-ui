import { AnimatedCanvasObject } from '@/types/canvas';

type SelectionListener = (selectedElements: AnimatedCanvasObject[]) => void;

export class SelectionManager {
  private static instance: SelectionManager;
  private selectedElements: AnimatedCanvasObject[] = [];
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
    listener(this.selectedElements);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.selectedElements));
  }

  select(element: AnimatedCanvasObject | AnimatedCanvasObject[] | null, addToSelection = false): void {
    if (element === null) {
      this.selectedElements = [];
    } else if (Array.isArray(element)) {
      this.selectedElements = [...element];
    } else {
      if (addToSelection && !this.isSelected(element)) {
        this.selectedElements = [...this.selectedElements, element];
      } else if (addToSelection && this.isSelected(element)) {
        // Remove from selection if already selected
        this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
      } else {
        this.selectedElements = [element];
      }
    }
    this.notifyListeners();
  }

  getSelected(): AnimatedCanvasObject[] {
    return this.selectedElements;
  }

  getFirstSelected(): AnimatedCanvasObject | null {
    return this.selectedElements.length > 0 ? this.selectedElements[0] : null;
  }

  isSelected(element: AnimatedCanvasObject): boolean {
    return this.selectedElements.some(el => el.id === element.id);
  }

  getSelectedIds(): string[] {
    return this.selectedElements.map(el => el.id);
  }

  hasSelection(): boolean {
    return this.selectedElements.length > 0;
  }

  hasMultipleSelection(): boolean {
    return this.selectedElements.length > 1;
  }

  selectAll(elements: AnimatedCanvasObject[]): void {
    this.selectedElements = [...elements];
    this.notifyListeners();
  }

  toggleSelection(element: AnimatedCanvasObject): void {
    this.select(element, true);
  }
} 