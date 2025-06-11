import React from 'react';
import { Graphics as PIXIGraphics } from 'pixi.js';
import { GridConfig, calculateGridLines, Rectangle } from '../../../utils/grid-utils';

interface GridOverlayProps {
  gridConfig: GridConfig;
  viewportBounds: Rectangle;
  zoom: number;
}

export const GridOverlay: React.FC<GridOverlayProps> = ({ 
  gridConfig, 
  viewportBounds, 
  zoom 
}) => {
  const drawGrid = (graphics: PIXIGraphics) => {
    graphics.clear();
    
    if (!gridConfig.visible || !gridConfig.enabled) {
      return;
    }
    
    const { verticalLines, horizontalLines } = calculateGridLines(viewportBounds, gridConfig);
    
    // Adjust grid line visibility based on zoom level
    // Fade out grid when zoomed out too far to prevent visual noise
    const minZoomForGrid = 0.5;
    const maxZoomForGrid = 8;
    let alpha = 1;
    
    if (zoom < minZoomForGrid) {
      alpha = 0; // Hide grid when zoomed out too far
    } else if (zoom < 1) {
      alpha = (zoom - minZoomForGrid) / (1 - minZoomForGrid) * 0.3;
    } else if (zoom <= maxZoomForGrid) {
      alpha = Math.min(0.3 + (zoom - 1) * 0.1, 0.6);
    } else {
      alpha = 0.6; // Max alpha when zoomed in close
    }
    
    if (alpha <= 0) return;
    
    // Determine grid line style based on zoom and grid size
    const effectiveGridSize = gridConfig.size * zoom;
    let lineWidth = 1;
    let color = 0xE0E0E0; // Light gray
    
    // Adjust line appearance based on effective grid size
    if (effectiveGridSize < 5) {
      // Very small grid - use thinner, lighter lines
      lineWidth = 0.5;
      color = 0xF0F0F0;
      alpha *= 0.5;
    } else if (effectiveGridSize > 50) {
      // Large grid - use slightly thicker lines
      lineWidth = 1.5;
      color = 0xD0D0D0;
    }
    
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