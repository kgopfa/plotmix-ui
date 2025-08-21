import React from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { Container } from 'pixi.js';
import { convertGlobalToDesignCanvasCoords, constrainToAxis, detectLineAlignment } from '@/utils/coordinate-utils';
import { LineAlignmentGuides } from './line-alignment-guides';
import { useUIStore } from '@/stores/use-ui-store';

interface LinePreviewProps {
  tool: string;
  lineStartPoint: { x: number; y: number } | null;
  mousePos: { x: number; y: number } | null;
  isLineChaining: boolean;
  chainedLineIds: string[];
  elements: AnimatedCanvasObject[];
  canvasContainerRef?: React.RefObject<Container | null>;
  shiftKey?: boolean;
  canvasWidth?: number;
  canvasHeight?: number;
  isSnappingEnabled?: boolean;
}

export const LinePreview: React.FC<LinePreviewProps> = ({
  tool,
  lineStartPoint,
  mousePos,
  isLineChaining,
  chainedLineIds,
  elements,
  canvasContainerRef,
  shiftKey = false,
  canvasWidth = 1920,
  canvasHeight = 1080,
  isSnappingEnabled = true,
}) => {
  // Get the current line type and snapping settings from the UI store
  const lineType = useUIStore((state) => state.tools.lineType);
  const elementSnapConfig = useUIStore((state) => state.snapping.elementSnapConfig);
  
  // Only render when we have the necessary data for line preview
  if (!(tool === 'line' || tool === 'simpleLine') || !lineStartPoint || !mousePos) {
    return null;
  }

  // Convert global mouse position to local canvas coordinates
  const getLocalMousePos = (): { x: number; y: number } | null => {
    if (!canvasContainerRef?.current) {
      // Fallback to using mousePos directly if no container ref
      return mousePos;
    }

    try {
      // Use the utility function for consistent coordinate conversion
      return convertGlobalToDesignCanvasCoords(mousePos, canvasContainerRef.current);
    } catch (error) {
      console.warn('Failed to convert mouse coordinates:', error);
      return mousePos;
    }
  };

  const localMousePos = getLocalMousePos();
  if (!localMousePos) {
    return null;
  }

  // Ensure we have a valid lineStartPoint (should be in local coordinates)
  if (!lineStartPoint) {
    return null;
  }

  // Apply shift constraint if shift key is held
  const constrainedMousePos = shiftKey ? constrainToAxis(lineStartPoint, localMousePos) : localMousePos;

  // Detect alignment guides for the line being drawn (only when snapping is disabled)
  const alignmentGuides = !isSnappingEnabled ? detectLineAlignment(lineStartPoint, constrainedMousePos, elements, 10) : [];

  // Check if we're in chaining mode and if mouse is near a point that can close the shape
  let canCloseShape = false;
  let snapToPoint = constrainedMousePos;
  let showSnapTarget = false;
  let snapDistance = Infinity;

  if (isLineChaining && chainedLineIds.length > 0) {
    // Find the first line in the chain by its ID
    const firstLineId = chainedLineIds[0];
    const firstLine = elements.find(el => el.id === firstLineId);

    if (firstLine?.lineOptions?.points?.start) {
      const originalStartPoint = firstLine.lineOptions.points.start;
      const distanceToOriginalStart = Math.hypot(
        constrainedMousePos.x - originalStartPoint.x, 
        constrainedMousePos.y - originalStartPoint.y
      );

      // Use the snap threshold from settings for consistent behavior
      const snapThreshold = elementSnapConfig.enabled ? elementSnapConfig.snapThreshold : 30;
      
      if (distanceToOriginalStart <= snapThreshold) {
        canCloseShape = true;
        snapToPoint = originalStartPoint;
        snapDistance = distanceToOriginalStart;
        
        // Show snap target if guides are enabled in settings
        showSnapTarget = elementSnapConfig.showGuides;
      }
    }
  }

  return (
    <pixiContainer>
      {/* Line preview */}
      <pixiGraphics
        eventMode="none"
        draw={(g) => {
          g.clear();

          // Draw preview line based on line type
          if (lineType === 'curved') {
            // Draw curved preview line
            const controlPoint = {
              x: (lineStartPoint.x + snapToPoint.x) / 2,
              y: (lineStartPoint.y + snapToPoint.y) / 2
            };
            
            // Draw curved line with dashed effect
            const steps = 20;
            const points: Array<{ x: number; y: number }> = [];
            
            for (let i = 0; i <= steps; i++) {
              const t = i / steps;
              const invT = 1 - t;
              const x = invT * invT * lineStartPoint.x + 2 * invT * t * controlPoint.x + t * t * snapToPoint.x;
              const y = invT * invT * lineStartPoint.y + 2 * invT * t * controlPoint.y + t * t * snapToPoint.y;
              points.push({ x, y });
            }
            
            // Draw dashed curved line
            const dashLength = 8;
            const gapLength = 4;
            const totalDashLength = dashLength + gapLength;
            
            for (let i = 0; i < points.length - 1; i++) {
              const start = points[i];
              const end = points[i + 1];
              const dx = end.x - start.x;
              const dy = end.y - start.y;
              const segmentLength = Math.sqrt(dx * dx + dy * dy);
              
              if (segmentLength === 0) continue;
              
              const numDashes = Math.floor(segmentLength / totalDashLength);
              
              for (let j = 0; j <= numDashes; j++) {
                const startRatio = (j * totalDashLength) / segmentLength;
                const endRatio = Math.min((j * totalDashLength + dashLength) / segmentLength, 1);
                
                const dashStartX = start.x + dx * startRatio;
                const dashStartY = start.y + dy * startRatio;
                const dashEndX = start.x + dx * endRatio;
                const dashEndY = start.y + dy * endRatio;
                
                g.moveTo(dashStartX, dashStartY);
                g.lineTo(dashEndX, dashEndY);
                g.stroke({
                  width: 2,
                  color: canCloseShape ? 0x4CAF50 : 0x888888,
                  alpha: 0.7,
                  cap: 'round'
                });
              }
            }
          } else {
            // Draw true straight preview line using lineTo
            const dx = snapToPoint.x - lineStartPoint.x;
            const dy = snapToPoint.y - lineStartPoint.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // Avoid division by zero
            if (distance === 0) {
              return;
            }

            const dashLength = 8;
            const gapLength = 4;
            const totalDashLength = dashLength + gapLength;
            const numDashes = Math.floor(distance / totalDashLength);

            for (let i = 0; i <= numDashes; i++) {
              const startRatio = (i * totalDashLength) / distance;
              const endRatio = Math.min((i * totalDashLength + dashLength) / distance, 1);

              const startX = lineStartPoint.x + dx * startRatio;
              const startY = lineStartPoint.y + dy * startRatio;
              const endX = lineStartPoint.x + dx * endRatio;
              const endY = lineStartPoint.y + dy * endRatio;

              g.moveTo(startX, startY);
              g.lineTo(endX, endY);
              g.stroke({
                width: 2,
                color: canCloseShape ? 0x4CAF50 : 0x888888, // Green when can close shape
                alpha: 0.7,
                cap: 'round'
              });
            }
          }

          // Show start point indicator ONLY for the very first line in the chain
          // For subsequent lines, the previous line's endpoint is already visible
          if (chainedLineIds.length === 0) {
            const HANDLE_SIZE = 7;
            const halfSize = HANDLE_SIZE / 2;
            g.rect(
              lineStartPoint.x - halfSize, 
              lineStartPoint.y - halfSize, 
              HANDLE_SIZE, 
              HANDLE_SIZE
            );
            g.fill({ color: 0xFFFFFF, alpha: 1 });
            g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
          }

          // Draw end point indicator - special styling if can close shape
          if (canCloseShape) {
            // Draw a larger, green circle to indicate shape closing
            g.circle(snapToPoint.x, snapToPoint.y, 8);
            g.fill({ color: 0x4CAF50, alpha: 0.8 });
            g.stroke({ color: 0x2E7D32, width: 2 });

            // Draw inner circle
            g.circle(snapToPoint.x, snapToPoint.y, 4);
            g.fill({ color: 0xFFFFFF, alpha: 0.9 });
          } else {
            // Regular end point indicator
            g.circle(snapToPoint.x, snapToPoint.y, 4);
            g.fill({ color: 0x888888, alpha: 0.7 });
          }
        }}
      />

      {/* Snap Target - only show when guides are enabled and we can close shape */}
      {showSnapTarget && canCloseShape && (
        <pixiGraphics
          eventMode="none"
          draw={(g) => {
            g.clear();
            
            // Draw a pulsing target indicator around the snap point
            const targetRadius = 12 + Math.sin(Date.now() * 0.01) * 2; // Pulsing effect
            
            // Outer ring
            g.circle(snapToPoint.x, snapToPoint.y, targetRadius);
            g.stroke({ 
              width: 2, 
              color: 0x4CAF50, 
              alpha: 0.8 
            });
            
            // Inner ring
            g.circle(snapToPoint.x, snapToPoint.y, targetRadius - 4);
            g.stroke({ 
              width: 1, 
              color: 0x2E7D32, 
              alpha: 0.6 
            });
            
            // Center dot
            g.circle(snapToPoint.x, snapToPoint.y, 2);
            g.fill({ color: 0x4CAF50, alpha: 1 });
            
            // Draw snap distance indicator if close enough
            if (snapDistance <= 15) {
              const textX = snapToPoint.x + 20;
              const textY = snapToPoint.y - 20;
              
              // Background for text
              g.rect(textX - 2, textY - 8, 40, 16);
              g.fill({ color: 0x000000, alpha: 0.7 });
              
              // Text would be drawn here if we had text support
              // For now, just show a small indicator
              g.circle(textX + 15, textY, 3);
              g.fill({ color: 0xFFFFFF, alpha: 1 });
            }
          }}
        />
      )}
    
      {/* Alignment guides */}
      {alignmentGuides.length > 0 && (
        <LineAlignmentGuides
          guides={alignmentGuides}
          canvasWidth={canvasWidth}
          canvasHeight={canvasHeight}
          canvasFrameX={-canvasWidth / 2}
          canvasFrameY={-canvasHeight / 2}
        />
      )}
    </pixiContainer>
  );
}; 