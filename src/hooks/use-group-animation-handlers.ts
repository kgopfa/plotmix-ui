import { useState, useEffect } from 'react';
import type { 
  CanvasGroup, 
  ElementAnimation, 
  AnimationType, 
  GsapEase
} from '@/types/canvas';
import { generateAnimationDisplayName } from '@/utils/animation-utils';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';

type GroupInspectorChangeHandler = (
  groupId: string,
  prop: string,
  value: string | number | boolean | ElementAnimation[]
) => void;

export function useGroupAnimationHandlers(
  selectedGroup: CanvasGroup | null,
  onGroupInspectorChange?: GroupInspectorChangeHandler
) {
  const { timelineAnimations } = useTimelineStoreV2();
  
  // Get animations for the selected group from timeline
  const groupAnimations = selectedGroup 
    ? timelineAnimations
        .filter(anim => anim.target.type === 'group' && anim.target.id === selectedGroup.id)
        .flatMap(anim => anim.tracks)
    : [];
  
  const [localGroupAnimations, setLocalGroupAnimations] = useState<ElementAnimation[]>(groupAnimations);

  // Sync local animations when selected group changes
  useEffect(() => {
    setLocalGroupAnimations(groupAnimations);
  }, [selectedGroup, groupAnimations]);

  const handleGroupAnimationChange = (
    animationId: string,
    field: string,
    value: string | number | boolean
  ) => {
    const updatedAnimations = localGroupAnimations.map(anim => {
      if (anim.id !== animationId) return anim;

      if (field === 'easing') {
        return { ...anim, easing: value as GsapEase };
      } else if (field === 'type') {
        const newType = value as AnimationType;
        let defaultProperties = {};
        if (newType === 'rotate') {
          defaultProperties = { rotation: 0 };
        } else if (newType === 'scale') {
          defaultProperties = { scaleX: 1, scaleY: 1 };
        } else if (newType === 'move') {
          defaultProperties = { x: 0, y: 0 };
        } else if (newType === 'fade') {
          defaultProperties = { alpha: 1 };
        }
        
        return { 
          ...anim, 
          type: newType,
          id: `${newType}-${animationId?.split('-')[1]}`,
          displayName: generateAnimationDisplayName(newType, localGroupAnimations),
          properties: defaultProperties
        };
      } else if (field.includes('.')) {
        // Handle nested properties (e.g., 'properties.x')
        const [parent, child] = field?.split('.');
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
      } else {
        return {
          ...anim,
          [field]: value
        };
      }
    });

    setLocalGroupAnimations(updatedAnimations);
    if (onGroupInspectorChange && selectedGroup) {
      onGroupInspectorChange(selectedGroup.id, 'animations', updatedAnimations);
    }
  };

  const handleAddGroupAnimation = () => {
    if (!selectedGroup || !onGroupInspectorChange) return;
    
    const type = 'rotate' as AnimationType;
    
    const newAnimation: ElementAnimation = {
      id: `${type}-${localGroupAnimations.length + 1}`,
      displayName: generateAnimationDisplayName(type, localGroupAnimations),
      type,
      startTime: 0,
      duration: 2,
      properties: { rotation: 0 },
      easing: 'power1.inOut' as GsapEase,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false
    };

    const updatedAnimations = [...localGroupAnimations, newAnimation];
    setLocalGroupAnimations(updatedAnimations);
    onGroupInspectorChange(selectedGroup.id, 'animations', updatedAnimations);
  };

  const handleDeleteGroupAnimation = (animationId: string) => {
    if (!selectedGroup || !onGroupInspectorChange) return;
    
    const updatedAnimations = localGroupAnimations.filter(anim => anim.id !== animationId);
    setLocalGroupAnimations(updatedAnimations);
    onGroupInspectorChange(selectedGroup.id, 'animations', updatedAnimations);
  };

  const handleDuplicateGroupAnimation = (animationId: string) => {
    if (!selectedGroup || !onGroupInspectorChange) return;
    
    const originalAnimation = localGroupAnimations.find(anim => anim.id === animationId);
    if (!originalAnimation) return;

    // Create a copy with a new ID, display name, and slightly offset start time
    const duplicatedAnimation: ElementAnimation = {
      ...originalAnimation,
      id: `${originalAnimation.type}-${Date.now().toString()}`,
      displayName: generateAnimationDisplayName(originalAnimation.type, localGroupAnimations),
      startTime: originalAnimation.startTime + originalAnimation.duration + 0.1 // Offset to avoid overlap
    };

    const updatedAnimations = [...localGroupAnimations, duplicatedAnimation];
    setLocalGroupAnimations(updatedAnimations);
    onGroupInspectorChange(selectedGroup.id, 'animations', updatedAnimations);
  };

  return {
    localGroupAnimations,
    handleGroupAnimationChange,
    handleAddGroupAnimation,
    handleDeleteGroupAnimation,
    handleDuplicateGroupAnimation
  };
} 