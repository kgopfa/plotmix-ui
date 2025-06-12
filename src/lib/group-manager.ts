import type { AnimatedCanvasObject, CanvasGroup, ElementAnimation } from '@/types/canvas';

// Simple ID generator
const generateId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
};

export class GroupManager {
  private static instance: GroupManager;
  private groups: Map<string, CanvasGroup> = new Map();

  private constructor() {}

  public static getInstance(): GroupManager {
    if (!GroupManager.instance) {
      GroupManager.instance = new GroupManager();
    }
    return GroupManager.instance;
  }

  // Create a default group for a single object
  public createDefaultGroup(element: AnimatedCanvasObject): CanvasGroup {
    const group: CanvasGroup = {
      id: element.groupId || generateId(),
      name: `${element.name} Group`,
      elementIds: [element.id],
      x: element.x,
      y: element.y,
      rotation: element.rotation || 0,
      isDefaultGroup: true,
      animations: []
    };

    this.groups.set(group.id, group);
    return group;
  }

  // Create a new group from multiple elements
  public createGroup(elements: AnimatedCanvasObject[], name?: string): CanvasGroup {
    const groupId = generateId();
    
    // Calculate group center based on elements' bounding box
    const bounds = this.calculateBounds(elements);
    const centerX = bounds.x + bounds.width / 2;
    const centerY = bounds.y + bounds.height / 2;

    // Count only non-default groups for numbering
    const nonDefaultGroupCount = Array.from(this.groups.values()).filter(g => !g.isDefaultGroup).length;

    const group: CanvasGroup = {
      id: groupId,
      name: name || `Group ${nonDefaultGroupCount + 1}`,
      elementIds: elements.map(el => el.id),
      x: centerX,
      y: centerY,
      rotation: 0,
      isDefaultGroup: false,
      animations: []
    };

    this.groups.set(group.id, group);
    return group;
  }

  // Ungroup elements (convert back to default groups)
  public ungroupElements(groupId: string, elements: AnimatedCanvasObject[]): CanvasGroup[] {
    this.groups.delete(groupId);
    
    const newGroups: CanvasGroup[] = [];
    for (const element of elements) {
      const newGroup = this.createDefaultGroup(element);
      newGroups.push(newGroup);
    }
    
    return newGroups;
  }

  // Get group by ID
  public getGroup(groupId: string): CanvasGroup | undefined {
    return this.groups.get(groupId);
  }

  // Get all groups
  public getAllGroups(): CanvasGroup[] {
    return Array.from(this.groups.values());
  }

  // Update group position
  public updateGroupPosition(groupId: string, x: number, y: number): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.x = x;
      group.y = y;
    }
  }

  // Update group rotation
  public updateGroupRotation(groupId: string, rotation: number): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.rotation = rotation;
    }
  }

  // Calculate bounding box for a set of elements
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

  // Get elements in a group
  public getElementsInGroup(groupId: string, allElements: AnimatedCanvasObject[]): AnimatedCanvasObject[] {
    const group = this.groups.get(groupId);
    if (!group) return [];

    return allElements.filter(el => group.elementIds.includes(el.id));
  }

  // Clear all groups (for reset/cleanup)
  public clear(): void {
    this.groups.clear();
  }

  // Initialize groups for existing elements (migration helper)
  public initializeGroupsForElements(elements: AnimatedCanvasObject[]): void {
    this.clear();
    
    // Group elements by groupId to determine if they should be default groups
    const elementsByGroup = new Map<string, AnimatedCanvasObject[]>();
    
    for (const element of elements) {
      if (!element.groupId) continue;
      
      if (!elementsByGroup.has(element.groupId)) {
        elementsByGroup.set(element.groupId, []);
      }
      elementsByGroup.get(element.groupId)!.push(element);
    }
    
    // Create appropriate groups based on element count
    for (const [groupId, groupElements] of elementsByGroup) {
      if (!this.groups.has(groupId)) {
        if (groupElements.length === 1) {
          // Single element - create default group
          this.createDefaultGroup(groupElements[0]);
        } else {
          // Multiple elements - create proper group
          const bounds = this.calculateBounds(groupElements);
          const centerX = bounds.x + bounds.width / 2;
          const centerY = bounds.y + bounds.height / 2;
          
          const nonDefaultGroupCount = Array.from(this.groups.values()).filter(g => !g.isDefaultGroup).length;
          
          const group: CanvasGroup = {
            id: groupId,
            name: `Group ${nonDefaultGroupCount + 1}`,
            elementIds: groupElements.map(el => el.id),
            x: centerX,
            y: centerY,
            rotation: 0,
            isDefaultGroup: false,
            animations: []
          };
          
          this.groups.set(groupId, group);
        }
      }
    }
  }

  // Add group animation methods
  public addGroupAnimation(groupId: string, animation: ElementAnimation): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.animations.push(animation);
    }
  }

  public updateGroupAnimation(groupId: string, animationId: string, updates: Partial<ElementAnimation>): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.animations = group.animations.map(anim => 
        anim.id === animationId ? { ...anim, ...updates } : anim
      );
    }
  }

  public removeGroupAnimation(groupId: string, animationId: string): void {
    const group = this.groups.get(groupId);
    if (group) {
      group.animations = group.animations.filter(anim => anim.id !== animationId);
    }
  }
} 