import React from 'react';
import { ToolType } from '@/types/editor';

interface MaskOverlayProps {
  tool: ToolType;
  maskPos: { x: number; y: number } | null;
  maskOffsetX?: number;
  maskOffsetY?: number;
}

export function MaskOverlay({ tool, maskPos, maskOffsetX = 0, maskOffsetY = 0 }: MaskOverlayProps) {
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
          points="25,5 45,45 5,45"
          fill="white"
          stroke="#888"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      </svg>
    );
  }

  if (tool === 'line') {
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
        <line
          x1="5"
          y1="25"
          x2="45"
          y2="25"
          stroke="#888"
          strokeWidth={2}
          strokeDasharray="4,3"
        />
      </svg>
    );
  }

  return null;
} 