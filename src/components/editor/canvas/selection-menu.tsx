import React from 'react';
import { Trash2, Rocket, EllipsisVertical } from 'lucide-react';
import { AnimatedCanvasObject } from '@/types/canvas';

interface SelectionMenuProps {
  selectedElements: AnimatedCanvasObject[];
  position: { x: number; y: number };
  onAnimate: () => void;
  onDelete: () => void;
  onOptions: () => void;
}

export const SelectionMenu: React.FC<SelectionMenuProps> = ({
  selectedElements,
  position,
  onAnimate,
  onDelete,
  onOptions,
}) => {
  if (selectedElements.length === 0) return null;

  const isMultiSelect = selectedElements.length > 1;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-sm shadow-sm flex items-center p-1"
      style={{
        left: position.x,
        top: position.y - 50, // Position above the element
        transform: 'translateX(-50%)', // Center horizontally
      }}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Animate button */}
      {!isMultiSelect && (
        <button
          onClick={onAnimate}
          className="flex items-center gap-1.5 p-1.5 text-xs font-medium text-purple-700 hover:bg-purple-50 rounded transition-colors"
          title="Add animations to this element"
        >
          <Rocket className="w-3.5 h-3.5" />
          Animate
        </button>
      )}

      {/* Delete button */}
      <button
        onClick={onDelete}
        className="flex items-center p-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
        title={isMultiSelect ? "Delete selected elements" : "Delete this element"}
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>

      {/* Options button */}
      <button
        onClick={onOptions}
        className="flex items-center p-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50 rounded transition-colors"
        title={isMultiSelect ? "Options for selected elements" : "Options for this element"}
      >
        <EllipsisVertical className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}; 