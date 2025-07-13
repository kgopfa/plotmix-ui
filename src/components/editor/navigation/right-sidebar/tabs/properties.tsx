import { useState, useEffect } from 'react';
import { 
  AnimatedCanvasObject,
  ElementAnimation
} from '@/types/canvas';
import { 
  calculateLineLength, 
  calculateNorthAngle
} from '@/utils/drawing-utils';

interface PropertiesTabProps {
  selectedElement: AnimatedCanvasObject;
  onInspectorChange: (
    prop: string,
    value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
      animationId: string;
      elementId: string;
    }
  ) => void;
}

export function PropertiesTab({ selectedElement, onInspectorChange }: PropertiesTabProps) {
  const [localElement, setLocalElement] = useState<AnimatedCanvasObject>(selectedElement);
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});
  
  // Sync with parent component when selected element changes
  useEffect(() => {
    // Exclude animations from local element state - they should only be managed by AnimationsTab
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { animations: _, ...elementWithoutAnimations } = selectedElement;
    setLocalElement({ ...elementWithoutAnimations, animations: [] } as AnimatedCanvasObject);
    setIsDirty({});
  }, [selectedElement]);
  
  // Batch updates to the parent component
  useEffect(() => {
    const dirtyKeys = Object.keys(isDirty).filter(key => isDirty[key]);
    
    if (dirtyKeys.length > 0) {
      // Apply each dirty property to the global state
      dirtyKeys.forEach(key => {
        // Skip animations - these should only be managed by the AnimationsTab
        if (key === 'animations') {
          return;
        }
        
        // Special handling for lineOptions - compare stringified values
        if (key === 'lineOptions') {
          const lineOptions = localElement.lineOptions;
          if (lineOptions && JSON.stringify(lineOptions) !== JSON.stringify(selectedElement.lineOptions)) {
            onInspectorChange(key, lineOptions);
          }
        } 
        // Regular property updates (excluding animations)
        else if (key in localElement) {
          const value = localElement[key as keyof AnimatedCanvasObject];
          // Ensure value is of the expected type before passing to onInspectorChange
          if (value !== undefined) {
            onInspectorChange(key, value as string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
              animationId: string;
              elementId: string;
            });
          }
        }
      });
      
      // Clear dirty flags
      setIsDirty({});
    }
  }, [isDirty, localElement, selectedElement, onInspectorChange]);
  
  // Update local state and mark property as dirty
  const updateLocalProperty = <K extends keyof AnimatedCanvasObject>(
    key: K, 
    value: AnimatedCanvasObject[K]
  ) => {
    setLocalElement(prev => ({ ...prev, [key]: value }));
    setIsDirty(prev => ({ ...prev, [key]: true }));
  };
  
  // Helper for line options updates
  const updateLineOptions = (updates: Partial<NonNullable<AnimatedCanvasObject['lineOptions']>>) => {
    setLocalElement(prev => ({
      ...prev,
      lineOptions: { ...prev.lineOptions!, ...updates }
    }));
    setIsDirty(prev => ({ ...prev, lineOptions: true }));
  };
  
  // Helper for angle and length updates that affect multiple properties
  const updateLineGeometry = (
    width: number, 
    height: number, 
    lineOptions: NonNullable<AnimatedCanvasObject['lineOptions']>
  ) => {
    setLocalElement(prev => ({
      ...prev,
      width,
      height,
      lineOptions
    }));
    
    setIsDirty(prev => ({ 
      ...prev, 
      width: true,
      height: true,
      lineOptions: true
    }));
  };
  
  return (
    <form className="flex flex-col gap-2 p-2">
      <label>
        Name:
        <input
          type="text"
          value={localElement.name}
          onChange={e => updateLocalProperty('name', e.target.value)}
          className="w-full px-2 py-1 border rounded"
        />
      </label>
      <label>
        X:
        <input
          type="number"
          value={localElement.x}
          onChange={e => updateLocalProperty('x', Number(e.target.value))}
        />
      </label>
      <label>
        Y:
        <input
          type="number"
          value={localElement.y}
          onChange={e => updateLocalProperty('y', Number(e.target.value))}
        />
      </label>
      {localElement.type === 'line' ? (
        <>
          <label>
            Length:
            <input
              type="number"
              value={Math.round(calculateLineLength(localElement.lineOptions!.points))}
              onChange={e => {
                const newLength = Number(e.target.value);
                if (newLength <= 0) return;
                
                const angle = calculateNorthAngle(localElement.lineOptions!.points) * Math.PI / 180;
                const start = localElement.lineOptions!.points.start;
                const end = {
                  x: start.x + newLength * Math.sin(angle),
                  y: start.y + newLength * Math.cos(angle)
                };
                
                // Calculate new dimensions
                const width = Math.abs(end.x - start.x);
                const height = Math.abs(end.y - start.y);
                
                // Update both the line's dimensions and points
                const updatedLineOptions = {
                  ...localElement.lineOptions!,
                  points: { start, end }
                };
                
                updateLineGeometry(width, height, updatedLineOptions);
              }}
              min={1}
            />
          </label>
          <label>
            Angle (°):
            <input
              type="number"
              value={Math.round(calculateNorthAngle(localElement.lineOptions!.points))}
              onChange={e => {
                const newAngle = Number(e.target.value) * Math.PI / 180;
                const length = calculateLineLength(localElement.lineOptions!.points);
                const start = localElement.lineOptions!.points.start;
                const end = {
                  x: start.x + length * Math.sin(newAngle),
                  y: start.y + length * Math.cos(newAngle)
                };
                
                // Calculate new dimensions
                const width = Math.abs(end.x - start.x);
                const height = Math.abs(end.y - start.y);
                
                // Update both the line's dimensions and points
                const updatedLineOptions = {
                  ...localElement.lineOptions!,
                  points: { start, end }
                };
                
                updateLineGeometry(width, height, updatedLineOptions);
              }}
              min={0}
              max={360}
              step={1}
            />
          </label>
        </>
      ) : (
        <>
          <label>
            Width:
            <input
              type="number"
              value={localElement.width}
              onChange={e => updateLocalProperty('width', Number(e.target.value))}
            />
          </label>
          <label>
            Height:
            <input
              type="number"
              value={localElement.height}
              onChange={e => updateLocalProperty('height', Number(e.target.value))}
            />
          </label>
        </>
      )}
      {localElement.type === 'rectangle' && (
        <label>
          Border Radius:
          <input
            type="number"
            value={localElement.cornerRadius ?? 0}
            onChange={e => updateLocalProperty('cornerRadius', Number(e.target.value))}
          />
        </label>
      )}
      {(localElement.type === 'circle' || localElement.type === 'triangle') && (
        <label>
          Radius:
          <input
            type="number"
            value={localElement.radius ?? 0}
            onChange={e => updateLocalProperty('radius', Number(e.target.value))}
          />
        </label>
      )}
      <label>
        Border:
        <input
          type="color"
          value={localElement.stroke ?? '#000000'}
          onChange={e => updateLocalProperty('stroke', e.target.value)}
        />
      </label>
      <label>
        Border Width:
        <input
          type="number"
          value={localElement.strokeWidth ?? 1}
          onChange={e => updateLocalProperty('strokeWidth', Number(e.target.value))}
        />
      </label>
      <label>
        Fill:
        <input
          type="color"
          value={localElement.fill}
          onChange={e => updateLocalProperty('fill', e.target.value)}
        />
      </label>
      <label>
        Opacity:
        <input
          type="number"
          min={0}
          max={1}
          step={0.01}
          value={localElement.opacity ?? 1}
          onChange={e => updateLocalProperty('opacity', Number(e.target.value))}
        />
      </label>
      {localElement.type === 'line' ? (
        <div className="flex flex-col gap-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localElement.lineOptions?.dotted ?? false}
              onChange={e => updateLineOptions({ dotted: e.target.checked })}
            />
            Dotted line
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localElement.lineOptions?.arrow ?? false}
              onChange={e => updateLineOptions({ arrow: e.target.checked })}
            />
            Show arrow
          </label>
        </div>
      ) : (
        <>
          <label>
            <input
              type="checkbox"
              checked={localElement.shadowEnabled ?? false}
              onChange={e => updateLocalProperty('shadowEnabled', e.target.checked)}
            />
            Shadow enabled
          </label>
          <fieldset
            disabled={!localElement.shadowEnabled}
            className={
              'flex flex-col gap-2 ' +
              (!localElement.shadowEnabled ? 'opacity-50 pointer-events-none' : '')
            }
          >
            <label>
              Shadow Color:
              <input
                type="color"
                value={localElement.shadowColor ?? '#000000'}
                onChange={e => updateLocalProperty('shadowColor', e.target.value)}
              />
            </label>
            <label>
              Shadow Blur:
              <input
                type="number"
                value={localElement.shadowBlur ?? 0}
                onChange={e => updateLocalProperty('shadowBlur', Number(e.target.value))}
              />
            </label>
            <label>
              Shadow Offset X:
              <input
                type="number"
                value={localElement.shadowOffsetX ?? 10}
                onChange={e => updateLocalProperty('shadowOffsetX', Number(e.target.value))}
              />
            </label>
            <label>
              Shadow Offset Y:
              <input
                type="number"
                value={localElement.shadowOffsetY ?? 10}
                onChange={e => updateLocalProperty('shadowOffsetY', Number(e.target.value))}
              />
            </label>
            <label>
              Shadow Opacity:
              <input
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={localElement.shadowOpacity ?? 0.5}
                onChange={e => updateLocalProperty('shadowOpacity', Number(e.target.value))}
              />
            </label>
          </fieldset>
        </>
      )}
    </form>
  );
} 