import React from 'react';
import type { LineAlignmentGuide } from '@/utils/coordinate-utils';
import type { Graphics } from 'pixi.js';

interface LineAlignmentGuidesProps {
  guides: LineAlignmentGuide[];
  canvasWidth: number;
  canvasHeight: number;
  canvasFrameX?: number;
  canvasFrameY?: number;
}

export const LineAlignmentGuides: React.FC<LineAlignmentGuidesProps> = ({ 
  guides, 
  canvasWidth, 
  canvasHeight,
  canvasFrameX = 0,
  canvasFrameY = 0
}) => {
  const drawGuides = (graphics: Graphics) => {
    graphics.clear();
    
    if (guides.length === 0) return;
    
    for (const guide of guides) {
      // Different colors and styles for different alignment types
      let lineColor: number;
      let lineWidth: number;
      const lineAlpha = 0.6;
      let isDotted = false;
      
      if (guide.alignmentType === 'center') {
        lineColor = 0x74b9ff; // Blue for center alignment
        lineWidth = 1;
        isDotted = true; // Dotted lines for center alignment
      } else {
        lineColor = 0xd63031; // Red for edge alignment
        lineWidth = 1;
        isDotted = true; // Dotted lines for edge alignment
      }
      
      if (guide.type === 'vertical') {
        // Draw vertical line
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
          
          if (isDotted) {
            // Draw dotted line
            const dashLength = 6;
            const gapLength = 4;
            let currentY = canvasFrameY;
            
            while (currentY < canvasFrameY + canvasHeight) {
              const endY = Math.min(currentY + dashLength, canvasFrameY + canvasHeight);
              graphics
                .moveTo(x, currentY)
                .lineTo(x, endY)
                .stroke({ 
                  width: lineWidth, 
                  color: lineColor, 
                  alpha: lineAlpha,
                  cap: 'round'
                });
              currentY = endY + gapLength;
            }
          } else {
            // Draw solid line
            graphics
              .moveTo(x, canvasFrameY)
              .lineTo(x, canvasFrameY + canvasHeight)
              .stroke({ 
                width: lineWidth, 
                color: lineColor, 
                alpha: lineAlpha,
                cap: 'round'
              });
          }
          
          // Draw small markers at the top and bottom
          const markerSize = 4;
          graphics
            .rect(x - markerSize/2, canvasFrameY - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
          graphics
            .rect(x - markerSize/2, canvasFrameY + canvasHeight - markerSize/2, markerSize, markerSize)
            .fill({ color: lineColor, alpha: lineAlpha });
        }
      } else if (guide.type === 'horizontal') {
        // Draw horizontal line
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
          
          if (isDotted) {
            // Draw dotted line
            const dashLength = 6;
            const gapLength = 4;
            let currentX = canvasFrameX;
            
            while (currentX < canvasFrameX + canvasWidth) {
              const endX = Math.min(currentX + dashLength, canvasFrameX + canvasWidth);
              graphics
                .moveTo(currentX, y)
                .lineTo(endX, y)
                .stroke({ 
                  width: lineWidth, 
                  color: lineColor, 
                  alpha: lineAlpha,
                  cap: 'round'
                });
              currentX = endX + gapLength;
            }
          } else {
            // Draw solid line
            graphics
              .moveTo(canvasFrameX, y)
              .lineTo(canvasFrameX + canvasWidth, y)
              .stroke({ 
                width: lineWidth, 
                color: lineColor, 
                alpha: lineAlpha,
                cap: 'round'
              });
          }
          
          // Draw small markers at the left and right
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
      zIndex={1002} // Render above line preview but below snap guides
    />
  );
}; 