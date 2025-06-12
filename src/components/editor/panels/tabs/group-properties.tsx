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
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2">Group Properties</h3>
        
        {/* Group Name */}
        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Name:
            <input
              type="text"
              value={localGroup.name}
              onChange={(e) => updateLocalProperty('name', e.target.value)}
              className="w-full mt-1 px-2 py-1 border rounded text-sm"
            />
          </label>
        </div>

        {/* Position */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Position</h4>
          <div className="grid grid-cols-2 gap-2">
            <label className="block text-sm">
              X:
              <input
                type="number"
                value={localGroup.x}
                onChange={(e) => updateLocalProperty('x', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 border rounded text-sm"
                step="1"
              />
            </label>
            <label className="block text-sm">
              Y:
              <input
                type="number"
                value={localGroup.y}
                onChange={(e) => updateLocalProperty('y', Number(e.target.value))}
                className="w-full mt-1 px-2 py-1 border rounded text-sm"
                step="1"
              />
            </label>
          </div>
        </div>

        {/* Rotation */}
        <div className="space-y-2 mt-4">
          <label className="block text-sm font-medium">
            Rotation (degrees):
            <input
              type="number"
              value={Math.round((localGroup.rotation || 0) * (180 / Math.PI))}
              onChange={(e) => updateLocalProperty('rotation', Number(e.target.value) * (Math.PI / 180))}
              className="w-full mt-1 px-2 py-1 border rounded text-sm"
              step="1"
            />
          </label>
        </div>

        {/* Group Info */}
        <div className="space-y-2 mt-4">
          <h4 className="text-sm font-medium">Group Info</h4>
          <div className="text-sm text-gray-600 space-y-1">
            <p>Elements: {localGroup.elementIds.length}</p>
            <p>Type: {localGroup.isDefaultGroup ? 'Default Group' : 'Custom Group'}</p>
          </div>
        </div>
      </div>
    </div>
  );
} 