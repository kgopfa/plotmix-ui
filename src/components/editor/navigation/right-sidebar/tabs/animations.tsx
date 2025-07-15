import {
  AnimatedCanvasObject,
  ElementAnimation,
  EASING_OPTIONS
} from '@/types/canvas';
import { useState, useEffect } from 'react';
import { AnimationSelectionManager } from '@/lib/animation-selection-manager';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { ChevronDown } from 'lucide-react';

interface AnimationsTabProps {
  selectedElement: AnimatedCanvasObject;
  localAnimations: ElementAnimation[];
  onEnterPathMode: (id: string) => void;
}

export function AnimationsTab({
  selectedElement,
  localAnimations,
  onEnterPathMode
}: AnimationsTabProps) {
  // Local state is the single source of truth for this component
  const [animations, setAnimations] = useState<ElementAnimation[]>(localAnimations);
  const [selectedAnimationId, setSelectedAnimationId] = useState<string | null>(null);
  const animationSelectionManager = AnimationSelectionManager.getInstance();

  // Get stores for direct updates
  const canvasStore = useCanvasStore();
  const { updateAnimationDuration, updateAnimationRepeat, updateTracks, buildGSAPTimeline } = useTimelineStore();

  // Sync local state when props change (initial load or element switch)
  useEffect(() => {
    setAnimations(localAnimations);
  }, [localAnimations, selectedElement.id]); // Reset when element changes

  // Auto-rebuild timeline when animations change
  useEffect(() => {
    if (animations.length > 0 || localAnimations.length !== animations.length) {
      console.log(`🎬 Animations changed for element ${selectedElement.id}, rebuilding timeline...`);

      // Update Canvas Store first
      canvasStore.updateElement(selectedElement.id, { animations });

      // Force Timeline Store to sync with Canvas Store
      const canvasElements = canvasStore.getAllElements();
      const canvasGroups = canvasStore.getAllGroups();
      const timelineStore = useTimelineStore.getState();

      // Update Timeline Store with latest data
      timelineStore.setElements(canvasElements);
      timelineStore.setGroups(canvasGroups);

      // Force clear Enhanced Timeline Manager cache to ensure rebuild
      timelineStore.gsapManager.forceClearCache();

      // Rebuild timeline
      setTimeout(() => {
        updateTracks();
        buildGSAPTimeline();
      }, 0);
    }
  }, [animations, selectedElement.id, canvasStore, updateTracks, buildGSAPTimeline]);

  // Listen for animation selections
  useEffect(() => {
    return animationSelectionManager.subscribe((selection) => {
      if (selection && selection.elementId === selectedElement.id) {
        setSelectedAnimationId(selection.animationId);
      } else {
        setSelectedAnimationId(null);
      }
    });
  }, [animationSelectionManager, selectedElement.id]);



  // Simplified sync to stores (Timeline rebuild handled by useEffect above)
  const syncToStores = (updatedAnimations: ElementAnimation[], changedField?: string, animationId?: string) => {
    // For repeat-related changes, use Timeline Store methods for consistency
    if (changedField && animationId && ['repeat', 'repeatDelay', 'yoyo'].includes(changedField)) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        if (changedField === 'repeat') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'repeatDelay') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        } else if (changedField === 'yoyo') {
          updateAnimationRepeat(animationId, selectedElement.id, animation.repeat ?? 0, animation.repeatDelay, animation.yoyo);
        }
      }
    } else if (changedField === 'duration' && animationId) {
      const animation = updatedAnimations.find(a => a.id === animationId);
      if (animation) {
        updateAnimationDuration(animationId, selectedElement.id, animation.duration);
      }
    }

    // Force clear cache for any animation changes to ensure timeline rebuilds
    const timelineStore = useTimelineStore.getState();
    timelineStore.gsapManager.forceClearCache();

    // Note: Canvas Store update and timeline rebuild handled by useEffect
  };



  // Handle deleting animations internally
  const handleDeleteAnimationInternal = (animationId: string) => {
    const updatedAnimations = animations.filter(anim => anim.id !== animationId);

    // Update local state immediately
    setAnimations(updatedAnimations);

    // Sync to stores
    syncToStores(updatedAnimations);
  };

  // Handle duplicating animations
  const handleDuplicateAnimation = (animationId: string) => {
    const originalAnimation = animations.find(anim => anim.id === animationId);
    if (!originalAnimation) return;

    // Create a copy with a new ID and slightly offset start time
    const duplicatedAnimation: ElementAnimation = {
      ...originalAnimation,
      id: `${originalAnimation.type}-${Date.now()}`,
      startTime: originalAnimation.startTime + originalAnimation.duration + 0.1 // Offset to avoid overlap
    };

    const updatedAnimations = [...animations, duplicatedAnimation];

    // Update local state immediately
    setAnimations(updatedAnimations);

    // Sync to stores
    syncToStores(updatedAnimations);
  };

  // Handle all animation changes through local state
  const handleAnimationChange = (id: string, field: string, value: string | number | boolean) => {
    console.log(`Animation change: ${field} = ${value} for animation ${id}`);

    const updatedAnimations = animations.map(anim => {
      if (anim.id !== id) return anim;

      if (field.includes('.')) {
        // Handle nested properties (e.g., 'properties.rotation')
        const [parent, child] = field.split('.');
        const parentKey = parent as keyof ElementAnimation;
        const parentValue = anim[parentKey];

        if (typeof parentValue === 'object' && parentValue !== null) {
          return {
            ...anim,
            [parent]: {
              ...parentValue,
              [child]: value
            }
          };
        }
        return anim;
      }

      // Handle direct properties
      if (field === 'repeat') {
        return { ...anim, repeat: Number(value) };
      } else if (field === 'repeatDelay') {
        return { ...anim, repeatDelay: Number(value) };
      } else if (field === 'yoyo') {
        return { ...anim, yoyo: Boolean(value) };
      } else if (field === 'duration') {
        return { ...anim, duration: Number(value) };
      } else {
        return { ...anim, [field]: value };
      }
    });

    // Update local state immediately
    setAnimations(updatedAnimations);

    // Sync to stores based on field type
    syncToStores(updatedAnimations, field, id);
  };

  return (
    <div className="flex flex-col gap-6 p-2">
      {/* Header */}
      <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
        <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
        <h3 className="font-semibold text-gray-900">Animations</h3>
      </div>

      {/* No animations state */}
      {animations.length === 0 && (
        <div className="p-6 text-center bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border border-purple-200/50">
          <div className="w-12 h-12 mx-auto mb-3 bg-purple-100 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-gray-700 mb-1">No animations yet</p>
          <p className="text-xs text-gray-500">Use the left sidebar to add animations</p>
        </div>
      )}

      {/* Animation List */}
      <div className="space-y-4">
        {animations.map((animation) => (
          <div 
            key={animation.id} 
            className={`
              bg-white rounded-xl border transition-all duration-200 overflow-hidden
              ${selectedAnimationId === animation.id 
                ? 'border-purple-300 shadow-lg shadow-purple-500/10 bg-purple-50/50' 
                : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
              }
            `}
          >
            {/* Animation Header */}
            <div className="flex justify-between items-center p-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-blue-500 rounded-lg flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {animation.type.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 capitalize">{animation.type}</h4>
                  <p className="text-xs text-gray-500">
                    {animation.startTime}s → {(animation.startTime + animation.duration).toFixed(1)}s
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleDuplicateAnimation(animation.id)}
                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                  title="Duplicate animation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
                <button
                  onClick={() => handleDeleteAnimationInternal(animation.id)}
                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                  title="Delete animation"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Animation Content */}
            <div className="p-4 space-y-6">
              {/* Basic Settings */}
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700">Start Time</span>
                    <input
                      type="number"
                      value={animation.startTime}
                      onChange={e => handleAnimationChange(animation.id, 'startTime', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      step="0.1"
                    />
                  </label>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700">Duration</span>
                    <input
                      type="number"
                      value={animation.duration}
                      onChange={e => handleAnimationChange(animation.id, 'duration', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors"
                      step="0.1"
                      min="0.1"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-gray-700">Easing</span>
                    <div className="relative">
                      <select
                        value={animation.easing ?? 'none'}
                        onChange={e => handleAnimationChange(animation.id, 'easing', e.target.value)}
                        className="w-full px-3 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-colors appearance-none"
                      >
                        {EASING_OPTIONS.map(ease => (
                          <option key={ease} value={ease}>
                            {ease}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="size-3 absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                    </div>
                  </label>
                </div>
              </div>

              {/* Properties Section */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  <h4 className="font-medium text-gray-800">Properties</h4>
                </div>
                
                <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-200/50">
                  <div className="grid grid-cols-2 gap-3">
                    {animation.type === 'rotate' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">Rotation (degrees)</span>
                        <input
                          type="number"
                          value={animation.properties.rotation ?? 0}
                          onChange={e => handleAnimationChange(animation.id, 'properties.rotation', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          step="1"
                        />
                      </label>
                    )}
                    {animation.type === 'scale' && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">Scale X</span>
                          <input
                            type="number"
                            value={animation.properties.scaleX ?? 1}
                            onChange={e => handleAnimationChange(animation.id, 'properties.scaleX', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            step="0.1"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">Scale Y</span>
                          <input
                            type="number"
                            value={animation.properties.scaleY ?? 1}
                            onChange={e => handleAnimationChange(animation.id, 'properties.scaleY', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                            step="0.1"
                          />
                        </label>
                      </>
                    )}
                    {animation.type === 'move' && (
                      <>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">Target X</span>
                          <input
                            type="number"
                            value={animation.properties.x ?? selectedElement.x}
                            onChange={e => handleAnimationChange(animation.id, 'properties.x', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </label>
                        <label className="flex flex-col gap-1">
                          <span className="text-sm font-medium text-gray-700">Target Y</span>
                          <input
                            type="number"
                            value={animation.properties.y ?? selectedElement.y}
                            onChange={e => handleAnimationChange(animation.id, 'properties.y', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          />
                        </label>
                      </>
                    )}
                    {animation.type === 'color' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">Target Color</span>
                        <input
                          type="color"
                          value={animation.properties.fillColor ?? selectedElement.fill ?? '#000000'}
                          onChange={e => handleAnimationChange(animation.id, 'properties.fillColor', e.target.value)}
                          className="w-full h-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </label>
                    )}
                    {animation.type === 'fade' && (
                      <label className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-gray-700">Target Opacity</span>
                        <input
                          type="number"
                          min="0"
                          max="1"
                          step="0.1"
                          value={animation.properties.alpha ?? selectedElement.opacity ?? 1}
                          onChange={e => handleAnimationChange(animation.id, 'properties.alpha', e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        />
                      </label>
                    )}
                    {animation.type === 'path' && (
                      <div className="col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Path Animation
                        </label>
                        <button
                          onClick={() => onEnterPathMode(animation.id)}
                          className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 flex items-center justify-center gap-2 transition-all"
                        >
                          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M3 17.25V21H6.75L17.81 9.94L14.06 6.19L3 17.25Z" fill="currentColor" />
                            <path d="M20.71 7.04C21.1 6.65 21.1 6.02 20.71 5.63L18.37 3.29C17.98 2.9 17.35 2.9 16.96 3.29L15.13 5.12L18.88 8.87L20.71 7.04Z" fill="currentColor" />
                          </svg>
                          Draw Path
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Repeat Settings */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 pb-2 border-b border-gray-200">
                  <div className="w-1 h-1 bg-green-500 rounded-full"></div>
                  <h4 className="font-medium text-gray-800">Repeat Settings</h4>
                </div>
                
                <div className="bg-green-50/50 p-4 rounded-lg border border-green-200/50">
                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">Repeat Count</span>
                      <input
                        type="number"
                        min="-1"
                        value={animation.repeat ?? 0}
                        onChange={e => {
                          console.log(`Setting repeat for ${animation.id} to ${e.target.value}`);
                          handleAnimationChange(animation.id, 'repeat', e.target.value);
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                        placeholder="0 = no repeat, -1 = infinite"
                        title="0 = no repeat, -1 = infinite loop, positive numbers = specific count"
                      />
                    </label>
                    <label className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-gray-700">Repeat Delay</span>
                      <input
                        type="number"
                        min="0"
                        step="0.1"
                        value={animation.repeatDelay ?? 0}
                        onChange={e => handleAnimationChange(animation.id, 'repeatDelay', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors disabled:opacity-50"
                        placeholder="0"
                        disabled={!animation.repeat || animation.repeat === 0}
                      />
                    </label>
                  </div>
                  
                  <div className="mt-3">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={animation.yoyo ?? false}
                        onChange={e => handleAnimationChange(animation.id, 'yoyo', e.target.checked)}
                        className="rounded border-gray-300 focus:ring-2 focus:ring-green-500"
                        disabled={!animation.repeat || animation.repeat === 0}
                      />
                      <span className="text-sm font-medium text-gray-700">Yoyo (reverse on repeat)</span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
} 