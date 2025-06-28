import React, { useState, useEffect } from 'react';
import { 
  AnimatedCanvasObject,
  ElementAnimation,
} from '@/types/canvas';
import { PropertiesTab } from './tabs/properties';
import { AnimationsTab } from './tabs/animations';
import { GroupPropertiesTab } from './tabs/group-properties';
import { GroupAnimationsTab } from './tabs/group-animations';
import { useAnimationHandlers } from '@/hooks/use-animation-handlers';
import { useGroupAnimationHandlers } from '@/hooks/use-group-animation-handlers';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { useSelectionStore } from '@/stores/useSelectionStore';

interface InspectorProps {
  onInspectorChange: (
    prop: string,
    value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
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

// Main Inspector Component
type Tab = 'properties' | 'animations';

export function Inspector({ 
  onInspectorChange, 
  onGroupInspectorChange 
}: InspectorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  
  // Get selection state from Zustand store
  const { selectedElements, selectedGroups, getFirstSelected } = useSelectionStore();
  const selectedElement = getFirstSelected();
  const selectedGroup = selectedGroups[0] || null;
  const selectedElementsCount = selectedElements.length;

  const {
    localAnimations,
    handleEnterPathMode
  } = useAnimationHandlers(selectedElement, onInspectorChange);

  const {
    localGroupAnimations,
    handleGroupAnimationChange,
    handleAddGroupAnimation,
    handleDeleteGroupAnimation,
    handleDuplicateGroupAnimation
  } = useGroupAnimationHandlers(selectedGroup, onGroupInspectorChange);

  // Listen for animation selections and auto-switch to animations tab
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection) {
        setActiveTab('animations');
      }
    });
  }, [animationSelectionManager]);

  // Clear animation selection when element changes
  useEffect(() => {
    animationSelectionManager.clearSelection();
  }, [selectedElement?.id, selectedGroup?.id, animationSelectionManager]);

  // Determine what to show based on selection priority:
  // 1. If we have a group selected and multiple elements, show group properties
  // 2. If we have an individual element selected, show individual properties  
  // 3. If we have a group selected (without individual elements), show group properties
  const hasValidGroupSelection = selectedGroup && !selectedGroup.isDefaultGroup && selectedGroup.id;
  const hasIndividualElement = selectedElement && selectedElementsCount === 1 && !hasValidGroupSelection;
  const hasGroupSelection = hasValidGroupSelection;
  const hasSelection = selectedElement || hasGroupSelection;

  // Selection logic working with state-based selection

  if (!hasSelection) {
    return (
      <div className="h-full p-2 text-gray-800">
        <p>Select an element or group to edit properties</p>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto">
      <div className="p-2 text-gray-800">
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'properties' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('properties')}
          >
            Properties
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'animations' ? 'border-b-2 border-blue-500' : ''}`}
            onClick={() => setActiveTab('animations')}
          >
            Animations
          </button>
        </div>

        <div className="pb-80">
          {activeTab === 'properties' ? (
            hasGroupSelection ? (
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
            )
          ) : (
            hasGroupSelection ? (
              <GroupAnimationsTab
                selectedGroup={selectedGroup!}
                localAnimations={localGroupAnimations}
                onAddAnimation={handleAddGroupAnimation}
                onDeleteAnimation={handleDeleteGroupAnimation}
                onDuplicateAnimation={handleDuplicateGroupAnimation}
                onAnimationChange={handleGroupAnimationChange}
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
            )
          )}
        </div>
      </div>
    </div>
  );
} 