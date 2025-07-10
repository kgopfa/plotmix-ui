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

    // Configure viewport with basic panning only - zoom functionality removed
    viewport
      .drag({
        mouseButtons: 'all' // Allow all mouse buttons for dragging
      })
      .decelerate({
        friction: 0.92, // Higher friction for more controlled movement
        bounce: 0.6, // Reduced bounce for more professional feel
        minSpeed: 0.02 // Slightly higher min speed for better feel
      })
      .clamp({
        left: -50000, // Expanded bounds for better navigation
        top: -50000,
        right: 150000,
        bottom: 150000
      });

    // Prevent browser zoom interference (but don't add canvas zoom)
    const handleWheel = (e: WheelEvent) => {
      // Prevent browser zoom when Ctrl/Cmd is held
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // Basic keyboard navigation (without zoom)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas area is focused or no input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return; // Don't interfere with text input
      }

      const scrollSpeed = e.shiftKey ? 200 : 50; // Faster navigation
      
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
            time: 400,
            ease: 'easeOutQuart'
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
      
      // Add wheel listener to prevent browser zoom only
      canvas.addEventListener('wheel', handleWheel, { passive: false });
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
        canvas.removeEventListener('wheel', handleWheel);
        document.removeEventListener('keydown', handleKeyDown);
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