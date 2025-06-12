import React from 'react';
import { ToolType } from '@/types/editor';

interface MaskOverlayProps {
  tool: ToolType;
  maskPos: { x: number; y: number } | null;
  maskOffsetX?: number;
  maskOffsetY?: number;
}

export function MaskOverlay({ 
  tool, 
  maskPos, 
  maskOffsetX = 0, 
  maskOffsetY = 0
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

  if (tool === 'image') {
    return (
      <div style={{
        ...style,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#888',
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}>
        IMG
      </div>
    );
  }

  if (tool === 'text') {
    return (
      <div style={{
        ...style,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '12px',
        fontWeight: 'bold',
        color: '#888',
        backgroundColor: 'rgba(255, 255, 255, 0.9)'
      }}>
        T
      </div>
    );
  }

  if (tool === 'line') {
    // Line preview is now handled directly on the PIXI canvas
    return null;
  }

  return null;
} 