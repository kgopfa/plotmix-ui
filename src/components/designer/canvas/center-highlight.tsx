import React from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { useUIStore } from '@/stores/use-ui-store';

extend({ Container, Graphics });

interface CenterHighlightProps {
  isVisible: boolean;
  onCenterClick?: () => void;
}

const CenterHighlight: React.FC<CenterHighlightProps> = ({ 
  isVisible, 
  onCenterClick 
}) => {
  const { activeTool } = useUIStore(state => state.tools);

  const drawCenterHighlight = (graphics: PIXI.Graphics) => {
    graphics.clear();
    
    if (!isVisible) return;
    
    const centerSize = 12;
    const innerSize = 6;
    const pulseSize = 20;
    
    // Draw pulsing circle for attention
    graphics.circle(0, 0, pulseSize);
    graphics.fill({ color: 0x4CAF50, alpha: 0.15 });
    
    // Draw outer center indicator circle
    graphics.circle(0, 0, centerSize);
    graphics.fill({ color: 0x4CAF50, alpha: 0.8 });
    graphics.stroke({ color: 0x2E7D32, width: 2, alpha: 0.9 });
    
    // Draw inner circle
    graphics.circle(0, 0, innerSize);
    graphics.fill({ color: 0xFFFFFF, alpha: 0.9 });
    
    // Draw crosshair to indicate exact center
    const crosshairSize = 4;
    graphics.moveTo(-crosshairSize, 0).lineTo(crosshairSize, 0);
    graphics.stroke({ color: 0x2E7D32, width: 1, alpha: 0.8 });
    graphics.moveTo(0, -crosshairSize).lineTo(0, crosshairSize);
    graphics.stroke({ color: 0x2E7D32, width: 1, alpha: 0.8 });
  };

  if (!isVisible) return null;

  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      <pixiGraphics
        draw={drawCenterHighlight}
        interactive={true}
        eventMode="static"
        cursor="pointer"
        onPointerDown={(e: PIXI.FederatedPointerEvent) => {
          // For draw tool, don't stop propagation - let the canvas handle the drawing
          if (activeTool === 'draw') {
            // Don't stop propagation, let the event bubble up to the canvas
            return;
          }
          
          // For line tools, stop propagation and handle the click
          e.stopPropagation();
          if (onCenterClick) {
            onCenterClick();
          }
        }}
        alpha={1}
      />
    </pixiContainer>
  );
};

export default CenterHighlight; 