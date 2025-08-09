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
    <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/50 rounded-xl shadow-sm">
      <span className="text-blue-700 font-medium text-sm">
        {selectedObjects.length} object{selectedObjects.length !== 1 ? 's' : ''} selected
      </span>
      {selectedObjects.length > 1 && (
        <span className="text-blue-600 text-xs font-medium">
          Multi-select active
        </span>
      )}
      
      {/* Grouping buttons */}
      <div className="flex gap-2 ml-3 border-l border-blue-300/50 pl-3">
        {selectedObjects.length > 1 && (
          <button
            className="group relative inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-sm shadow-green-500/30 hover:from-green-600 hover:to-emerald-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
            onClick={onGroupElements}
            title="Group selected elements"
          >
            <svg className="w-3 h-3 mr-1.5 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Group
          </button>
        )}
        {selectedGroups.length > 0 && selectedGroups.some(group => !group.isDefaultGroup) && (
          <button
            className="group relative inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-lg bg-gradient-to-r from-orange-500 to-yellow-600 text-white shadow-sm shadow-orange-500/30 hover:from-orange-600 hover:to-yellow-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
            onClick={onUngroupElements}
            title="Ungroup selected group"
          >
            <svg className="w-3 h-3 mr-1.5 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            Ungroup
          </button>
        )}
      </div>
    </div>
  );
}; 