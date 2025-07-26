import React from 'react';
import { Rocket, Copy, Layers, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface RightClickOptionsPosition {
  x: number;
  y: number;
  targetId: string;
  targetType?: 'element' | 'group' | 'component';
}

interface RightClickOptionsProps {
  contextMenu: RightClickOptionsPosition | null;
  onAction: (action: string) => void;
  onClose: () => void;
}

export const RightClickOptions: React.FC<RightClickOptionsProps> = ({
  contextMenu,
  onAction
}) => {
  if (!contextMenu) return null;

  const isElement = contextMenu.targetType === 'element' || !contextMenu.targetType; // Default to element for backward compatibility

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-2 min-w-[180px] text-gray-900"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isElement && (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-600 flex items-center gap-3 rounded-lg mx-1 transition-colors"
          onClick={() => onAction('animate')}
        >
          <Rocket className="w-4 h-4" />
          Animate
        </button>
      )}

      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 rounded-lg mx-1 transition-colors"
        onClick={() => onAction('copy')}
      >
        <Copy className="w-4 h-4" />
        Copy
      </button>
      
      {isElement && (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 rounded-lg mx-1 transition-colors"
          onClick={() => onAction('group')}
        >
          <Layers className="w-4 h-4" />
          Group Element
        </button>
      )}
      
      <div className="border-t border-gray-100 my-2 mx-1" />
      
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 rounded-lg mx-1 transition-colors"
        onClick={() => onAction('moveToFront')}
      >
        <ChevronUp className="w-4 h-4" />
        Move to Front
      </button>
      
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-3 rounded-lg mx-1 transition-colors"
        onClick={() => onAction('moveToBack')}
      >
        <ChevronDown className="w-4 h-4" />
        Move to Back
      </button>
      
      <div className="border-t border-gray-100 my-2 mx-1" />
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-3 rounded-lg mx-1 transition-colors"
        onClick={() => onAction('delete')}
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </button>
    </div>
  );
}; 