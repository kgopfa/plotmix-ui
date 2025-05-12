import React, { useRef, useState } from 'react';
import { ElementAnimation } from '../editor/Canvas';

interface DraggableAnimationBlockProps {
  animation: ElementAnimation;
  scale: number;
  isSelected: boolean;
  onClick?: () => void;
}

export const AnimationBlock: React.FC<DraggableAnimationBlockProps> = ({ animation, scale, isSelected, onClick }) => {
  const [left, setLeft] = useState(animation.startTime * scale);
  const [width, setWidth] = useState(animation.duration * scale);

  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const dragStartX = useRef(0);
  const initialLeft = useRef(0);
  const initialWidth = useRef(0);

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
    setLeft(Math.max(0, initialLeft.current + delta));
  };

  const handleResize = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const delta = e.clientX - dragStartX.current;
    setWidth(Math.max(20, initialWidth.current + delta));
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
      <div
        className="absolute right-0 top-0 bottom-0 w-2 bg-blue-700 cursor-ew-resize"
        onMouseDown={handleResizeMouseDown}
      />
    </div>
  );
};
