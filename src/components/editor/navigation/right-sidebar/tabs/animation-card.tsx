import {
  AnimatedCanvasObject,
  ElementAnimation,
  EASING_OPTIONS
} from '@/types/canvas';
import { ChevronDown, ChevronRight, ChevronsUpDown, Check } from 'lucide-react';
import { useState } from 'react';
import { Listbox, ListboxButton, ListboxOption, ListboxOptions } from '@headlessui/react';

interface AnimationCardProps {
  animation: ElementAnimation;
  selectedElement: AnimatedCanvasObject;
  isSelected: boolean;
  onAnimationChange: (id: string, field: string, value: string | number | boolean) => void;
  onDuplicateAnimation: (id: string) => void;
  onDeleteAnimation: (id: string) => void;
  onEnterPathMode: (id: string) => void;
}

export function AnimationCard({
  animation,
  selectedElement,
  isSelected,
  onAnimationChange,
  onDuplicateAnimation,
  onDeleteAnimation,
  onEnterPathMode
}: AnimationCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div 
      className={`
        bg-white rounded-md border transition-all duration-200 overflow-hidden
        ${isSelected 
          ? 'border-purple-300 shadow-lg shadow-purple-500/10 bg-purple-50/50' 
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
        }
      `}
    >
      {/* Animation Header */}
      <div className="flex justify-between items-center py-3 px-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
            <span className="text-white text-xs font-bold">
              {animation.type.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <h4 className="font-medium text-gray-700 capitalize text-sm">{animation.displayName}</h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onDuplicateAnimation(animation.id)}
            className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
            title="Duplicate animation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => onDeleteAnimation(animation.id)}
            className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
            title="Delete animation"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-gray-500" />
            )}
          </button>
        </div>
      </div>

      {/* Animation Content */}
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="p-4 space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
            <h4 className="font-semibold text-gray-600 text-sm">Time Controls</h4>
          </div>
          {/* Basic Settings */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400">Start Time</span>
                <input
                  type="number"
                  value={animation.startTime}
                  onChange={e => onAnimationChange(animation.id, 'startTime', e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                  step="0.1"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-gray-400">Duration</span>
                <input
                  type="number"
                  value={animation.duration}
                  onChange={e => onAnimationChange(animation.id, 'duration', e.target.value)}
                  className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                  step="0.1"
                  min="0.1"
                />
              </label>
            </div>
            
            <div className="mt-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={animation.yoyo ?? false}
                  onChange={e => onAnimationChange(animation.id, 'yoyo', e.target.checked)}
                  className="rounded border-gray-300 focus:ring-2 focus:ring-indigo-500"
                />
                <span className="text-sm font-medium text-gray-400">Yoyo (return to original position)</span>
              </label>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Listbox value={animation.easing ?? 'none'} onChange={(value) => onAnimationChange(animation.id, 'easing', value)}>
                <label className="block text-xs font-semibold text-gray-400">Easing</label>
                <div className="relative">
                  <ListboxButton className="grid w-full cursor-default grid-cols-1 rounded-lg bg-white py-1.5 pr-2 pl-3 text-left text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 text-sm">
                    <span className="col-start-1 row-start-1 truncate pr-6">{animation.easing ?? 'none'}</span>
                    <ChevronsUpDown
                      aria-hidden="true"
                      className="col-start-1 row-start-1 size-4 self-center justify-self-end text-gray-500"
                    />
                  </ListboxButton>

                  <ListboxOptions
                    transition
                    className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-sm shadow-lg ring-1 ring-black/5 focus:outline-hidden data-leave:transition data-leave:duration-100 data-leave:ease-in data-closed:data-leave:opacity-0"
                  >
                    {EASING_OPTIONS.map((ease) => (
                      <ListboxOption
                        key={ease}
                        value={ease}
                        className="group relative cursor-default py-2 pr-4 pl-8 text-gray-600 select-none data-focus:bg-indigo-600 data-focus:text-white data-focus:outline-hidden"
                      >
                        <span className="block truncate font-normal group-data-selected:font-semibold">{ease}</span>

                        <span className="absolute inset-y-0 left-0 flex items-center pl-1.5 text-indigo-600 group-not-data-selected:hidden group-data-focus:text-white">
                          <Check aria-hidden="true" className="size-4" />
                        </span>
                      </ListboxOption>
                    ))}
                  </ListboxOptions>
                </div>
              </Listbox>
            </div>
          </div>

          {/* Properties Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-600 text-sm">Properties</h4>
            </div>
            
            <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50">
              {animation.type === 'rotate' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Rotation</span>
                  <div className="flex">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                      °
                    </div>
                    <input
                      type="number"
                      value={Math.round(animation.properties.rotation ?? 0)}
                      onChange={e => onAnimationChange(animation.id, 'properties.rotation', Math.round(Number(e.target.value)))}
                      className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      step="1"
                    />
                  </div>
                </div>
              )}
              {animation.type === 'scale' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Scale</span>
                  <div className="flex flex-row gap-2">
                    <div className="flex">
                      <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                        X
                      </div>
                      <input
                        type="number"
                        value={animation.properties.scaleX ?? 1}
                        onChange={e => onAnimationChange(animation.id, 'properties.scaleX', e.target.value)}
                        className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                        step="0.1"
                      />
                    </div>
                    <div className="flex">
                      <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                        Y
                      </div>
                      <input
                        type="number"
                        value={animation.properties.scaleY ?? 1}
                        onChange={e => onAnimationChange(animation.id, 'properties.scaleY', e.target.value)}
                        className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                        step="0.1"
                      />
                    </div>
                  </div>
                </div>
              )}
              {animation.type === 'move' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Distance</span>
                  <div className="flex flex-row gap-2">
                    <div className="flex">
                      <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                        X
                      </div>
                      <input
                        type="number"
                        value={Math.round(animation.properties.x ?? 0)}
                        onChange={e => onAnimationChange(animation.id, 'properties.x', Math.round(Number(e.target.value)))}
                        className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                        step="1"
                      />
                    </div>
                    <div className="flex">
                      <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                        Y
                      </div>
                      <input
                        type="number"
                        value={Math.round(animation.properties.y ?? 0)}
                        onChange={e => onAnimationChange(animation.id, 'properties.y', Math.round(Number(e.target.value)))}
                        className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                        step="1"
                      />
                    </div>
                  </div>
                </div>
              )}
              {animation.type === 'color' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Target Color</span>
                  <div className="flex">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                      <div
                        className="w-4 h-4 rounded border border-gray-300"
                        style={{ backgroundColor: animation.properties.fillColor ?? selectedElement.fill ?? '#000000' }}
                      />
                    </div>
                    <input
                      type="color"
                      value={animation.properties.fillColor ?? selectedElement.fill ?? '#000000'}
                      onChange={e => onAnimationChange(animation.id, 'properties.fillColor', e.target.value)}
                      className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                </div>
              )}
              {animation.type === 'fade' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Opacity</span>
                  <div className="flex">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                      %
                    </div>
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={animation.properties.alpha ?? selectedElement.opacity ?? 1}
                      onChange={e => onAnimationChange(animation.id, 'properties.alpha', e.target.value)}
                      className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    />
                  </div>
                </div>
              )}
              {animation.type === 'path' && (
                <div className="grid grid-cols-1 gap-1">
                  <span className="text-xs font-semibold text-gray-400">Path Animation</span>
                  <div className="flex">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-gray-500 outline-1 -outline-offset-1 outline-gray-300">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" fill="currentColor" />
                        <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor" />
                      </svg>
                    </div>
                    <button
                      onClick={() => onEnterPathMode(animation.id)}
                      className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 hover:bg-gray-50 transition-colors"
                    >
                      Draw Path
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Repeat Settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
              <h4 className="font-semibold text-gray-600 text-sm">Repeat Settings</h4>
            </div>
            
            <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/50">
              <div className="grid grid-cols-2 gap-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400">Count</span>
                  <input
                    type="number"
                    min="-1"
                    value={animation.repeat ?? 0}
                    onChange={e => {
                      console.log(`Setting repeat for ${animation.id} to ${e.target.value}`);
                      onAnimationChange(animation.id, 'repeat', e.target.value);
                    }}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                    placeholder="0"
                    title="0 = no repeat, -1 = infinite loop, positive numbers = specific count"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-gray-400">Delay</span>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={animation.repeatDelay ?? 0}
                    onChange={e => onAnimationChange(animation.id, 'repeatDelay', e.target.value)}
                    className="block w-full rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 disabled:opacity-50"
                    placeholder="0"
                    disabled={!animation.repeat || animation.repeat === 0}
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 