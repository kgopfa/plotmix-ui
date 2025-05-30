import React, { useState, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics } from 'pixi.js';
import * as PIXI from 'pixi.js';
import type { AnimatedCanvasElement } from '@/types/canvas';
import RadiusCircle from './radius-circle';

extend({ Container, Graphics });

interface ShapeSelectProps {
  element: AnimatedCanvasElement;
  scaleFactor?: number;
}

const ShapeSelect: React.FC<ShapeSelectProps> = ({
  element,
  scaleFactor = 1
}) => {
  // State for tracking resize dimensions
  const [dimensions, setDimensions] = useState({
    width: element.width,
    height: element.height
  });

  // Track the inward distance of circles from their default positions
  const [circleInwardDistance, setCircleInwardDistance] = useState(0);

  // Calculate circle positions based on current dimensions and inward distance
  const getCirclePositions = (width: number, height: number, inwardDistance: number) => {
    const baseDistance = 12; // Default distance from corner
    const radiusOffset = element.cornerRadius || 0; // Current corner radius
    const totalDistance = baseDistance + radiusOffset + inwardDistance; // Move circles inward by radius amount + manual adjustment

    return {
      tl: { x: -width / 2 + totalDistance, y: -height / 2 + totalDistance },
      tr: { x: width / 2 - totalDistance, y: -height / 2 + totalDistance },
      bl: { x: -width / 2 + totalDistance, y: height / 2 - totalDistance },
      br: { x: width / 2 - totalDistance, y: height / 2 - totalDistance }
    };
  };

  // State for circle positions (calculated based on dimensions and inward distance)
  const [circlePositions, setCirclePositions] = useState(() =>
    getCirclePositions(dimensions.width, dimensions.height, circleInwardDistance)
  );

  // Update circle positions when dimensions change (during resize)
  useEffect(() => {
    const newPositions = getCirclePositions(dimensions.width, dimensions.height, circleInwardDistance);
    setCirclePositions(newPositions);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dimensions.width, dimensions.height, circleInwardDistance, element.cornerRadius]);

  // Shape center (always 0,0 since element is centered)
  const shapeCenter = { x: 0, y: 0 };

  // Calculate initial distance from center for each corner
  const getInitialDistanceFromCenter = (corner: keyof typeof circlePositions) => {
    // Use current positions to calculate distance
    const pos = circlePositions[corner];
    return Math.sqrt(pos.x * pos.x + pos.y * pos.y);
  };

  // Calculate position at specific distance from center for each corner
  const getPositionAtDistance = (corner: keyof typeof circlePositions, distance: number) => {
    // Use current positions as the direction template
    const currentPos = circlePositions[corner];
    const currentDistance = getInitialDistanceFromCenter(corner);

    if (currentDistance === 0) return currentPos;

    // Scale the position to achieve the desired distance
    const scale = distance / currentDistance;
    return {
      x: currentPos.x * scale,
      y: currentPos.y * scale
    };
  };

  // Synchronized move handler
  const handleSyncMove = (draggedCorner: keyof typeof circlePositions, inwardDistance: number) => {
    const newPositions = { ...circlePositions };

    // Calculate new distance for all circles
    Object.keys(circlePositions).forEach(corner => {
      const cornerKey = corner as keyof typeof circlePositions;
      const initialDistance = getInitialDistanceFromCenter(cornerKey);
      const newDistance = Math.max(7, initialDistance - inwardDistance); // Minimum distance of 7

      const newPos = getPositionAtDistance(cornerKey, newDistance);

      // Apply bounds
      const bounds = getCircleBounds();
      newPositions[cornerKey] = {
        x: Math.max(bounds.minX, Math.min(bounds.maxX, newPos.x)),
        y: Math.max(bounds.minY, Math.min(bounds.maxY, newPos.y))
      };
    });

    setCirclePositions(newPositions);

    // Update the stored inward distance for future resize calculations
    setCircleInwardDistance(inwardDistance);

    // Calculate border radius based on circle positions
    const cornerRadius = calculateBorderRadius(newPositions);

    // Update the element's corner radius
    updateElementCornerRadius(cornerRadius);
  };

  // Calculate border radius based on circle positions
  const calculateBorderRadius = (positions: typeof circlePositions) => {
    // Calculate distance from each circle to its respective corner
    const halfWidth = dimensions.width / 2;
    const halfHeight = dimensions.height / 2;

    const corners = {
      tl: { x: -halfWidth, y: -halfHeight },
      tr: { x: halfWidth, y: -halfHeight },
      bl: { x: -halfWidth, y: halfHeight },
      br: { x: halfWidth, y: halfHeight }
    };

    // Calculate the minimum distance from any circle to its corner
    // This represents how "inward" the circles have moved
    let minDistanceFromCorner = Infinity;

    Object.keys(positions).forEach(corner => {
      const cornerKey = corner as keyof typeof positions;
      const circlePos = positions[cornerKey];
      const cornerPos = corners[cornerKey];

      const dx = circlePos.x - cornerPos.x;
      const dy = circlePos.y - cornerPos.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      minDistanceFromCorner = Math.min(minDistanceFromCorner, distance);
    });

    // Convert distance to radius (limit to reasonable values)
    const maxRadius = Math.min(halfWidth, halfHeight) / 2;
    const radius = Math.min(maxRadius, Math.max(0, minDistanceFromCorner - 7)); // Subtract 7 for handle size

    return radius;
  };

  // Update element's corner radius through parent
  const updateElementCornerRadius = (radius: number) => {
    // Dispatch a custom event to update the element's corner radius
    const radiusEvent = new CustomEvent('element-border-radius-change', {
      detail: {
        id: element.id,
        cornerRadius: radius
      }
    });

    window.dispatchEvent(radiusEvent);
  };

  // Calculate bounds for circles
  const getCircleBounds = () => ({
    minX: -dimensions.width / 2 + 7,
    maxX: dimensions.width / 2 - 7,
    minY: -dimensions.height / 2 + 7,
    maxY: dimensions.height / 2 - 7
  });

  // SIMPLIFIED: Draw only the selection outline - NO handles here
  const drawOutline = (g: PIXI.Graphics) => {
    g.clear();

    // For line type, draw custom selection outline
    if (element.type === 'line' && element.lineOptions?.points) {
      const { start, end } = element.lineOptions.points;
      const startX = start.x - element.x;
      const startY = start.y - element.y;
      const endX = end.x - element.x;
      const endY = end.y - element.y;

      // Calculate line bounding box with padding for better selection
      const padding = 10;
      const minX = Math.min(startX, endX) - padding;
      const maxX = Math.max(startX, endX) + padding;
      const minY = Math.min(startY, endY) - padding;
      const maxY = Math.max(startY, endY) + padding;

      // Draw selection rectangle covering the entire line length
      g.rect(minX, minY, maxX - minX, maxY - minY);
      g.stroke({ width: 1, color: 0x74b9ff, alpha: 0.5 });

      // Draw the actual line for visual reference
      g.moveTo(startX, startY).lineTo(endX, endY);
      g.stroke({ width: 2, color: 0x74b9ff, alpha: 0.8 });

      // Draw endpoint markers
      const ENDPOINT_SIZE = 10;

      // Start point
      g.circle(startX, startY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

      // End point
      g.circle(endX, endY, ENDPOINT_SIZE / 2);
      g.fill({ color: 0x74b9ff, alpha: 0.8 });
      g.stroke({ color: 0x74b9ff, width: 1 });

      return; // Exit early for line elements
    }

    // Draw rectangular outline for non-line elements - NO HANDLES
    g.roundRect(
      -dimensions.width / 2,
      -dimensions.height / 2,
      dimensions.width,
      dimensions.height,
      element.cornerRadius
    );

    g.stroke({
      width: 1,
      color: 0x74b9ff,
      alpha: 0.85,
    });
  };

  // Update local dimensions when element props change
  useEffect(() => {
    setDimensions({
      width: element.width,
      height: element.height
    });

    if (element.isAnimationPath) {
      // Dispatch a custom event to trigger animation updates for path elements
      const animationPathUpdateEvent = new CustomEvent('animation-path-updated', {
        detail: {
          pathElement: element
        }
      });

      window.dispatchEvent(animationPathUpdateEvent);
    }
  }, [element.width, element.height, element]);

  return (
    <pixiContainer x={0} y={0} sortableChildren={true}>
      {/* VISUAL ONLY: Selection outline - NO event handling */}
      <pixiGraphics
        draw={drawOutline}
        eventMode="passive"
      />

      {/* Synchronized moveable circles for border radius */}
      {(element.type === 'rectangle' || element.type === 'triangle') && (
        <>
          <RadiusCircle
            x={circlePositions.tl.x}
            y={circlePositions.tl.y}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="tl"
            onSyncMove={handleSyncMove}
            shapeCenter={shapeCenter}
          />
          <RadiusCircle
            x={circlePositions.tr.x}
            y={circlePositions.tr.y}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="tr"
            onSyncMove={handleSyncMove}
            shapeCenter={shapeCenter}
          />
          <RadiusCircle
            x={circlePositions.bl.x}
            y={circlePositions.bl.y}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="bl"
            onSyncMove={handleSyncMove}
            shapeCenter={shapeCenter}
          />
          <RadiusCircle
            x={circlePositions.br.x}
            y={circlePositions.br.y}
            bounds={getCircleBounds()}
            scaleFactor={scaleFactor}
            corner="br"
            onSyncMove={handleSyncMove}
            shapeCenter={shapeCenter}
          />
        </>
      )}
    </pixiContainer>
  );
};

export default ShapeSelect;