import React from 'react';
import { useUIStore } from '@/stores/use-ui-store';

export const PathModeIndicator = () => {
  const isPathMode = useUIStore(state => state.tools.isPathMode);
  const togglePathMode = useUIStore(state => state.togglePathMode);
  const setAnimationTarget = useUIStore(state => state.setAnimationTarget);

  if (!isPathMode) return null;

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-blue-500 text-white rounded text-sm">
      <span className="font-medium">Drawing Animation Path</span>
      <button
        className="bg-white text-blue-500 px-2 py-0.5 rounded text-xs font-medium hover:bg-blue-100"
        onClick={() => {
          togglePathMode();
          setAnimationTarget(null);
        }}
      >
        Cancel
      </button>
    </div>
  );
}; 