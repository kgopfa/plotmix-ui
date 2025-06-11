import React from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { FederatedPointerEvent } from 'pixi.js';
import ObjectSelect from './object-select';
import ResizeHandle from './resize-handle';
import type { GridConfig } from '@/utils/grid-utils';

interface GroupSelectionProps {
  selectedElements: AnimatedCanvasObject[];
  scaleFactor: number;
  onGroupDragStart?: (
    virtualElement: AnimatedCanvasObject, 
    mouseX: number, 
    mouseY: number,
    allElements?: AnimatedCanvasObject[],
    gridConfig?: GridConfig
  ) => void;
  allElements?: AnimatedCanvasObject[];
  gridConfig?: GridConfig;
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({ 
  selectedElements, 
  scaleFactor,
  onGroupDragStart,
  allElements,
  gridConfig
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

  // Handle drag start on the group selection area
  const handleGroupDragStart = (e: FederatedPointerEvent) => {
    e.stopPropagation();
    if (onGroupDragStart) {
      onGroupDragStart(virtualGroupElement, e.global.x, e.global.y, allElements, gridConfig);
    }
  };

  return (
    <React.Fragment key="group-selection">
      {/* Selection outline */}
      <pixiContainer
        x={virtualGroupElement.x}
        y={virtualGroupElement.y}
        rotation={virtualGroupElement.rotation || 0}
      >
        {/* Transparent interactive area to capture clicks inside the rectangle */}
        <pixiGraphics
          draw={(g) => {
            g.clear();
            g.rect(
              -virtualGroupElement.width / 2,
              -virtualGroupElement.height / 2,
              virtualGroupElement.width,
              virtualGroupElement.height
            );
            g.fill({ color: 0x000000, alpha: 0.01 }); // Nearly transparent fill to capture events
          }}
          interactive={true}
          eventMode="static"
          cursor="move"
          onPointerDown={handleGroupDragStart}
        />
        
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