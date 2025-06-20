import { useState, useEffect } from 'react';
import { 
  AnimatedCanvasObject, 
  GsapEase, 
  ElementAnimation, 
  AnimationType, 
  AnimatableProperties 
} from '@/types/canvas';

type InspectorChangeHandler = (
  prop: string,
  value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
    animationId: string;
    elementId: string;
  }
) => void;

export function useAnimationHandlers(
  selectedElement: AnimatedCanvasObject | null,
  onInspectorChange: InspectorChangeHandler
) {
  const [localAnimations, setLocalAnimations] = useState<ElementAnimation[]>(
    selectedElement?.animations ?? []
  );

  // Sync local animations when selected element changes
  useEffect(() => {
    if (selectedElement) {
      setLocalAnimations(selectedElement.animations);
    } else {
      setLocalAnimations([]);
    }
  }, [selectedElement]);

  const getAnimationProperty = (path: string, value: string | number): Partial<AnimatableProperties> => {
    const parts = path.split('.');
    const propertyKey = parts[1] as keyof AnimatableProperties;
    
    // Handle numeric properties vs string properties
    const isNumericProperty = propertyKey !== 'fillColor';
    const convertedValue = isNumericProperty ? Number(value) : value;
    
    return { [propertyKey]: convertedValue };
  };

  const handleEnterPathMode = (animationId: string) => {
    if (!selectedElement) return;
    
    onInspectorChange('enterPathMode', {
      animationId,
      elementId: selectedElement.id
    });
  };

  const handleAnimationChange = (
    animationId: string,
    field: string,
    value: string | number | boolean
  ) => {
    const updatedAnimations = localAnimations.map(anim => {
      if (anim.id !== animationId) return anim;

      if (field === 'easing') {
        return { ...anim, easing: value as GsapEase };
      } else if (field === 'type') {
        const newType = value as AnimationType;
        const defaultProperties = {
          rotate: { rotation: 0 },
          scale: { scaleX: 1, scaleY: 1 },
          move: { x: 0, y: 0 },
          color: { fillColor: selectedElement!.fill },
          fade: { alpha: selectedElement!.opacity ?? 1 },
          path: { 
            pathPoints: [],
            pathDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
            yoyo: false,
            attachDelay: 0.5
          },
        };
        return { 
          ...anim, 
          type: newType,
          id: `${newType}-${animationId.split('-')[1]}`,
          properties: defaultProperties[newType]
        };
      } else if (field === 'startTime' || field === 'duration') {
        return { ...anim, [field]: Number(value) };
      } else if (field.startsWith('properties.')) {
        if (field === 'properties.yoyo') {
          return {
            ...anim,
            properties: {
              ...anim.properties,
              yoyo: value as boolean
            }
          };
        } else if (field === 'properties.pathDirection') {
          return {
            ...anim,
            properties: {
              ...anim.properties,
              pathDirection: value as 'clockwise' | 'counterclockwise'
            }
          };
        } else {
          const animationProperty = getAnimationProperty(field, value as string | number);
          return {
            ...anim,
            properties: {
              ...anim.properties,
              ...animationProperty
            }
          };
        }
      }
      return anim;
    });

    setLocalAnimations(updatedAnimations as ElementAnimation[]);
    onInspectorChange('animations', updatedAnimations as ElementAnimation[]);
  };

  const handleAddAnimation = () => {
    if (!selectedElement) return;
    
    const type = 'rotate' as AnimationType;
    const defaultProperties = {
      rotate: { rotation: 0 },
      scale: { scaleX: 1, scaleY: 1 },
      move: { x: 0, y: 0 },
      color: { fillColor: selectedElement.fill },
      fade: { alpha: selectedElement.opacity ?? 1 },
      path: { 
        pathPoints: [],
        pathDirection: 'clockwise' as 'clockwise' | 'counterclockwise',
        yoyo: false,
        attachDelay: 0.5
      }
    };

    const newAnimation = {
      id: `${type}-${localAnimations.length + 1}`,
      type,
      startTime: 0,
      duration: 2,
      properties: defaultProperties[type],
      easing: 'power1.inOut' as GsapEase
    };

    const updatedAnimations = [...localAnimations, newAnimation];
    setLocalAnimations(updatedAnimations);
    onInspectorChange('animations', updatedAnimations);
  };

  const handleDeleteAnimation = (animationId: string) => {
    const updatedAnimations = localAnimations.filter(anim => anim.id !== animationId);
    setLocalAnimations(updatedAnimations);
    onInspectorChange('animations', updatedAnimations);
  };

  return {
    localAnimations,
    handleEnterPathMode,
    handleAnimationChange,
    handleAddAnimation,
    handleDeleteAnimation
  };
} 