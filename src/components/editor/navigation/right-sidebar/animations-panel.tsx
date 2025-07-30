import React from 'react';
import { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';
import { AnimationsTab } from './tabs/animations';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useAnimationHandlers } from '@/hooks/use-animation-handlers';
import { useGroupAnimationHandlers } from '@/hooks/use-group-animation-handlers';

interface AnimationsPanelProps {
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

export const AnimationsPanel: React.FC<AnimationsPanelProps> = ({
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

  const { localAnimations, handleEnterPathMode } = useAnimationHandlers(
    selectedElement,
    onInspectorChange
  );

  const {
    localGroupAnimations,
  } = useGroupAnimationHandlers(selectedGroup, onGroupInspectorChange);

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="h-full overflow-y-auto p-2 text-gray-800 pb-80">
      {hasGroupSelection ? (
        <AnimationsTab
          selectedGroup={selectedGroup!}
          localAnimations={localGroupAnimations}
          onEnterPathMode={handleEnterPathMode}
          onGroupInspectorChange={onGroupInspectorChange}
        />
      ) : hasIndividualElement ? (
        <AnimationsTab
          selectedElement={selectedElement!}
          localAnimations={localAnimations}
          onEnterPathMode={handleEnterPathMode}
        />
      ) : (
        <div className="p-4 text-gray-600">
          <p>Multiple elements selected. Group them to edit animations as a group.</p>
        </div>
      )}
    </div>
  );
}; 