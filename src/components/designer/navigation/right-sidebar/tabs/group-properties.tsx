import { useState, useEffect, useMemo, useRef } from 'react';
import { CanvasGroup, ElementAnimation } from '@/types/canvas';
import { useCanvasElements, useCanvasOperations } from '@/stores/use-canvas-store';
import { FontSelector } from './font-selector';
import { ColorPicker } from './color-picker';
import { Weight, SquareRoundCorner, X } from 'lucide-react';
import { useSetActiveRightPanel } from '@/stores/use-ui-store';

interface GroupPropertiesTabProps {
  selectedGroup: CanvasGroup;
  onGroupInspectorChange: (
    groupId: string,
    prop: string,
    value: string | number | boolean | ElementAnimation[]
  ) => void;
}

export function GroupPropertiesTab({ selectedGroup, onGroupInspectorChange }: GroupPropertiesTabProps) {
  const [localGroup, setLocalGroup] = useState<CanvasGroup>(selectedGroup);
  const [isDirty, setIsDirty] = useState<Record<string, boolean>>({});
  const elements = useCanvasElements();
  const { updateMultipleElements } = useCanvasOperations();
  const setActiveRightPanel = useSetActiveRightPanel();

  // Elements belonging to the selected group
  const elementsInGroup = useMemo(() => {
    if (!selectedGroup) return [] as typeof elements;
    const ids = new Set(selectedGroup.elementIds);
    return elements.filter(el => ids.has(el.id));
  }, [elements, selectedGroup]);

  // Detect if all elements are the same type
  const uniformType = useMemo(() => {
    if (elementsInGroup.length === 0) return null as null | typeof elementsInGroup[number]['type'];
    const firstType = elementsInGroup[0].type;
    return elementsInGroup.every(el => el.type === firstType) ? firstType : null;
  }, [elementsInGroup]);
  
  // Sync with parent component when selected group changes
  useEffect(() => {
    setLocalGroup(selectedGroup);
    setIsDirty({});
  }, [selectedGroup]);
  
  // Batch updates to the parent component
  useEffect(() => {
    const dirtyKeys = Object.keys(isDirty).filter(key => isDirty[key]);
    
    if (dirtyKeys.length > 0) {
      // Apply each dirty property to the global state
      dirtyKeys.forEach(key => {
        if (key in localGroup) {
          const value = localGroup[key as keyof CanvasGroup];
          if (value !== undefined) {
            onGroupInspectorChange(selectedGroup.id, key, value as string | number | boolean | ElementAnimation[]);
          }
        }
      });
      
      // Clear dirty flags
      setIsDirty({});
    }
  }, [isDirty, localGroup, selectedGroup.id, onGroupInspectorChange]);
  
  // Update local state and mark property as dirty
  const updateLocalProperty = <K extends keyof CanvasGroup>(
    key: K, 
    value: CanvasGroup[K]
  ) => {
    setLocalGroup(prev => ({ ...prev, [key]: value }));
    setIsDirty(prev => ({ ...prev, [key]: true }));
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-blue-600 text-sm">Group Properties</h4>
        <button
          onClick={() => setActiveRightPanel(null)}
          className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Group Info Section */}
      <div className="space-y-4 mt-2">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
          <h4 className="font-semibold text-green-600 text-sm">Group Info</h4>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Elements</span>
            <span className="text-sm text-gray-600">{localGroup.elementIds.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-700">Type</span>
            <span className="text-sm text-gray-600">{localGroup.isDefaultGroup ? 'Default Group' : 'Group'}</span>
          </div>
        </div>
      </div>

      {/* Basic Properties */}
      <div className="space-y-4">
        <div className="space-y-4">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-blue-400">Name</span>
            <input
              type="text"
              value={localGroup.name}
              onChange={(e) => updateLocalProperty('name', e.target.value)}
              className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
              placeholder="Group name"
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
                  value={Math.round(localGroup.x)}
                  onChange={(e) => updateLocalProperty('x', Math.round(Number(e.target.value)))}
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
                  value={Math.round(localGroup.y)}
                  onChange={(e) => updateLocalProperty('y', Math.round(Number(e.target.value)))}
                  className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
                  step="1"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-1">
            <span className="text-xs font-semibold text-blue-400">Rotation</span>
            <input
              type="number"
              value={Math.round((localGroup.rotation || 0) * (180 / Math.PI))}
              onChange={(e) => updateLocalProperty('rotation', Number(e.target.value) * (Math.PI / 180))}
              className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
              step="1"
              placeholder="0"
            />
          </div>

          <div className="grid grid-cols-1 gap-1">
            <span className="text-xs font-semibold text-blue-400">Opacity</span>
            <input
              type="number"
              value={localGroup.opacity ?? 1}
              onChange={(e) => updateLocalProperty('opacity', Number(e.target.value))}
              min={0}
              max={1}
              step={0.1}
              className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600"
            />
          </div>
        </div>

        {/* Same-type Group Elements Editing - styled like single element properties, no heading */}
        {uniformType && (
          <div className="space-y-6 mt-2">
            {/* Size (non-line types) */}
            {uniformType !== 'line' && (
              <div className="grid grid-cols-1 gap-1">
                <span className="text-xs font-semibold text-green-400">Size</span>
                <div className="flex flex-row gap-2">
                  <div className="flex">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-green-500 outline-1 -outline-offset-1 outline-gray-300">
                      H
                    </div>
                    <input
                      type="number"
                      value={Math.round(elementsInGroup[0]?.height || 0)}
                      onChange={(e) => {
                        const value = Math.round(Number(e.target.value));
                        updateMultipleElements(
                          elementsInGroup.map(el => ({ id: el.id, updates: { height: value } }))
                        );
                      }}
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
                      value={Math.round(elementsInGroup[0]?.width || 0)}
                      onChange={(e) => {
                        const value = Math.round(Number(e.target.value));
                        updateMultipleElements(
                          elementsInGroup.map(el => ({ id: el.id, updates: { width: value } }))
                        );
                      }}
                      className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-green-600"
                      step="1"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Circle-specific */}
            {uniformType === 'circle' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-xs font-semibold text-orange-400">Radius</span>
                    <input
                      type="number"
                      value={elementsInGroup[0]?.radius || 0}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        updateMultipleElements(
                          elementsInGroup.map(el => ({ id: el.id, updates: { radius: value } }))
                        );
                      }}
                      min={0}
                      className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600"
                    />
                  </label>
                </div>
              </div>
            )}

            {/* Appearance */}
            <GroupAppearanceControls elementsInGroup={elementsInGroup} onBulkUpdate={updateMultipleElements} />

            {/* Stroke */}
            <GroupStrokeControls elementsInGroup={elementsInGroup} onBulkUpdate={updateMultipleElements} showCornerRadius={uniformType === 'rectangle'} />

            {/* Text-specific basic (font family) */}
            {uniformType === 'text' && (
              <div className="space-y-3">
                <label className="flex flex-col gap-1">
                  <span className="text-xs font-semibold text-green-400">Font Family</span>
                  <FontSelector
                    value={elementsInGroup[0]?.fontFamily || 'Arial, sans-serif'}
                    onChange={(value) => {
                      updateMultipleElements(
                        elementsInGroup.map(el => ({ id: el.id, updates: { fontFamily: value } }))
                      );
                    }}
                  />
                </label>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 

// Subcomponents for shared controls (appearance and stroke) to mirror single element styling
function GroupAppearanceControls({ elementsInGroup, onBulkUpdate }: { elementsInGroup: ReturnType<typeof useCanvasElements>; onBulkUpdate: ReturnType<typeof useCanvasOperations>['updateMultipleElements']; }) {
  const [showFillColorPicker, setShowFillColorPicker] = useState(false);
  const fillColorTriggerRef = useRef<HTMLDivElement>(null);
  const [fillHex, setFillHex] = useState<string>('');
  const [fillHexError, setFillHexError] = useState<boolean>(false);

  const sanitizeHexInput = (raw: string) => raw.replace(/#/g, '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
  const isValidHex = (hex: string) => /^[0-9A-F]{6}$/.test(hex);

  useEffect(() => {
    const first = elementsInGroup[0];
    if (!first) return;
    const initFill = (first.fill && first.fill !== 'none' ? first.fill : '#ffffff').replace('#', '').toUpperCase();
    setFillHex(initFill);
    setFillHexError(!isValidHex(initFill));
  }, [elementsInGroup]);

  return (
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
                style={
                  (elementsInGroup[0]?.fill === 'none')
                    ? {
                        backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                        backgroundSize: '8px 8px',
                        backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                      }
                    : { backgroundColor: elementsInGroup[0]?.fill || '#ffffff' }
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
                  onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { fill: '#' + hex } })));
                }
              }}
              className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${fillHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600'} uppercase`}
              placeholder="FFFFFF"
            />
            <ColorPicker
              value={elementsInGroup[0]?.fill || '#ffffff'}
              onChange={(color) => {
                onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { fill: color } })));
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
                onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { fill: 'none' } })));
                setFillHex('');
                setFillHexError(false);
              }}
              isNone={elementsInGroup[0]?.fill === 'none'}
            />
          </div>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-xs font-semibold text-purple-400">Opacity</span>
          <input
            type="number"
            value={elementsInGroup[0]?.opacity ?? 1}
            onChange={e => {
              const value = Number(e.target.value);
              onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { opacity: value } })));
            }}
            min={0}
            max={1}
            step={0.1}
            className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-purple-600"
          />
        </label>
      </div>
    </div>
  );
}

function GroupStrokeControls({ elementsInGroup, onBulkUpdate, showCornerRadius }: { elementsInGroup: ReturnType<typeof useCanvasElements>; onBulkUpdate: ReturnType<typeof useCanvasOperations>['updateMultipleElements']; showCornerRadius?: boolean; }) {
  const [showStrokeColorPicker, setShowStrokeColorPicker] = useState(false);
  const strokeColorTriggerRef = useRef<HTMLDivElement>(null);
  const [strokeHex, setStrokeHex] = useState<string>('');
  const [strokeHexError, setStrokeHexError] = useState<boolean>(false);

  const sanitizeHexInput = (raw: string) => raw.replace(/#/g, '').replace(/[^0-9A-Fa-f]/g, '').slice(0, 6).toUpperCase();
  const isValidHex = (hex: string) => /^[0-9A-F]{6}$/.test(hex);

  useEffect(() => {
    const first = elementsInGroup[0];
    if (!first) return;
    const initStroke = (first.stroke && first.stroke !== 'none' ? first.stroke : '#000000').replace('#', '').toUpperCase();
    setStrokeHex(initStroke);
    setStrokeHexError(!isValidHex(initStroke));
  }, [elementsInGroup]);

  return (
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
                (elementsInGroup[0]?.stroke === 'none')
                  ? {
                      backgroundImage: `linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)`,
                      backgroundSize: '8px 8px',
                      backgroundPosition: '0 0, 0 4px, 4px -4px, -4px 0px'
                    }
                  : { backgroundColor: elementsInGroup[0]?.stroke || '#000000' }
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
                onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { stroke: '#' + hex } })));
              }
            }}
            className={`-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 ${strokeHexError ? 'outline-red-500 focus:outline-red-600' : 'outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600'} uppercase`}
            placeholder="000000"
          />
          <ColorPicker
            value={elementsInGroup[0]?.stroke || '#000000'}
            onChange={(color) => {
              onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { stroke: color } })));
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
              onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { stroke: 'none' } })));
              setStrokeHex('');
              setStrokeHexError(false);
            }}
            isNone={elementsInGroup[0]?.stroke === 'none'}
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
              value={elementsInGroup[0]?.strokeWidth || 0}
              onChange={e => {
                const value = Number(e.target.value);
                onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { strokeWidth: value } })));
              }}
              min={0}
              className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
            />
          </div>
        </label>

        {showCornerRadius && (
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-indigo-400">Corner Radius</span>
            <div className="flex">
              <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-indigo-500 outline-1 -outline-offset-1 outline-gray-300">
                <SquareRoundCorner className="w-4 h-4" />
              </div>
              <input
                type="number"
                value={elementsInGroup[0]?.cornerRadius || 0}
                onChange={e => {
                  const value = Number(e.target.value);
                  onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { cornerRadius: value } })));
                }}
                min={0}
                className="-ml-px block w-full grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-900 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
              />
            </div>
          </label>
        )}
      </div>

      <label className="flex flex-col gap-1">
        <span className="text-xs font-semibold text-indigo-400">Stroke Opacity</span>
        <input
          type="number"
          value={elementsInGroup[0]?.strokeOpacity ?? 1}
          onChange={e => {
            const value = Number(e.target.value);
            onBulkUpdate(elementsInGroup.map(el => ({ id: el.id, updates: { strokeOpacity: value } })));
          }}
          min={0}
          max={1}
          step={0.1}
          className="block w-full grow rounded-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
        />
      </label>
    </div>
  );
}