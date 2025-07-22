import React from 'react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import type { Container } from 'pixi.js';

interface LinePreviewProps {
  tool: string;
  lineStartPoint: { x: number; y: number } | null;
  mousePos: { x: number; y: number } | null;
  isLineChaining: boolean;
  chainedLineIds: string[];
  elements: AnimatedCanvasObject[];
  centerX: number;
  centerY: number;
  canvasContainerRef?: React.RefObject<Container | null>;
}

export const LinePreview: React.FC<LinePreviewProps> = ({
  tool,
  lineStartPoint,
  mousePos,
  isLineChaining,
  chainedLineIds,
  elements,
  centerX,
  centerY,
  canvasContainerRef,
}) => {
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
      // Convert global coordinates to local coordinates within the design canvas
      const localPos = canvasContainerRef.current.toLocal(mousePos);
      return localPos;
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

  // Debug logging to understand coordinate systems
  console.log('[LinePreview] Coordinates:', {
    globalMousePos: mousePos,
    localMousePos,
    lineStartPoint,
    centerX,
    centerY
  });

  return (
    <pixiGraphics
      eventMode="none"
      draw={(g) => {
        g.clear();

        // Check if we're in chaining mode and if mouse is near a point that can close the shape
        let canCloseShape = false;
        let snapToPoint = localMousePos;

        if (isLineChaining && chainedLineIds.length > 0) {
          // Find the first line in the chain by its ID
          const firstLineId = chainedLineIds[0];
          const firstLine = elements.find(el => el.id === firstLineId);

          if (firstLine?.lineOptions?.points?.start) {
            const originalStartPoint = firstLine.lineOptions.points.start;
            const distanceToOriginalStart = Math.hypot(
              localMousePos.x - originalStartPoint.x, 
              localMousePos.y - originalStartPoint.y
            );

            // Use same threshold as closing logic - 30px for easier polygon closing
            if (distanceToOriginalStart <= 30) {
              canCloseShape = true;
              snapToPoint = originalStartPoint;
            }
          }
        }

        // Manually draw dotted line for better control
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

          const startX = lineStartPoint.x + dx * startRatio + centerX;
          const startY = lineStartPoint.y + dy * startRatio + centerY;
          const endX = lineStartPoint.x + dx * endRatio + centerX;
          const endY = lineStartPoint.y + dy * endRatio + centerY;

          g.moveTo(startX, startY);
          g.lineTo(endX, endY);
          g.stroke({
            width: 2,
            color: canCloseShape ? 0x4CAF50 : 0x888888, // Green when can close shape
            alpha: 0.7,
            cap: 'round'
          });
        }

        // Show start point indicator ONLY for the very first line in the chain
        // For subsequent lines, the previous line's endpoint is already visible
        if (chainedLineIds.length === 0) {
          const HANDLE_SIZE = 7;
          const halfSize = HANDLE_SIZE / 2;
          g.rect(
            lineStartPoint.x - halfSize + centerX, 
            lineStartPoint.y - halfSize + centerY, 
            HANDLE_SIZE, 
            HANDLE_SIZE
          );
          g.fill({ color: 0xFFFFFF, alpha: 1 });
          g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.8 });
        }

        // Draw end point indicator - special styling if can close shape
        if (canCloseShape) {
          // Draw a larger, green circle to indicate shape closing
          g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 8);
          g.fill({ color: 0x4CAF50, alpha: 0.8 });
          g.stroke({ color: 0x2E7D32, width: 2 });

          // Draw inner circle
          g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 4);
          g.fill({ color: 0xFFFFFF, alpha: 0.9 });
        } else {
          // Regular end point indicator
          g.circle(snapToPoint.x + centerX, snapToPoint.y + centerY, 4);
          g.fill({ color: 0x888888, alpha: 0.7 });
        }
      }}
    />
  );
}; 