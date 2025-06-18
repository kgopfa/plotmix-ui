import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

type SelectionListener = (selectedElements: AnimatedCanvasObject[], selectedGroups: CanvasGroup[]) => void;

export class SelectionManager {
  private static instance: SelectionManager;
  private selectedElements: AnimatedCanvasObject[] = [];
  private selectedGroups: CanvasGroup[] = [];
  private listeners: Set<SelectionListener> = new Set();

  private constructor() {}

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
      // selectedGroups will be updated separately when groups state changes
    } else {
      if (addToSelection && !this.isSelected(element)) {
        this.selectedElements = [...this.selectedElements, element];
      } else if (addToSelection && this.isSelected(element)) {
        // Remove from selection if already selected
        this.selectedElements = this.selectedElements.filter(el => el.id !== element.id);
      } else {
        this.selectedElements = [element];
      }
      // selectedGroups will be updated separately when groups state changes
    }
    this.notifyListeners();
  }

  // Internal method to update selected groups without triggering listeners
  private updateSelectedGroupsInternal(currentGroups: CanvasGroup[]): void {
    const groupIds = new Set(this.selectedElements.map(el => el.groupId).filter(Boolean));
    this.selectedGroups = currentGroups.filter(group => groupIds.has(group.id));
  }

  // Public method to update selected groups (for external calls - does not trigger listeners)
  updateSelectedGroups(currentGroups: CanvasGroup[]): void {
    this.updateSelectedGroupsInternal(currentGroups);
    // Note: We don't call notifyListeners() here to avoid infinite loops
    // The component will handle updating its state based on the existing selection
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
  canUngroup(currentGroups: CanvasGroup[]): boolean {
    if (this.selectedGroups.length !== 1) return false;
    
    const group = this.selectedGroups[0];
    // Verify the group still exists in current groups
    const currentGroup = currentGroups.find(g => g.id === group.id);
    return currentGroup ? !currentGroup.isDefaultGroup && currentGroup.elementIds.length > 1 : false;
  }

  selectAll(elements: AnimatedCanvasObject[]): void {
    this.selectedElements = [...elements];
    // selectedGroups will be updated separately when groups state changes
    this.notifyListeners();
  }

  // Helper method to calculate bounds for group creation
  private calculateBounds(elements: AnimatedCanvasObject[]): { x: number; y: number; width: number; height: number } {
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
  }

  // Create a new group from selected elements - returns the group for component to add to state
  createGroupFromSelected(currentGroups: CanvasGroup[]): CanvasGroup | null {
    if (!this.canGroup()) return null;

    const groupId = crypto.randomUUID();
    
    // Calculate group center based on elements' bounding box
    const bounds = this.calculateBounds(this.selectedElements);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Count only non-default groups for numbering
    const nonDefaultGroupCount = currentGroups.filter(g => !g.isDefaultGroup).length;

    // Determine group type based on selected elements
    const hasOnlyLines = this.selectedElements.every(el => el.type === 'line');
    const groupType = hasOnlyLines ? 'polygon' : 'custom';

    const group: CanvasGroup = {
      id: groupId,
      name: groupType === 'polygon' ? `Polygon ${nonDefaultGroupCount + 1}` : `Group ${nonDefaultGroupCount + 1}`,
      elementIds: this.selectedElements.map(el => el.id),
      x: centerX,
      y: centerY,
      rotation: 0,
      type: groupType,
      isDefaultGroup: false,
      animations: []
    };

    return group;
  }

  // Get elements in a group by filtering from all elements
  getElementsInGroup(groupId: string, allElements: AnimatedCanvasObject[]): AnimatedCanvasObject[] {
    return allElements.filter(el => el.groupId === groupId);
  }

  // Create default groups for ungrouped elements - returns array of new groups
  createDefaultGroupsForElements(elements: AnimatedCanvasObject[]): CanvasGroup[] {
    return elements.map(element => ({
      id: crypto.randomUUID(),
      name: `${element.name} Group`,
      elementIds: [element.id],
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      type: 'custom' as const,
      isDefaultGroup: true,
      animations: []
    }));
  }
} 