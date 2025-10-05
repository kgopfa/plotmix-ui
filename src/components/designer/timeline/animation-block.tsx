import React, { useRef } from 'react';
import { ElementAnimation } from '@/types/canvas';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';

interface AnimationBlockProps {
  animation: ElementAnimation;
  elementId: string; // Add elementId prop
  scale: number;
  isSelected: boolean;
  onClick?: () => void;
  onChange?: (update: { startTime: number; duration: number }) => void;
}

const BLOCK_COLORS = [
  'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700',
  'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700',
  'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700',
  'bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700',
  'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700',
  'bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700',
  'bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700',
  'bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700',
];

function hashStringToIndex(value: string, modulo: number): number {
  // djb2 hash
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash) + value.charCodeAt(i);
    hash |= 0;
  }
  const positive = Math.abs(hash);
  return positive % Math.max(1, modulo);
}

export const AnimationBlock: React.FC<AnimationBlockProps> = ({
  animation,
  elementId, // Add elementId to destructuring
  scale,
  isSelected,
  onClick,
  onChange,
}) => {
  // TODO: Update for new centralized timeline structure
  // const { getEffectiveDuration, updateAnimationFromTimeline } = useTimelineStoreV2();
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartX = useRef(0);
  const initialLeft = useRef(0);
  const initialWidth = useRef(0);

  const left = animation.startTime * scale;
  const width = animation.duration * scale; // Use animation duration directly

  // Get color based on animation number
  // Use a stable hash of the animation id so colors also appear correctly after project load
  const colorIndex = hashStringToIndex(animation.id, BLOCK_COLORS.length);
  const blockColor = BLOCK_COLORS[colorIndex];

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isDragging.current = true;
    dragStartX.current = e.clientX;
    initialLeft.current = left;

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    isResizing.current = true;
    dragStartX.current = e.clientX;
    initialWidth.current = width;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleDrag = (e: MouseEvent) => {
    if (!isDragging.current) return;
    const delta = e.clientX - dragStartX.current;
    const newLeft = Math.max(0, initialLeft.current + delta);

    // Snap to nearest second
    const snappedStartTime = Math.round(newLeft / scale);

    onChange?.({
      startTime: Math.min(snappedStartTime, 120 - animation.duration),
      duration: animation.duration, // Keep base duration unchanged
    });
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - dragStartX.current;
    const newWidth = Math.max(20, initialWidth.current + delta);
    
    const newEffectiveDuration = Math.max(0.1, newWidth / scale);
    
    // Use the actual elementId instead of hardcoded string
    // TODO: Update for new centralized timeline structure
    // updateAnimationFromTimeline(animation.id, elementId, newEffectiveDuration, animation.startTime);
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    isResizing.current = false;
    document.removeEventListener('mousemove', handleDrag);
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  return (
    <div
      className={`absolute top-1 bottom-1 rounded-lg cursor-move transition-all duration-200 shadow-md hover:shadow-lg ${blockColor} ${isSelected ? 'ring-2 ring-white ring-opacity-50 shadow-xl' : ''}`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white truncate px-1 font-medium drop-shadow-sm">{animation.displayName}</span>
      </div>
      {/* Resize Handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 ${isSelected ? 'bg-opacity-100' : 'bg-opacity-75'} cursor-ew-resize rounded-r-lg transition-all duration-200 hover:bg-opacity-100`}
        style={{ backgroundColor: 'rgba(255, 255, 255, 0.3)' }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
