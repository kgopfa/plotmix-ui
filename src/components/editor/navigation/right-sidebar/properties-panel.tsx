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
        <div className="p-4 text-gray-600">
          <p>Multiple elements selected. Group them to edit as a group.</p>
        </div>
      )}
    </div>
  );
}; 