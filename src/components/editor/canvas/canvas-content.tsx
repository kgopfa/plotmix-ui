import { extend, useApplication } from '@pixi/react';
import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import { Viewport } from 'pixi-viewport';

extend({ Viewport });

export const CanvasContent = forwardRef<Viewport | null, { children: React.ReactNode }>(
  ({ children }, ref) => {
  const { app } = useApplication();
  const viewportRef = useRef<Viewport | null>(null);

  useImperativeHandle(ref, () => viewportRef.current!);

  useEffect(() => {
    if (!viewportRef.current || !app?.renderer) return;

    const viewport = viewportRef.current;

    viewport
      .drag()
      .pinch()
      .wheel()
      .decelerate()
      .clampZoom({ minScale: 0.1, maxScale: 8 }); // Wider zoom range for large canvas

    // Center the viewport to the middle of the world on initial load
    const worldCenterX = 50000; // Half of world width
    const worldCenterY = 50000; // Half of world height
    viewport.moveCenter(worldCenterX, worldCenterY);

  }, [app]);

  if (!app?.renderer?.events) return null;

  // Figma-like large canvas dimensions
  const WORLD_WIDTH = 100000;  // 100k pixels wide
  const WORLD_HEIGHT = 100000; // 100k pixels tall

  return (
    <viewport
      ref={viewportRef}
      screenWidth={app.renderer.width}
      screenHeight={app.renderer.height}
      worldWidth={WORLD_WIDTH}
      worldHeight={WORLD_HEIGHT}
      events={app.renderer.events}
      interactive={true}
    >
      {children}
    </viewport>
  );
});

CanvasContent.displayName = 'CanvasContent';