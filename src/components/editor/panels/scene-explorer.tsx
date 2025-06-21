import { useState, useEffect } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { ContextMenu } from '../canvas/context-menu';
import { contextMenuManager } from '@/lib/context-menu-manager';

interface ContextMenuPosition {
  x: number;
  y: number;
  targetId: string;
  targetType: 'element' | 'group';
}

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  selectedElements: AnimatedCanvasObject[];
  selectedGroups: CanvasGroup[];
  onElementSelect: (element: AnimatedCanvasObject | null, addToSelection?: boolean) => void;
  onGroupSelect: (group: CanvasGroup, addToSelection?: boolean) => void;
  onClearSelection: () => void;
  onElementVisibilityChange: (elementId: string, visible: boolean) => void;
  onGroupVisibilityChange: (groupId: string, visible: boolean) => void;
  onParentChange: (childId: string, newParentId: string | null, childType: 'element' | 'group') => void;
  // Context menu action callbacks
  onCopyElement?: (elementId: string) => void;
  onCopyGroup?: (groupId: string) => void;
  onGroupElements?: (elementIds: string[]) => void;
  onMoveToFront?: (elementId: string, isElement: boolean) => void;
  onMoveToBack?: (elementId: string, isElement: boolean) => void;
}

export function SceneExplorer({ 
  elements, 
  groups, 
  selectedElements, 
  selectedGroups,
  onElementSelect,
  onGroupSelect,
  onClearSelection,
  onElementVisibilityChange,
  onGroupVisibilityChange,
  onParentChange,
  onCopyElement,
  onCopyGroup,
  onGroupElements,
  onMoveToFront,
  onMoveToBack
}: SceneExplorerProps) {
  // Filter out animation paths and character elements (characters will be shown under their group parent)
  const shapes = elements.filter(element => !element.isAnimationPath && element.type !== 'character');
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const [expandedShapes, setExpandedShapes] = useState<Set<string>>(new Set());
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [draggedItem, setDraggedItem] = useState<{id: string, type: 'element' | 'group'} | null>(null);
  const [dragOverItem, setDragOverItem] = useState<{id: string, type: 'element' | 'group'} | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuPosition | null>(null);

  // Helper function to get characters for a text group
  const getCharactersForTextGroup = (groupId: string): AnimatedCanvasObject[] => {
    const group = groups.find(g => g.id === groupId && g.type === 'text');
    if (!group) return [];
    
    return elements
      .filter(el => el.type === 'character' && group.elementIds.includes(el.id))
      .sort((a, b) => (a.characterIndex || 0) - (b.characterIndex || 0));
  };

  // Helper function to get group elements (non-character elements)
  const getGroupElements = (groupId: string): AnimatedCanvasObject[] => {
    const group = groups.find(g => g.id === groupId);
    if (!group) return [];
    
    return elements.filter(el => group.elementIds.includes(el.id) && el.type !== 'character');
  };

  // Helper functions for parent-child relationships
  const getChildElements = (parentId: string): AnimatedCanvasObject[] => {
    return elements.filter(el => el.parent === parentId);
  };

  const getChildGroups = (parentId: string): CanvasGroup[] => {
    return groups.filter(group => group.parent === parentId);
  };

  const getRootElements = (): AnimatedCanvasObject[] => {
    const rootElements = shapes.filter(element => {
      const group = groups.find(g => g.elementIds.includes(element.id));
      const isRoot = (!group || group.isDefaultGroup) && !element.parent;
      console.log(`Element ${element.name} (${element.id}):`, { 
        hasParent: !!element.parent, 
        parent: element.parent, 
        isRoot,
        inGroup: !!group && !group.isDefaultGroup 
      });
      return isRoot;
    });
    console.log('Root elements:', rootElements.map(e => e.name));
    return rootElements;
  };

  const getRootGroups = (): CanvasGroup[] => {
    return groups.filter(group => !group.isDefaultGroup && !group.parent);
  };

  /**
   * Validates whether a dragged item can be dropped on a target.
   * Enforces the following constraints:
   * 1. Shapes cannot be dragged into other shapes - only into groups
   * 2. Shapes cannot be dragged into text groups (type === 'text')
   * 3. Prevents circular dependencies
   */
  const canDropOnTarget = (draggedId: string, draggedType: 'element' | 'group', targetId: string, targetType: 'element' | 'group'): boolean => {
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

  const getAnimationIcon = (animationType: string) => {
    const iconMap: Record<string, string> = {
      'move': '🔄',
      'rotate': '↻',
      'scale': '⚏',
      'color': '🎨',
      'fade': '👻',
      'path': '📍'
    };
    return iconMap[animationType] || '⚡';
  };

  const getShapeIcon = (shapeType: string) => {
    const iconMap: Record<string, string> = {
      'rectangle': '▭',
      'circle': '○',
      'triangle': '△',
      'line': '—',
      'path': '〰️',
      'image': '🖼️',
      'text': '📝',
      'textGroup': '📄',
      'character': '🔤'
    };
    return iconMap[shapeType] || '◻️';
  };

  const getGroupIcon = (groupType: string) => {
    const iconMap: Record<string, string> = {
      'text': '📄',
      'custom': '📦',
      'polygon': '◇'
    };
    return iconMap[groupType] || '📦';
  };

  const toggleShapeExpansion = (shapeId: string) => {
    setExpandedShapes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(shapeId)) {
        newSet.delete(shapeId);
      } else {
        newSet.add(shapeId);
      }
      return newSet;
    });
  };

  const toggleGroupExpansion = (groupId: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };

  // Auto-expand shapes when their animations are selected from other parts of the UI
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection) {
        setExpandedShapes(prev => {
          const newSet = new Set(prev);
          newSet.add(selection.elementId);
          return newSet;
        });
      }
    });
  }, [animationSelectionManager]);

  const handleEmptySpaceClick = (e: React.MouseEvent) => {
    // Only deselect if clicking directly on the aside element (empty space)
    if (e.target === e.currentTarget) {
      onClearSelection();
      animationSelectionManager.clearSelection();
    }
    // Close context menu when clicking elsewhere
    setContextMenu(null);
  };

  // Context menu handlers
  const handleContextMenu = (e: React.MouseEvent, targetId: string, targetType: 'element' | 'group') => {
    e.preventDefault();
    e.stopPropagation();
    
    // Use context menu manager to ensure only one menu is shown
    const menuId = 'scene-explorer-context-menu';
    contextMenuManager.openContextMenu(menuId);
    
    // Get the element's bounding box to align context menu horizontally
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    
    setContextMenu({
      x: rect.left, // Align horizontally with the left edge of the element
      y: rect.bottom, // Position 8px below the bottom of the element
      targetId,
      targetType
    });
  };

  const handleContextMenuAction = (action: string) => {
    if (!contextMenu) return;

    const { targetId, targetType } = contextMenu;
    
    switch (action) {
      case 'copy':
        if (targetType === 'element' && onCopyElement) {
          onCopyElement(targetId);
        } else if (targetType === 'group' && onCopyGroup) {
          onCopyGroup(targetId);
        }
        break;
      case 'group':
        if (targetType === 'element' && onGroupElements) {
          onGroupElements([targetId]);
        }
        break;
      case 'moveToFront':
        if (onMoveToFront) {
          onMoveToFront(targetId, targetType === 'element');
        }
        break;
      case 'moveToBack':
        if (onMoveToBack) {
          onMoveToBack(targetId, targetType === 'element');
        }
        break;
    }
    
    setContextMenu(null);
  };

  // Close context menu on outside clicks and global close events
  useEffect(() => {
    const handleClickOutside = () => {
      setContextMenu(null);
      contextMenuManager.closeAllContextMenus();
    };
    
    const handleGlobalClose = () => {
      setContextMenu(null);
    };

    if (contextMenu) {
      document.addEventListener('click', handleClickOutside);
      window.addEventListener('close-context-menu', handleGlobalClose);
      return () => {
        document.removeEventListener('click', handleClickOutside);
        window.removeEventListener('close-context-menu', handleGlobalClose);
      };
    }
  }, [contextMenu]);

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
      console.log('Setting parent:', { childId: draggedItem.id, parentId: targetId, childType: draggedItem.type });
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

  // Helper method to properly select a group
  const selectGroup = (group: CanvasGroup, isMultiSelect: boolean = false) => {
    onGroupSelect(group, isMultiSelect);
  };

  // Helper function to check if an element is selected
  const isElementSelected = (element: AnimatedCanvasObject) => {
    return selectedElements.some(el => el.id === element.id);
  };

  // Helper function to check if a group is selected
  const isGroupSelected = (group: CanvasGroup) => {
    return selectedGroups.some(g => g.id === group.id);
  };

  // Component to render hierarchical element
  const renderHierarchicalElement = (element: AnimatedCanvasObject, depth: number = 0): React.ReactNode => {
    const hasAnimations = element.animations.length > 0;
    const isExpanded = expandedShapes.has(element.id);
    const children = getChildElements(element.id);
    const childGroups = getChildGroups(element.id);
    const hasChildren = children.length > 0 || childGroups.length > 0;
    const shouldShowExpandButton = (hasAnimations && element.type !== 'textGroup') || hasChildren;
    const isDraggedOver = dragOverItem?.id === element.id && dragOverItem?.type === 'element';
    const isDragging = draggedItem?.id === element.id && draggedItem?.type === 'element';

    return (
      <li key={element.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center">
          {/* Collapse/Expand Button for children */}
          {shouldShowExpandButton && (
            <button
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleShapeExpansion(element.id);
              }}
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {/* Element Content */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, element.id, 'element')}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, element.id, 'element')}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, element.id, 'element')}
            onContextMenu={(e) => handleContextMenu(e, element.id, 'element')}
            className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 flex items-center gap-2 transition-colors ${
              isElementSelected(element) ? 'bg-blue-100 text-blue-600' : ''
            } ${element.visible === false ? 'opacity-50' : ''} ${
              isDraggedOver ? 'bg-green-100 border-2 border-green-400' : ''
            } ${isDragging ? 'opacity-50' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              const isMultiSelect = e.metaKey || e.ctrlKey;
              onElementSelect(element, isMultiSelect);
              animationSelectionManager.clearSelection();
            }}
          >
            <span className="text-sm">{getShapeIcon(element.type)}</span>
            <span className="flex-1">{element.name}</span>
            {hasAnimations && (
              <span className="text-xs text-gray-500">({element.animations.length} anim)</span>
            )}
            {hasChildren && (
              <span className="text-xs text-gray-400">({children.length + childGroups.length} children)</span>
            )}
          </div>
          
          {/* Element Visibility Toggle */}
          <button
            className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 rounded text-gray-500 hover:text-gray-700"
            onClick={(e) => {
              e.stopPropagation();
              const newVisible = !(element.visible ?? true);
              onElementVisibilityChange(element.id, newVisible);
            }}
            title={`${element.visible === false ? 'Show' : 'Hide'} element`}
          >
            {element.visible === false ? (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
              </svg>
            ) : (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Children and Animations */}
        {isExpanded && (
          <ul className="ml-6 mt-1 space-y-1">
            {/* Child Groups */}
            {childGroups.map(childGroup => renderHierarchicalGroup(childGroup, depth + 1))}
            
            {/* Child Elements */}
            {children.map(child => renderHierarchicalElement(child, depth + 1))}
            
            {/* Element Animations */}
            {hasAnimations && element.animations.map(animation => (
              <li key={animation.id}>
                <div 
                  className="px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    onElementSelect(element);
                  }}
                >
                  <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                  <span className="flex-1">{animation.type}</span>
                  <span className="text-xs text-gray-400">
                    {animation.startTime.toFixed(1)}s → {(animation.startTime + animation.duration).toFixed(1)}s
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  // Component to render hierarchical group
  const renderHierarchicalGroup = (group: CanvasGroup, depth: number = 0): React.ReactNode => {
    const isGroupExpanded = expandedGroups.has(group.id);
    const groupElements = getGroupElements(group.id);
    const characters = group.type === 'text' ? getCharactersForTextGroup(group.id) : [];
    const hasAnimations = group.animations.length > 0;
    const hasCharacters = characters.length > 0;
    const hasElements = groupElements.length > 0;
    const children = getChildElements(group.id);
    const childGroups = getChildGroups(group.id);
    const hasChildren = children.length > 0 || childGroups.length > 0;
    const shouldShowExpandButton = hasAnimations || hasCharacters || (hasElements && group.type !== 'text' && group.type !== 'polygon') || hasChildren;
    const isSelected = isGroupSelected(group);
    const isDraggedOver = dragOverItem?.id === group.id && dragOverItem?.type === 'group';
    const isDragging = draggedItem?.id === group.id && draggedItem?.type === 'group';

    return (
      <li key={group.id} style={{ marginLeft: `${depth * 16}px` }}>
        <div className="flex items-center">
          {/* Collapse/Expand Button */}
          {shouldShowExpandButton && (
            <button
              className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
              onClick={(e) => {
                e.stopPropagation();
                toggleGroupExpansion(group.id);
              }}
            >
              <svg 
                className={`w-3 h-3 transition-transform ${isGroupExpanded ? 'rotate-90' : ''}`}
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          
          {/* Group Content */}
          <div className="flex items-center gap-1">
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, group.id, 'group')}
              onDragEnd={handleDragEnd}
              onDragOver={(e) => handleDragOver(e, group.id, 'group')}
              onDragLeave={handleDragLeave}
              onDrop={(e) => handleDrop(e, group.id, 'group')}
              onContextMenu={(e) => handleContextMenu(e, group.id, 'group')}
              className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-purple-600 flex items-center gap-2 transition-colors ${
                isSelected ? 'bg-purple-100 text-purple-600' : ''
              } ${group.visible === false ? 'opacity-50' : ''} ${
                isDraggedOver ? 'bg-green-100 border-2 border-green-400' : ''
              } ${isDragging ? 'opacity-50' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                const isMultiSelect = e.metaKey || e.ctrlKey;
                selectGroup(group, isMultiSelect);
                animationSelectionManager.clearSelection();
              }}
            >
              <span className="text-sm">{getGroupIcon(group.type)}</span>
              <span className="flex-1">{group.name}</span>
              {hasAnimations && (
                <span className="text-xs text-gray-500">({group.animations.length} anim)</span>
              )}
              {hasChildren && (
                <span className="text-xs text-gray-400">({children.length + childGroups.length} children)</span>
              )}
            </div>
            
            {/* Visibility Toggle */}
            <button
              className="w-5 h-5 flex items-center justify-center hover:bg-gray-300 rounded text-gray-500 hover:text-gray-700"
              onClick={(e) => {
                e.stopPropagation();
                const newVisible = !(group.visible ?? true);
                onGroupVisibilityChange(group.id, newVisible);
              }}
              title={`${group.visible === false ? 'Show' : 'Hide'} group`}
            >
              {group.visible === false ? (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                  <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                </svg>
              ) : (
                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                  <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                </svg>
              )}
            </button>
          </div>
        </div>
        
        {/* Group Children */}
        {isGroupExpanded && (
          <ul className="ml-6 mt-1 space-y-1">
            {/* For text groups, show characters */}
            {group.type === 'text' && hasCharacters && characters.map(character => (
              <li key={character.id}>
                <div className="flex items-center gap-1">
                  <div 
                    className={`flex-1 px-2 py-1 rounded flex items-center gap-2 text-sm opacity-50 cursor-not-allowed ${
                      character.visible === false ? 'opacity-25' : ''
                    }`}
                    title="Characters cannot be selected individually. Select the text group instead."
                  >
                    <span className="text-xs">{getShapeIcon(character.type)}</span>
                    <span className="flex-1">{character.character || 'char'}</span>
                    <span className="text-xs text-gray-400">#{character.characterIndex}</span>
                  </div>
                  
                  {/* Character Visibility Toggle */}
                  <button
                    className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newVisible = !(character.visible ?? true);
                      onElementVisibilityChange(character.id, newVisible);
                    }}
                    title={`${character.visible === false ? 'Show' : 'Hide'} character`}
                  >
                    {character.visible === false ? (
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </li>
            ))}

            {/* For custom groups, show elements (polygon groups are not expandable) */}
            {group.type === 'custom' && hasElements && groupElements.map(element => (
              <li key={element.id}>
                <div className="flex items-center gap-1">
                  <div 
                    className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-blue-600 flex items-center gap-2 text-sm ${
                      isElementSelected(element) ? 'bg-blue-100 text-blue-700' : ''
                    } ${isSelected ? 'opacity-50 cursor-not-allowed' : ''} ${element.visible === false ? 'opacity-50' : ''}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isSelected) return; // Prevent element selection if group is selected
                      const isMultiSelect = e.metaKey || e.ctrlKey;
                      onElementSelect(element, isMultiSelect);
                      animationSelectionManager.clearSelection();
                    }}
                  >
                    <span className="text-xs">{getShapeIcon(element.type)}</span>
                    <span className="flex-1">{element.name}</span>
                    {element.animations.length > 0 && (
                      <span className="text-xs text-gray-400">({element.animations.length} anim)</span>
                    )}
                  </div>
                  
                  {/* Element Visibility Toggle */}
                  <button
                    className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded text-gray-400 hover:text-gray-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newVisible = !(element.visible ?? true);
                      onElementVisibilityChange(element.id, newVisible);
                    }}
                    title={`${element.visible === false ? 'Show' : 'Hide'} element`}
                  >
                    {element.visible === false ? (
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                        <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                      </svg>
                    ) : (
                      <svg className="w-2.5 h-2.5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                        <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </li>
            ))}

            {/* Child Groups */}
            {childGroups.map(childGroup => renderHierarchicalGroup(childGroup, depth + 1))}
            
            {/* Child Elements */}
            {children.map(child => renderHierarchicalElement(child, depth + 1))}

            {/* Group Animations */}
            {hasAnimations && group.animations.map(animation => (
              <li key={animation.id}>
                <div 
                  className="px-2 py-1 rounded cursor-pointer hover:bg-gray-100 hover:text-green-600 flex items-center gap-2 text-sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Need to select group for animation
                    const elementsInGroup = elements.filter(el => group.elementIds.includes(el.id));
                    if (elementsInGroup.length > 0) {
                      onElementSelect(elementsInGroup[0]);
                      // For group animations, we'll handle selection differently
                    }
                  }}
                >
                  <span className="text-xs">{getAnimationIcon(animation.type)}</span>
                  <span className="flex-1">{animation.type}</span>
                  <span className="text-xs text-gray-400">
                    {animation.startTime.toFixed(1)}s → {(animation.startTime + animation.duration).toFixed(1)}s
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  };

  return (
    <div 
      className="h-full p-2 text-gray-800"
      onClick={handleEmptySpaceClick}
      onDragOver={(e) => {
        e.preventDefault();
        if (draggedItem) {
          e.dataTransfer.dropEffect = 'move';
        }
      }}
      onDrop={handleDropOnRoot}
    >
      <h3 className="font-semibold mb-2">Scenes</h3>
      <ul>
        <li>
          <details open>
            <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
            <ul className="ml-4 mt-1 space-y-1">
              {/* Render root groups (groups without parents) */}
              {getRootGroups().map(group => renderHierarchicalGroup(group, 0))}
              
              {/* Render root elements (elements without parents and not in non-default groups) */}
              {getRootElements().map(element => renderHierarchicalElement(element, 0))}

              {/* Empty state */}
              {getRootGroups().length === 0 && getRootElements().length === 0 && (
                <li className="px-2 py-4 text-gray-500 text-center">
                  No elements to display
                </li>
              )}
            </ul>
          </details>
        </li>
      </ul>

      {/* Context Menu */}
              <ContextMenu
          contextMenu={contextMenu}
          onAction={handleContextMenuAction}
          onClose={() => setContextMenu(null)}
        />
    </div>
  );
} 