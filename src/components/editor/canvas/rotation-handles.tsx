import React from 'react';
import { extend } from '@pixi/react';
import { Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

extend({ Graphics });

interface RotationHandlesProps {
  element: AnimatedCanvasObject;
  onRotate: (rotation: number) => void;
  onRotationStart?: () => void;
  onRotationEnd?: () => void;
}

const HANDLE_SIZE = 14;

const RotationHandles: React.FC<RotationHandlesProps> = ({ 
  element, 
  onRotate, 
  onRotationStart, 
  onRotationEnd 
}) => {
  const { x, y, width, height, rotation = 0 } = element;

  // Get world-space corner positions
  const getCornerPosition = (offsetX: number, offsetY: number) => {
    const cos = Math.cos(rotation);
    const sin = Math.sin(rotation);
    return {
      x: x + offsetX * cos - offsetY * sin,
      y: y + offsetX * sin + offsetY * cos,
    };
  };

  // Calculate positions for all four corners (outside the shape)
  const handleOffset = 14; // Distance outside the shape
  const corners = {
    topLeft: getCornerPosition(-width / 2 - handleOffset, -height / 2 - handleOffset),
    topRight: getCornerPosition(width / 2 + handleOffset, -height / 2 - handleOffset),
    bottomLeft: getCornerPosition(-width / 2 - handleOffset, height / 2 + handleOffset),
    bottomRight: getCornerPosition(width / 2 + handleOffset, height / 2 + handleOffset),
  };

  const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Notify that rotation started
    if (onRotationStart) {
      onRotationStart();
    }

    const canvasElement = document.querySelector('canvas');
    if (!canvasElement) return;

    const rect = canvasElement.getBoundingClientRect();
    const startMouseX = e.client.x - rect.left;
    const startMouseY = e.client.y - rect.top;

    // Shape center in canvas coordinates
    const shapeCenterX = x;
    const shapeCenterY = y;

    // Calculate initial angle from shape center to mouse
    const initialAngle = Math.atan2(startMouseY - shapeCenterY, startMouseX - shapeCenterX);
    const initialRotation = rotation;

    const handleRotationMove = (moveEvent: PointerEvent) => {
      const currentMouseX = moveEvent.clientX - rect.left;
      const currentMouseY = moveEvent.clientY - rect.top;

      // Calculate current angle from shape center to mouse
      const currentAngle = Math.atan2(currentMouseY - shapeCenterY, currentMouseX - shapeCenterX);

      // Calculate rotation delta
      const deltaAngle = currentAngle - initialAngle;
      const newRotation = initialRotation + deltaAngle;

      onRotate(newRotation);
    };

    const handleRotationEnd = () => {
      document.removeEventListener('pointermove', handleRotationMove);
      document.removeEventListener('pointerup', handleRotationEnd);
      
      // Notify that rotation ended
      if (onRotationEnd) {
        onRotationEnd();
      }
    };

    document.addEventListener('pointermove', handleRotationMove);
    document.addEventListener('pointerup', handleRotationEnd);
  };

  // Draw a rotation handle
  const drawHandle = (g: PIXI.Graphics) => {
    g.clear();
    g.rect(-HANDLE_SIZE / 2, -HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE);
    g.fill({ color: 0x000000, alpha: 0 });
  };

  // Calculate cursor based on handle position and current rotation
  const getRotationCursor = (cornerType: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight') => {
    // Your original cursor definitions (when rotation = 0)
    const BASE_CURSORS = {
      topLeft: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 38 38\'%3E%3Cpath d=\'m35.508 9.419-7.513-7.514v15.028z\' fill=\'black\'/%3E%3Cpath d=\'m10.005 36.095-7.513-7.514h15.027z\' fill=\'black\'/%3E%3Cpath d=\'m11.253 29.4h-2.5v-6.962a14.506 14.506 0 0 1 14.489-14.491h4.772v2.5h-4.772a12 12 0 0 0 -11.989 11.991z\' fill=\'black\'/%3E%3C/svg%3E") 8 8, auto',
      topRight: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 38 38\'%3E%3Cpath d=\'m2.492 9.419 7.513-7.514v15.028z\' fill=\'black\'/%3E%3Cpath d=\'m27.995 36.095 7.513-7.514h-15.027z\' fill=\'black\'/%3E%3Cpath d=\'m29.247 29.4h-2.5v-6.962a12 12 0 0 0 -11.99-11.991h-4.771v-2.5h4.771a14.506 14.506 0 0 1 14.49 14.491z\' fill=\'black\'/%3E%3C/svg%3E") 8 8, auto',
      bottomLeft: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 38 38\'%3E%3Cpath d=\'m35.508 28.581-7.513 7.514v-15.028z\' fill=\'black\'/%3E%3Cpath d=\'m10.005 1.905-7.513 7.514h15.027z\' fill=\'black\'/%3E%3Cpath d=\'m28.014 30.053h-4.772a14.506 14.506 0 0 1 -14.489-14.49v-6.963h2.5v6.966a12 12 0 0 0 11.989 11.99h4.772z\' fill=\'black\'/%3E%3C/svg%3E") 8 8, auto',
      bottomRight: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 38 38\'%3E%3Cpath d=\'m2.492 28.581 7.513 7.514v-15.028z\' fill=\'black\'/%3E%3Cpath d=\'m27.995 1.905 7.513 7.514h-15.027z\' fill=\'black\'/%3E%3Cpath d=\'m14.757 30.053h-4.771v-2.5h4.771a12 12 0 0 0 11.99-11.99v-6.963h2.5v6.966a14.506 14.506 0 0 1 -14.49 14.487z\' fill=\'black\'/%3E%3C/svg%3E") 8 8, auto'
    };

    // If no rotation, return the base cursor
    if (Math.abs(rotation) < 0.01) {
      return BASE_CURSORS[cornerType];
    }

    // Extract the path data from the base cursor for rotation
    const pathData = {
      topLeft: 'm35.508 9.419-7.513-7.514v15.028z\' fill=\'black\'/%3E%3Cpath d=\'m10.005 36.095-7.513-7.514h15.027z\' fill=\'black\'/%3E%3Cpath d=\'m11.253 29.4h-2.5v-6.962a14.506 14.506 0 0 1 14.489-14.491h4.772v2.5h-4.772a12 12 0 0 0 -11.989 11.991z\' fill=\'black\'/%3E',
      topRight: 'm2.492 9.419 7.513-7.514v15.028z\' fill=\'black\'/%3E%3Cpath d=\'m27.995 36.095 7.513-7.514h-15.027z\' fill=\'black\'/%3E%3Cpath d=\'m29.247 29.4h-2.5v-6.962a12 12 0 0 0 -11.99-11.991h-4.771v-2.5h4.771a14.506 14.506 0 0 1 14.49 14.491z\' fill=\'black\'/%3E',
      bottomLeft: 'm35.508 28.581-7.513 7.514v-15.028z\' fill=\'black\'/%3E%3Cpath d=\'m10.005 1.905-7.513 7.514h15.027z\' fill=\'black\'/%3E%3Cpath d=\'m28.014 30.053h-4.772a14.506 14.506 0 0 1 -14.489-14.49v-6.963h2.5v6.966a12 12 0 0 0 11.989 11.99h4.772z\' fill=\'black\'/%3E',
      bottomRight: 'm2.492 28.581 7.513 7.514v-15.028z\' fill=\'black\'/%3E%3Cpath d=\'m27.995 1.905 7.513 7.514h-15.027z\' fill=\'black\'/%3E%3Cpath d=\'m14.757 30.053h-4.771v-2.5h4.771a12 12 0 0 0 11.99-11.99v-6.963h2.5v6.966a14.506 14.506 0 0 1 -14.49 14.487z\' fill=\'black\'/%3E'
    };

    // Convert rotation to degrees
    const rotationDegrees = (rotation * 180) / Math.PI;

    // Create rotated version of the cursor
    const rotatedCursor = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 38 38'%3E%3Cg transform='rotate(${rotationDegrees} 19 19)'%3E%3Cpath d='${pathData[cornerType]}%3C/g%3E%3C/svg%3E") 8 8, auto`;

    return rotatedCursor;
  };

  return (
    <>
      {/* Top-left rotation handle */}
      <pixiGraphics
        x={corners.topLeft.x}
        y={corners.topLeft.y}
        draw={drawHandle}
        interactive={true}
        eventMode="static"
        cursor={getRotationCursor('topLeft')}
        onPointerDown={handlePointerDown}
      />

      {/* Top-right rotation handle */}
      <pixiGraphics
        x={corners.topRight.x}
        y={corners.topRight.y}
        draw={drawHandle}
        interactive={true}
        eventMode="static"
        cursor={getRotationCursor('topRight')}
        onPointerDown={handlePointerDown}
      />

      {/* Bottom-left rotation handle */}
      <pixiGraphics
        x={corners.bottomLeft.x}
        y={corners.bottomLeft.y}
        draw={drawHandle}
        interactive={true}
        eventMode="static"
        cursor={getRotationCursor('bottomLeft')}
        onPointerDown={handlePointerDown}
      />

      {/* Bottom-right rotation handle */}
      <pixiGraphics
        x={corners.bottomRight.x}
        y={corners.bottomRight.y}
        draw={drawHandle}
        interactive={true}
        eventMode="static"
        cursor={getRotationCursor('bottomRight')}
        onPointerDown={handlePointerDown}
      />
    </>
  );
};

export default RotationHandles;