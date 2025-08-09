import React from 'react';
import { Trash2, Rocket, EllipsisVertical, Copy, Layers, FolderPlus, FolderMinus, BringToFront } from 'lucide-react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useUIStore } from '@/stores/use-ui-store';
import { useCanvasStore } from '@/stores/use-canvas-store';

interface SelectionNavbarProps {
  selectedElements: AnimatedCanvasObject[];
  selectedGroups: CanvasGroup[];
  onAnimate: () => void;
  onDelete: () => void;
  onCopy: () => void;
  onDuplicate: () => void;
  onGroup: () => void;
  onUngroup: () => void;
  onOptions: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  onClick: () => void;
  color: string;
  hoverColor: string;
  activeColor: string;
  title: string;
  showCondition: (selectedElements: AnimatedCanvasObject[]) => boolean;
}

export const SelectionNavbar: React.FC<SelectionNavbarProps> = ({
  selectedElements,
  selectedGroups,
  onAnimate,
  onDelete,
  onCopy,
  onDuplicate,
  onGroup,
  onUngroup,
  onOptions,
}) => {
  const { setShowAnimationsTab } = useUIStore();
  
  // Subscribe to canvas store for real-time z-index updates
  const allElements = useCanvasStore(state => state.elements);

  if (selectedElements.length === 0 && selectedGroups.length === 0) {
    return null;
  }

  const isMultiSelect = selectedElements.length > 1;
  const hasGroupSelection = selectedGroups.length > 0 && selectedGroups.some(group => !group.isDefaultGroup);

  // Calculate z-index info for display - now uses subscribed elements for real-time updates
  const getZIndexInfo = () => {
    if (selectedElements.length === 1) {
      const element = selectedElements[0];
      // Find the current element with updated z-index from the store
      const currentElement = allElements.find(el => el.id === element.id);
      if (!currentElement) return null;
      
      const sortedElements = [...allElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
      const currentIndex = sortedElements.findIndex(el => el.id === element.id);
      const totalElements = sortedElements.length;
      
      return {
        zIndex: currentElement.zIndex || 0,
        position: currentIndex + 1,
        total: totalElements,
        isAtBottom: currentIndex === 0,
        isAtTop: currentIndex === totalElements - 1
      };
    }
    return null;
  };

  const zIndexInfo = getZIndexInfo();

  const handleAnimate = () => {
    if (selectedElements.length === 1 || hasGroupSelection) {
      setShowAnimationsTab(true);
    }
    onAnimate();
  };

  const menuItems: MenuItem[] = [
    {
      id: 'animate',
      label: 'Animate',
      icon: Rocket,
      onClick: handleAnimate,
      color: 'text-purple-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700',
      activeColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
      title: hasGroupSelection ? 'Add animations to this group' : 'Add animations to this element',
      showCondition: (elements) => (elements.length === 1 && !hasGroupSelection) || hasGroupSelection
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      onClick: onCopy,
      color: 'text-blue-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700',
      activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30',
      title: 'Copy selected elements',
      showCondition: () => true
    },
    {
      id: 'duplicate',
      label: 'Duplicate',
      icon: Layers,
      onClick: onDuplicate,
      color: 'text-green-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700',
      activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30',
      title: 'Duplicate selected elements',
      showCondition: () => true
    },
    {
      id: 'group',
      label: 'Group',
      icon: FolderPlus,
      onClick: onGroup,
      color: 'text-orange-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-orange-50 hover:to-yellow-50 hover:text-orange-700',
      activeColor: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30',
      title: 'Group selected elements',
      showCondition: (elements) => elements.length > 1
    },
    {
      id: 'ungroup',
      label: 'Ungroup',
      icon: FolderMinus,
      onClick: onUngroup,
      color: 'text-red-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700',
      activeColor: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
      title: 'Ungroup selected group',
      showCondition: () => hasGroupSelection
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      color: 'text-red-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 hover:text-red-700',
      activeColor: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
      title: isMultiSelect ? 'Delete selected elements' : 'Delete this element',
      showCondition: () => true
    },
    {
      id: 'options',
      label: 'Options',
      icon: EllipsisVertical,
      onClick: onOptions,
      color: 'text-gray-600',
      hoverColor: 'hover:bg-gradient-to-r hover:from-gray-50 hover:to-slate-50 hover:text-gray-700',
      activeColor: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30',
      title: isMultiSelect ? 'Options for selected elements' : 'Options for this element',
      showCondition: () => true
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.showCondition(selectedElements));

  return (
    <div className="fixed top-16 left-0 right-0 z-40 flex justify-center pointer-events-none">
      <div className="m-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex items-center h-16 px-4 pointer-events-auto transition-all duration-300 ease-out">
        {/* Menu items */}
        <nav className="flex items-center space-x-2">
          {visibleMenuItems.map((item) => (
            <div key={item.id} className="relative">
              <button
                className={`
                  relative group flex items-center justify-center
                  w-12 h-12 rounded-xl font-medium
                  transition-all duration-200 ease-out
                  transform hover:scale-105 active:scale-95
                  ${item.color} ${item.hoverColor} hover:shadow-md
                `}
                onClick={item.onClick}
                title={item.title}
              >
                <item.icon 
                  aria-hidden="true" 
                  className="w-5 h-5 transition-all duration-200 group-hover:scale-110" 
                />
                <span className="sr-only">{item.label}</span>
              </button>
            </div>
          ))}
        </nav>

        {/* Z-Index Indicator - only show for single element selection */}
        {zIndexInfo && (
          <div className="ml-4 pl-4 border-l border-gray-200 flex items-center">
            <div className="flex flex-col items-center">
              <div className="flex flex-row items-center gap-1 bg-purple-500 rounded-md p-1">
                <BringToFront className="w-4 h-4 text-white" />
                <span className="text-xs text-white font-bold">{zIndexInfo.zIndex}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 