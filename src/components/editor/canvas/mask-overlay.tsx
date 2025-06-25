import React from 'react';
import { ToolType } from '@/types/tool';

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

  if (tool === 'textGroup') {
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
        TG
      </div>
    );
  }

  return null;
} 