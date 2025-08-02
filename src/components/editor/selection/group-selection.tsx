import React from 'react';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import type { FederatedPointerEvent } from 'pixi.js';
import ElementSelect from './element-select';
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
  groups?: CanvasGroup[]; // Add groups prop to check group types
}

export const GroupSelection: React.FC<GroupSelectionProps> = ({ 
  selectedElements, 
  scaleFactor,
  onGroupDragStart,
  allElements,
  gridConfig,
  groups = []
}) => {
  if (selectedElements.length <= 1) return null;

  // Helper function to check if selected elements belong to a custom type group
  const isCustomTypeGroup = (): boolean => {
    if (selectedElements.length === 0) return false;
    
    // Check if all selected elements belong to the same group
    const firstGroupId = selectedElements[0].groupId;
    const allSameGroup = selectedElements.every(el => el.groupId === firstGroupId);
    
    if (!allSameGroup) return false;
    
    // Find the group and check if it's a custom type
    const group = groups.find(g => g.id === firstGroupId);
    return !!(group && group.type === 'custom' && !group.isDefaultGroup);
  };

  // Helper function to create individual line outlines for custom groups
  const renderCustomGroupOutlines = () => {
    return selectedElements.map((element) => (
      <pixiContainer
        key={`custom-outline-${element.id}`}
        x={element.x}
        y={element.y}
        rotation={element.rotation || 0}
      >
        <ElementSelect
          element={element}
          scaleFactor={scaleFactor}
        />
      </pixiContainer>
    ));
  };

  // Helper function to create a virtual group element for multi-selection
  const createVirtualGroupElement = (elements: AnimatedCanvasObject[]): AnimatedCanvasObject => {
    if (elements.length === 0) {
      throw new Error('Cannot create virtual group from empty selection');
    }

    // Check if all elements are lines (polygon case)
    const isPolygonGroup = elements.every(el => el.type === 'line' && el.lineOptions?.points);

    // Calculate bounding box for all selected elements
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    if (isPolygonGroup) {
      // For polygon groups, find the extreme points from all line endpoints
      for (const element of elements) {
        if (element.lineOptions?.points) {
          const { start, end } = element.lineOptions.points;
          
          // Check start point
          minX = Math.min(minX, start.x);
          minY = Math.min(minY, start.y);
          maxX = Math.max(maxX, start.x);
          maxY = Math.max(maxY, start.y);
          
          // Check end point
          minX = Math.min(minX, end.x);
          minY = Math.min(minY, end.y);
          maxX = Math.max(maxX, end.x);
          maxY = Math.max(maxY, end.y);
        }
      }
    } else {
      // For non-polygon groups, use element bounds with rotation
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

  // If this is a custom type group, render individual line outlines but still enable group dragging
  if (isCustomTypeGroup()) {
    const virtualGroupElement = createVirtualGroupElement(selectedElements);

    // Handle drag start on the group selection area
    const handleGroupDragStart = (e: FederatedPointerEvent) => {
      e.stopPropagation();
      if (onGroupDragStart) {
        onGroupDragStart(virtualGroupElement, e.global.x, e.global.y, allElements, gridConfig);
      }
    };

    return (
      <React.Fragment key="custom-group-selection">
        {renderCustomGroupOutlines()}
        
        {/* Group selection outline and draggable area */}
        <pixiContainer
          x={virtualGroupElement.x}
          y={virtualGroupElement.y}
          rotation={virtualGroupElement.rotation || 0}
        >
          {/* Invisible draggable area */}
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
          
          {/* Group selection outline */}
          <ElementSelect
            element={virtualGroupElement}
            scaleFactor={scaleFactor}
          />
        </pixiContainer>
        
        {/* Resize handles for the group */}
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
  }

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
        
        <ElementSelect
          element={virtualGroupElement}
          scaleFactor={scaleFactor}
        />
      </pixiContainer>
      
      {/* Resize handles for multi-selection groups */}
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