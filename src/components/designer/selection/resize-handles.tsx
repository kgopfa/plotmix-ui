import React from 'react';
import ResizeHandle from './resize-handle';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface ResizeHandlesProps {
  element: AnimatedCanvasObject;
}

const ResizeHandles: React.FC<ResizeHandlesProps> = ({ element }) => {
  // Don't render resize handles for lines or paths
  if (element.type === 'line' || element.type === 'path') {
    return null;
  }

  return (
    <>
      <ResizeHandle
        elementX={element.x}
        elementY={element.y}
        elementWidth={element.width}
        elementHeight={element.height}
        elementRotation={element.rotation || 0}
        corner="tl"
        elementId={element.id}
      />
      <ResizeHandle
        elementX={element.x}
        elementY={element.y}
        elementWidth={element.width}
        elementHeight={element.height}
        elementRotation={element.rotation || 0}
        corner="tr"
        elementId={element.id}
      />
      <ResizeHandle
        elementX={element.x}
        elementY={element.y}
        elementWidth={element.width}
        elementHeight={element.height}
        elementRotation={element.rotation || 0}
        corner="bl"
        elementId={element.id}
      />
      <ResizeHandle
        elementX={element.x}
        elementY={element.y}
        elementWidth={element.width}
        elementHeight={element.height}
        elementRotation={element.rotation || 0}
        corner="br"
        elementId={element.id}
      />
    </>
  );
};

export default ResizeHandles; 