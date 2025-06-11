import React from 'react';
import { Graphics as PIXIGraphics } from 'pixi.js';
import { SnapGuide } from '../../../utils/element-snapping';

interface SnapGuidesProps {
  guides: SnapGuide[];
  canvasWidth: number;
  canvasHeight: number;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ 
  guides, 
  canvasWidth, 
  canvasHeight 
}) => {
  const drawGuides = (graphics: PIXIGraphics) => {
    graphics.clear();
    
    if (guides.length === 0) return;
    
    for (const guide of guides) {
      // Different colors for different snap types
      const isGridCenter = guide.sourceElementId === 'grid-center';
      const lineColor = isGridCenter ? 0x00BB88 : 0xFF3366; // Green for grid centers, pink for elements
      const lineWidth = isGridCenter ? 2 : 1; // Thicker lines for grid centers
      const lineAlpha = 0.8;
      
      if (guide.type === 'vertical') {
        // Draw vertical line
        graphics
          .moveTo(guide.position, 0)
          .lineTo(guide.position, canvasHeight)
          .stroke({ 
            width: lineWidth, 
            color: lineColor, 
            alpha: lineAlpha 
          });
      } else {
        // Draw horizontal line
        graphics
          .moveTo(0, guide.position)
          .lineTo(canvasWidth, guide.position)
          .stroke({ 
            width: lineWidth, 
            color: lineColor, 
            alpha: lineAlpha 
          });
      }
    }
  };

  // Don't render if no guides
  if (guides.length === 0) {
    return null;
  }

  return (
    <pixiGraphics
      draw={drawGuides}
      eventMode="none"
      zIndex={1000} // Render on top of everything
    />
  );
}; 