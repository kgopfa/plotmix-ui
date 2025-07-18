import React from 'react';
import { Trash2, Rocket, EllipsisVertical, Copy, Layers, Group, Ungroup } from 'lucide-react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useUIStore } from '@/stores/use-ui-store';

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
  showCondition: (selectedElements: AnimatedCanvasObject[], selectedGroups: CanvasGroup[]) => boolean;
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

  if (selectedElements.length === 0 && selectedGroups.length === 0) {
    return null;
  }

  const isMultiSelect = selectedElements.length > 1;
  const hasGroupSelection = selectedGroups.length > 0 && selectedGroups.some(group => !group.isDefaultGroup);

  const handleAnimate = () => {
    if (selectedElements.length === 1) {
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
      hoverColor: 'hover:bg-purple-50 hover:text-purple-700',
      activeColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30',
      title: 'Add animations to this element',
      showCondition: (elements) => elements.length === 1 && !hasGroupSelection
    },
    {
      id: 'copy',
      label: 'Copy',
      icon: Copy,
      onClick: onCopy,
      color: 'text-blue-600',
      hoverColor: 'hover:bg-blue-50 hover:text-blue-700',
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
      hoverColor: 'hover:bg-green-50 hover:text-green-700',
      activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30',
      title: 'Duplicate selected elements',
      showCondition: () => true
    },
    {
      id: 'group',
      label: 'Group',
      icon: Group,
      onClick: onGroup,
      color: 'text-indigo-600',
      hoverColor: 'hover:bg-indigo-50 hover:text-indigo-700',
      activeColor: 'bg-gradient-to-r from-indigo-500 to-indigo-600 text-white shadow-lg shadow-indigo-500/30',
      title: 'Group selected elements',
      showCondition: (elements) => elements.length > 1 && !hasGroupSelection
    },
    {
      id: 'ungroup',
      label: 'Ungroup',
      icon: Ungroup,
      onClick: onUngroup,
      color: 'text-orange-600',
      hoverColor: 'hover:bg-orange-50 hover:text-orange-700',
      activeColor: 'bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg shadow-orange-500/30',
      title: 'Ungroup selected group',
      showCondition: () => hasGroupSelection
    },
    {
      id: 'delete',
      label: 'Delete',
      icon: Trash2,
      onClick: onDelete,
      color: 'text-red-600',
      hoverColor: 'hover:bg-red-50 hover:text-red-700',
      activeColor: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30',
      title: isMultiSelect ? "Delete selected elements" : "Delete this element",
      showCondition: () => true
    },
    {
      id: 'options',
      label: 'More',
      icon: EllipsisVertical,
      onClick: onOptions,
      color: 'text-gray-600',
      hoverColor: 'hover:bg-gray-50 hover:text-gray-700',
      activeColor: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-lg shadow-gray-500/30',
      title: isMultiSelect ? "More options for selected elements" : "More options for this element",
      showCondition: () => true
    }
  ];

  const visibleMenuItems = menuItems.filter(item => item.showCondition(selectedElements, selectedGroups));

  return (
    <div className="m-2 fixed top-16 left-1/2 transform -translate-x-1/2 z-40 w-auto overflow-visible transition-all duration-300 ease-out translate-x-0 opacity-100">
      <div className="relative bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex items-center h-16 px-4">
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
      </div>
    </div>
  );
}; 