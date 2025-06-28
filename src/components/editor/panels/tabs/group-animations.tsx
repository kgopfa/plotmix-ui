import { 
  CanvasGroup, 
  ElementAnimation
} from '@/types/canvas';
import { useState, useEffect, useCallback, useMemo } from 'react';
import debounce from 'lodash/debounce';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';

interface GroupAnimationsTabProps {
  selectedGroup: CanvasGroup;
  localAnimations: ElementAnimation[];
  onAddAnimation: () => void;
  onDeleteAnimation: (id: string) => void;
  onAnimationChange: (id: string, field: string, value: string | number | boolean) => void;
}

export function GroupAnimationsTab({ 
  selectedGroup,
  localAnimations,
  onAddAnimation,
  onDeleteAnimation,
  onAnimationChange
}: GroupAnimationsTabProps) {
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
      if (selection && selection.elementId === selectedGroup.id) {
        setSelectedAnimationId(selection.animationId);
      } else {
        setSelectedAnimationId(null);
      }
    });
  }, [animationSelectionManager, selectedGroup.id]);

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
        + Add Group Animation
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
                  <option value="fade">Fade</option>
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
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={animation.yoyo || false}
                    onChange={e => handleAnimationChange(animation.id, 'yoyo', e.target.checked)}
                    className="mr-2"
                  />
                  <span>Yoyo (return to start)</span>
                </label>
              </div>
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
                  {animation.type === 'fade' && (
                    <label>
                      Opacity:
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={animation.properties.alpha ?? 1}
                        onChange={e => handleAnimationChange(animation.id, 'properties.alpha', e.target.value)}
                        className="w-full"
                      />
                    </label>
                  )}
                </div>
              </div>
              <div className="mt-2">
                <h4 className="font-medium mb-2">Repeat Settings</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    Repeat Count:
                    <input
                      type="number"
                      min="-1"
                      value={animation.repeat ?? 0}
                      onChange={e => handleAnimationChange(animation.id, 'repeat', e.target.value)}
                      className="w-full"
                      placeholder="0 = no repeat, -1 = infinite"
                    />
                  </label>
                  <label>
                    Repeat Delay:
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={animation.repeatDelay ?? 0}
                      onChange={e => handleAnimationChange(animation.id, 'repeatDelay', e.target.value)}
                      className="w-full"
                      disabled={!animation.repeat || animation.repeat === 0}
                    />
                  </label>
                </div>
                {(animation.repeat ?? 0) !== 0 && (
                  <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
                    <strong>Note:</strong> Repeats happen within the {animation.duration}s duration.
                    {animation.repeat === -1 ? (
                      <span> Animation will loop infinitely with compressed cycles.</span>
                    ) : (
                      <span> Each cycle will be compressed to fit {animation.repeat} repeat{animation.repeat !== 1 ? 's' : ''} + delays.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
        {animations.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No group animations yet. Click &quot;Add Group Animation&quot; to get started.
          </div>
        )}
      </div>
    </div>
  );
} 