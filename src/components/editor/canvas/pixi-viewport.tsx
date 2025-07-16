import React from 'react';
import { extend } from '@pixi/react';
import { Viewport } from 'pixi-viewport';

extend({ Viewport });

interface PixiViewportProps {
  width: number;
  height: number;
  worldWidth?: number;
  worldHeight?: number;
  children?: React.ReactNode;
}

export const PixiViewportWrapper: React.FC<PixiViewportProps> = ({
  width,
  height,
  worldWidth,
  worldHeight,
  children,
}) => {
  return (
    // @ts-expect-error: pixiViewport is registered by extend
    <pixiViewport
      screenWidth={width}
      screenHeight={height}
      worldWidth={worldWidth || width * 2}
      worldHeight={worldHeight || height * 2}
      stopPropagation={true}
      drag={true}
      pinch={true}
      wheel={true}
      decelerate={true}
      clamp={{ direction: 'all', underflow: 'center' }}
      clampZoom={{ minScale: 0.1, maxScale: 5 }}
    >
      {children}
    </pixiViewport>
  );
};

PixiViewportWrapper.displayName = 'PixiViewportWrapper'; 