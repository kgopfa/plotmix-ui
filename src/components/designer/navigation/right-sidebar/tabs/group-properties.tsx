import { useState, useEffect } from 'react';
import { CanvasGroup, ElementAnimation } from '@/types/canvas';

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
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <h4 className="font-semibold text-blue-600 text-sm">Group Properties</h4>
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

        {/* Group Info Section */}
        <div className="space-y-4 mt-2">
          <div className="flex items-center mt-2 gap-2 pb-2 border-b border-gray-200">
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
      </div>
    </div>
  );
} 