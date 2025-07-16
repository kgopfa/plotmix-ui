import React, { useRef } from 'react';
import { ElementAnimation } from '@/types/canvas';
import { useTimelineStore } from '@/stores/use-timeline-store';

interface AnimationBlockProps {
  animation: ElementAnimation;
  scale: number;
  isSelected: boolean;
  onClick?: () => void;
  onChange?: (update: { startTime: number; duration: number }) => void;
}

const BLOCK_COLORS = [
  'bg-blue-500 hover:bg-blue-600',
  'bg-purple-500 hover:bg-purple-600',
  'bg-green-500 hover:bg-green-600',
  'bg-yellow-500 hover:bg-yellow-600',
  'bg-red-500 hover:bg-red-600',
  'bg-pink-500 hover:bg-pink-600',
  'bg-indigo-500 hover:bg-indigo-600',
  'bg-teal-500 hover:bg-teal-600',
];

export const AnimationBlock: React.FC<AnimationBlockProps> = ({
  animation,
  scale,
  isSelected,
  onClick,
  onChange,
}) => {
  const { getEffectiveDuration, updateAnimationFromTimeline } = useTimelineStore();
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartX = useRef(0);
  const initialLeft = useRef(0);
  const initialWidth = useRef(0);

  const left = animation.startTime * scale;
  const width = getEffectiveDuration(animation.id) * scale; // Get from Zustand

  // Get color based on animation number
  const colorIndex = parseInt(animation.id.split('-')[1]) - 1;
  const blockColor = BLOCK_COLORS[colorIndex % BLOCK_COLORS.length];

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
    
    // Update through Zustand instead of onChange callback
    updateAnimationFromTimeline(animation.id, "elementId", newEffectiveDuration, animation.startTime);
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
      className={`absolute top-1 bottom-1 rounded cursor-move transition-colors ${blockColor} ${isSelected ? 'ring-2 ring-white ring-opacity-50' : ''}`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs text-white truncate px-1">{animation.displayName}</span>
      </div>
      {/* Resize Handle */}
      <div
        className={`absolute right-0 top-0 bottom-0 w-2 ${isSelected ? 'bg-opacity-100' : 'bg-opacity-75'} cursor-ew-resize`}
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.2)' }}
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
