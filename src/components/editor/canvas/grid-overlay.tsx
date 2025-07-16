import React from 'react';
import { Graphics as PIXIGraphics } from 'pixi.js';
import { GridConfig, calculateGridLines, Rectangle } from '../../../utils/grid-utils';

interface GridOverlayProps {
  gridConfig: GridConfig;
  viewportBounds: Rectangle;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ 
  gridConfig, 
  viewportBounds
}) => {
  const drawGrid = (graphics: PIXIGraphics) => {
    graphics.clear();
    
    if (!gridConfig.visible || !gridConfig.enabled) {
      return;
    }
    
    const { verticalLines, horizontalLines } = calculateGridLines(viewportBounds, gridConfig);
    
    // Simple grid styling since zoom functionality removed
    const alpha = 0.3;
    const lineWidth = 1;
    const color = 0xE0E0E0; // Light gray
    
    // Every 5th line is slightly more prominent (major grid lines)
    const majorLineFrequency = 5;
    
    // Draw vertical lines
    verticalLines.forEach((x) => {
      const isMajorLine = (x / gridConfig.size) % majorLineFrequency === 0;
      const lineAlpha = isMajorLine ? alpha * 1.5 : alpha;
      const lineColor = isMajorLine ? 0xC0C0C0 : color;
      const lineWidthToUse = isMajorLine ? lineWidth * 1.5 : lineWidth;
      
      graphics
        .moveTo(x, viewportBounds.y)
        .lineTo(x, viewportBounds.y + viewportBounds.height)
        .stroke({ 
          width: lineWidthToUse, 
          color: lineColor, 
          alpha: Math.min(lineAlpha, 1) 
        });
    });
    
    // Draw horizontal lines
    horizontalLines.forEach((y) => {
      const isMajorLine = (y / gridConfig.size) % majorLineFrequency === 0;
      const lineAlpha = isMajorLine ? alpha * 1.5 : alpha;
      const lineColor = isMajorLine ? 0xC0C0C0 : color;
      const lineWidthToUse = isMajorLine ? lineWidth * 1.5 : lineWidth;
      
      graphics
        .moveTo(viewportBounds.x, y)
        .lineTo(viewportBounds.x + viewportBounds.width, y)
        .stroke({ 
          width: lineWidthToUse, 
          color: lineColor, 
          alpha: Math.min(lineAlpha, 1) 
        });
    });
  };

  return (
    <pixiGraphics
      draw={drawGrid}
      eventMode="none"
      zIndex={-1} // Render behind all other elements
    />
  );
}; 