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

    // Configure viewport with enhanced zoom capabilities like Figma/Photoshop
    viewport
      .drag({
        mouseButtons: 'all' // Allow all mouse buttons for dragging
      })
      .pinch({
        percent: 2, // More sensitive pinch for trackpad
        center: null // Let pinch center around the gesture center
      })
      .wheel({
        smooth: 5, // Increased smoothness for wheel scrolling
        percent: 0.15, // Better zoom sensitivity (15% per wheel step)
        reverse: false, // Normal zoom direction (wheel up = zoom in)
        trackpadPinch: true, // Enable trackpad pinch gestures
        wheelZoom: true, // Enable zoom with wheel
        interrupt: true, // Allow interrupting animations
        center: null, // Zoom towards cursor position (Figma-like behavior)
        lineHeight: 40 // Better line height for smooth scrolling
      })
      .decelerate({
        friction: 0.92, // Higher friction for more controlled movement
        bounce: 0.6, // Reduced bounce for more professional feel
        minSpeed: 0.02 // Slightly higher min speed for better feel
      })
      .clampZoom({ 
        minScale: 0.02, // Allow zooming out much further like Figma
        maxScale: 100, // Allow zooming in much closer like Photoshop
        minWidth: 10,
        minHeight: 10
      })
      .clamp({
        left: -50000, // Expanded bounds for better navigation
        top: -50000,
        right: 150000,
        bottom: 150000
      });

    // Enhanced wheel handling for better zoom and pan experience
    const handleWheel = (e: WheelEvent) => {
      // Only handle if the target is the canvas or its children
      const target = e.target as HTMLElement;
      if (!target.closest('canvas')) return;
      
      // Detect if this is a pinch gesture (wheel with ctrlKey on Mac trackpads)
      const isPinchGesture = e.ctrlKey || e.metaKey;
      
      if (isPinchGesture) {
        // Enhanced zoom behavior - zoom towards cursor position
        e.preventDefault();
        
        // Calculate zoom factor - more responsive like Figma
        let zoomFactor = 1;
        const deltaY = e.deltaY;
        
        // Determine zoom factor based on delta
        if (Math.abs(deltaY) < 10) {
          // Small delta - fine zoom control
          zoomFactor = deltaY > 0 ? 0.95 : 1.05;
        } else if (Math.abs(deltaY) < 50) {
          // Medium delta - normal zoom
          zoomFactor = deltaY > 0 ? 0.85 : 1.15;
        } else {
          // Large delta - fast zoom
          zoomFactor = deltaY > 0 ? 0.7 : 1.3;
        }
        
        const currentScale = viewport.scale.x;
        const newScale = Math.min(Math.max(currentScale * zoomFactor, 0.02), 100);
        
        // Apply zoom
        const zoomPercent = (newScale / currentScale - 1);
        viewport.zoom(zoomPercent, true);
        
      } else if (e.shiftKey) {
        // Horizontal panning with Shift+wheel
        e.preventDefault();
        const panSpeed = Math.abs(e.deltaY) > 10 ? e.deltaY * 3 : e.deltaY * 1.5;
        viewport.x -= panSpeed;
      } else {
        // Vertical panning with normal wheel (when not zooming)
        e.preventDefault();
        const panSpeed = Math.abs(e.deltaY) > 10 ? e.deltaY * 3 : e.deltaY * 1.5;
        viewport.y -= panSpeed;
      }
    };

    // Enhanced keyboard navigation
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only handle if canvas area is focused or no input is focused
      const activeElement = document.activeElement;
      if (activeElement && (activeElement.tagName === 'INPUT' || activeElement.tagName === 'TEXTAREA')) {
        return; // Don't interfere with text input
      }

      const scrollSpeed = e.shiftKey ? 200 : 50; // Faster navigation
      const fastZoomFactor = e.shiftKey ? 0.5 : 0.8; // Fast zoom with shift
      const zoomFactor = e.shiftKey ? 2 : 1.25; // Regular zoom
      
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
        case '=':
        case '+': // Zoom in
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            const currentScale = viewport.scale.x;
            const newScale = Math.min(currentScale * zoomFactor, 100);
            viewport.animate({
              scale: newScale,
              time: 200,
              ease: 'easeOutQuart'
            });
          }
          break;
        case '-': // Zoom out
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            const currentScale = viewport.scale.x;
            const newScale = Math.max(currentScale * fastZoomFactor, 0.02);
            viewport.animate({
              scale: newScale,
              time: 200,
              ease: 'easeOutQuart'
            });
          }
          break;
        case '0': // Reset zoom to 100%
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            viewport.animate({
              scale: 1,
              time: 300,
              ease: 'easeOutQuart'
            });
          }
          break;
      }
    };

    // Add event listeners to the canvas specifically
    const canvas = app.renderer.view.canvas as HTMLCanvasElement;
    
    // Add touch handling for mobile pinch-to-zoom
    let initialPinchDistance = 0;
    let initialScale = 1;
    
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        initialPinchDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        initialScale = viewport.scale.x;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const currentDistance = Math.sqrt(
          Math.pow(touch2.clientX - touch1.clientX, 2) +
          Math.pow(touch2.clientY - touch1.clientY, 2)
        );
        
        if (initialPinchDistance > 0) {
          const pinchScale = currentDistance / initialPinchDistance;
          const newScale = Math.min(Math.max(initialScale * pinchScale, 0.02), 100);
          
          // Apply zoom for touch/pinch gesture
          viewport.setZoom(newScale, true);
        }
      }
    };

    const handleTouchEnd = () => {
      initialPinchDistance = 0;
      initialScale = 1;
    };
    
    if (canvas) {
      // Make canvas focusable
      canvas.setAttribute('tabindex', '0');
      canvas.style.outline = 'none'; // Remove focus outline
      
      // Add wheel listener with passive: false for preventDefault
      canvas.addEventListener('wheel', handleWheel, { passive: false });
      // Add keyboard listener to document
      document.addEventListener('keydown', handleKeyDown);
      
      // Focus canvas on click to enable keyboard navigation
      canvas.addEventListener('mousedown', () => {
        canvas.focus();
      });

      // Add touch event listeners
      canvas.addEventListener('touchstart', handleTouchStart, { passive: false });
      canvas.addEventListener('touchmove', handleTouchMove, { passive: false });
      canvas.addEventListener('touchend', handleTouchEnd, { passive: false });
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
        canvas.removeEventListener('touchstart', handleTouchStart);
        canvas.removeEventListener('touchmove', handleTouchMove);
        canvas.removeEventListener('touchend', handleTouchEnd);
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