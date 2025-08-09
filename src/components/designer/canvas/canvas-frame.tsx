import React from 'react';
import { useCanvasState } from '@/stores/use-ui-store';

interface CanvasFrameProps {
  children: React.ReactNode;
  className?: string;
}

export const CanvasFrame: React.FC<CanvasFrameProps> = ({ children, className = '' }) => {
  const canvasState = useCanvasState();
  
  // Get current canvas size
  const currentSize = canvasState.currentSizeId === 'custom' 
    ? canvasState.customSize 
    : canvasState.availableSizes.find(size => size.id === canvasState.currentSizeId);

  if (!currentSize) {
    return null;
  }

  // All canvas sizes are 16:9, so we use fixed aspect-video class
  
  return (
    <div
      className={`
        mx-auto                     /* centered */
        w-2/5                       /* 40% of available width */
        max-w-[1920px]              /* hard ceiling for ultra-wide displays */
        max-h-[85vh]                /* never use > 85% of viewport height */
        aspect-video                /* locked 16:9 aspect ratio */
        bg-white shadow-lg
        border border-gray-200
        relative                    /* so children can be absolutely positioned */
        ${className}
      `}
    >
      {/* Children fill the frame */}
      <div className="absolute inset-0 overflow-hidden">
        {children}
      </div>
    </div>
  );
}; 