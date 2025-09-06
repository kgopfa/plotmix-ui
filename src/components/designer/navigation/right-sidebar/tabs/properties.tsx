import { useState, useEffect, useRef } from 'react';
import {
  AnimatedCanvasObject,
  ElementAnimation
} from '@/types/canvas';
import {
  calculateLineLength,
  calculateNorthAngle,
  updateLineFromLengthAndNorthAngle,
  clearAnimatedRectangleDotsCacheForShape
} from '@/utils/drawing-utils';
import { ColorPicker } from './color-picker';
import { FontSelector } from './font-selector';
import { GradientPicker } from './gradient-picker';
import { Weight, SquareRoundCorner, ChevronsUpDown, Check, X, Zap } from 'lucide-react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

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
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const [showAnimatedColorPicker, setShowAnimatedColorPicker] = useState(false);
  const fillColorTriggerRef = useRef<HTMLDivElement>(null);
  const strokeColorTriggerRef = useRef<HTMLDivElement>(null);
  const animatedColorTriggerRef = useRef<HTMLDivElement>(null);
  const setActiveRightPanel = useSetActiveRightPanel();

  // Local input state for color fields with validation
  const [fillHex, setFillHex] = useState<string>('');
  const [fillHexError, setFillHexError] = useState<boolean>(false);
  const [strokeHex, setStrokeHex] = useState<string>('');
  const [strokeHexError, setStrokeHexError] = useState<boolean>(false);
  const [shadowHex, setShadowHex] = useState<string>('');
  const [shadowHexError, setShadowHexError] = useState<boolean>(false);
  const [textStrokeHex, setTextStrokeHex] = useState<string>('');
  const [textStrokeHexError, setTextStrokeHexError] = useState<boolean>(false);
  const [animatedHex, setAnimatedHex] = useState<string>('');
  const [animatedHexError, setAnimatedHexError] = useState<boolean>(false);

  const sanitizeHexInput = (raw: string) => raw.replace(/#/g, '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
  const isValidHex = (hex: string) => /^[0-9A-F]{6}$/.test(hex);

  // Sync with parent component when selected element changes
  useEffect(() => {
    // Exclude animations from local element state - they should only be managed by AnimationsTab
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { animations: _, ...elementWithoutAnimations } = selectedElement;
    setLocalElement({ ...elementWithoutAnimations, animations: [] } as AnimatedCanvasObject);
    setIsDirty({});

    // Initialize color input states from the selected element
    const initFill = (selectedElement.fill && selectedElement.fill !== 'none' ? selectedElement.fill : '#ffffff').replace('#', '').toUpperCase();
    setFillHex(initFill);
    setFillHexError(!isValidHex(initFill));

    const initStroke = (selectedElement.stroke && selectedElement.stroke !== 'none' ? selectedElement.stroke : '#000000').replace('#', '').toUpperCase();
    setStrokeHex(initStroke);
    setStrokeHexError(!isValidHex(initStroke));

    const initShadow = (selectedElement.shadowColor || '#000000').replace('#', '').toUpperCase();
    setShadowHex(initShadow);
    setShadowHexError(!isValidHex(initShadow));

    const initTextStroke = (selectedElement.textStroke || '#000000').replace('#', '').toUpperCase();
    setTextStrokeHex(initTextStroke);
    setTextStrokeHexError(!isValidHex(initTextStroke));

    const initAnimated = (selectedElement.lineOptions?.animatedColor || selectedElement.stroke || '#000000').replace('#', '').toUpperCase();
    setAnimatedHex(initAnimated);
    setAnimatedHexError(!isValidHex(initAnimated));
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
          // Always send the value, including undefined for properties that can be explicitly disabled
          onInspectorChange(key, value as string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasObject['lineOptions']> | {
            animationId: string;
            elementId: string;
          });
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
      lineOptions: {
        ...prev.lineOptions!,
        ...updates,
        // Ensure controlPoint and isCurved are preserved when updating other properties
        controlPoint: updates.controlPoint ?? prev.lineOptions!.controlPoint,
        isCurved: updates.isCurved ?? prev.lineOptions!.isCurved ?? true
      }
    }));
    setIsDirty(prev => ({ ...prev, lineOptions: true }));
  };

  // Helper for animated rectangle properties updates (clears cache for real-time updates)
  const updateAnimatedProperties = (updates: Partial<NonNullable<AnimatedCanvasObject['lineOptions']>>) => {
    // Clear the cache for this shape to force recreation with new properties
    clearAnimatedRectangleDotsCacheForShape(localElement.id);
    
    setLocalElement(prev => ({
      ...prev,
      lineOptions: {
        ...prev.lineOptions!,
        ...updates,
        // Ensure controlPoint and isCurved are preserved when updating other properties
        controlPoint: updates.controlPoint ?? prev.lineOptions!.controlPoint,
        isCurved: updates.isCurved ?? prev.lineOptions!.isCurved ?? true
      }
    }));
    setIsDirty(prev => ({ ...prev, lineOptions: true }));
  };

  // Helper to update shadow filters on the canvas
  const updateShadowFilters = (elementId: string, shadowProperties: Partial<AnimatedCanvasObject>) => {
    // Dispatch a custom event to update shadow filters on the canvas
    const shadowUpdateEvent = new CustomEvent('element-shadow-update', {
      detail: {
        id: elementId,
        shadowProperties
      }
    });
    window.dispatchEvent(shadowUpdateEvent);
  };

  // Helper for angle and length updates that affect multiple properties
  const updateLineGeometry = (
    width: number,
    height: number,
    lineOptions: NonNullable<AnimatedCanvasObject['lineOptions']>
  ) => {
    // Calculate the new center position based on the updated line endpoints
    const centerX = (lineOptions.points.start.x + lineOptions.points.end.x) / 2;
    const centerY = (lineOptions.points.start.y + lineOptions.points.end.y) / 2;

    setLocalElement(prev => ({
      ...prev,
      x: centerX,
      y: centerY,
      width,
      height,
      lineOptions: {
        ...lineOptions,
        // Ensure controlPoint and isCurved are preserved
        controlPoint: lineOptions.controlPoint ?? prev.lineOptions!.controlPoint,
        isCurved: lineOptions.isCurved ?? prev.lineOptions!.isCurved ?? true
      }
    }));

    setIsDirty(prev => ({
      ...prev,
      x: true,
      y: true,
      width: true,
      height: true,
      lineOptions: true
    }));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-blue-600 text-sm">Properties</h4>
        <button
          onClick={() => setActiveRightPanel(null)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-blue-400">Name</span>
            <input
              type="text"
              value={localElement.name}
              onChange={e => updateLocalProperty('name', e.target.value)}
              className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
              placeholder="Element name"
            />
          </label>

          <div className="grid grid-cols-1 gap-1">
            <span className="text-xs font-semibold text-blue-400">Position</span>
            <div className="flex flex-row gap-2">
              <div className="flex">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-blue-500 outline-1 -outline-offset-1 outline-gray-300">
                  X
                </div>
                <input
                  type="number"
                  value={Math.round(localElement.x)}
                  onChange={e => updateLocalProperty('x', Math.round(Number(e.target.value)))}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                  step="1"
                />
              </div>
              <div className="flex">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-blue-500 outline-1 -outline-offset-1 outline-gray-300">
                  Y
                </div>
                <input
                  type="number"
                  value={Math.round(localElement.y)}
                  onChange={e => updateLocalProperty('y', Math.round(Number(e.target.value)))}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                  step="1"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Line-specific properties */}
        {localElement.type === 'line' ? (
          <div className="space-y-4 mt-2">
            <div className="flex items-center mt-2 gap-2 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-orange-600 text-sm">Line Properties</h4>
            </div>

            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-orange-400">Length</span>
                  <input
                    type="number"
                    value={Math.round(calculateLineLength(localElement.lineOptions!.points))}
                    onChange={e => {
                      const newLength = Number(e.target.value);
                      if (newLength <= 0) return;

                      const currentAngle = calculateNorthAngle(localElement.lineOptions!.points);
                      const start = localElement.lineOptions!.points.start;
                      const end = updateLineFromLengthAndNorthAngle(start, newLength, currentAngle);

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
                    className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-orange-400">Angle (°)</span>
                  <input
                    type="number"
                    value={Math.round(calculateNorthAngle(localElement.lineOptions!.points))}
                    onChange={e => {
                      const newAngle = Number(e.target.value);
                      const length = calculateLineLength(localElement.lineOptions!.points);
                      const start = localElement.lineOptions!.points.start;
                      const end = updateLineFromLengthAndNorthAngle(start, length, newAngle);

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
                    className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                  />
                </label>
              </div>

              <div className="space-y-3">

                {/* Control Point Coordinates - only show for curved lines */}
                {localElement.lineOptions?.isCurved && localElement.lineOptions?.controlPoint && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-orange-400">Control X</span>
                        <input
                          type="number"
                          value={Math.round(localElement.lineOptions.controlPoint.x)}
                          onChange={e => {
                            const newX = Number(e.target.value);
                            const updatedLineOptions = {
                              ...localElement.lineOptions!,
                              controlPoint: {
                                ...localElement.lineOptions!.controlPoint!,
                                x: newX
                              }
                            };
                            updateLineOptions(updatedLineOptions);
                          }}
                          className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-orange-400">Control Y</span>
                        <input
                          type="number"
                          value={Math.round(localElement.lineOptions.controlPoint.y)}
                          onChange={e => {
                            const newY = Number(e.target.value);
                            const updatedLineOptions = {
                              ...localElement.lineOptions!,
                              controlPoint: {
                                ...localElement.lineOptions!.controlPoint!,
                                y: newY
                              }
                            };
                            updateLineOptions(updatedLineOptions);
                          }}
                          className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                        />
                      </label>
                    </div>
                    
                    {/* Curve Intensity Slider */}
                    <div>
                      <label className="block text-xs font-medium text-orange-400 mb-1">Curve Intensity</label>
                      <input
                        type="range"
                        min="0"
                        max="200"
                        value={(() => {
                          if (!localElement.lineOptions?.controlPoint) return 0;
                          const { start, end } = localElement.lineOptions.points;
                          const { controlPoint } = localElement.lineOptions;
                          
                          // Calculate distance from control point to straight line
                          const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                          if (lineLength === 0) return 0;
                          
                          // Calculate perpendicular distance from control point to line
                          const A = end.y - start.y;
                          const B = start.x - end.x;
                          const C = end.x * start.y - start.x * end.y;
                          const distance = Math.abs(A * controlPoint.x + B * controlPoint.y + C) / Math.sqrt(A * A + B * B);
                          
                          // Convert to percentage (0-200%)
                          return Math.min(200, Math.round((distance / lineLength) * 200));
                        })()}
                        onChange={e => {
                          const intensity = Number(e.target.value) / 100; // Convert to 0-2 multiplier
                          const { start, end } = localElement.lineOptions!.points;
                          
                          // Calculate midpoint of straight line
                          const midX = (start.x + end.x) / 2;
                          const midY = (start.y + end.y) / 2;
                          
                          // Calculate perpendicular direction from line
                          const lineAngle = Math.atan2(end.y - start.y, end.x - start.x);
                          const perpAngle = lineAngle + Math.PI / 2;
                          
                          // Calculate line length for scaling
                          const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                          
                          // Position control point perpendicular to line at desired intensity
                          const newControlPoint = {
                            x: midX + Math.cos(perpAngle) * lineLength * intensity * 0.5,
                            y: midY + Math.sin(perpAngle) * lineLength * intensity * 0.5
                          };
                          
                          const updatedLineOptions = {
                            ...localElement.lineOptions!,
                            controlPoint: newControlPoint
                          };
                          updateLineOptions(updatedLineOptions);
                        }}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, #f97316 0%, #f97316 ${(() => {
                            if (!localElement.lineOptions?.controlPoint) return 0;
                            const { start, end } = localElement.lineOptions.points;
                            const { controlPoint } = localElement.lineOptions;
                            const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                            if (lineLength === 0) return 0;
                            const A = end.y - start.y;
                            const B = start.x - end.x;
                            const C = end.x * start.y - start.x * end.y;
                            const distance = Math.abs(A * controlPoint.x + B * controlPoint.y + C) / Math.sqrt(A * A + B * B);
                            return Math.min(100, (distance / lineLength) * 100);
                          })()}%, #e5e7eb ${(() => {
                            if (!localElement.lineOptions?.controlPoint) return 0;
                            const { start, end } = localElement.lineOptions.points;
                            const { controlPoint } = localElement.lineOptions;
                            const lineLength = Math.sqrt((end.x - start.x) ** 2 + (end.y - start.y) ** 2);
                            if (lineLength === 0) return 0;
                            const A = end.y - start.y;
                            const B = start.x - end.x;
                            const C = end.x * start.y - start.x * end.y;
                            const distance = Math.abs(A * controlPoint.x + B * controlPoint.y + C) / Math.sqrt(A * A + B * B);
                            return Math.min(100, (distance / lineLength) * 100);
                          })()}%, #e5e7eb 100%)`
                        }}
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-1">
                        <span>Straight</span>
                        <span>Maximum Curve</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                {/* Always show dotted line option */}
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localElement.lineOptions?.dotted ?? false}
                    onChange={e => updateLineOptions({ dotted: e.target.checked })}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Dotted line</span>
                </label>

                {/* Only show animated dots for curved lines or lines that already have animated properties */}
                {((localElement.lineOptions?.isCurved) || 
                  (localElement.lineOptions?.animatedDots)) && 
                 !(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localElement.lineOptions?.animatedDots ?? false}
                      onChange={e => updateLineOptions({ animatedDots: e.target.checked })}
                      className="rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Animated dots</span>
                  </label>
                )}

                {/* Show animated rectangle properties when both dotted and animatedDots are true */}
                {localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                      <Zap className="w-4 h-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700">Animated Rectangles</span>
                    </div>
                    
                    {/* Gap between rectangles */}
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-blue-400">Gap</span>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={localElement.lineOptions?.animatedGap || 20}
                        onChange={e => updateAnimatedProperties({ animatedGap: parseInt(e.target.value) || 20 })}
                        className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                      />
                    </label>
                    
                    
                    {/* Rectangle length */}
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-blue-400">Length</span>
                      <input
                        type="number"
                        min="2"
                        max="50"
                        value={localElement.lineOptions?.animatedLength || 8}
                        onChange={e => updateAnimatedProperties({ animatedLength: parseInt(e.target.value) || 8 })}
                        className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                      />
                    </label>
                    
                    {/* Rectangle thickness */}
                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-blue-400">Thickness</span>
                      <input
                        type="number"
                        min="1"
                        max="20"
                        value={localElement.lineOptions?.animatedThickness || 4}
                        onChange={e => updateAnimatedProperties({ animatedThickness: parseInt(e.target.value) || 4 })}
                        className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                      />
                    </label>
                  </div>
                )}

                {/* Show arrow head option for all lines (straight and curved) except animated lines */}
                {!(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={localElement.lineOptions?.arrow ?? false}
                      onChange={e => updateLineOptions({ arrow: e.target.checked })}
                      className="rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Arrow head</span>
                  </label>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Non-line properties */
          <div className="grid grid-cols-1 gap-1">
            <span className="text-xs font-semibold text-green-400">Size</span>
            <div className="flex flex-row gap-2">
              <div className="flex">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                  H
                </div>
                <input
                  type="number"
                  value={Math.round(localElement.height)}
                  onChange={e => updateLocalProperty('height', Math.round(Number(e.target.value)))}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
                  step="1"
                />
              </div>
              <div className="flex">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                  W
                </div>
                <input
                  type="number"
                  value={Math.round(localElement.width)}
                  onChange={e => updateLocalProperty('width', Math.round(Number(e.target.value)))}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
                  step="1"
                />
              </div>
            </div>
          </div>
        )}

        {/* Rotation Property */}
        <div className="grid grid-cols-1 gap-1">
          <span className="text-xs font-semibold text-green-400">Rotation</span>
          <div className="flex">
            <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
              °
            </div>
            <input
              type="number"
              value={Math.round((localElement.rotation || 0) * (180 / Math.PI))}
              onChange={e => updateLocalProperty('rotation', Number(e.target.value) * (Math.PI / 180))}
              className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
              step="1"
              placeholder="0"
            />
          </div>
        </div>
      </div>

      {/* Appearance Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <h4 className="font-semibold text-purple-600 text-sm">Appearance</h4>
        </div>

        <div className="space-y-3">
          {/* Show Fill only for non-animated lines */}
          {!(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-purple-400">Fill</span>
              <div className="flex relative">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-purple-500 outline-1 -outline-offset-1 outline-gray-300">
                  <div
                    ref={fillColorTriggerRef}
                    className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                    style={
                      (localElement.fill === 'none')
                        ? {
                            backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                            backgroundSize: '8px 8px',
                            backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                          }
                        : { backgroundColor: localElement.fill || '#ffffff' }
                    }
                    onClick={() => setShowFillColorPicker(!showFillColorPicker)}
                  />
                </div>
                <input
                  type="text"
                  value={fillHex}
                  onChange={e => {
                    const hex = sanitizeHexInput(e.target.value);
                    setFillHex(hex);
                    const valid = isValidHex(hex);
                    setFillHexError(!valid);
                    if (valid) {
                      updateLocalProperty('fill', '#' + hex);
                    }
                  }}
                  className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${fillHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600'} uppercase`}
                  placeholder="FFFFFF"
                />
                <ColorPicker
                  value={localElement.fill || '#ffffff'}
                  onChange={(color) => {
                    updateLocalProperty('fill', color);
                    if (color === 'none') {
                      setFillHex('');
                      setFillHexError(false);
                    } else {
                      const next = color.replace('#', '').toUpperCase();
                      setFillHex(next);
                      setFillHexError(!isValidHex(next));
                    }
                  }}
                  isOpen={showFillColorPicker}
                  onClose={() => setShowFillColorPicker(false)}
                  triggerRef={fillColorTriggerRef}
                  allowNone
                  onClear={() => {
                    updateLocalProperty('fill', 'none');
                    setFillHex('');
                    setFillHexError(false);
                  }}
                  isNone={localElement.fill === 'none'}
                />
              </div>
            </label>
          )}

          {/* Show animated rectangle color for animated lines */}
          {localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-purple-400">Color</span>
              <div className="flex relative">
                <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-purple-500 outline-1 -outline-offset-1 outline-gray-300">
                  <div
                    ref={animatedColorTriggerRef}
                    className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: localElement.lineOptions?.animatedColor || localElement.stroke || '#000000' }}
                    onClick={() => setShowAnimatedColorPicker(!showAnimatedColorPicker)}
                  />
                </div>
                <input
                  type="text"
                  value={animatedHex}
                  onChange={e => {
                    const hex = sanitizeHexInput(e.target.value);
                    setAnimatedHex(hex);
                    const valid = isValidHex(hex);
                    setAnimatedHexError(!valid);
                    if (valid) {
                      updateAnimatedProperties({ animatedColor: '#' + hex });
                    }
                  }}
                  className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${animatedHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600'} uppercase`}
                  placeholder="000000"
                />
                <ColorPicker
                  value={localElement.lineOptions?.animatedColor || localElement.stroke || '#000000'}
                  onChange={(color) => {
                    updateAnimatedProperties({ animatedColor: color });
                    const next = color.replace('#', '').toUpperCase();
                    setAnimatedHex(next);
                    setAnimatedHexError(!isValidHex(next));
                  }}
                  isOpen={showAnimatedColorPicker}
                  onClose={() => setShowAnimatedColorPicker(false)}
                  triggerRef={animatedColorTriggerRef}
                />
              </div>
            </label>
          )}

          {/* Show animated rectangle opacity for animated lines */}
          {localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-purple-400">Opacity</span>
              <input
                type="number"
                value={localElement.lineOptions?.animatedOpacity ?? 1}
                onChange={e => updateAnimatedProperties({ animatedOpacity: Number(e.target.value) })}
                min={0}
                max={1}
                step={0.1}
                className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600"
              />
            </label>
          )}

          {/* Show regular opacity for non-animated lines */}
          {!(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-purple-400">Opacity</span>
              <input
                type="number"
                value={localElement.opacity ?? 1}
                onChange={e => updateLocalProperty('opacity', Number(e.target.value))}
                min={0}
                max={1}
                step={0.1}
                className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600"
              />
            </label>
          )}
        </div>
      </div>

      {/* Stroke Properties - hide for text elements since they use textStroke instead, and hide for animated lines since they use animated rectangle color */}
      {localElement.type !== 'text' && !(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <h4 className="font-semibold text-indigo-600 text-sm">Stroke</h4>
          </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-indigo-400">Fill</span>
          <div className="flex relative">
            <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-indigo-500 outline-1 -outline-offset-1 outline-gray-300">
              <div
                ref={strokeColorTriggerRef}
                className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                style={
                  (localElement.stroke === 'none')
                    ? {
                        backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                      }
                    : { backgroundColor: localElement.stroke || '#000000' }
                }
                onClick={() => setShowStrokeColorPicker(!showStrokeColorPicker)}
              />
            </div>
            <input
              type="text"
              value={strokeHex}
              onChange={e => {
                const hex = sanitizeHexInput(e.target.value);
                setStrokeHex(hex);
                const valid = isValidHex(hex);
                setStrokeHexError(!valid);
                if (valid) {
                  updateLocalProperty('stroke', '#' + hex);
                }
              }}
              className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${strokeHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600'} uppercase`}
              placeholder="000000"
            />
            <ColorPicker
              value={localElement.stroke || '#000000'}
              onChange={(color) => {
                updateLocalProperty('stroke', color);
                if (color === 'none') {
                  setStrokeHex('');
                  setStrokeHexError(false);
                } else {
                  const next = color.replace('#', '').toUpperCase();
                  setStrokeHex(next);
                  setStrokeHexError(!isValidHex(next));
                }
              }}
              isOpen={showStrokeColorPicker}
              onClose={() => setShowStrokeColorPicker(false)}
              triggerRef={strokeColorTriggerRef}
              allowNone
              onClear={() => {
                updateLocalProperty('stroke', 'none');
                setStrokeHex('');
                setStrokeHexError(false);
              }}
              isNone={localElement.stroke === 'none'}
            />
          </div>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-indigo-400">Width</span>
            <div className="flex">
              <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-indigo-500 outline-1 -outline-offset-1 outline-gray-300">
                <Weight className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={localElement.strokeWidth || 0}
                onChange={e => updateLocalProperty('strokeWidth', Number(e.target.value))}
                min={0}
                className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-indigo-400">Corner Radius</span>
            <div className="flex">
              <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-indigo-500 outline-1 -outline-offset-1 outline-gray-300">
                <SquareRoundCorner className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={localElement.cornerRadius || 0}
                onChange={e => updateLocalProperty('cornerRadius', Number(e.target.value))}
                min={0}
                className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </label>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-indigo-400">Stroke Opacity</span>
          <input
            type="number"
            value={localElement.strokeOpacity ?? 1}
            onChange={e => updateLocalProperty('strokeOpacity', Number(e.target.value))}
            min={0}
            max={1}
            step={0.1}
            className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
          />
        </label>
      </div>
      )}

      {/* Shadow Properties - hide for animated lines since they don't support shadows */}
      {!(localElement.lineOptions?.dotted && localElement.lineOptions?.animatedDots) && (
        <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <h4 className="font-semibold text-amber-600 text-sm">Shadow</h4>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={localElement.shadowEnabled || false}
              onChange={e => {
                updateLocalProperty('shadowEnabled', e.target.checked);
                updateShadowFilters(localElement.id, { shadowEnabled: e.target.checked });
              }}
              className="rounded border-gray-300 focus:ring-2 focus:ring-amber-500"
            />
            <span className="text-sm font-medium text-gray-700">Enable Shadow</span>
          </div>

          {localElement.shadowEnabled && (
            <div className="space-y-3 pl-6 border-l-2 border-amber-200">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-400">Blur</span>
                  <input
                    type="number"
                    value={localElement.shadowBlur || 4}
                    onChange={e => {
                      const value = Number(e.target.value);
                      updateLocalProperty('shadowBlur', value);
                      updateShadowFilters(localElement.id, { shadowBlur: value });
                    }}
                    min={0}
                    max={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-400">Distance</span>
                  <input
                    type="number"
                    value={localElement.shadowOffsetX || 6}
                    onChange={e => {
                      const value = Number(e.target.value);
                      updateLocalProperty('shadowOffsetX', value);
                      updateShadowFilters(localElement.id, { shadowOffsetX: value });
                    }}
                    min={0}
                    max={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                  />
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-400">Offset Y</span>
                  <input
                    type="number"
                    value={localElement.shadowOffsetY || 6}
                    onChange={e => {
                      const value = Number(e.target.value);
                      updateLocalProperty('shadowOffsetY', value);
                      updateShadowFilters(localElement.id, { shadowOffsetY: value });
                    }}
                    min={0}
                    max={50}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-amber-400">Angle (°)</span>
                  <input
                    type="number"
                    value={Math.round(((localElement.shadowAngle || Math.PI / 6) * 180) / Math.PI)}
                    onChange={e => {
                      const value = (Number(e.target.value) * Math.PI) / 180;
                      updateLocalProperty('shadowAngle', value);
                      updateShadowFilters(localElement.id, { shadowAngle: value });
                    }}
                    min={0}
                    max={360}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                  />
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-amber-400">Opacity</span>
                <input
                  type="number"
                  value={localElement.shadowOpacity || 1}
                  onChange={e => {
                    const value = Number(e.target.value);
                    updateLocalProperty('shadowOpacity', value);
                    updateShadowFilters(localElement.id, { shadowOpacity: value });
                  }}
                  min={0}
                  max={1}
                  step={0.1}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition-colors text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-amber-400">Shadow Color</span>
                <div className="flex relative">
                  <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-amber-500 outline-1 -outline-offset-1 outline-gray-300">
                    <div
                      className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                      style={{ backgroundColor: localElement.shadowColor || '#000000' }}
                    />
                  </div>
                  <input
                    type="text"
                    value={shadowHex}
                    onChange={e => {
                      const hex = sanitizeHexInput(e.target.value);
                      setShadowHex(hex);
                      const valid = isValidHex(hex);
                      setShadowHexError(!valid);
                      if (valid) {
                        const value = '#' + hex;
                        updateLocalProperty('shadowColor', value);
                        updateShadowFilters(localElement.id, { shadowColor: value });
                      }
                    }}
                    className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${shadowHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-amber-600'} uppercase`}
                    placeholder="000000"
                  />
                </div>
              </label>
            </div>
          )}
        </div>
      </div>
      )}

      {/* Text Properties */}
      {
        (localElement.type === 'text') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-red-400 text-sm">Text Properties</h4>
            </div>

            <div className="space-y-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-green-400">Font Family</span>
                <FontSelector
                  value={localElement.fontFamily || 'Arial, sans-serif'}
                  onChange={(value) => updateLocalProperty('fontFamily', value)}
                />
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-400">Font Size</span>
                  <input
                    type="number"
                    value={localElement.fontSize || 16}
                    onChange={e => updateLocalProperty('fontSize', Number(e.target.value))}
                    min={8}
                    className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm"
                  />
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-400">Font Weight</span>
                  <Listbox value={localElement.fontWeight || 'normal'} onChange={(value) => updateLocalProperty('fontWeight', value)}>
                    <div className="relative">
                      <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm">
                        <span className="col-start-1 row-start-1 truncate pr-6">{localElement.fontWeight || 'normal'}</span>
                        <ChevronsUpDown
                          aria-hidden="true"
                          className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                        />
                      </ListboxButton>

                      <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                      >
                        {['Normal', 'Bold', 'Lighter', 'Bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((weight) => (
                          <ListboxOption
                            key={weight}
                            value={weight}
                            className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-green-600 data-focus:text-white data-focus:outline-hidden"
                          >
                            <span className="block truncate font-normal group-data-selected:font-semibold">{weight}</span>

                            <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-green-600 group-not-data-selected:hidden group-data-focus:text-white">
                              <Check aria-hidden="true" className="size-4" />
                            </span>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-400">Font Style</span>
                  <Listbox value={localElement.fontStyle || 'normal'} onChange={(value) => updateLocalProperty('fontStyle', value)}>
                    <div className="relative">
                      <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm">
                        <span className="col-start-1 row-start-1 truncate pr-6">{localElement.fontStyle || 'normal'}</span>
                        <ChevronsUpDown
                          aria-hidden="true"
                          className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                        />
                      </ListboxButton>

                      <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                      >
                        {['Normal', 'Italic', 'Oblique'].map((style) => (
                          <ListboxOption
                            key={style}
                            value={style}
                            className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-green-600 data-focus:text-white data-focus:outline-hidden"
                          >
                            <span className="block truncate font-normal group-data-selected:font-semibold">{style}</span>

                            <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-green-600 group-not-data-selected:hidden group-data-focus:text-white">
                              <Check aria-hidden="true" className="size-4" />
                            </span>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-400">Text Align</span>
                  <Listbox value={localElement.textAlign || 'left'} onChange={(value) => updateLocalProperty('textAlign', value)}>
                    <div className="relative">
                      <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm">
                        <span className="col-start-1 row-start-1 truncate pr-6">{localElement.textAlign || 'left'}</span>
                        <ChevronsUpDown
                          aria-hidden="true"
                          className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                        />
                      </ListboxButton>

                      <ListboxOptions
                        transition
                        className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                      >
                        {['Left', 'Center', 'Right', 'Justify'].map((align) => (
                          <ListboxOption
                            key={align}
                            value={align}
                            className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-green-600 data-focus:text-white data-focus:outline-hidden"
                          >
                            <span className="block truncate font-normal group-data-selected:font-semibold">{align}</span>

                            <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-green-600 group-not-data-selected:hidden group-data-focus:text-white">
                              <Check aria-hidden="true" className="size-4" />
                            </span>
                          </ListboxOption>
                        ))}
                      </ListboxOptions>
                    </div>
                  </Listbox>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-green-400">Line Height</span>
                <input
                  type="number"
                  value={localElement.lineHeight || 1.2}
                  onChange={e => updateLocalProperty('lineHeight', Number(e.target.value))}
                  min={0.5}
                  max={3}
                  step={0.1}
                  className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-green-400">Letter Spacing</span>
                <input
                  type="number"
                  value={localElement.letterSpacing || 0}
                  onChange={e => updateLocalProperty('letterSpacing', Number(e.target.value))}
                  min={-5}
                  max={20}
                  step={0.5}
                  className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm"
                />
              </label>

              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-green-400">Text Width</span>
                <input
                  type="number"
                  value={Math.round(localElement.width)}
                  onChange={e => {
                    const newWidth = Math.round(Number(e.target.value));
                    // Update both width and wordWrapWidth simultaneously
                    updateLocalProperty('width', newWidth);
                    updateLocalProperty('wordWrapWidth', newWidth);
                  }}
                  min={50}
                  max={1000}
                  step={1}
                  className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm"
                />
              </label>

              {/* Text Stroke/Outline Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={!!(localElement.textStroke && (localElement.textStrokeWidth ?? 0) > 0)}
                    onChange={e => {
                      if (e.target.checked) {
                        updateLocalProperty('textStroke', '#000000');
                        updateLocalProperty('textStrokeWidth', 1);
                      } else {
                        updateLocalProperty('textStroke', undefined);
                        updateLocalProperty('textStrokeWidth', 0);
                      }
                    }}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Text Stroke</span>
                </div>
                {localElement.textStroke && (localElement.textStrokeWidth ?? 0) > 0 && (
                  <div className="space-y-3 pl-6 border-l-2 border-green-200">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Stroke Width</span>
                        <input
                          type="number"
                          value={localElement.textStrokeWidth ?? 0}
                          onChange={e => updateLocalProperty('textStrokeWidth', Number(e.target.value))}
                          min={0.5}
                          max={10}
                          step={0.5}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Join Style</span>
                        <Listbox value={localElement.textStrokeJoin || 'round'} onChange={(value) => updateLocalProperty('textStrokeJoin', value)}>
                          <div className="relative">
                            <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 text-sm">
                              <span className="col-start-1 row-start-1 truncate pr-6">{localElement.textStrokeJoin || 'round'}</span>
                              <ChevronsUpDown
                                aria-hidden="true"
                                className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                              />
                            </ListboxButton>

                            <ListboxOptions
                              transition
                              className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                            >
                              {['round', 'miter', 'bevel'].map((join) => (
                                <ListboxOption
                                  key={join}
                                  value={join}
                                  className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-green-600 data-focus:text-white data-focus:outline-hidden"
                                >
                                  <span className="block truncate font-normal group-data-selected:font-semibold">{join}</span>

                                  <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-green-600 group-not-data-selected:hidden group-data-focus:text-white">
                                    <Check aria-hidden="true" className="size-4" />
                                  </span>
                                </ListboxOption>
                              ))}
                            </ListboxOptions>
                          </div>
                        </Listbox>
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-green-400">Stroke Color</span>
                      <div className="flex relative">
                        <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: localElement.textStroke || '#000000' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={textStrokeHex}
                          onChange={e => {
                            const hex = sanitizeHexInput(e.target.value);
                            setTextStrokeHex(hex);
                            const valid = isValidHex(hex);
                            setTextStrokeHexError(!valid);
                            if (valid) {
                              updateLocalProperty('textStroke', '#' + hex);
                            }
                          }}
                          className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${textStrokeHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600'} uppercase`}
                          placeholder="000000"
                        />
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Drop Shadow Controls - Different behavior for text vs other elements */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={
                      localElement.type === 'text' 
                        ? !!(localElement.textDropShadow) 
                        : (localElement.shadowEnabled || false)
                    }
                    onChange={e => {
                      if (localElement.type === 'text') {
                        if (e.target.checked) {
                          updateLocalProperty('textDropShadow', {
                            color: '#000000',
                            blur: 4,
                            angle: Math.PI / 6,
                            distance: 6,
                            alpha: 1
                          });
                        } else {
                          updateLocalProperty('textDropShadow', undefined);
                        }
                      } else {
                        updateLocalProperty('shadowEnabled', e.target.checked);
                      }
                    }}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Drop Shadow</span>
                </div>

                {/* Text Drop Shadow Controls */}
                {localElement.type === 'text' && localElement.textDropShadow && (
                  <div className="space-y-3 pl-6 border-l-2 border-green-200">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Blur</span>
                        <input
                          type="number"
                          value={localElement.textDropShadow.blur || 4}
                          onChange={e => updateLocalProperty('textDropShadow', {
                            color: localElement.textDropShadow?.color || '#000000',
                            blur: Number(e.target.value),
                            angle: localElement.textDropShadow?.angle || Math.PI / 6,
                            distance: localElement.textDropShadow?.distance || 6,
                            alpha: localElement.textDropShadow?.alpha || 1
                          })}
                          min={0}
                          max={50}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Distance</span>
                        <input
                          type="number"
                          value={localElement.textDropShadow.distance || 6}
                          onChange={e => updateLocalProperty('textDropShadow', {
                            color: localElement.textDropShadow?.color || '#000000',
                            blur: localElement.textDropShadow?.blur || 4,
                            angle: localElement.textDropShadow?.angle || Math.PI / 6,
                            distance: Number(e.target.value),
                            alpha: localElement.textDropShadow?.alpha || 1
                          })}
                          min={0}
                          max={50}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Angle (°)</span>
                        <input
                          type="number"
                          value={Math.round(((localElement.textDropShadow.angle || Math.PI / 6) * 180) / Math.PI)}
                          onChange={e => updateLocalProperty('textDropShadow', {
                            color: localElement.textDropShadow?.color || '#000000',
                            blur: localElement.textDropShadow?.blur || 4,
                            angle: (Number(e.target.value) * Math.PI) / 180,
                            distance: localElement.textDropShadow?.distance || 6,
                            alpha: localElement.textDropShadow?.alpha || 1
                          })}
                          min={0}
                          max={360}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Opacity</span>
                        <input
                          type="number"
                          value={localElement.textDropShadow.alpha || 1}
                          onChange={e => updateLocalProperty('textDropShadow', {
                            color: localElement.textDropShadow?.color || '#000000',
                            blur: localElement.textDropShadow?.blur || 4,
                            angle: localElement.textDropShadow?.angle || Math.PI / 6,
                            distance: localElement.textDropShadow?.distance || 6,
                            alpha: Number(e.target.value)
                          })}
                          min={0}
                          max={1}
                          step={0.1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-green-400">Shadow Color</span>
                      <div className="flex relative">
                        <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: localElement.textDropShadow.color || '#000000' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={(localElement.textDropShadow.color || '#000000').replace('#', '').toUpperCase()}
                          onChange={e => {
                            const hex = sanitizeHexInput(e.target.value);
                            if (isValidHex(hex)) {
                              updateLocalProperty('textDropShadow', {
                                color: '#' + hex,
                                blur: localElement.textDropShadow?.blur || 4,
                                angle: localElement.textDropShadow?.angle || Math.PI / 6,
                                distance: localElement.textDropShadow?.distance || 6,
                                alpha: localElement.textDropShadow?.alpha || 1
                              });
                            }
                          }}
                          className="block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:ring-green-600 uppercase"
                          placeholder="000000"
                        />
                      </div>
                    </label>
                  </div>
                )}

                {/* General Shadow Controls for non-text elements */}
                {localElement.type !== 'text' && localElement.shadowEnabled && (
                  <div className="space-y-3 pl-6 border-l-2 border-green-200">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Blur</span>
                        <input
                          type="number"
                          value={localElement.shadowBlur || 4}
                          onChange={e => updateLocalProperty('shadowBlur', Number(e.target.value))}
                          min={0}
                          max={50}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Distance</span>
                        <input
                          type="number"
                          value={localElement.shadowOffsetX || 6}
                          onChange={e => updateLocalProperty('shadowOffsetX', Number(e.target.value))}
                          min={0}
                          max={50}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Angle (°)</span>
                        <input
                          type="number"
                          value={Math.round(((localElement.shadowAngle || Math.PI / 6) * 180) / Math.PI)}
                          onChange={e => updateLocalProperty('shadowAngle', (Number(e.target.value) * Math.PI) / 180)}
                          min={0}
                          max={360}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Opacity</span>
                        <input
                          type="number"
                          value={localElement.shadowOpacity || 1}
                          onChange={e => updateLocalProperty('shadowOpacity', Number(e.target.value))}
                          min={0}
                          max={1}
                          step={0.1}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors text-sm"
                        />
                      </label>
                    </div>

                    <label className="flex flex-col gap-1">
                      <span className="text-xs font-semibold text-green-400">Shadow Color</span>
                      <div className="flex relative">
                        <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                          <div
                            className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                            style={{ backgroundColor: localElement.shadowColor || '#000000' }}
                          />
                        </div>
                        <input
                          type="text"
                          value={shadowHex}
                          onChange={e => {
                            const hex = sanitizeHexInput(e.target.value);
                            setShadowHex(hex);
                            const valid = isValidHex(hex);
                            setShadowHexError(!valid);
                            if (valid) {
                              updateLocalProperty('shadowColor', '#' + hex);
                            }
                          }}
                          className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${shadowHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600'} uppercase`}
                          placeholder="000000"
                        />
                      </div>
                    </label>


                  </div>
                )}
              </div>

              {/* Text Gradient Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">Text Gradient</span>
                </div>
                <GradientPicker
                  gradient={localElement.textGradient}
                  onChange={(gradient) => updateLocalProperty('textGradient', gradient)}
                  onRemove={() => updateLocalProperty('textGradient', undefined)}
                />
              </div>
            </div>
          </div>
        )
      }

      {/* Code Editor Properties */}
      {
        (localElement.type === 'code-editor') && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-blue-400 text-sm">Code Editor Properties</h4>
            </div>

            <div className="space-y-3">
              {/* Line Numbers Toggle */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={localElement.showLineNumbers || false}
                  onChange={e => updateLocalProperty('showLineNumbers', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Show Line Numbers</span>
              </div>

              {/* Language Selection */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-blue-400">Language</span>
                <Listbox value={localElement.language || 'javascript'} onChange={(value) => updateLocalProperty('language', value)}>
                  <div className="relative">
                    <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 text-sm">
                      <span className="col-start-1 row-start-1 truncate pr-6">{localElement.language || 'javascript'}</span>
                      <ChevronsUpDown
                        aria-hidden="true"
                        className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                      />
                    </ListboxButton>

                    <ListboxOptions
                      transition
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                    >
                      {['javascript', 'typescript', 'go', 'python', 'java', 'cpp', 'csharp', 'php', 'ruby', 'swift', 'rust'].map((lang) => (
                        <ListboxOption
                          key={lang}
                          value={lang}
                          className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-blue-600 data-focus:text-white data-focus:outline-hidden"
                        >
                          <span className="block truncate font-normal group-data-selected:font-semibold">{lang}</span>

                          <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                            <Check aria-hidden="true" className="size-4" />
                          </span>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </label>

              {/* Theme Selection */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-blue-400">Theme</span>
                <Listbox value={localElement.syntaxTheme || 'light'} onChange={(value) => updateLocalProperty('syntaxTheme', value)}>
                  <div className="relative">
                    <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 text-sm">
                      <span className="col-start-1 row-start-1 truncate pr-6">{localElement.syntaxTheme || 'light'}</span>
                      <ChevronsUpDown
                        aria-hidden="true"
                        className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                      />
                    </ListboxButton>

                    <ListboxOptions
                      transition
                      className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                    >
                      {['light', 'dark'].map((theme) => (
                        <ListboxOption
                          key={theme}
                          value={theme}
                          className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-blue-600 data-focus:text-white data-focus:outline-hidden"
                        >
                          <span className="block truncate font-normal group-data-selected:font-semibold">{theme}</span>

                          <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-blue-600 group-not-data-selected:hidden group-data-focus:text-white">
                            <Check aria-hidden="true" className="size-4" />
                          </span>
                        </ListboxOption>
                      ))}
                    </ListboxOptions>
                  </div>
                </Listbox>
              </label>

              {/* Tab Size */}
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-blue-400">Tab Size</span>
                <input
                  type="number"
                  value={localElement.tabSize || 2}
                  onChange={e => updateLocalProperty('tabSize', Number(e.target.value))}
                  min={1}
                  max={8}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
                />
              </label>
            </div>
          </div>
        )
      }
    </div >
  );
} 