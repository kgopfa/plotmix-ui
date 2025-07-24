import { useEffect, FC, useState } from 'react';
import { Layers, Eye, EyeOff, Square, Circle, Type, Image, Minus, Group, Users, Ungroup, ChevronDown, ChevronRight } from 'lucide-react';
import { useCanvasElements, useCanvasGroups, useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';

export const LayersTab: FC = () => {
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const { setElementVisibility, setGroupVisibility, createGroupFromElements, ungroupElements } = useCanvasOperations();
  const { selectedElements, selectedGroups, select: selectElement, selectGroup, canGroup, canUngroup, createGroupFromSelected, updateSelectedGroups } = useSelectionStore();

  // State for collapsed groups
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Keep selection store in sync with current groups
  useEffect(() => {
    updateSelectedGroups(groups);
  }, [groups, updateSelectedGroups]);

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

  const getElementIcon = (type: string) => {
    switch (type) {
      case 'rectangle': return Square;
      case 'circle': return Circle;
      case 'text': return Type;
      case 'image': return Image;
      case 'line': 
      case 'simpleLine': return Minus;
      default: return Square;
    }
  };

  const getElementColor = (type: string) => {
    switch (type) {
      case 'rectangle': return 'text-blue-600';
      case 'circle': return 'text-green-600';
      case 'text': return 'text-orange-600';
      case 'image': return 'text-purple-600';
      case 'line': 
      case 'simpleLine': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const handleElementClick = (element: AnimatedCanvasObject, event?: React.MouseEvent) => {
    if (event && (event.metaKey || event.ctrlKey)) {
      // Multi-select: add to or remove from selection
      selectElement(element, true);
    } else {
      // Single select: replace selection
      selectElement([element]);
    }
  };

  const handleGroupClick = (group: CanvasGroup) => {
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

  const handleCreateGroup = () => {
    if (!canGroup()) return;
    
    const groupInfo = createGroupFromSelected();
    if (groupInfo) {
      const elementIds = selectedElements.map(el => el.id);
      createGroupFromElements(elementIds, groupInfo);
      
      // Clear selection after grouping
      selectElement(null);
    }
  };

  const handleUngroup = () => {
    if (!canUngroup() || selectedGroups.length === 0) return;
    
    const group = selectedGroups[0];
    ungroupElements(group.id);
    
    // Clear selection after ungrouping
    selectElement(null);
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
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          <h3 className="font-semibold text-gray-900">Layers</h3>
        </div>
      </div>
      
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-2 text-sm">

          {/* Grouping Controls */}
          {(canGroup() || canUngroup()) && (
            <div className="p-3 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200">
              <div className="font-medium text-gray-700 mb-2 text-xs">Group Management</div>
              <div className="flex gap-2">
                {canGroup() && (
                  <button
                    onClick={handleCreateGroup}
                    className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded-md hover:bg-purple-700 transition-colors"
                    title={`Group ${selectedElements.length} selected elements`}
                  >
                    <Users className="w-3 h-3" />
                    Group ({selectedElements.length})
                  </button>
                )}
                {canUngroup() && (
                  <button
                    onClick={handleUngroup}
                    className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded-md hover:bg-orange-700 transition-colors"
                    title="Ungroup selected group"
                  >
                    <Ungroup className="w-3 h-3" />
                    Ungroup
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Groups */}
          {groups.filter(group => !group.isDefaultGroup).length > 0 && (
            <div className="space-y-1">
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Group className="w-3 h-3" />
                Groups
              </div>
                             {groups.filter(group => !group.isDefaultGroup).map((group) => {
                 const isCollapsed = collapsedGroups.has(group.id);
                 return (
                   <div key={group.id} className="space-y-1">
                     <div
                       className={`w-full p-2 rounded-lg transition-colors ${
                         isGroupSelected(group.id) 
                           ? 'bg-indigo-100 border border-indigo-200' 
                           : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
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
                         <Group className="w-4 h-4 text-purple-600" />
                         <button
                           onClick={() => handleGroupClick(group)}
                           className="font-medium text-gray-700 flex-1 truncate text-left hover:text-indigo-600 transition-colors"
                         >
                           {group.name}
                         </button>
                         <div className="flex items-center gap-1">
                           <span className="text-xs px-1 bg-purple-100 text-purple-700 rounded">
                             {group.elementIds.length}
                           </span>
                           <button
                             onClick={(e) => handleGroupVisibilityToggle(e, group)}
                             className="p-1 hover:bg-white rounded transition-colors"
                             title={group.visible !== false ? 'Hide group' : 'Show group'}
                           >
                             {group.visible !== false ? (
                               <Eye className="w-3 h-3 text-green-600" />
                             ) : (
                               <EyeOff className="w-3 h-3 text-gray-400" />
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
                           .map((element) => {
                             const IconComponent = getElementIcon(element.type);
                             return (
                               <div
                                 key={element.id}
                                 className={`w-full p-2 rounded transition-colors ${
                                   isElementSelected(element.id) 
                                     ? 'bg-blue-100 border border-blue-200' 
                                     : 'bg-white hover:bg-gray-50 border border-gray-200'
                                 }`}
                               >
                                 <div className="flex items-center gap-2">
                                   <IconComponent className={`w-3 h-3 ${getElementColor(element.type)}`} />
                                   <button
                                     onClick={(e) => handleElementClick(element, e)}
                                     className="text-xs text-gray-700 flex-1 truncate text-left hover:text-blue-600 transition-colors"
                                   >
                                     {element.name}
                                   </button>
                                   <button
                                     onClick={(e) => handleElementVisibilityToggle(e, element)}
                                     className="p-1 hover:bg-gray-100 rounded transition-colors"
                                     title={element.visible !== false ? 'Hide element' : 'Show element'}
                                   >
                                     {element.visible !== false ? (
                                       <Eye className="w-3 h-3 text-green-600" />
                                     ) : (
                                       <EyeOff className="w-3 h-3 text-gray-400" />
                                     )}
                                   </button>
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
              <div className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Layers className="w-3 h-3" />
                Elements
              </div>
              {ungroupedElements.map((element) => {
                const IconComponent = getElementIcon(element.type);
                return (
                  <div
                    key={element.id}
                    className={`w-full p-2 rounded-lg transition-colors ${
                      isElementSelected(element.id) 
                        ? 'bg-blue-100 border border-blue-200' 
                        : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className={`w-4 h-4 ${getElementColor(element.type)}`} />
                                             <button
                         onClick={(e) => handleElementClick(element, e)}
                         className="font-medium text-gray-700 flex-1 truncate text-left hover:text-blue-600 transition-colors"
                       >
                         {element.name}
                       </button>
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