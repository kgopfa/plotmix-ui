import { useState, useEffect } from 'react';
import { AnimatedCanvasElement, EASING_OPTIONS, GsapEase, ElementAnimation, AnimationType, AnimatableProperties } from '@/types/canvas';

interface InspectorProps {
  selectedElement: AnimatedCanvasElement | null;
  onInspectorChange: (prop: string, value: string | number | boolean | ElementAnimation[]) => void;
}

type Tab = 'properties' | 'animations';

export function Inspector({ selectedElement, onInspectorChange }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
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

  const handleAnimationChange = (
    animationId: string,
    field: string,
    value: string | number
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
          fade: { alpha: selectedElement!.opacity ?? 1 }
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
        const animationProperty = getAnimationProperty(field, value);
        return {
          ...anim,
          properties: {
            ...anim.properties,
            ...animationProperty
          }
        };
      }
      return anim;
    });

    setLocalAnimations(updatedAnimations);
    onInspectorChange('animations', updatedAnimations);
  };

  const handleAddAnimation = () => {
    if (!selectedElement) return;
    
    const type = 'rotate' as AnimationType;
    const defaultProperties = {
      rotate: { rotation: 0 },
      scale: { scaleX: 1, scaleY: 1 },
      move: { x: 0, y: 0 },
      color: { fillColor: selectedElement.fill },
      fade: { alpha: selectedElement.opacity ?? 1 }
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

  if (!selectedElement) {
    return (
      <aside className="w-80 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
        <p>Select an element to edit properties</p>
      </aside>
    );
  }

  const renderPropertiesTab = () => (
    <form className="flex flex-col gap-2">
      <label>
        Name:
        <input
          type="text"
          value={selectedElement.name}
          onChange={e => onInspectorChange('name', e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
      </label>
      <label>
        X:
        <input
          type="number"
          value={selectedElement.x}
          onChange={e => onInspectorChange('x', Number(e.target.value))}
        />
      </label>
      <label>
        Y:
        <input
          type="number"
          value={selectedElement.y}
          onChange={e => onInspectorChange('y', Number(e.target.value))}
        />
      </label>
      <label>
        Width:
        <input
          type="number"
          value={selectedElement.width}
          onChange={e => onInspectorChange('width', Number(e.target.value))}
        />
      </label>
      <label>
        Height:
        <input
          type="number"
          value={selectedElement.height}
          onChange={e => onInspectorChange('height', Number(e.target.value))}
        />
      </label>
      {selectedElement.type === 'rectangle' && (
        <label>
          Border Radius:
          <input
            type="number"
            value={selectedElement.cornerRadius ?? 0}
            onChange={e => onInspectorChange('cornerRadius', Number(e.target.value))}
          />
        </label>
      )}
      {(selectedElement.type === 'circle' || selectedElement.type === 'triangle') && (
        <label>
          Radius:
          <input
            type="number"
            value={selectedElement.radius ?? 0}
            onChange={e => onInspectorChange('radius', Number(e.target.value))}
          />
        </label>
      )}
      <label>
        Border:
        <input
          type="color"
          value={selectedElement.stroke ?? '#000000'}
          onChange={e => onInspectorChange('stroke', e.target.value)}
        />
      </label>
      <label>
        Border Width:
        <input
          type="number"
          value={selectedElement.strokeWidth ?? 1}
          onChange={e => onInspectorChange('strokeWidth', Number(e.target.value))}
        />
      </label>
      <label>
        Fill:
        <input
          type="color"
          value={selectedElement.fill}
          onChange={e => onInspectorChange('fill', e.target.value)}
        />
      </label>
      <label>
        Opacity:
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={selectedElement.opacity ?? 1}
          onChange={e => onInspectorChange('opacity', Number(e.target.value))}
        />
      </label>
      <label>
        <input
          type="checkbox"
          checked={selectedElement.shadowEnabled ?? false}
          onChange={e => onInspectorChange('shadowEnabled', e.target.checked)}
        />
        Shadow enabled
      </label>
      <fieldset
        disabled={!selectedElement.shadowEnabled}
        className={
          'flex flex-col gap-2 ' +
          (!selectedElement.shadowEnabled ? 'opacity-50 pointer-events-none' : '')
        }
      >
        <label>
          Shadow Color:
          <input
            type="color"
            value={selectedElement.shadowColor ?? '#000000'}
            onChange={e => onInspectorChange('shadowColor', e.target.value)}
          />
        </label>
        <label>
          Shadow Blur:
          <input
            type="number"
            value={selectedElement.shadowBlur ?? 0}
            onChange={e => onInspectorChange('shadowBlur', Number(e.target.value))}
          />
        </label>
        <label>
          Shadow Offset X:
          <input
            type="number"
            value={selectedElement.shadowOffsetX ?? 10}
            onChange={e => onInspectorChange('shadowOffsetX', Number(e.target.value))}
          />
        </label>
        <label>
          Shadow Offset Y:
          <input
            type="number"
            value={selectedElement.shadowOffsetY ?? 10}
            onChange={e => onInspectorChange('shadowOffsetY', Number(e.target.value))}
          />
        </label>
        <label>
          Shadow Opacity:
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={selectedElement.shadowOpacity ?? 0.5}
            onChange={e => onInspectorChange('shadowOpacity', Number(e.target.value))}
          />
        </label>
      </fieldset>
    </form>
  );

  const renderAnimationsTab = () => (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={handleAddAnimation}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        + Add Animation
      </button>
      <div className="flex flex-col gap-2">
        {localAnimations.map((animation) => (
          <div key={animation.id} className="border rounded p-2">
            <div className="flex justify-between items-center mb-2 border-b pb-2">
              <span className="font-medium text-blue-600">{animation.type}</span>
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
                  <option value="rotate">Rotation</option>
                  <option value="scale">Scale</option>
                  <option value="move">Movement</option>
                  <option value="color">Color</option>
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
                  {EASING_OPTIONS.map(ease => (
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
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <aside className="w-80 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
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
      {activeTab === 'properties' ? renderPropertiesTab() : renderAnimationsTab()}
    </aside>
  );
} 