import { AnimatedCanvasElement } from '@/components/editor/Canvas';

type SelectionListener = (selectedElement: AnimatedCanvasElement | null) => void;

export class SelectionManager {
  private static instance: SelectionManager;
  private selectedElement: AnimatedCanvasElement | null = null;
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
    listener(this.selectedElement);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.selectedElement));
  }

  select(element: AnimatedCanvasElement | null): void {
    this.selectedElement = element;
    this.notifyListeners();
  }

  getSelected(): AnimatedCanvasElement | null {
    return this.selectedElement;
  }

  isSelected(element: AnimatedCanvasElement): boolean {
    return this.selectedElement?.id === element.id;
  }
} 