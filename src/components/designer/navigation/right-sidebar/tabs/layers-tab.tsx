import { useEffect, FC, useState, useRef } from 'react';
import { Eye, EyeOff, Square, Circle, Type, Image as ImageIcon, Minus, Folder, ChevronDown, ChevronRight, X, Code, GripVertical } from 'lucide-react';
import Image from 'next/image';
import { useCanvasElements, useCanvasGroups, useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

// Component to render image thumbnails for image/SVG/component elements
const ElementThumbnail: FC<{ element: AnimatedCanvasObject; className?: string }> = ({ element, className = "w-4 h-4" }) => {
  const [imageError, setImageError] = useState(false);

  // Check if this element should show a thumbnail
  const shouldShowThumbnail = element.type === 'image' ||
    (element.type === 'path' && element.isAnimationPath === false);

  if (!shouldShowThumbnail || imageError) {
    // Fallback to icon
    const IconComponent = getElementIcon(element.type);
    return <IconComponent className={`${className} text-purple-600`} />;
  }

  // Try to get image source from element
  const imageSrc = element.imageData;

  if (!imageSrc) {
    // Fallback to icon if no image source
    const IconComponent = getElementIcon(element.type);
    return <IconComponent className={`${className} text-purple-600`} />;
  }

  // Convert SVG content to data URL if needed
  let processedImageSrc = imageSrc;
  if (imageSrc.includes('<svg') && !imageSrc.startsWith('data:')) {
    try {
      const base64 = window.btoa(unescape(encodeURIComponent(imageSrc)));
      processedImageSrc = `data:image/svg+xml;base64,${base64}`;
    } catch (error) {
      console.warn('Failed to convert SVG to data URL:', error);
      processedImageSrc = imageSrc;
    }
  }

  return (
    <div className={`${className} relative overflow-hidden rounded border border-gray-200 bg-gray-50 flex items-center justify-center`}>
      {processedImageSrc.startsWith('data:image/svg') || processedImageSrc.includes('<svg') ? (
        // Handle SVG content
        <div
          className="w-full h-full flex items-center justify-center"
          dangerouslySetInnerHTML={{ __html: processedImageSrc.includes('<svg') ? processedImageSrc : '' }}
        />
      ) : (
        <Image
          src={processedImageSrc}
          alt={element.name}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
          onLoad={() => setImageError(false)}
          unoptimized={processedImageSrc.startsWith('data:')}
        />
      )}
    </div>
  );
};

// Helper function to get element icon (moved outside component for reuse)
const getElementIcon = (type: string) => {
  switch (type) {
    case 'rectangle': return Square;
    case 'circle': return Circle;
    case 'text': return Type;
    case 'code-editor': return Code;
    case 'image': return ImageIcon;
    case 'line':
    case 'simpleLine': return Minus;
    default: return Square;
  }
};

export const LayersTab: FC = () => {
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const { setElementVisibility, setGroupVisibility, updateElement, updateGroup, reorderElements, reorderElementsInGroup, reorderGroups } = useCanvasOperations();
  const { selectedElements, selectedGroups, select: selectElement, selectGroup, updateSelectedGroups } = useSelectionStore();
  const setActiveRightPanel = useSetActiveRightPanel();
  const [lastSelectedElementId, setLastSelectedElementId] = useState<string | null>(null);
  const [editingElementId, setEditingElementId] = useState<string | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');
  const nameInputRef = useRef<HTMLInputElement | null>(null);
  const commitByEnterRef = useRef<boolean>(false);

  // Drag and drop state
  const [draggedElementId, setDraggedElementId] = useState<string | null>(null);
  const [draggedGroupId, setDraggedGroupId] = useState<string | null>(null);
  const [dragOverElementId, setDragOverElementId] = useState<string | null>(null);
  const [dragOverGroupId, setDragOverGroupId] = useState<string | null>(null);
  const [dragContext, setDragContext] = useState<'ungrouped' | 'group' | 'groups' | null>(null);

  // State for collapsed groups - initialize with all groups collapsed
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(() => {
    const nonDefaultGroups = groups.filter(group => !group.isDefaultGroup);
    return new Set(nonDefaultGroups.map(group => group.id));
  });

  // Keep selection store in sync with current groups
  useEffect(() => {
    updateSelectedGroups(groups);
  }, [groups, updateSelectedGroups]);

  // Keep collapsed groups in sync when new groups are added
  useEffect(() => {
    const nonDefaultGroups = groups.filter(group => !group.isDefaultGroup);
    const newGroupIds = nonDefaultGroups.map(group => group.id);
    
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      // Add any new groups to collapsed state
      newGroupIds.forEach(id => {
        if (!newSet.has(id)) {
          newSet.add(id);
        }
      });
      return newSet;
    });
  }, [groups]);

  // Focus the input when starting to edit
  useEffect(() => {
    if (editingElementId || editingGroupId) {
      nameInputRef.current?.focus();
      nameInputRef.current?.select();
    }
  }, [editingElementId, editingGroupId]);

  const startEditElement = (element: AnimatedCanvasObject) => {
    setEditingGroupId(null);
    setEditingElementId(element.id);
    setEditingName(element.name || '');
  };

  const commitEditElement = (element: AnimatedCanvasObject) => {
    const newName = editingName.trim();
    setEditingElementId(null);
    if (newName && newName !== element.name) {
      updateElement(element.id, { name: newName });
    }
  };

  const startEditGroup = (group: CanvasGroup) => {
    setEditingElementId(null);
    setEditingGroupId(group.id);
    setEditingName(group.name || '');
  };

  const commitEditGroup = (group: CanvasGroup) => {
    const newName = editingName.trim();
    setEditingGroupId(null);
    if (newName && newName !== group.name) {
      updateGroup(group.id, { name: newName });
    }
  };



  const toggleGroupCollapse = (groupId: string) => {
    setCollapsedGroups(prev => {
      const newSet = new Set(prev);
      if (newSet.has(groupId)) {
        newSet.delete(groupId);
      } else {
        newSet.add(groupId);
      }
      return newSet;
    });
  };



  const handleElementClick = (element: AnimatedCanvasObject, event?: React.MouseEvent) => {
    if (event?.shiftKey) {
      // Build a flat list of visible elements in render order
      const visibleElements: AnimatedCanvasObject[] = [];
      const nonDefaultGroups = groups.filter(group => !group.isDefaultGroup);
      for (const group of nonDefaultGroups) {
        const isCollapsed = collapsedGroups.has(group.id);
        if (!isCollapsed) {
          const elementsInGroup = canvasObjects.filter(el => el.groupId === group.id);
          visibleElements.push(...elementsInGroup);
        }
      }
      // Ungrouped elements appear after grouped ones
      const ungroupedElementsLocal = canvasObjects.filter(el => {
        if (!el.groupId) return true;
        const group = groups.find(g => g.id === el.groupId);
        return !group || group.isDefaultGroup;
      });
      visibleElements.push(...ungroupedElementsLocal);

      const clickedIndex = visibleElements.findIndex(el => el.id === element.id);
      // Determine anchor: lastSelectedElementId, or last currently selected, else clicked itself
      const fallbackAnchorId = selectedElements.length > 0 ? selectedElements[selectedElements.length - 1].id : element.id;
      const anchorId = lastSelectedElementId || fallbackAnchorId;
      let anchorIndex = visibleElements.findIndex(el => el.id === anchorId);
      if (anchorIndex === -1) {
        anchorIndex = clickedIndex;
      }

      if (clickedIndex !== -1 && anchorIndex !== -1) {
        const start = Math.min(anchorIndex, clickedIndex);
        const end = Math.max(anchorIndex, clickedIndex);
        const rangeSelection = visibleElements.slice(start, end + 1);
        selectElement(rangeSelection);
        setLastSelectedElementId(element.id);
        return;
      }
    }

    if (event && (event.metaKey || event.ctrlKey)) {
      // Multi-select: toggle add/remove
      selectElement(element, true);
      setLastSelectedElementId(element.id);
    } else {
      // Single select: replace selection
      selectElement([element]);
      setLastSelectedElementId(element.id);
    }
  };

  const handleGroupClick = (group: CanvasGroup, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    selectGroup(group);
  };

  const handleElementVisibilityToggle = (e: React.MouseEvent, element: AnimatedCanvasObject) => {
    e.stopPropagation(); // Prevent element selection
    setElementVisibility(element.id, element.visible === false);
  };

  const handleGroupVisibilityToggle = (e: React.MouseEvent, group: CanvasGroup) => {
    e.stopPropagation(); // Prevent group selection
    setGroupVisibility(group.id, group.visible === false);
  };

  // Drag and drop handlers for elements
  const handleElementDragStart = (e: React.DragEvent, element: AnimatedCanvasObject, context: 'ungrouped' | 'group', groupId?: string) => {
    setDraggedElementId(element.id);
    setDragContext(context);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ elementId: element.id, context, groupId }));
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleElementDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedElementId(null);
    setDragOverElementId(null);
    setDragContext(null);
  };

  const handleElementDragOver = (e: React.DragEvent, element: AnimatedCanvasObject) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedElementId && draggedElementId !== element.id) {
      setDragOverElementId(element.id);
    }
  };

  const handleElementDrop = (e: React.DragEvent, dropElement: AnimatedCanvasObject, context: 'ungrouped' | 'group', groupId?: string) => {
    e.preventDefault();
    
    if (!draggedElementId || draggedElementId === dropElement.id) return;

    if (context === 'ungrouped' && dragContext === 'ungrouped') {
      // Reorder ungrouped elements
      const ungroupedEls = ungroupedElements.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      const elementIds = ungroupedEls.map(el => el.id);
      const draggedIndex = elementIds.indexOf(draggedElementId);
      const dropIndex = elementIds.indexOf(dropElement.id);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newOrder = [...elementIds];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        
        // Reverse the order since highest z-index should be first
        reorderElements(elementIds, newOrder.reverse());
      }
    } else if (context === 'group' && dragContext === 'group' && groupId) {
      // Reorder elements within the same group
      const groupEls = groupedElements
        .filter(el => el.groupId === groupId)
        .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0));
      const elementIds = groupEls.map(el => el.id);
      const draggedIndex = elementIds.indexOf(draggedElementId);
      const dropIndex = elementIds.indexOf(dropElement.id);
      
      if (draggedIndex !== -1 && dropIndex !== -1) {
        const newOrder = [...elementIds];
        const [removed] = newOrder.splice(draggedIndex, 1);
        newOrder.splice(dropIndex, 0, removed);
        
        // Reverse the order since highest z-index should be first
        reorderElementsInGroup(groupId, elementIds, newOrder.reverse());
      }
    }
    
    setDraggedElementId(null);
    setDragOverElementId(null);
    setDragContext(null);
  };

  // Drag and drop handlers for groups
  const handleGroupDragStart = (e: React.DragEvent, group: CanvasGroup) => {
    setDraggedGroupId(group.id);
    setDragContext('groups');
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify({ groupId: group.id }));
    
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleGroupDragEnd = (e: React.DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
    
    setDraggedGroupId(null);
    setDragOverGroupId(null);
    setDragContext(null);
  };

  const handleGroupDragOver = (e: React.DragEvent, group: CanvasGroup) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedGroupId && draggedGroupId !== group.id) {
      setDragOverGroupId(group.id);
    }
  };

  const handleGroupDrop = (e: React.DragEvent, dropGroup: CanvasGroup) => {
    e.preventDefault();
    
    if (!draggedGroupId || draggedGroupId === dropGroup.id || dragContext !== 'groups') return;

    const nonDefaultGroups = groups.filter(g => !g.isDefaultGroup);
    const groupIds = nonDefaultGroups.map(g => g.id);
    const draggedIndex = groupIds.indexOf(draggedGroupId);
    const dropIndex = groupIds.indexOf(dropGroup.id);
    
    if (draggedIndex !== -1 && dropIndex !== -1) {
      const newOrder = [...groupIds];
      const [removed] = newOrder.splice(draggedIndex, 1);
      newOrder.splice(dropIndex, 0, removed);
      
      // Groups are displayed in reverse z-index order (highest first)
      // So we need to reverse before passing to reorderGroups
      reorderGroups(groupIds, newOrder.reverse());
    }
    
    setDraggedGroupId(null);
    setDragOverGroupId(null);
    setDragContext(null);
  };

  const isElementSelected = (elementId: string) => {
    return selectedElements.some(el => el.id === elementId);
  };

  const isGroupSelected = (groupId: string) => {
    return selectedGroups.some(group => group.id === groupId);
  };

  // Group elements by their groupId, treating default groups as ungrouped
  const ungroupedElements = canvasObjects.filter(el => {
    if (!el.groupId) return true;
    const group = groups.find(g => g.id === el.groupId);
    return !group || group.isDefaultGroup;
  });
  const groupedElements = canvasObjects.filter(el => {
    if (!el.groupId) return false;
    const group = groups.find(g => g.id === el.groupId);
    return group && !group.isDefaultGroup;
  });

  return (
    <div className="h-full p-4 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-2 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h3 className="font-semibold text-red-500 text-sm">Layers</h3>
          </div>
          <button
            onClick={() => setActiveRightPanel(null)}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div
        className="flex-1 px-1 py-4 overflow-y-auto"
        onClick={(e) => {
          // Deselect when clicking on the scroll area background/padding
          if (e.currentTarget === e.target) {
            selectElement(null);
            setLastSelectedElementId(null);
          }
        }}
      >
        <div
          className="space-y-2 text-sm"
          onClick={(e) => {
            // Deselect when clicking on empty space between items
            if (e.currentTarget === e.target) {
              selectElement(null);
              setLastSelectedElementId(null);
            }
          }}
        >

          {/* Groups */}
          {groups.filter(group => !group.isDefaultGroup).length > 0 && (
            <div className="space-y-1">
              {groups.filter(group => !group.isDefaultGroup).map((group) => {
                const isCollapsed = collapsedGroups.has(group.id);
                const isDraggingGroup = draggedGroupId === group.id;
                const isDragOverGroup = dragOverGroupId === group.id;
                
                return (
                  <div key={group.id} className="space-y-1">
                    <div
                      draggable={!editingGroupId}
                      onDragStart={(e) => handleGroupDragStart(e, group)}
                      onDragEnd={handleGroupDragEnd}
                      onDragOver={(e) => handleGroupDragOver(e, group)}
                      onDrop={(e) => handleGroupDrop(e, group)}
                      className={`w-full p-2 rounded-lg transition-all group cursor-move ${
                        isGroupSelected(group.id)
                          ? 'bg-indigo-100 border border-indigo-200'
                          : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      } ${isDraggingGroup ? 'opacity-50' : ''} ${
                        isDragOverGroup ? 'border-t-2 border-t-blue-500 bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleGroupCollapse(group.id);
                          }}
                          className="p-0.5 hover:bg-gray-200 rounded transition-colors"
                          title={isCollapsed ? 'Expand group' : 'Collapse group'}
                        >
                          {isCollapsed ? (
                            <ChevronRight className="w-3 h-3 text-gray-500" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-gray-500" />
                          )}
                        </button>
                        <Folder className="w-4 h-4 text-purple-600" />
                        {editingGroupId === group.id ? (
                          <input
                            ref={nameInputRef}
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onBlur={() => {
                              if (commitByEnterRef.current) {
                                commitByEnterRef.current = false;
                                return;
                              }
                              commitEditGroup(group);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                e.stopPropagation();
                                commitByEnterRef.current = true;
                                commitEditGroup(group);
                              }
                              if (e.key === 'Escape') setEditingGroupId(null);
                            }}
                            onClick={(e) => e.stopPropagation()}
                            className="flex-1 text-xs px-1 py-0.5 border border-indigo-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-400"
                          />
                        ) : (
                          <button
                            onClick={(e) => handleGroupClick(group, e)}
                            onDoubleClick={(e) => { e.stopPropagation(); startEditGroup(group); }}
                            className="text-gray-700 flex-1 truncate text-left hover:text-indigo-600 transition-colors"
                          >
                            {group.name}
                          </button>
                        )}
                        
                        {/* Group Actions */}
                        <div className="flex items-center gap-1">
                          {!editingGroupId && (
                            <div 
                              className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors hover:bg-gray-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
                              title="Drag to reorder"
                            >
                              <GripVertical className="w-3 h-3" />
                            </div>
                          )}
                          <button
                            onClick={(e) => handleGroupVisibilityToggle(e, group)}
                            className="p-1 hover:bg-white rounded transition-colors"
                            title={group.visible !== false ? 'Hide group' : 'Show group'}
                          >
                            {group.visible !== false ? (
                              <Eye className="w-4 h-4 text-green-600" />
                            ) : (
                              <EyeOff className="w-4 h-4 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Group Elements - only show if not collapsed */}
                    {!isCollapsed && (
                      <div className="ml-4 space-y-1">
                        {groupedElements
                          .filter(el => el.groupId === group.id)
                          .sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
                          .map((element) => {
                            const isDraggingElement = draggedElementId === element.id;
                            const isDragOverElement = dragOverElementId === element.id;
                            
                            return (
                              <div
                                key={element.id}
                                draggable={!editingElementId}
                                onDragStart={(e) => handleElementDragStart(e, element, 'group', group.id)}
                                onDragEnd={handleElementDragEnd}
                                onDragOver={(e) => handleElementDragOver(e, element)}
                                onDrop={(e) => handleElementDrop(e, element, 'group', group.id)}
                                className={`w-full p-2 rounded transition-all group cursor-move ${
                                  isElementSelected(element.id)
                                    ? 'bg-blue-100 border border-blue-200'
                                    : 'bg-white hover:bg-gray-50 border border-gray-200'
                                } ${isDraggingElement ? 'opacity-50' : ''} ${
                                  isDragOverElement ? 'border-t-2 border-t-blue-500 bg-blue-50' : ''
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ElementThumbnail element={element} />
                                  {editingElementId === element.id ? (
                                    <input
                                      ref={nameInputRef}
                                      value={editingName}
                                      onChange={(e) => setEditingName(e.target.value)}
                                      onBlur={() => {
                                        if (commitByEnterRef.current) {
                                          commitByEnterRef.current = false;
                                          return;
                                        }
                                        commitEditElement(element);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          e.preventDefault();
                                          e.stopPropagation();
                                          commitByEnterRef.current = true;
                                          commitEditElement(element);
                                        }
                                        if (e.key === 'Escape') setEditingElementId(null);
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="flex-1 text-xs px-1 py-0.5 border border-blue-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                                    />
                                  ) : (
                                    <button
                                      onClick={(e) => handleElementClick(element, e)}
                                      onDoubleClick={(e) => { e.stopPropagation(); startEditElement(element); }}
                                      className="text-xs text-gray-700 flex-1 truncate text-left hover:text-blue-600 transition-colors"
                                    >
                                      {element.name}
                                    </button>
                                  )}
                                  
                                  {/* Element Actions */}
                                  <div className="flex items-center gap-1">
                                    {!editingElementId && (
                                      <div 
                                        className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors hover:bg-gray-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
                                        title="Drag to reorder"
                                      >
                                        <GripVertical className="w-3 h-3" />
                                      </div>
                                    )}
                                    <button
                                      onClick={(e) => handleElementVisibilityToggle(e, element)}
                                      className="p-1 hover:bg-gray-100 rounded transition-colors"
                                      title={element.visible !== false ? 'Hide element' : 'Show element'}
                                    >
                                      {element.visible !== false ? (
                                        <Eye className="w-4 h-4 text-green-600" />
                                      ) : (
                                        <EyeOff className="w-4 h-4 text-gray-400" />
                                      )}
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Ungrouped Elements */}
          {ungroupedElements.length > 0 && (
            <div className="space-y-1">
              {ungroupedElements.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0)).map((element) => {
                const isDraggingElement = draggedElementId === element.id;
                const isDragOverElement = dragOverElementId === element.id;
                
                return (
                  <div
                    key={element.id}
                    draggable={!editingElementId}
                    onDragStart={(e) => handleElementDragStart(e, element, 'ungrouped')}
                    onDragEnd={handleElementDragEnd}
                    onDragOver={(e) => handleElementDragOver(e, element)}
                    onDrop={(e) => handleElementDrop(e, element, 'ungrouped')}
                    className={`w-full py-2 pl-8 pr-2 rounded-lg transition-all group cursor-move ${
                      isElementSelected(element.id)
                        ? 'bg-blue-100 border border-blue-200'
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    } ${isDraggingElement ? 'opacity-50' : ''} ${
                      isDragOverElement ? 'border-t-2 border-t-blue-500 bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ElementThumbnail element={element} />
                      {editingElementId === element.id ? (
                        <input
                          ref={nameInputRef}
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onBlur={() => {
                            if (commitByEnterRef.current) {
                              commitByEnterRef.current = false;
                              return;
                            }
                            commitEditElement(element);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              e.stopPropagation();
                              commitByEnterRef.current = true;
                              commitEditElement(element);
                            }
                            if (e.key === 'Escape') setEditingElementId(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 text-sm px-1 py-0.5 border border-blue-300 rounded bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-400"
                        />
                      ) : (
                        <button
                          onClick={(e) => handleElementClick(element, e)}
                          onDoubleClick={(e) => { e.stopPropagation(); startEditElement(element); }}
                          className="text-gray-700 flex-1 truncate text-left hover:text-blue-600 transition-colors"
                        >
                          {element.name}
                        </button>
                      )}
                      
                      {/* Element Actions */}
                      <div className="flex items-center gap-1">
                        {!editingElementId && (
                          <div 
                            className="p-1 text-gray-400 hover:text-gray-600 rounded transition-colors hover:bg-gray-200 cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100"
                            title="Drag to reorder"
                          >
                            <GripVertical className="w-3 h-3" />
                          </div>
                        )}
                        <button
                          onClick={(e) => handleElementVisibilityToggle(e, element)}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title={element.visible !== false ? 'Hide element' : 'Show element'}
                        >
                          {element.visible !== false ? (
                            <Eye className="w-4 h-4 text-green-600" />
                          ) : (
                            <EyeOff className="w-4 h-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Empty State */}
          {canvasObjects.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              <span className="text-2xl block mb-2">📄</span>
              <div className="text-sm">No elements on canvas</div>
              <div className="text-xs">Create shapes or add text to get started</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 