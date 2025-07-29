import { useState, useEffect, useRef } from 'react';
import {
  AnimatedCanvasObject,
  ElementAnimation
} from '@/types/canvas';
import {
  calculateLineLength,
  calculateNorthAngle
} from '@/utils/drawing-utils';
import { ColorPicker } from './color-picker';
import { FontSelector } from './font-selector';
import { GradientPicker } from './gradient-picker';
import { Weight, SquareRoundCorner, ChevronsUpDown, Check } from 'lucide-react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

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
  const fillColorTriggerRef = useRef<HTMLDivElement>(null);
  const strokeColorTriggerRef = useRef<HTMLDivElement>(null);

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
        <h4 className="font-semibold text-blue-600 text-sm">Properties</h4>
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
                    className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-orange-400">Angle (°)</span>
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
                    className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                  />
                </label>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localElement.lineOptions?.dotted ?? false}
                    onChange={e => updateLineOptions({ dotted: e.target.checked })}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Dotted line</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localElement.lineOptions?.arrow ?? false}
                    onChange={e => updateLineOptions({ arrow: e.target.checked })}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-orange-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Show arrow</span>
                </label>
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
      </div>

      {/* Appearance Properties */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <h4 className="font-semibold text-purple-600 text-sm">Appearance</h4>
        </div>

        <div className="space-y-3">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-purple-400">Fill</span>
            <div className="flex relative">
              <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-purple-500 outline-1 -outline-offset-1 outline-gray-300">
                <div
                  ref={fillColorTriggerRef}
                  className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                  style={{ backgroundColor: localElement.fill || '#ffffff' }}
                  onClick={() => setShowFillColorPicker(!showFillColorPicker)}
                />
              </div>
              <input
                type="text"
                value={(localElement.fill || '#ffffff').replace('#', '').toUpperCase()}
                onChange={e => updateLocalProperty('fill', '#' + e.target.value.toUpperCase())}
                className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600 uppercase"
                placeholder="FFFFFF"
              />
              <ColorPicker
                value={localElement.fill || '#ffffff'}
                onChange={(color) => updateLocalProperty('fill', color)}
                isOpen={showFillColorPicker}
                onClose={() => setShowFillColorPicker(false)}
                triggerRef={fillColorTriggerRef}
              />
            </div>
          </label>
        </div>
      </div>

      {/* Stroke Properties */}
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
                style={{ backgroundColor: localElement.stroke || '#000000' }}
                onClick={() => setShowStrokeColorPicker(!showStrokeColorPicker)}
              />
            </div>
            <input
              type="text"
              value={(localElement.stroke || '#000000').replace('#', '').toUpperCase()}
              onChange={e => updateLocalProperty('stroke', '#' + e.target.value.toUpperCase())}
              className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 uppercase"
              placeholder="000000"
            />
            <ColorPicker
              value={localElement.stroke || '#000000'}
              onChange={(color) => updateLocalProperty('stroke', color)}
              isOpen={showStrokeColorPicker}
              onClose={() => setShowStrokeColorPicker(false)}
              triggerRef={strokeColorTriggerRef}
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
      </div>


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
                        {['normal', 'bold', 'lighter', 'bolder', '100', '200', '300', '400', '500', '600', '700', '800', '900'].map((weight) => (
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
                        {['normal', 'italic', 'oblique'].map((style) => (
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
                        {['left', 'center', 'right', 'justify'].map((align) => (
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
                    checked={!!(localElement.textStroke && localElement.textStrokeWidth)}
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

                {localElement.textStroke && localElement.textStrokeWidth && (
                  <div className="space-y-3 pl-6 border-l-2 border-green-200">
                    <div className="grid grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1">
                        <span className="text-xs font-semibold text-green-400">Stroke Width</span>
                        <input
                          type="number"
                          value={localElement.textStrokeWidth}
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
                          value={(localElement.textStroke || '#000000').replace('#', '').toUpperCase()}
                          onChange={e => updateLocalProperty('textStroke', '#' + e.target.value.toUpperCase())}
                          className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 uppercase"
                          placeholder="000000"
                        />
                      </div>
                    </label>
                  </div>
                )}
              </div>

              {/* Drop Shadow Controls */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={localElement.shadowEnabled || false}
                    onChange={e => updateLocalProperty('shadowEnabled', e.target.checked)}
                    className="rounded border-gray-300 focus:ring-2 focus:ring-green-500"
                  />
                  <span className="text-sm font-medium text-gray-700">Drop Shadow</span>
                </div>

                {localElement.shadowEnabled && (
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
                          value={(localElement.shadowColor || '#000000').replace('#', '').toUpperCase()}
                          onChange={e => updateLocalProperty('shadowColor', '#' + e.target.value.toUpperCase())}
                          className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600 uppercase"
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
    </div >
  );
} 