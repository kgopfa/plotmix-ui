import {
  AnimatedCanvasObject,
  ElementAnimation
} from '@/types/canvas';
import { useState, useEffect } from 'react';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { AnimationCard } from './animation-card';
import { generateAnimationDisplayName, updateAnimationDisplayNames } from '@/utils/animation-utils';

interface AnimationsTabProps {
  selectedElement: AnimatedCanvasObject;
  localAnimations: ElementAnimation[];
  onEnterPathMode: (id: string) => void;
}

export function AnimationsTab({
  selectedElement,
  localAnimations,
  onEnterPathMode
}: AnimationsTabProps) {
  // Local state is the single source of truth for this component
  const [animations, setAnimations] = useState<ElementAnimation[]>(localAnimations);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null);
  const animationSelectionManager = AnimationSelectionManager.getInstance();

  // Get stores for direct updates
  const canvasStore = useCanvasStore();
  const { updateAnimationDuration, updateAnimationRepeat, updateTracks, buildGSAPTimeline } = useTimelineStore();

  // Sync local state when props change (initial load or element switch)
  useEffect(() => {
    // Migrate existing animations to include displayName if missing
    const migratedAnimations = localAnimations.map(animation => {
      if (!animation.displayName) {
        return {
          ...animation,
          displayName: generateAnimationDisplayName(animation.type, localAnimations)
        };
      }
      return animation;
    });
    
    // Update display names to ensure proper sequential numbering
    const updatedAnimations = updateAnimationDisplayNames(migratedAnimations);
    
    setAnimations(updatedAnimations);
  }, [localAnimations, localAnimations.length, selectedElement.id]); // Reset when element changes

  // Auto-rebuild timeline when animations change
  useEffect(() => {
    if (animations.length > 0 || localAnimations.length !== animations.length) {
      console.log(`🎬 Animations changed for element ${selectedElement.id}, rebuilding timeline...`);

      // Update Canvas Store first
      canvasStore.updateElement(selectedElement.id, { animations });

      // Force Timeline Store to sync with Canvas Store
      const canvasElements = canvasStore.getAllElements();
      const canvasGroups = canvasStore.getAllGroups();
      const timelineStore = useTimelineStore.getState();

      // Update Timeline Store with latest data
      timelineStore.setElements(canvasElements);
      timelineStore.setGroups(canvasGroups);

      // Force clear Enhanced Timeline Manager cache to ensure rebuild
      timelineStore.gsapManager.forceClearCache();

      // Rebuild timeline
      setTimeout(() => {
        updateTracks();
        buildGSAPTimeline();
      }, 0);
    }
  }, [animations, selectedElement.id, canvasStore, updateTracks, buildGSAPTimeline]);

  // Listen for animation selections
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection && selection.elementId === selectedElement.id) {
        setSelectedAnimationId(selection.animationId);
      } else {
        setSelectedAnimationId(null);
      }
    });
  }, [animationSelectionManager, selectedElement.id]);



  // Simplified sync to stores (Timeline rebuild handled by useEffect above)
  const syncToStores = (updatedAnimations: ElementAnimation[], changedField?: string, animationId?: string) => {
    // For repeat-related changes, use Timeline Store methods for consistency
    if (changedField && animationId && ['repeat', 'repeatDelay', 'yoyo'].includes(changedField)) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        if (changedField === 'repeat') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'repeatDelay') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'yoyo') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        }
      }
    } else if (changedField === 'duration' && animationId) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        updateAnimationDuration(animationId, selectedElement.id, animation.duration);
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

    // Update local state immediately
    setAnimations(updatedAnimations);

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

    // Update local state immediately
    setAnimations(updatedAnimations);

    // Sync to stores
    syncToStores(updatedAnimations);
  };

  // Handle all animation changes through local state
  const handleAnimationChange = (id: string, field: string, value: string | number | boolean) => {
    console.log(`Animation change: ${field} = ${value} for animation ${id}`);

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

    // Update local state immediately
    setAnimations(updatedAnimations);

    // Sync to stores based on field type
    syncToStores(updatedAnimations, field, id);
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <h3 className="font-semibold text-gray-900">Animations</h3>
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
            selectedElement={selectedElement}
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