import React, { useEffect } from 'react';
import { AnimatedCanvasObject, ElementAnimation } from '@/types/canvas';
import { AnimationsTab } from './tabs/animations';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useAnimationHandlers } from '@/hooks/use-animation-handlers';


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

  const { handleEnterPathMode } = useAnimationHandlers(
    selectedElement,
    onInspectorChange
  );

  // Ensure GSAP timeline is built when the animations panel opens
  useEffect(() => {
    (async () => {
      try {
        const store = await import('@/stores/use-timeline-store');
        const state = store.useTimelineStore.getState();
        state.updateTracks();
        state.buildGSAPTimeline();
      } catch {}
    })();
  }, []);

  if (!hasSelection) {
    return null;
  }

  return (
    <div className="h-full w-full bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="flex-1 overflow-y-auto p-4 text-gray-800">
      {hasGroupSelection ? (
        <AnimationsTab
          selectedGroup={selectedGroup!}
          localAnimations={[]} // Empty array since AnimationsTab gets data from store
          onEnterPathMode={handleEnterPathMode}
          onGroupInspectorChange={onGroupInspectorChange}
        />
      ) : hasIndividualElement ? (
        <AnimationsTab
          selectedElement={selectedElement!}
          localAnimations={[]} // Empty array since AnimationsTab gets data from store
          onEnterPathMode={handleEnterPathMode}
        />
      ) : (
        <div className="p-4 text-gray-600">
          <p>Multiple elements selected. Group them to edit animations as a group.</p>
        </div>
      )}
      </div>
    </div>
  );
}; 