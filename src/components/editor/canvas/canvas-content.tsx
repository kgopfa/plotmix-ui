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

    // Configure viewport with all scrolling and interaction capabilities
    viewport
      .drag({
        mouseButtons: 'all' // Allow all mouse buttons for dragging
      })
      .pinch() // Touch/trackpad pinch to zoom
      .wheel({
        smooth: 3, // Smooth wheel scrolling
        percent: 0.1, // Zoom sensitivity (10% per wheel step)
        reverse: false, // Normal zoom direction (wheel up = zoom in)
        trackpadPinch: true, // Enable trackpad pinch gestures
        wheelZoom: true, // Enable zoom with wheel
        interrupt: true // Allow interrupting animations
      })
      .decelerate({
        friction: 0.88, // Momentum scrolling friction (lower = more momentum)
        bounce: 0.8, // Bounce back when hitting edges
        minSpeed: 0.01 // Minimum speed before stopping
      })
      .clampZoom({ 
        minScale: 0.1, 
        maxScale: 8,
        minWidth: 100,
        minHeight: 100
      })
      .clamp({
        left: -10000, // Allow scrolling beyond world bounds for better UX
        top: -10000,
        right: 110000, // World width + padding  
        bottom: 110000 // World height + padding
      });

    // Custom wheel handling for panning (separate from zoom)
    const handleWheel = (e: WheelEvent) => {
      // Only handle if the target is the canvas or its children
      const target = e.target as HTMLElement;
      if (!target.closest('canvas')) return;
      
      if (e.shiftKey) {
        // Horizontal panning with Shift+wheel
        e.preventDefault();
        viewport.x -= e.deltaY * 2;
      } else if (!e.ctrlKey && !e.metaKey) {
        // Vertical panning with normal wheel (when not zooming)
        e.preventDefault();
        viewport.y -= e.deltaY * 2;
      }
      // Let ctrl+wheel and cmd+wheel pass through to the built-in zoom
    };

    // Keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas area is focused or no input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return; // Don't interfere with text input
      }

      const scrollSpeed = e.shiftKey ? 100 : 30;
      
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          viewport.y += scrollSpeed;
          break;
        case 'ArrowDown':
          e.preventDefault();
          viewport.y -= scrollSpeed;
          break;
        case 'ArrowLeft':
          e.preventDefault();
          viewport.x += scrollSpeed;
          break;
        case 'ArrowRight':
          e.preventDefault();
          viewport.x -= scrollSpeed;
          break;
        case ' ': // Spacebar to center
          e.preventDefault();
          viewport.animate({
            position: { x: 0, y: 0 }, // Center of world
            time: 500
          });
          break;
      }
    };

    // Add event listeners to the canvas specifically
    const canvas = app.renderer.view.canvas as HTMLCanvasElement;
    if (canvas) {
      // Make canvas focusable
      canvas.setAttribute('tabindex', '0');
      canvas.style.outline = 'none'; // Remove focus outline
      
      // Add wheel listener to document but check target
      document.addEventListener('wheel', handleWheel, { passive: false });
      // Add keyboard listener to document
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus canvas on click to enable keyboard navigation
      canvas.addEventListener('mousedown', () => {
        canvas.focus();
      });
    }

    // Center the viewport to the middle of the world on initial load
    const worldCenterX = 50000; // Half of world width
    const worldCenterY = 50000; // Half of world height
    viewport.moveCenter(worldCenterX, worldCenterY);

    // Cleanup
    return () => {
      if (canvas) {
        document.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', handleKeyDown);
        canvas.removeEventListener('mousedown', () => {});
      }
    };

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