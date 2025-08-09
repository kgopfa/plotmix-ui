import React from 'react';
import RadiusHandle from './radius-handle';
import type { AnimatedCanvasObject } from '@/types/canvas';

interface RadiusHandlesProps {
  element: AnimatedCanvasObject;
  scaleFactor: number;
}

const RadiusHandles: React.FC<RadiusHandlesProps> = ({ element, scaleFactor }) => {
  // Only render radius handles for rectangles and triangles
  if (element.type !== 'rectangle' && element.type !== 'triangle') {
    return null;
  }

  // Calculate radius handle positions (different for rectangles vs triangles)
  const getRadiusHandlePositions = () => {
    const baseDistance = 12;
    const radiusOffset = element.cornerRadius || 0;
    const totalDistance = baseDistance + radiusOffset;
    const rotation = element.rotation || 0;

    if (element.type === 'triangle') {
      // For triangles, place handle at the top corner only
      const tl = { x: -element.width / 2 + totalDistance, y: -element.height / 2 + totalDistance }
      const tr = { x: element.width / 2 - totalDistance, y: -element.height / 2 + totalDistance }

      const localPositions = {
        tmid: { x: (tl.x + tr.x) / 2, y: -element.height / 2 + totalDistance + 8 },
        bl: { x: -element.width / 2 + totalDistance + 8, y: element.height / 2 - totalDistance },
        br: { x: element.width / 2 - totalDistance - 8, y: element.height / 2 - totalDistance }
      };

      // Apply rotation transformation
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      return {
        tmid: {
          x: element.x + localPositions.tmid.x * cos - localPositions.tmid.y * sin,
          y: element.y + localPositions.tmid.x * sin + localPositions.tmid.y * cos
        },
        bl: {
          x: element.x + localPositions.bl.x * cos - localPositions.bl.y * sin,
          y: element.y + localPositions.bl.x * sin + localPositions.bl.y * cos
        },
        br: {
          x: element.x + localPositions.br.x * cos - localPositions.br.y * sin,
          y: element.y + localPositions.br.x * sin + localPositions.br.y * cos
        }
      };
    } else {
      // For rectangles, use the existing 4-corner logic
      const localPositions = {
        tl: { x: -element.width / 2 + totalDistance, y: -element.height / 2 + totalDistance },
        tr: { x: element.width / 2 - totalDistance, y: -element.height / 2 + totalDistance },
        bl: { x: -element.width / 2 + totalDistance, y: element.height / 2 - totalDistance },
        br: { x: element.width / 2 - totalDistance, y: element.height / 2 - totalDistance }
      };

      // Apply rotation transformation
      const cos = Math.cos(rotation);
      const sin = Math.sin(rotation);

      return {
        tl: {
          x: element.x + localPositions.tl.x * cos - localPositions.tl.y * sin,
          y: element.y + localPositions.tl.x * sin + localPositions.tl.y * cos
        },
        tr: {
          x: element.x + localPositions.tr.x * cos - localPositions.tr.y * sin,
          y: element.y + localPositions.tr.x * sin + localPositions.tr.y * cos
        },
        bl: {
          x: element.x + localPositions.bl.x * cos - localPositions.bl.y * sin,
          y: element.y + localPositions.bl.x * sin + localPositions.bl.y * cos
        },
        br: {
          x: element.x + localPositions.br.x * cos - localPositions.br.y * sin,
          y: element.y + localPositions.br.x * sin + localPositions.br.y * cos
        }
      };
    }
  };

  const radiusPositions = getRadiusHandlePositions();

  const handleRadiusChange = (newRadius: number) => {
    const radiusChangeEvent = new CustomEvent('element-border-radius-change', {
      detail: {
        id: element.id,
        cornerRadius: newRadius
      }
    });
    window.dispatchEvent(radiusChangeEvent);
  };

  return (
    <>
      {/* Rectangle: 4 corner radius handles */}
      {element.type === 'rectangle' && radiusPositions.tl && (
        <>
          <RadiusHandle
            x={radiusPositions.tl.x}
            y={radiusPositions.tl.y}
            scaleFactor={scaleFactor}
            corner="tl"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />

          <RadiusHandle
            x={radiusPositions.tr.x}
            y={radiusPositions.tr.y}
            scaleFactor={scaleFactor}
            corner="tr"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />

          <RadiusHandle
            x={radiusPositions.bl.x}
            y={radiusPositions.bl.y}
            scaleFactor={scaleFactor}
            corner="bl"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />

          <RadiusHandle
            x={radiusPositions.br.x}
            y={radiusPositions.br.y}
            scaleFactor={scaleFactor}
            corner="br"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />
        </>
      )}

      {/* Triangle: Triangle radius handles */}
      {element.type === 'triangle' && radiusPositions.tmid && (
        <>
          <RadiusHandle
            x={radiusPositions.tmid.x}
            y={radiusPositions.tmid.y}
            scaleFactor={scaleFactor}
            corner="top"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />

          <RadiusHandle
            x={radiusPositions.bl.x}
            y={radiusPositions.bl.y}
            scaleFactor={scaleFactor}
            corner="bl"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />

          <RadiusHandle
            x={radiusPositions.br.x}
            y={radiusPositions.br.y}
            scaleFactor={scaleFactor}
            corner="br"
            currentRadius={element.cornerRadius || 0}
            onRadiusChange={handleRadiusChange}
          />
        </>
      )}
    </>
  );
};

export default RadiusHandles; 