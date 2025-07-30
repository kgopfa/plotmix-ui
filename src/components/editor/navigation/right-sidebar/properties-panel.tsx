import React from 'react';
import { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';
import { PropertiesTab } from './tabs/properties';
import { GroupPropertiesTab } from './tabs/group-properties';
import { useSelectionStore } from '@/stores/use-selection-store';

interface PropertiesPanelProps {
  onInspectorChange: (
    prop: string,
    value:
      | string
      | number
      | boolean
      | ElementAnimation[]
      | NonNullable<AnimatedCanvasObject['lineOptions']>
      | {
          animationId: string;
          elementId: string;
        }
  ) => void;
  onGroupInspectorChange?: (
    groupId: string,
    prop: string,
    value: string | number | boolean | ElementAnimation[]
  ) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  onInspectorChange,
  onGroupInspectorChange,
}) => {
  const { selectedElements, selectedGroups, getFirstSelected } =
    useSelectionStore();
  const selectedElement = getFirstSelected();
  const selectedGroup = selectedGroups[0] || null;
  const selectedElementsCount = selectedElements.length;

  const hasValidGroupSelection =
    selectedGroup && !selectedGroup.isDefaultGroup && selectedGroup.id;
  const hasIndividualElement =
    selectedElement && selectedElementsCount === 1 && !hasValidGroupSelection;
  const hasGroupSelection = hasValidGroupSelection;
  const hasSelection = selectedElement || hasGroupSelection;

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-2 text-gray-800 pb-80">
      {hasGroupSelection ? (
        <GroupPropertiesTab
          selectedGroup={selectedGroup!}
          onGroupInspectorChange={onGroupInspectorChange!}
        />
      ) : hasIndividualElement ? (
        <PropertiesTab
          selectedElement={selectedElement!}
          onInspectorChange={onInspectorChange}
        />
      ) : (
        <div className="bg-blue-50 rounded p-3 space-y-1 border border-blue-100">
          <div className="text-xs font-semibold text-gray-800 mb-1">💡 Tip:</div>
          <div className="text-xs text-gray-700">
            Press <kbd className="bg-blue-200 px-1 rounded text-xs font-mono">Cmd+G</kbd> to group the selected elements
          </div>
        </div>
      )}
    </div>
  );
}; 