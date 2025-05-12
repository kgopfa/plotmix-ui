import React, { useRef } from 'react';
import { ElementAnimation } from '@/components/editor/Canvas';

interface AnimationBlockProps {
  animation: ElementAnimation;
  scale: number;
  isSelected: boolean;
  onClick?: () => void;
  onChange?: (update: { startTime: number; duration: number }) => void;
}

export const AnimationBlock: React.FC<AnimationBlockProps> = ({
  animation,
  scale,
  isSelected,
  onClick,
  onChange,
}) => {
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartX = useRef(0);
  const initialLeft = useRef(0);
  const initialWidth = useRef(0);

  const left = animation.startTime * scale;
  const width = animation.duration * scale;

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
    const newStartTime = newLeft / scale;

    onChange?.({
      startTime: Math.min(newStartTime, 120 - animation.duration),
      duration: animation.duration,
    });
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - dragStartX.current;
    const newWidth = Math.max(20, initialWidth.current + delta); // min 20px
    const newDuration = newWidth / scale;

    onChange?.({
      startTime: animation.startTime,
      duration: Math.min(newDuration, 120 - animation.startTime),
    });
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
      className={`absolute top-1 bottom-1 rounded cursor-move transition-colors ${
        isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
      }`}
      style={{ left: `${left}px`, width: `${width}px` }}
      onMouseDown={handleMouseDown}
      onClick={onClick}
    >
      {/* Resize Handle */}
      <div
        className="absolute right-0 top-0 bottom-0 w-2 bg-blue-700 cursor-ew-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
