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
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
        <h3 className="font-semibold text-gray-900">Properties</h3>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Name</span>
            <input
              type="text"
              value={localElement.name}
              onChange={e => updateLocalProperty('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Element name"
            />
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">X Position</span>
              <input
                type="number"
                value={Math.round(localElement.x)}
                onChange={e => updateLocalProperty('x', Math.round(Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                step="1"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Y Position</span>
              <input
                type="number"
                value={Math.round(localElement.y)}
                onChange={e => updateLocalProperty('y', Math.round(Number(e.target.value)))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                step="1"
              />
            </label>
          </div>
        </div>

        {/* Line-specific properties */}
        {localElement.type === 'line' ? (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
              <div className="w-1 h-1 bg-gray-500 rounded-full"></div>
              Line Properties
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Length</span>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Angle (°)</span>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </label>
            </div>
            
            <div className="mt-3 space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localElement.lineOptions?.dotted ?? false}
                  onChange={e => updateLineOptions({ dotted: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Dotted line</span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localElement.lineOptions?.arrow ?? false}
                  onChange={e => updateLineOptions({ arrow: e.target.checked })}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show arrow</span>
              </label>
            </div>
          </div>
        ) : (
          /* Non-line properties */
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Width</span>
                <input
                  type="number"
                  value={Math.round(localElement.width)}
                  onChange={e => updateLocalProperty('width', Math.round(Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  step="1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Height</span>
                <input
                  type="number"
                  value={Math.round(localElement.height)}
                  onChange={e => updateLocalProperty('height', Math.round(Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  step="1"
                />
              </label>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Rotation</span>
                <input
                  type="number"
                  value={Math.round(localElement.rotation || 0)}
                  onChange={e => updateLocalProperty('rotation', Math.round(Number(e.target.value)))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  placeholder="0"
                  step="1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-sm font-medium text-gray-700">Opacity</span>
                <input
                  type="number"
                  value={localElement.opacity || 1}
                  onChange={e => updateLocalProperty('opacity', Number(e.target.value))}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                />
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Appearance Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
          <h4 className="font-medium text-gray-800">Appearance</h4>
        </div>
        
        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Fill Color</span>
            <input
              type="color"
              value={localElement.fill || '#ffffff'}
              onChange={e => updateLocalProperty('fill', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </label>
          
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Border Color</span>
            <input
              type="color"
              value={localElement.stroke || '#000000'}
              onChange={e => updateLocalProperty('stroke', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </label>
          
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Border Width</span>
            <input
              type="number"
              value={localElement.strokeWidth || 0}
              onChange={e => updateLocalProperty('strokeWidth', Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </label>
          
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Border Radius</span>
            <input
              type="number"
              value={localElement.cornerRadius || 0}
              onChange={e => updateLocalProperty('cornerRadius', Number(e.target.value))}
              min={0}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
            />
          </label>
        </div>
      </div>

      {/* Text Properties */}
      {(localElement.type === 'text' || localElement.type === 'textGroup') && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <h4 className="font-medium text-gray-800">Text Properties</h4>
          </div>
          
          <div className="space-y-3">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Font Size</span>
              <input
                type="number"
                value={localElement.fontSize || 16}
                onChange={e => updateLocalProperty('fontSize', Number(e.target.value))}
                min={8}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              />
            </label>
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Font Family</span>
              <select
                value={localElement.fontFamily || 'Arial'}
                onChange={e => updateLocalProperty('fontFamily', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="Arial">Arial</option>
                <option value="Helvetica">Helvetica</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Courier New">Courier New</option>
                <option value="Georgia">Georgia</option>
                <option value="Verdana">Verdana</option>
              </select>
            </label>
            
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-gray-700">Font Weight</span>
              <select
                value={localElement.fontWeight || 'normal'}
                onChange={e => updateLocalProperty('fontWeight', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              >
                <option value="normal">Normal</option>
                <option value="bold">Bold</option>
                <option value="lighter">Lighter</option>
                <option value="bolder">Bolder</option>
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  );
} 