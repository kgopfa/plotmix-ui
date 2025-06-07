import { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';

export interface AnimationSelection {
  type: 'animation';
  elementId: string;
  animationId: string;
  element: AnimatedCanvasObject;
  animation: ElementAnimation;
}

export interface PathShapeSelection {
  type: 'pathShape';
  elementId: string;
  animationId: string;
  element: AnimatedCanvasObject;
  animation: ElementAnimation;
  pathElement: AnimatedCanvasObject;
}

export type Selection = AnimationSelection | PathShapeSelection | null;

type SelectionListener = (selection: Selection) => void;

export class AnimationSelectionManager {
  private static instance: AnimationSelectionManager;
  private selectedAnimation: Selection = null;
  private listeners: Set<SelectionListener> = new Set();

  private constructor() {}

  static getInstance(): AnimationSelectionManager {
    if (!AnimationSelectionManager.instance) {
      AnimationSelectionManager.instance = new AnimationSelectionManager();
    }
    return AnimationSelectionManager.instance;
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    listener(this.selectedAnimation);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.selectedAnimation));
  }

  selectAnimation(
    element: AnimatedCanvasObject, 
    animation: ElementAnimation
  ): void {
    this.selectedAnimation = {
      type: 'animation',
      elementId: element.id,
      animationId: animation.id,
      element,
      animation
    };
    this.notifyListeners();
  }

  selectPathShape(
    element: AnimatedCanvasObject,
    animation: ElementAnimation,
    pathElement: AnimatedCanvasObject
  ): void {
    this.selectedAnimation = {
      type: 'pathShape',
      elementId: element.id,
      animationId: animation.id,
      element,
      animation,
      pathElement
    };
    this.notifyListeners();
  }

  clearSelection(): void {
    this.selectedAnimation = null;
    this.notifyListeners();
  }

  getSelected(): Selection {
    return this.selectedAnimation;
  }

  isAnimationSelected(elementId: string, animationId: string): boolean {
    return this.selectedAnimation?.elementId === elementId && 
           this.selectedAnimation?.animationId === animationId;
  }

  isPathShapeSelected(elementId: string, animationId: string, pathElementId: string): boolean {
    return this.selectedAnimation?.type === 'pathShape' &&
           this.selectedAnimation?.elementId === elementId &&
           this.selectedAnimation?.animationId === animationId &&
           this.selectedAnimation?.pathElement.id === pathElementId;
  }
} 