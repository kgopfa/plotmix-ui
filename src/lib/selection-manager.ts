import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { GroupManager } from './group-manager';

type SelectionListener = (selectedElements: AnimatedCanvasObject[], selectedGroups: CanvasGroup[]) => void;

export class SelectionManager {
  private static instance: SelectionManager;
  private selectedElements: AnimatedCanvasObject[] = [];
  private selectedGroups: CanvasGroup[] = [];
  private listeners: Set<SelectionListener> = new Set();
  private groupManager: GroupManager;

  private constructor() {
    this.groupManager = GroupManager.getInstance();
  }

  public static getInstance(): SelectionManager {
    if (!SelectionManager.instance) {
      SelectionManager.instance = new SelectionManager();
    }
    return SelectionManager.instance;
  }

  subscribe(listener: SelectionListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.selectedElements, this.selectedGroups));
  }

  select(element: AnimatedCanvasObject | AnimatedCanvasObject[] | null, addToSelection = false): void {
    if (element === null) {
      this.selectedElements = [];
      this.selectedGroups = [];
    } else if (Array.isArray(element)) {
      this.selectedElements = [...element];
      this.updateSelectedGroups();
    } else {
      if (addToSelection && !this.isSelected(element)) {
        this.selectedElements = [...this.selectedElements, element];
      } else if (addToSelection && this.isSelected(element)) {
        // Remove from selection if already selected
        this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
      } else {
        this.selectedElements = [element];
      }
      this.updateSelectedGroups();
    }
    this.notifyListeners();
  }

  // Update selected groups based on selected elements
  private updateSelectedGroups(): void {
    const groupIds = new Set(this.selectedElements.map(el => el.groupId));
    this.selectedGroups = Array.from(groupIds)
      .map(groupId => this.groupManager.getGroup(groupId || ''))
      .filter((group): group is CanvasGroup => group !== undefined);
  }

  getSelected(): AnimatedCanvasObject[] {
    return [...this.selectedElements];
  }

  getSelectedGroups(): CanvasGroup[] {
    return [...this.selectedGroups];
  }

  getFirstSelected(): AnimatedCanvasObject | null {
    return this.selectedElements.length > 0 ? this.selectedElements[0] : null;
  }

  isSelected(element: AnimatedCanvasObject): boolean {
    return this.selectedElements.some(el => el.id === element.id);
  }

  clear(): void {
    this.selectedElements = [];
    this.selectedGroups = [];
    this.notifyListeners();
  }

  hasMultipleSelection(): boolean {
    return this.selectedElements.length > 1;
  }

  // Check if we can group selected elements (multiple elements from different groups)
  canGroup(): boolean {
    if (this.selectedElements.length < 2) return false;
    
    // Check if selected elements belong to different groups
    const groupIds = new Set(this.selectedElements.map(el => el.groupId));
    return groupIds.size > 1;
  }

  // Check if we can ungroup (single group with multiple elements selected)
  canUngroup(): boolean {
    if (this.selectedGroups.length !== 1) return false;
    
    const group = this.selectedGroups[0];
    return !group.isDefaultGroup && group.elementIds.length > 1;
  }

  selectAll(elements: AnimatedCanvasObject[]): void {
    this.selectedElements = [...elements];
    this.updateSelectedGroups();
    this.notifyListeners();
  }

  // Group selected elements
  groupSelectedElements(allElements: AnimatedCanvasObject[]): CanvasGroup | null {
    if (!this.canGroup()) return null;

    const group = this.groupManager.createGroup(this.selectedElements);
    
    // Update elements to use new group ID
    const updatedElements = allElements.map(el => {
      if (this.selectedElements.some(selected => selected.id === el.id)) {
        return { ...el, groupId: group.id };
      }
      return el;
    });

    // Update selected elements with new group ID
    this.selectedElements = this.selectedElements.map(el => ({
      ...el,
      groupId: group.id
    }));

    this.updateSelectedGroups();
    this.notifyListeners();

    return group;
  }

  // Ungroup selected group
  ungroupSelectedElements(allElements: AnimatedCanvasObject[]): CanvasGroup[] {
    if (!this.canUngroup()) return [];

    const group = this.selectedGroups[0];
    const elementsInGroup = this.groupManager.getElementsInGroup(group.id, allElements);
    const newGroups = this.groupManager.ungroupElements(group.id, elementsInGroup);

    // Update elements with new group IDs
    const updatedElements = allElements.map(el => {
      const elementGroup = newGroups.find(g => g.elementIds.includes(el.id));
      if (elementGroup) {
        return { ...el, groupId: elementGroup.id };
      }
      return el;
    });

    // Update selected elements with new group IDs
    this.selectedElements = this.selectedElements.map(el => {
      const elementGroup = newGroups.find(g => g.elementIds.includes(el.id));
      if (elementGroup) {
        return { ...el, groupId: elementGroup.id };
      }
      return el;
    });

    this.updateSelectedGroups();
    this.notifyListeners();

    return newGroups;
  }
} 