import { useState } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

interface DraggedItem {
  id: string;
  type: 'element' | 'group';
}

interface DragOverItem {
  id: string;
  type: 'element' | 'group';
}

interface UseDragAndDropProps {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  onParentChange: (childId: string, newParentId: string | null, childType: 'element' | 'group') => void;
}

export function useDragAndDrop({ elements, groups, onParentChange }: UseDragAndDropProps) {
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<DragOverItem | null>(null);

  /**
   * Validates whether a dragged item can be dropped on a target.
   * Enforces the following constraints:
   * 1. Shapes cannot be dragged into other shapes - only into groups
   * 2. Shapes cannot be dragged into text groups (type === 'text')
   * 3. Prevents circular dependencies
   */
  const canDropOnTarget = (
    draggedId: string, 
    draggedType: 'element' | 'group', 
    targetId: string, 
    targetType: 'element' | 'group'
  ): boolean => {
    // Can't drop on self
    if (draggedId === targetId) return false;
    
    // Shapes should not be draggable into other shapes - only into groups
    if (draggedType === 'element' && targetType === 'element') {
      return false;
    }
    
    // If target is a group, check if it's a text group (not allowed)
    if (targetType === 'group') {
      const targetGroup = groups.find(g => g.id === targetId);
      if (targetGroup && targetGroup.type === 'text') {
        return false;
      }
    }
    
    // Can't create circular dependencies - check if target is a descendant of dragged item
    const isDescendant = (ancestorId: string, descendantId: string, type: 'element' | 'group'): boolean => {
      if (type === 'element') {
        const element = elements.find(el => el.id === descendantId);
        if (!element || !element.parent) return false;
        if (element.parent === ancestorId) return true;
        
        // Check if parent is an element or group and continue recursively
        const parentElement = elements.find(el => el.id === element.parent);
        const parentGroup = groups.find(g => g.id === element.parent);
        
        if (parentElement) return isDescendant(ancestorId, element.parent, 'element');
        if (parentGroup) return isDescendant(ancestorId, element.parent, 'group');
      } else {
        const group = groups.find(g => g.id === descendantId);
        if (!group || !group.parent) return false;
        if (group.parent === ancestorId) return true;
        
        // Check if parent is an element or group and continue recursively
        const parentElement = elements.find(el => el.id === group.parent);
        const parentGroup = groups.find(g => g.id === group.parent);
        
        if (parentElement) return isDescendant(ancestorId, group.parent, 'element');
        if (parentGroup) return isDescendant(ancestorId, group.parent, 'group');
      }
      return false;
    };

    return !isDescendant(draggedId, targetId, targetType);
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, id: string, type: 'element' | 'group') => {
    setDraggedItem({ id, type });
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', ''); // Required for Firefox
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string, targetType: 'element' | 'group') => {
    e.preventDefault();
    if (draggedItem && canDropOnTarget(draggedItem.id, draggedItem.type, targetId, targetType)) {
      e.dataTransfer.dropEffect = 'move';
      setDragOverItem({ id: targetId, type: targetType });
    } else {
      e.dataTransfer.dropEffect = 'none';
      setDragOverItem(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear drag over if we're leaving the target element entirely
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverItem(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetId: string, targetType: 'element' | 'group') => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to parent container
    if (draggedItem && canDropOnTarget(draggedItem.id, draggedItem.type, targetId, targetType)) {
      onParentChange(draggedItem.id, targetId, draggedItem.type);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDropOnRoot = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedItem) {
      onParentChange(draggedItem.id, null, draggedItem.type);
    }
    setDraggedItem(null);
    setDragOverItem(null);
  };

  return {
    draggedItem,
    dragOverItem,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDropOnRoot,
  };
} 