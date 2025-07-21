import React from 'react';
import { Graphics as PIXIGraphics } from 'pixi.js';
import { SnapGuide } from '../../../utils/element-snapping';

interface SnapGuidesProps {
  guides: SnapGuide[];
  canvasWidth: number;
  canvasHeight: number;
  canvasFrameX?: number;
  canvasFrameY?: number;
}

export const SnapGuides: React.FC<SnapGuidesProps> = ({ 
  guides, 
  canvasWidth, 
  canvasHeight,
  canvasFrameX = 0,
  canvasFrameY = 0
}) => {
  const drawGuides = (graphics: PIXIGraphics) => {
    graphics.clear();
    
    if (guides.length === 0) return;
    

    
    for (const guide of guides) {
      // Different colors for different snap types
      let lineColor: number;
      let lineWidth: number;
      const lineAlpha = 0.6;
      
      // Different colors and styles for different alignment types
      if (guide.sourceElementId === 'grid-center') {
        lineColor = 0x00BB88; // Green for grid centers
        lineWidth = 1;
      } else if (guide.type === 'spacing') {
        // Different colors for spacing vs distribution
        if (guide.alignmentType.includes('distribution')) {
          lineColor = 0xFF9500; // Orange for distribution
          lineWidth = 1;
        } else {
          lineColor = 0x9500FF; // Purple for equal spacing
          lineWidth = 1;
        }
      } else {
        // Different colors for different alignment types
        if (guide.alignmentType === 'centerX' || guide.alignmentType === 'centerY') {
          lineColor = 0x2563EB; // Blue for center alignment
          lineWidth = 1;
        } else if (guide.alignmentType === 'left' || guide.alignmentType === 'right') {
          lineColor = 0xDC2626; // Red for edge alignment
          lineWidth = 1;
        } else if (guide.alignmentType === 'top' || guide.alignmentType === 'bottom') {
          lineColor = 0xDC2626; // Red for edge alignment
          lineWidth = 1;
        } else {
          lineColor = 0x2563EB; // Default blue
          lineWidth = 1;
        }
      }
      
      if (guide.type === 'vertical' || (guide.type === 'spacing' && guide.spacingInfo?.direction === 'horizontal')) {
        // Draw vertical line - guide.position is in world coordinates relative to the design canvas frame
        const x = guide.position;
        
        // Only draw if the guide is within the design canvas frame bounds
        if (x >= canvasFrameX && x <= canvasFrameX + canvasWidth) {
          // Draw a subtle background line for better visibility
          graphics
            .moveTo(x, canvasFrameY)
            .lineTo(x, canvasFrameY + canvasHeight)
            .stroke({ 
              width: lineWidth + 1, 
              color: 0xFFFFFF, 
              alpha: 0.3,
              cap: 'round'
            });
          
          // Draw the main guide line
          graphics
            .moveTo(x, canvasFrameY)
            .lineTo(x, canvasFrameY + canvasHeight)
            .stroke({ 
              width: lineWidth, 
              color: lineColor, 
              alpha: lineAlpha,
              cap: 'round'
            });
          
          // Draw small markers at the top and bottom to indicate alignment type
          const markerSize = 4;
          graphics
            .rect(x - markerSize/2, canvasFrameY - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
          graphics
            .rect(x - markerSize/2, canvasFrameY + canvasHeight - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
        }
      } else {
        // Draw horizontal line - guide.position is in world coordinates relative to the design canvas frame
        const y = guide.position;
        
        // Only draw if the guide is within the design canvas frame bounds
        if (y >= canvasFrameY && y <= canvasFrameY + canvasHeight) {
          // Draw a subtle background line for better visibility
          graphics
            .moveTo(canvasFrameX, y)
            .lineTo(canvasFrameX + canvasWidth, y)
            .stroke({ 
              width: lineWidth + 1, 
              color: 0xFFFFFF, 
              alpha: 0.3,
              cap: 'round'
            });
          
          // Draw the main guide line
          graphics
            .moveTo(canvasFrameX, y)
            .lineTo(canvasFrameX + canvasWidth, y)
            .stroke({ 
              width: lineWidth, 
              color: lineColor, 
              alpha: lineAlpha,
              cap: 'round'
            });
          
          // Draw small markers at the left and right to indicate alignment type
          const markerSize = 4;
          graphics
            .rect(canvasFrameX - markerSize/2, y - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
          graphics
            .rect(canvasFrameX + canvasWidth - markerSize/2, y - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
        }
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