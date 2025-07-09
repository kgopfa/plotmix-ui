import React from 'react';
import { useSelectionStore } from '@/stores/use-selection-store';

interface SelectionIndicatorProps {
  onGroupElements: () => void;
  onUngroupElements: () => void;
}

export const SelectionIndicator: React.FC<SelectionIndicatorProps> = ({ 
  onGroupElements, 
  onUngroupElements 
}) => {
  const selectedObjects = useSelectionStore(state => state.selectedElements);
  const selectedGroups = useSelectionStore(state => state.selectedGroups);

  if (selectedObjects.length === 0) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-50 border border-blue-200 rounded text-sm">
      <span className="text-blue-600 font-medium">
        {selectedObjects.length} object{selectedObjects.length !== 1 ? 's' : ''} selected
      </span>
      {selectedObjects.length > 1 && (
        <span className="text-blue-500 text-xs">
          Multi-select active
        </span>
      )}
      
      {/* Grouping buttons */}
      <div className="flex gap-1 ml-2 border-l pl-2">
        {selectedObjects.length > 1 && (
          <button
            className="btn-sm bg-green-500 text-white hover:bg-green-600"
            onClick={onGroupElements}
            title="Group selected elements"
          >
            📦 Group
          </button>
        )}
        {selectedGroups.length > 0 && selectedGroups.some(group => !group.isDefaultGroup) && (
          <button
            className="btn-sm bg-orange-500 text-white hover:bg-orange-600"
            onClick={onUngroupElements}
            title="Ungroup selected group"
          >
            📤 Ungroup
          </button>
        )}
      </div>
    </div>
  );
}; 