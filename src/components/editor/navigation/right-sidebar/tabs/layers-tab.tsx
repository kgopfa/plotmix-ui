import { useEffect, FC, useState } from 'react';
import { Eye, EyeOff, Square, Circle, Type, Image as ImageIcon, Minus, Folder, ChevronDown, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { useCanvasElements, useCanvasGroups, useCanvasOperations } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';

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
    case 'image': return ImageIcon;
    case 'line':
    case 'simpleLine': return Minus;
    default: return Square;
  }
};

export const LayersTab: FC = () => {
  const canvasObjects = useCanvasElements();
  const groups = useCanvasGroups();
  const { setElementVisibility, setGroupVisibility } = useCanvasOperations();
  const { selectedElements, selectedGroups, select: selectElement, selectGroup, updateSelectedGroups } = useSelectionStore();

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
        <div className="flex items-center gap-3">
          <h3 className="font-semibold text-red-500 text-sm">Layers</h3>
        </div>
      </div>

      <div className="flex-1 px-1 py-4 overflow-y-auto">
        <div className="space-y-2 text-sm">

          {/* Groups */}
          {groups.filter(group => !group.isDefaultGroup).length > 0 && (
            <div className="space-y-1">
              {groups.filter(group => !group.isDefaultGroup).map((group) => {
                const isCollapsed = collapsedGroups.has(group.id);
                return (
                  <div key={group.id} className="space-y-1">
                    <div
                      className={`w-full p-2 rounded-lg transition-colors ${isGroupSelected(group.id)
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
                        <Folder className="w-4 h-4 text-purple-600" />
                        <button
                          onClick={() => handleGroupClick(group)}
                          className="text-gray-700 flex-1 truncate text-left hover:text-indigo-600 transition-colors"
                        >
                          {group.name}
                        </button>
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

                    {/* Group Elements - only show if not collapsed */}
                    {!isCollapsed && (
                      <div className="ml-4 space-y-1">
                        {groupedElements
                          .filter(el => el.groupId === group.id)
                          .map((element) => {
                            return (
                              <div
                                key={element.id}
                                className={`w-full p-2 rounded transition-colors ${isElementSelected(element.id)
                                  ? 'bg-blue-100 border border-blue-200'
                                  : 'bg-white hover:bg-gray-50 border border-gray-200'
                                  }`}
                              >
                                <div className="flex items-center gap-2">
                                  <ElementThumbnail element={element} />
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
                  </div>
                );
              })}
            </div>
          )}

          {/* Ungrouped Elements */}
          {ungroupedElements.length > 0 && (
            <div className="space-y-1">
              {ungroupedElements.map((element) => {
                return (
                  <div
                    key={element.id}
                    className={`w-full py-2 pl-8 pr-2 rounded-lg transition-colors ${isElementSelected(element.id)
                      ? 'bg-blue-100 border border-blue-200'
                      : 'bg-gray-50 hover:bg-gray-100 border border-transparent'
                      }`}
                  >
                    <div className="flex items-center gap-2">
                      <ElementThumbnail element={element} />
                      <button
                        onClick={(e) => handleElementClick(element, e)}
                        className="text-gray-700 flex-1 truncate text-left hover:text-blue-600 transition-colors"
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