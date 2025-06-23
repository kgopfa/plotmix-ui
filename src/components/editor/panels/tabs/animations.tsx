import { 
  AnimatedCanvasObject, 
  ElementAnimation
} from '@/types/canvas';
import { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface AnimationsTabProps {
  selectedElement: AnimatedCanvasObject;
  localAnimations: ElementAnimation[];
  onAddAnimation: () => void;
  onDeleteAnimation: (id: string) => void;
  onAnimationChange: (id: string, field: string, value: string | number | boolean) => void;
  onEnterPathMode: (id: string) => void;
}

export function AnimationsTab({ 
  selectedElement,
  localAnimations,
  onAddAnimation,
  onDeleteAnimation,
  onAnimationChange,
  onEnterPathMode
}: AnimationsTabProps) {
  // Local state for animations
  const [animations, setAnimations] = useState<ElementAnimation[]>(localAnimations);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null);
  const animationSelectionManager = AnimationSelectionManager.getInstance();

  // Update local state when props change
  useEffect(() => {
    setAnimations(localAnimations);
  }, [localAnimations]);

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

  // Debounced function to sync with parent
  const debouncedOnAnimationChange = useCallback((id: string, field: string, value: string | number | boolean) => {
    onAnimationChange(id, field, value);
  }, [onAnimationChange]);

  const debouncedHandler = useMemo(
    () => debounce(debouncedOnAnimationChange, 300),
    [debouncedOnAnimationChange]
  );

  // Handle local state changes
  const handleAnimationChange = (id: string, field: string, value: string | number | boolean) => {
    setAnimations(prevAnimations => 
      prevAnimations.map(anim => {
        if (anim.id !== id) return anim;
        
        if (field.includes('.')) {
          // Handle nested properties (e.g., 'properties.x')
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
        
        return {
          ...anim,
          [field]: value
        };
      })
    );

    // Sync with parent state
    debouncedHandler(id, field, value);
  };

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={onAddAnimation}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Animation
      </button>
      <div className="flex flex-col gap-2">
        {animations.map((animation) => (
          <div key={animation.id} className={`border rounded p-2 ${
            selectedAnimationId === animation.id ? 'border-green-500 bg-green-50' : ''
          }`}>
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <span className="font-medium text-blue-600">{animation.type}</span>
              <button
                onClick={() => onDeleteAnimation(animation.id)}
                className="text-red-500 hover:text-red-700"
                title="Delete animation"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <div className="grid grid-cols-2 gap-2">
                <label>
                  Start Time:
                  <input
                    type="number"
                    value={animation.startTime}
                    onChange={e => handleAnimationChange(animation.id, 'startTime', e.target.value)}
                    className="w-full"
                  />
                </label>
                <label>
                  Duration:
                  <input
                    type="number"
                    value={animation.duration}
                    onChange={e => handleAnimationChange(animation.id, 'duration', e.target.value)}
                    className="w-full"
                  />
                </label>
              </div>
              <label>
                Type:
                <select
                  value={animation.type}
                  onChange={e => handleAnimationChange(animation.id, 'type', e.target.value)}
                  className="w-full"
                >
                  <option value="rotate">Rotate</option>
                  <option value="scale">Scale</option>
                  <option value="move">Move</option>
                  <option value="color">Color</option>
                  <option value="fade">Fade</option>
                  <option value="path">Path</option>
                  <option value="physics">Physics</option>
                </select>
              </label>
              <label>
                Easing:
                <select
                  value={animation.easing ?? 'none'}
                  onChange={e => handleAnimationChange(animation.id, 'easing', e.target.value)}
                  className="w-full"
                >
                  {[
                    'power1.in', 'power1.out', 'power1.inOut',
                    'power2.in', 'power2.out', 'power2.inOut',
                    'power3.in', 'power3.out', 'power3.inOut',
                    'power4.in', 'power4.out', 'power4.inOut',
                    'back.in', 'back.out', 'back.inOut',
                    'elastic.in', 'elastic.out', 'elastic.inOut',
                    'bounce.in', 'bounce.out', 'bounce.inOut',
                    'steps(5)', 'steps(10)', 'steps(20)',
                    'circ.in', 'circ.out', 'circ.inOut',
                    'expo.in', 'expo.out', 'expo.inOut',
                    'sine.in', 'sine.out', 'sine.inOut',
                    'none', 'linear'
                  ].map(ease => (
                    <option key={ease} value={ease}>
                      {ease}
                    </option>
                  ))}
                </select>
              </label>
              <div className="mt-2">
                <h4 className="font-medium mb-2">Properties</h4>
                <div className="grid grid-cols-2 gap-2">
                  {animation.type === 'rotate' && (
                    <label>
                      Rotation (degrees):
                      <input
                        type="number"
                        value={animation.properties.rotation ?? 0}
                        onChange={e => handleAnimationChange(animation.id, 'properties.rotation', e.target.value)}
                        className="w-full"
                        step="1"
                      />
                    </label>
                  )}
                  {animation.type === 'scale' && (
                    <>
                      <label>
                        Scale X:
                        <input
                          type="number"
                          value={animation.properties.scaleX ?? 1}
                          onChange={e => handleAnimationChange(animation.id, 'properties.scaleX', e.target.value)}
                          className="w-full"
                          step="0.1"
                        />
                      </label>
                      <label>
                        Scale Y:
                        <input
                          type="number"
                          value={animation.properties.scaleY ?? 1}
                          onChange={e => handleAnimationChange(animation.id, 'properties.scaleY', e.target.value)}
                          className="w-full"
                          step="0.1"
                        />
                      </label>
                    </>
                  )}
                  {animation.type === 'move' && (
                    <>
                      <label>
                        Move X:
                        <input
                          type="number"
                          value={animation.properties.x ?? 0}
                          onChange={e => handleAnimationChange(animation.id, 'properties.x', e.target.value)}
                          className="w-full"
                          step="1"
                        />
                      </label>
                      <label>
                        Move Y:
                        <input
                          type="number"
                          value={animation.properties.y ?? 0}
                          onChange={e => handleAnimationChange(animation.id, 'properties.y', e.target.value)}
                          className="w-full"
                          step="1"
                        />
                      </label>
                    </>
                  )}
                  {animation.type === 'color' && (
                    <label>
                      Color:
                      <input
                        type="color"
                        value={animation.properties.fillColor ?? selectedElement.fill}
                        onChange={e => handleAnimationChange(animation.id, 'properties.fillColor', e.target.value)}
                        className="w-full"
                      />
                    </label>
                  )}
                  {animation.type === 'fade' && (
                    <label>
                      Opacity:
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={animation.properties.alpha ?? selectedElement.opacity ?? 1}
                        onChange={e => handleAnimationChange(animation.id, 'properties.alpha', e.target.value)}
                        className="w-full"
                      />
                    </label>
                  )}
                  {animation.type === 'path' && (
                    <div className="col-span-2 grid grid-cols-2 gap-2">
                      <div className="col-span-2">
                        <label className="block text-sm font-medium mb-1">
                          Path Animation
                        </label>
                        <button
                          onClick={() => onEnterPathMode(animation.id)}
                          className="w-full py-2 px-3 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-center"
                        >
                          <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" fill="currentColor"/>
                            <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor"/>
                          </svg>
                          Draw Path
                        </button>
                      </div>
                      
                      <div className="col-span-2">
                        <label className="block">
                          Direction:
                          <select
                            value={animation.properties.pathDirection || 'clockwise'}
                            onChange={e => handleAnimationChange(animation.id, 'properties.pathDirection', e.target.value)}
                            className="w-full mt-1"
                          >
                            <option value="clockwise">Clockwise</option>
                            <option value="counterclockwise">Counterclockwise</option>
                          </select>
                        </label>
                      </div>
                      
                      <div className="col-span-2 flex items-center">
                        <input
                          type="checkbox"
                          id={`yoyo-${animation.id}`}
                          checked={animation.properties.yoyo || false}
                          onChange={e => handleAnimationChange(animation.id, 'properties.yoyo', e.target.checked)}
                          className="mr-2"
                        />
                        <label htmlFor={`yoyo-${animation.id}`}>
                          Yoyo (forward and backward)
                        </label>
                      </div>
                    </div>
                  )}
                  {animation.type === 'physics' && (
                    <>
                      <label>
                        Velocity:
                        <input
                          type="number"
                          value={animation.properties.velocity ?? 400}
                          onChange={e => handleAnimationChange(animation.id, 'properties.velocity', e.target.value)}
                          className="w-full"
                          step="10"
                        />
                      </label>
                      <label>
                        Angle (degrees):
                        <input
                          type="number"
                          value={animation.properties.angle ?? 60}
                          onChange={e => handleAnimationChange(animation.id, 'properties.angle', e.target.value)}
                          className="w-full"
                          step="1"
                        />
                      </label>
                      <label>
                        Gravity:
                        <input
                          type="number"
                          value={animation.properties.gravity ?? 800}
                          onChange={e => handleAnimationChange(animation.id, 'properties.gravity', e.target.value)}
                          className="w-full"
                          step="10"
                        />
                      </label>
                      <label>
                        Acceleration:
                        <input
                          type="number"
                          value={animation.properties.acceleration ?? ''}
                          onChange={e => handleAnimationChange(animation.id, 'properties.acceleration', e.target.value)}
                          className="w-full"
                          step="10"
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Acceleration Angle (degrees):
                        <input
                          type="number"
                          value={animation.properties.accelerationAngle ?? ''}
                          onChange={e => handleAnimationChange(animation.id, 'properties.accelerationAngle', e.target.value)}
                          className="w-full"
                          step="1"
                          placeholder="Optional"
                        />
                      </label>
                      <label>
                        Friction:
                        <input
                          type="number"
                          value={animation.properties.friction ?? ''}
                          onChange={e => handleAnimationChange(animation.id, 'properties.friction', e.target.value)}
                          className="w-full"
                          step="0.1"
                          min="0"
                          max="1"
                          placeholder="0-1 (Optional)"
                        />
                      </label>
                      <label>
                        X Property:
                        <input
                          type="text"
                          value={animation.properties.xProp ?? ''}
                          onChange={e => handleAnimationChange(animation.id, 'properties.xProp', e.target.value)}
                          className="w-full"
                          placeholder="e.g., x, rotation (Optional)"
                        />
                      </label>
                      <label>
                        Y Property:
                        <input
                          type="text"
                          value={animation.properties.yProp ?? ''}
                          onChange={e => handleAnimationChange(animation.id, 'properties.yProp', e.target.value)}
                          className="w-full"
                          placeholder="e.g., y, scaleY (Optional)"
                        />
                      </label>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 