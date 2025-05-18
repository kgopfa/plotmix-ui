import React from 'react';
import { ToolType } from '@/types/editor';

interface MaskOverlayProps {
  tool: ToolType;
  maskPos: { x: number; y: number } | null;
  maskOffsetX?: number;
  maskOffsetY?: number;
  lineStartPoint?: { x: number; y: number } | null;
}

export function MaskOverlay({ 
  tool, 
  maskPos, 
  maskOffsetX = 0, 
  maskOffsetY = 0, 
  lineStartPoint 
}: MaskOverlayProps) {
  if (tool === 'select' || !maskPos) return null;

  const style = {
    position: 'absolute' as const,
    left: maskPos.x + maskOffsetX,
    top: maskPos.y + maskOffsetY,
    width: 50,
    height: 50,
    pointerEvents: 'none' as const,
    background: 'white',
    opacity: 0.5,
    zIndex: 20,
    border: '2px dotted #888',
    boxSizing: 'border-box' as const,
  };

  if (tool === 'rectangle') {
    return <div style={{ ...style, borderRadius: 4 }} />;
  }

  if (tool === 'circle') {
    return <div style={{ ...style, borderRadius: '50%' }} />;
  }

  if (tool === 'triangle') {
    // Calculate points for equilateral triangle with height = 50 (mask height)
    const height = 50;
    const sideLength = (2 * height) / Math.sqrt(3);
    const halfWidth = sideLength / 2;
    const points = `${25},${5} ${25 + halfWidth},${45} ${25 - halfWidth},${45}`;

    return (
      <svg
        style={{
          position: 'absolute',
          left: maskPos.x + maskOffsetX,
          top: maskPos.y + maskOffsetY,
          width: 50,
          height: 50,
          pointerEvents: 'none',
          opacity: 0.5,
          zIndex: 20,
        }}
      >
        <polygon
          points={points}
          fill="white"
          stroke="#888"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      </svg>
    );
  }

  if (tool === 'line') {
    if (!lineStartPoint) {
      // Show the cursor for the first point
      return (
        <svg
          style={{
            position: 'absolute',
            left: maskPos.x + maskOffsetX - 5,
            top: maskPos.y + maskOffsetY - 5,
            width: 10,
            height: 10,
            pointerEvents: 'none',
            opacity: 0.5,
            zIndex: 20,
          }}
        >
          <circle cx="5" cy="5" r="4" fill="white" stroke="#888" strokeWidth={1} />
        </svg>
      );
    }

    // Show the preview line from start point to current mouse position
    return (
      <svg
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          opacity: 0.5,
          zIndex: 20,
        }}
      >
        <line
          x1={lineStartPoint.x}
          y1={lineStartPoint.y}
          x2={maskPos.x + maskOffsetX}
          y2={maskPos.y + maskOffsetY}
          stroke="#888"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      </svg>
    );
  }

  return null;
} 