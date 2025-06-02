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
      .clampZoom({ minScale: 0.5, maxScale: 4 });

  }, [app]);

  if (!app?.renderer?.events) return null;

  return (
    <viewport
      ref={viewportRef}
      screenWidth={app.renderer.width}
      screenHeight={app.renderer.height}
      worldWidth={2000}
      worldHeight={2000}
      events={app.renderer.events}
      interactive={true}
    >
      {children}
    </viewport>
  );
});

CanvasContent.displayName = 'CanvasContent';