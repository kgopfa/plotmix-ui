import React from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import ObjectSelect from './object-select';
import ResizeHandle from './resize-handle';

interface GroupSelectionProps {
  selectedElements: AnimatedCanvasObject[];
  scaleFactor: number;
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({ 
  selectedElements, 
  scaleFactor 
}) => {
  if (selectedElements.length <= 1) return null;

  // Helper function to create a virtual group element for multi-selection
  const createVirtualGroupElement = (elements: AnimatedCanvasObject[]): AnimatedCanvasObject => {
    if (elements.length === 0) {
      throw new Error('Cannot create virtual group from empty selection');
    }

    // Calculate bounding box for all selected elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    for (const element of elements) {
      // Calculate element bounds considering rotation
      const cos = Math.cos(element.rotation || 0);
      const sin = Math.sin(element.rotation || 0);
      const halfWidth = element.width / 2;
      const halfHeight = element.height / 2;

      // Calculate the four corners of the rotated element
      const corners = [
        { x: -halfWidth, y: -halfHeight },
        { x: halfWidth, y: -halfHeight },
        { x: halfWidth, y: halfHeight },
        { x: -halfWidth, y: halfHeight }
      ];

      // Transform corners to world coordinates
      for (const corner of corners) {
        const worldX = element.x + corner.x * cos - corner.y * sin;
        const worldY = element.y + corner.x * sin + corner.y * cos;

        minX = Math.min(minX, worldX);
        minY = Math.min(minY, worldY);
        maxX = Math.max(maxX, worldX);
        maxY = Math.max(maxY, worldY);
      }
    }

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const width = maxX - minX;
    const height = maxY - minY;

    // Create virtual group element
    return {
      id: 'virtual-group',
      type: 'rectangle',
      name: 'Group Selection',
      x: centerX,
      y: centerY,
      width,
      height,
      rotation: 0,
      fill: 'transparent',
      stroke: '#2196F3',
      strokeWidth: 2,
      opacity: 1,
      groupId: 'virtual-group',
      animations: [],
      cornerRadius: 0 // Ensure no rounded corners for group selection
    };
  };

  const virtualGroupElement = createVirtualGroupElement(selectedElements);

  return (
    <React.Fragment key="group-selection">
      {/* Selection outline */}
      <pixiContainer
        x={virtualGroupElement.x}
        y={virtualGroupElement.y}
        rotation={virtualGroupElement.rotation || 0}
      >
        <ObjectSelect
          element={virtualGroupElement}
          scaleFactor={scaleFactor}
        />
      </pixiContainer>
      
      {/* Resize handles for the virtual group */}
      <ResizeHandle
        elementX={virtualGroupElement.x}
        elementY={virtualGroupElement.y}
        elementWidth={virtualGroupElement.width}
        elementHeight={virtualGroupElement.height}
        elementRotation={virtualGroupElement.rotation || 0}
        corner="tl"
        elementId={virtualGroupElement.id}
      />
      <ResizeHandle
        elementX={virtualGroupElement.x}
        elementY={virtualGroupElement.y}
        elementWidth={virtualGroupElement.width}
        elementHeight={virtualGroupElement.height}
        elementRotation={virtualGroupElement.rotation || 0}
        corner="tr"
        elementId={virtualGroupElement.id}
      />
      <ResizeHandle
        elementX={virtualGroupElement.x}
        elementY={virtualGroupElement.y}
        elementWidth={virtualGroupElement.width}
        elementHeight={virtualGroupElement.height}
        elementRotation={virtualGroupElement.rotation || 0}
        corner="bl"
        elementId={virtualGroupElement.id}
      />
      <ResizeHandle
        elementX={virtualGroupElement.x}
        elementY={virtualGroupElement.y}
        elementWidth={virtualGroupElement.width}
        elementHeight={virtualGroupElement.height}
        elementRotation={virtualGroupElement.rotation || 0}
        corner="br"
        elementId={virtualGroupElement.id}
      />
    </React.Fragment>
  );
}; 