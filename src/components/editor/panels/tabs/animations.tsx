import { 
  AnimatedCanvasObject, 
  ElementAnimation,
  AnimationType,
  GsapEase
} from '@/types/canvas';
import { useState, useEffect, useRef } from 'react';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { useTimelineStore } from '@/stores/useTimelineStore';
import { useCanvasStore } from '@/stores/useCanvasStore';

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
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const animationSelectionManager = AnimationSelectionManager.getInstance();
  
  // Get stores for direct updates
  const canvasStore = useCanvasStore();
  const { updateAnimationDuration, updateAnimationRepeat, updateTracks, buildGSAPTimeline } = useTimelineStore();

  // Sync local state when props change (initial load or element switch)
  useEffect(() => {
    setAnimations(localAnimations);
  }, [localAnimations, selectedElement.id]); // Reset when element changes

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
      
      // Force rebuild timeline tracks and GSAP timeline
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

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowAddDropdown(false);
      }
    };

    if (showAddDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showAddDropdown]);

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
    // Note: Canvas Store update and timeline rebuild handled by useEffect
  };

  // Available animation types with descriptions
  const animationTypes: Array<{ value: AnimationType; label: string; description: string }> = [
    { value: 'move', label: 'Move', description: 'Change position (X, Y)' },
    { value: 'scale', label: 'Scale', description: 'Change size (Scale X, Y)' },
    { value: 'rotate', label: 'Rotate', description: 'Rotate around center' },
    { value: 'fade', label: 'Fade', description: 'Change opacity' },
    { value: 'color', label: 'Color', description: 'Change fill color' },
    { value: 'path', label: 'Path', description: 'Follow a custom path' },
    { value: 'physics', label: 'Physics', description: 'Physics-based motion' },
    { value: 'typewriter', label: 'Typewriter', description: 'Text appears character by character' },
    { value: 'textScale', label: 'Text Scale', description: 'Scale text characters individually' },
  ];

  // Handle adding animations with specific type
  const handleAddAnimationWithType = (type: AnimationType) => {
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
      },
      physics: {
        velocity: 400,
        angle: 60,
        gravity: 800,
        acceleration: undefined,
        accelerationAngle: undefined,
        friction: undefined,
        xProp: '',
        yProp: ''
      },
      typewriter: {
        text: selectedElement.text || '',
        characters: selectedElement.characters || [],
        characterOpacity: []
      },
      textScale: {
        characters: selectedElement.characters || [],
        characterScale: []
      }
    };

    const newAnimation: ElementAnimation = {
      id: `${type}-${Date.now()}`,
      type,
      startTime: 0,
      duration: 2,
      properties: defaultProperties[type],
      easing: 'power1.inOut' as GsapEase,
      repeat: 0,
      repeatDelay: 0,
      yoyo: false
    };

    const updatedAnimations = [...animations, newAnimation];
    
    // Update local state immediately
    setAnimations(updatedAnimations);
    
    // Sync to stores
    syncToStores(updatedAnimations);
    
    // Close dropdown
    setShowAddDropdown(false);
  };

  // Handle deleting animations internally
  const handleDeleteAnimationInternal = (animationId: string) => {
    const updatedAnimations = animations.filter(anim => anim.id !== animationId);
    
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
    <div className="flex flex-col gap-2">
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setShowAddDropdown(!showAddDropdown)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 flex items-center justify-between w-full"
        >
          <span>+ Add Animation</span>
          <svg className={`w-4 h-4 transition-transform ${showAddDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {showAddDropdown && (
          <div className="absolute top-full left-0 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg z-10">
            {animationTypes.map(({ value, label, description }) => (
              <button
                key={value}
                onClick={() => handleAddAnimationWithType(value)}
                className="w-full px-4 py-3 text-left hover:bg-blue-50 border-b border-gray-100 last:border-b-0 focus:bg-blue-50 focus:outline-none"
              >
                <div className="font-medium text-gray-900">{label}</div>
                <div className="text-sm text-gray-600">{description}</div>
              </button>
            ))}
            <button
              onClick={() => setShowAddDropdown(false)}
              className="w-full px-4 py-2 text-center text-gray-500 hover:bg-gray-50 text-sm border-t"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="flex flex-col gap-2">
        {animations.map((animation) => (
          <div key={animation.id} className={`border rounded p-2 ${
            selectedAnimationId === animation.id ? 'border-green-500 bg-green-50' : ''
          }`}>
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <span className="font-medium text-blue-600">{animation.type}</span>
              <button
                onClick={() => handleDeleteAnimationInternal(animation.id)}
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
                <input
                  type="text"
                  value={animation.type}
                  readOnly
                  className="w-full bg-gray-100 text-gray-600 cursor-not-allowed"
                  title="Animation type cannot be changed after creation"
                />
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
                {animation.yoyo && (
                  <div className="mt-2 ml-6">
                    <label>
                      Return Easing:
                      <select
                        value={animation.yoyoReturnEasing ?? animation.easing ?? 'none'}
                        onChange={e => handleAnimationChange(animation.id, 'yoyoReturnEasing', e.target.value)}
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
                  </div>
                )}
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
              <div className="mt-2">
                <h4 className="font-medium mb-2">Repeat Settings</h4>
                <div className="grid grid-cols-2 gap-2">
                  <label>
                    Repeat Count:
                    <input
                      type="number"
                      min="-1"
                      value={animation.repeat ?? 0}
                      onChange={e => {
                        console.log(`Setting repeat for ${animation.id} to ${e.target.value}`);
                        handleAnimationChange(animation.id, 'repeat', e.target.value);
                      }}
                      className="w-full"
                      placeholder="0 = no repeat, -1 = infinite"
                      title="0 = no repeat, -1 = infinite loop, positive numbers = specific count"
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
                      placeholder="0"
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
      </div>
    </div>
  );
} 