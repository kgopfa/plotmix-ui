import React from 'react';

interface ContextMenuPosition {
  x: number;
  y: number;
  targetId: string;
  targetType?: 'element' | 'group';
}

interface ContextMenuProps {
  contextMenu: ContextMenuPosition | null;
  onAction: (action: string) => void;
  onClose: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  contextMenu,
  onAction
}) => {
  if (!contextMenu) return null;

  const isElement = contextMenu.targetType === 'element' || !contextMenu.targetType; // Default to element for backward compatibility

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] text-gray-900"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {isElement && (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-purple-50 hover:text-purple-600 flex items-center gap-2"
          onClick={() => onAction('animate')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          Animate
        </button>
      )}

      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => onAction('copy')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Copy
      </button>
      
      {isElement && (
        <button
          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
          onClick={() => onAction('group')}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Group Element
        </button>
      )}
      
      <div className="border-t border-gray-100 my-1" />
      
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => onAction('moveToFront')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11l5-5m0 0l5 5m-5-5v12" />
        </svg>
        Move to Front
      </button>
      
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => onAction('moveToBack')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 13l-5 5m0 0l-5-5m5 5V6" />
        </svg>
        Move to Back
      </button>
      
      {isElement && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
            onClick={() => onAction('delete')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </>
      )}
    </div>
  );
}; 