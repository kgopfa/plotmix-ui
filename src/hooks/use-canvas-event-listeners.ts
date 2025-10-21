import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useUIStore } from '@/stores/use-ui-store';
import { GSAPTimelineManagerV2 } from '@/lib/gsap-timeline-manager-v2';
import { AnimatedCanvasObject } from '@/types/canvas';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
import type { SnapGuide } from '@/utils/element-snapping';

interface UseCanvasEventListenersProps {
  gsapManager: GSAPTimelineManagerV2;
  updateAnimationsForPathElement: (elements: AnimatedCanvasObject[], pathElement: AnimatedCanvasObject) => AnimatedCanvasObject[];
  addPathToAnimation: (pathShape: AnimatedCanvasObject) => void;
  togglePathMode: () => void;
  setAnimationTarget: (target: { animationId: string; elementId: string } | null) => void;
  clearElementSnapGuides: () => void;
  onSnapElement?: (element: AnimatedCanvasObject, allElements: AnimatedCanvasObject[]) => { x: number; y: number; guides: SnapGuide[] };
  onSetSnapGuides?: (guides: SnapGuide[]) => void;
  onClearSnapGuides?: () => void;
}

export const useCanvasEventListeners = ({
  gsapManager,
  updateAnimationsForPathElement,
  addPathToAnimation,
  togglePathMode,
  setAnimationTarget,
  clearElementSnapGuides,
  onSnapElement,
  onSetSnapGuides,
  onClearSnapGuides
}: UseCanvasEventListenersProps) => {
  const { elements: canvasObjects, updateElement } = useCanvasStore();
  const { buildGSAPTimeline: buildTimelineV2 } = useTimelineStoreV2();
  const elementsRef = useRef(canvasObjects);
  elementsRef.current = canvasObjects;

  // Listen for resize events from the Canvas component
  useEffect(() => {
    const handleElementResize = (e: CustomEvent) => {
      const { id, width, height, handle } = e.detail;


      // Use the ref to get current elements to avoid stale closure
      const currentElements = elementsRef.current;
      
      // Check if this is a virtual group resize or group outline resize
      if (id === 'virtual-group' || id.startsWith('group-outline-')) {
        // Handle group resize - scale all selected elements proportionally
        let elementsToResize: AnimatedCanvasObject[] = [];
        
        if (id === 'virtual-group') {
          // Multi-selection group
          const { selectedElements } = useSelectionStore.getState();
          if (selectedElements.length > 1) {
            elementsToResize = selectedElements;
          }
        } else {
          // Actual group - get elements in the group
          const groupId = id.replace('group-outline-', '');
          elementsToResize = currentElements.filter(el => el.groupId === groupId);
        }
        
        if (elementsToResize.length > 0) {
          // Calculate the scale factors based on the virtual group's new dimensions
          // We need to find the original bounds of the elements to resize
          let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
          
          elementsToResize.forEach(element => {
            const halfWidth = element.width / 2;
            const halfHeight = element.height / 2;
            minX = Math.min(minX, element.x - halfWidth);
            minY = Math.min(minY, element.y - halfHeight);
            maxX = Math.max(maxX, element.x + halfWidth);
            maxY = Math.max(maxY, element.y + halfHeight);
          });
          
          const originalWidth = maxX - minX;
          const originalHeight = maxY - minY;
          const originalCenterX = (minX + maxX) / 2;
          const originalCenterY = (minY + maxY) / 2;
          
          // Calculate scale factors
          const scaleX = width / originalWidth;
          const scaleY = height / originalHeight;
          
          // For center-based scaling (when shift is held), use the same scale for both dimensions
          const isShiftHeld = e.detail.shiftKey || false;
          const finalScaleX = isShiftHeld ? Math.max(scaleX, scaleY) : scaleX;
          const finalScaleY = isShiftHeld ? Math.max(scaleX, scaleY) : scaleY;
          

          
          // Update all elements in the group with the new scale
          const updatedElements = currentElements.map(el => {
            if (elementsToResize.some(elementToResize => elementToResize.id === el.id)) {
              // Calculate new position relative to the group center
              const relativeX = el.x - originalCenterX;
              const relativeY = el.y - originalCenterY;
              
              // Apply scaling
              const newX = originalCenterX + (relativeX * finalScaleX);
              const newY = originalCenterY + (relativeY * finalScaleY);
              const newWidth = el.width * finalScaleX;
              const newHeight = el.height * finalScaleY;
              
              const scaledElement = {
                ...el,
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight,
                ...(el.type === 'circle' && { radius: newHeight / 2 }),
                ...(el.type === 'triangle' && { 
                  radius: newHeight / 2,
                  width: (2 * newHeight) / Math.sqrt(3)
                })
              };
              
              // Apply snapping to each element in the group
              if (onSnapElement) {
                const otherElements = currentElements.filter(elem => !elementsToResize.some(e => e.id === elem.id));
                const snapResult = onSnapElement(scaledElement, otherElements);
                scaledElement.x = snapResult.x;
                scaledElement.y = snapResult.y;
                
                if (onSetSnapGuides && snapResult.guides.length > 0) {
                  onSetSnapGuides(snapResult.guides);
                }
              }
              
              return scaledElement;
            }
            return el;
          });
          
          // Update all elements at once
          updatedElements.forEach(element => {
            updateElement(element.id, element);
          });
          
          return;
        }
      }
      
      // Handle individual element resize
      const updatedElements = currentElements.map((el) => {
        if (el.id !== id) return el;

        // Calculate position adjustments for certain resize handles
        // This keeps the shape anchored to the opposite corner during resize
        let x = el.x;
        let y = el.y;

        // Calculate position adjustments based on which handle is being dragged
        const deltaWidth = width - el.width;
        const deltaHeight = height - el.height;

        switch (handle) {
          case 'top-left':
            x = el.x + deltaWidth / 2;
            y = el.y + deltaHeight / 2;
            break;
          case 'top-right':
            x = el.x - deltaWidth / 2;
            y = el.y + deltaHeight / 2;
            break;
          case 'bottom-left':
            x = el.x + deltaWidth / 2;
            y = el.y - deltaHeight / 2;
            break;
          case 'bottom-right':
            x = el.x - deltaWidth / 2;
            y = el.y - deltaHeight / 2;
            break;
        }

        let finalX = e.detail.x !== undefined ? e.detail.x : x;
        let finalY = e.detail.y !== undefined ? e.detail.y : y;
        
        const updatedElement = {
          ...el,
          width,
          height,
          x: finalX,
          y: finalY
        };

        // Apply snapping to the resized element position
        if (onSnapElement) {
          const otherElements = currentElements.filter(elem => elem.id !== id);
          const snapResult = onSnapElement(updatedElement, otherElements);
          
          updatedElement.x = snapResult.x;
          updatedElement.y = snapResult.y;
          
          if (onSetSnapGuides && snapResult.guides.length > 0) {
            onSetSnapGuides(snapResult.guides);
          }
        }

        // For circles, update radius to match the height (as used in drawing)
        if (el.type === 'circle') {
          updatedElement.radius = height / 2;
        }

        // For triangles, maintain equilateral proportions and update radius
        if (el.type === 'triangle') {
          const correctWidth = (2 * height) / Math.sqrt(3);
          updatedElement.width = correctWidth;
          updatedElement.radius = height / 2;
        }

        return updatedElement;
      });

      // If this is an animation path element, update related animations
      const resizedElement = updatedElements.find(el => el.id === id);


      if (resizedElement?.isAnimationPath) {

        const elementsWithUpdatedAnimations = updateAnimationsForPathElement(updatedElements, resizedElement);

        // Force a state update first, then rebuild timeline
        setTimeout(() => {
          buildTimelineV2();
        }, 10); // Small delay to ensure state is updated

        // Update all elements at once
        updatedElements.forEach(element => {
          updateElement(element.id, element);
        });
      } else {
        // Update just the resized element
        const resizedElement = updatedElements.find(el => el.id === id);
        if (resizedElement) {
          updateElement(id, resizedElement);
        }
      }
    };

    const handleBorderRadiusChange = (e: CustomEvent) => {
      const { id, cornerRadius } = e.detail;

      const element = elementsRef.current.find(el => el.id === id);
      if (element) {
        updateElement(id, { ...element, cornerRadius });
      }
    };

    const handleLineControlPointDrag = (e: CustomEvent) => {
      const { id, x, y } = e.detail;
      
      const element = elementsRef.current.find(el => el.id === id);
      if (element && element.type === 'line' && element.lineOptions) {
        // Update the control point
        const updatedLineOptions = {
          ...element.lineOptions,
          controlPoint: { x, y },
          isCurved: true
        };
        updateElement(id, { ...element, lineOptions: updatedLineOptions });
      }
    };

    const handleElementRotationChange = (e: CustomEvent) => {
      const { id, rotation } = e.detail;
      
      const element = elementsRef.current.find(el => el.id === id);
      if (element) {
        updateElement(id, { ...element, rotation });
      }
    };

    const handleElementShadowUpdate = (e: CustomEvent) => {
      const { id, shadowProperties } = e.detail;
      
      const element = elementsRef.current.find(el => el.id === id);
      if (element) {
        // Update the element with new shadow properties
        const updatedElement = { ...element, ...shadowProperties };
        updateElement(id, updatedElement);
      }
    };

    // Add event listeners for resize, border radius changes, control point dragging, rotation changes, and shadow updates
    window.addEventListener('element-resize', handleElementResize as EventListener);
    window.addEventListener('element-border-radius-change', handleBorderRadiusChange as EventListener);
    window.addEventListener('line-control-point-drag', handleLineControlPointDrag as EventListener);
    window.addEventListener('element-rotation-change', handleElementRotationChange as EventListener);
    window.addEventListener('element-shadow-update', handleElementShadowUpdate as EventListener);

    // Clean up the event listeners when component unmounts
    return () => {
      window.removeEventListener('element-resize', handleElementResize as EventListener);
      window.removeEventListener('element-border-radius-change', handleBorderRadiusChange as EventListener);
      window.removeEventListener('line-control-point-drag', handleLineControlPointDrag as EventListener);
      window.removeEventListener('element-rotation-change', handleElementRotationChange as EventListener);
      window.removeEventListener('element-shadow-update', handleElementShadowUpdate as EventListener);
    };
  }, [gsapManager, updateAnimationsForPathElement, updateElement]);

  // Listen for draw completion events
  useEffect(() => {
    const handleDrawComplete = (e: CustomEvent) => {
      // Exit draw mode when a path is completed
      const { setActiveTool } = useUIStore.getState();
      setActiveTool('select');
      
      const { element, isPathMode: wasInPathMode } = e.detail || {};
      
      // If we were in path mode and completed a drawing, add to animation and exit path mode
      const { tools } = useUIStore.getState();
      if (tools.isPathMode && tools.animationTarget && element && wasInPathMode) {
        // Add the drawn path to the animation
        addPathToAnimation(element);
        
        // Exit path mode
        togglePathMode();
        setAnimationTarget(null);
      }
    };

    window.addEventListener('draw-complete', handleDrawComplete as EventListener);

    return () => {
      window.removeEventListener('draw-complete', handleDrawComplete as EventListener);
    };
  }, [addPathToAnimation, togglePathMode, setAnimationTarget]);

  // Listen for animation path updates (from ShapeSelect component)
  useEffect(() => {
    const handleAnimationPathUpdate = (e: CustomEvent) => {
      const { pathElement } = e.detail;


      const currentElements = elementsRef.current;
      const elementsWithUpdatedAnimations = updateAnimationsForPathElement(currentElements, pathElement);

      // Rebuild timeline after animation path update
      setTimeout(() => {
        buildTimelineV2();
      }, 10);

      // Update all elements
      elementsWithUpdatedAnimations.forEach(element => {
        updateElement(element.id, element);
      });
    };

    // Listen for single line/shape path additions
    const handleAddPathToAnimation = (e: CustomEvent) => {
      const { pathElement } = e.detail;
      addPathToAnimation(pathElement);
    };

    // Listen for path mode exit events
    const handleExitPathMode = (e: CustomEvent) => {
      const { source } = e.detail;

      
      const { tools } = useUIStore.getState();
      if (tools.isPathMode) {
        togglePathMode();
        setAnimationTarget(null);
      }
    };

    window.addEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);
    window.addEventListener('add-path-to-animation', handleAddPathToAnimation as EventListener);
    window.addEventListener('exit-path-mode', handleExitPathMode as EventListener);

    const handleGroupDragEndEvent = () => {
      clearElementSnapGuides();
    };

    const handleResizeEndEvent = () => {
      if (onClearSnapGuides) {
        onClearSnapGuides();
      }
    };

    window.addEventListener('group-drag-end', handleGroupDragEndEvent);
    window.addEventListener('element-resize-end', handleResizeEndEvent);

    return () => {
      window.removeEventListener('animation-path-updated', handleAnimationPathUpdate as EventListener);
      window.removeEventListener('add-path-to-animation', handleAddPathToAnimation as EventListener);
      window.removeEventListener('exit-path-mode', handleExitPathMode as EventListener);
      window.removeEventListener('group-drag-end', handleGroupDragEndEvent);
      window.removeEventListener('element-resize-end', handleResizeEndEvent);
    };
  }, [updateAnimationsForPathElement, gsapManager, addPathToAnimation, togglePathMode, setAnimationTarget, clearElementSnapGuides, updateElement, onSnapElement, onSetSnapGuides, onClearSnapGuides]);

  // Block horizontal wheel events to prevent browser navigation
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      // Prevent default when horizontal scroll
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
        e.preventDefault();
      }
    };

    document.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      document.removeEventListener('wheel', handleWheel);
    };
  }, []);
}; 