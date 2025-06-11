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
      let lineColor: number;
      let lineWidth: number;
      const lineAlpha = 0.8;
      
      if (guide.sourceElementId === 'grid-center') {
        lineColor = 0x00BB88; // Green for grid centers
        lineWidth = 2;
      } else if (guide.type === 'spacing') {
        // Different colors for spacing vs distribution
        if (guide.alignmentType.includes('distribution')) {
          lineColor = 0xFF9500; // Orange for distribution
          lineWidth = 2;
        } else {
          lineColor = 0x9500FF; // Purple for equal spacing
          lineWidth = 2;
        }
      } else {
        lineColor = 0xFF3366; // Pink for regular element alignment
        lineWidth = 1;
      }
      
      if (guide.type === 'vertical' || (guide.type === 'spacing' && guide.spacingInfo?.direction === 'horizontal')) {
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