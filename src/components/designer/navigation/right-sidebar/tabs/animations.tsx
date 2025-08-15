import {
  AnimatedCanvasObject,
  ElementAnimation,
  CanvasGroup
} from '@/types/canvas';
import { useState, useEffect } from 'react';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { AnimationCard } from './animation-card';
import { generateAnimationDisplayName } from '@/utils/animation-utils';
import { X } from 'lucide-react';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

interface AnimationsTabProps {
  selectedElement?: AnimatedCanvasObject;
  selectedGroup?: CanvasGroup;
  localAnimations: ElementAnimation[];
  onEnterPathMode: (id: string) => void;
  onGroupInspectorChange?: (
    groupId: string,
    prop: string,
    value: string | number | boolean | ElementAnimation[]
  ) => void;
}

export function AnimationsTab({
  selectedElement,
  selectedGroup,
  localAnimations,
  onEnterPathMode,
  onGroupInspectorChange
}: AnimationsTabProps) {
  // Remove local state entirely and use store selectors
  const selectedElementFromStore = useSelectionStore(state => state.selectedElements[0]);
  const selectedGroupFromStore = useSelectionStore(state => state.selectedGroups[0]);
  
  // Use the actual selected element/group from store, fallback to props if needed
  const actualSelectedElement = selectedElementFromStore || selectedElement;
  const actualSelectedGroup = selectedGroupFromStore || selectedGroup;
  
  // Get animations directly from store
  const animations = actualSelectedGroup?.animations || actualSelectedElement?.animations || [];
  
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null);
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  const setActiveRightPanel = useSetActiveRightPanel();

  // Get stores for direct updates
  const canvasStore = useCanvasStore();
  const { updateAnimationDuration, updateAnimationRepeat, updateTracks, buildGSAPTimeline } = useTimelineStore();

  // Determine the current selection type and ID
  const currentSelection = actualSelectedGroup || actualSelectedElement;
  const selectionId = currentSelection?.id;

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

  // Listen for animation selections
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection && selection.elementId === selectionId) {
        setSelectedAnimationId(selection.animationId);
      } else {
        setSelectedAnimationId(null);
      }
    });
  }, [animationSelectionManager, selectionId]);

  // Simplified sync to stores (Timeline rebuild handled by useEffect above)
  const syncToStores = (updatedAnimations: ElementAnimation[], changedField?: string, animationId?: string) => {
    // For repeat-related changes, use Timeline Store methods for consistency
    if (changedField && animationId && ['repeat', 'repeatDelay', 'yoyo'].includes(changedField)) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        if (changedField === 'repeat') {
          updateAnimationRepeat(animationId, selectionId!, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'repeatDelay') {
          updateAnimationRepeat(animationId, selectionId!, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'yoyo') {
          updateAnimationRepeat(animationId, selectionId!, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        }
      }
    } else if (changedField === 'duration' && animationId) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        updateAnimationDuration(animationId, selectionId!, animation.duration);
      }
    }

    // Force clear cache for any animation changes to ensure timeline rebuilds
    const timelineStore = useTimelineStore.getState();
    timelineStore.gsapManager.forceClearCache();

    // Note: Canvas Store update and timeline rebuild handled by useEffect
  };

  // Handle deleting animations internally
  const handleDeleteAnimationInternal = (animationId: string) => {
    const updatedAnimations = animations.filter(anim => anim.id !== animationId);

    // Update store immediately instead of local state
    if (actualSelectedGroup) {
      onGroupInspectorChange?.(actualSelectedGroup.id, 'animations', updatedAnimations);
    } else if (actualSelectedElement) {
      canvasStore.updateElement(actualSelectedElement.id, { animations: updatedAnimations });
    }

    // Sync to stores
    syncToStores(updatedAnimations);
  };

  // Handle duplicating animations
  const handleDuplicateAnimation = (animationId: string) => {
    const originalAnimation = animations.find(anim => anim.id === animationId);
    if (!originalAnimation) return;

    // Create a copy with a new ID, display name, and slightly offset start time
    const duplicatedAnimation: ElementAnimation = {
      ...originalAnimation,
      id: `${originalAnimation.type}-${Date.now()}`,
      displayName: generateAnimationDisplayName(originalAnimation.type, animations),
      startTime: originalAnimation.startTime + originalAnimation.duration + 0.1 // Offset to avoid overlap
    };

    const updatedAnimations = [...animations, duplicatedAnimation];

    // Update store immediately instead of local state
    if (actualSelectedGroup) {
      onGroupInspectorChange?.(actualSelectedGroup.id, 'animations', updatedAnimations);
    } else if (actualSelectedElement) {
      canvasStore.updateElement(actualSelectedElement.id, { animations: updatedAnimations });
    }

    // Sync to stores
    syncToStores(updatedAnimations);
  };

  // Handle all animation changes through store updates
  const handleAnimationChange = (id: string, field: string, value: string | number | boolean) => {
    const updatedAnimations = animations.map(anim => {
      if (anim.id !== id) return anim;

      if (field.includes('.')) {
        // Handle nested properties (e.g., 'properties.rotation')
        const [parent, child] = field.split('.');
        const parentKey = parent as keyof ElementAnimation;
        const parentValue = anim[parentKey];

        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...anim,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return anim;
      }

      // Handle direct properties
      if (field === 'repeat') {
        return { ...anim, repeat: Number(value) };
      } else if (field === 'repeatDelay') {
        return { ...anim, repeatDelay: Number(value) };
      } else if (field === 'yoyo') {
        return { ...anim, yoyo: Boolean(value) };
      } else if (field === 'duration') {
        return { ...anim, duration: Number(value) };
      } else {
        return { ...anim, [field]: value };
      }
    });

    // Update store immediately instead of local state
    if (actualSelectedGroup) {
      onGroupInspectorChange?.(actualSelectedGroup.id, 'animations', updatedAnimations);
    } else if (actualSelectedElement) {
      canvasStore.updateElement(actualSelectedElement.id, { animations: updatedAnimations });
    }

    // Sync to stores based on field type
    syncToStores(updatedAnimations, field, id);
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-purple-500 text-sm">Animations</h4>
        <button
          onClick={() => setActiveRightPanel(null)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* No animations state */}
      {animations.length === 0 && (
        <div className="p-6 text-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200/50">
          <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No animations yet</p>
          <p className="text-xs text-gray-500">Use the left sidebar to add animations</p>
        </div>
      )}

      {/* Animation List */}
      <div className="space-y-4">
        {animations.map((animation) => (
          <AnimationCard
            key={animation.id}
            animation={animation}
            selectedElement={actualSelectedElement}
            selectedGroup={actualSelectedGroup}
            isSelected={selectedAnimationId === animation.id}
            onAnimationChange={handleAnimationChange}
            onDuplicateAnimation={handleDuplicateAnimation}
            onDeleteAnimation={handleDeleteAnimationInternal}
            onEnterPathMode={onEnterPathMode}
          />
        ))}
      </div>
    </div>
  );
} 