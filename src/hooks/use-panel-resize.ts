import { useCallback, useEffect } from 'react';
import { useUIStore } from '@/stores/use-ui-store';

interface UsePanelResizeReturn {
  handleMouseDown: (panel: 'left' | 'right' | 'timeline') => (e: React.MouseEvent) => void;
  handleMouseMove: (e: MouseEvent) => void;
  handleMouseUp: () => void;
}

export const usePanelResize = (): UsePanelResizeReturn => {
  const panelState = useUIStore((state) => state.panels);
  const {
    setLeftPanelWidth,
    setRightPanelWidth,
    setTimelineHeight,
    setResizing
  } = useUIStore();

  const handleMouseDown = useCallback((panel: 'left' | 'right' | 'timeline') => (e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(panel);
  }, [setResizing]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!panelState.isResizing) return;

    // Use requestAnimationFrame for smooth resizing
    requestAnimationFrame(() => {
      if (panelState.isResizing === 'left') {
        const newWidth = Math.max(320, Math.min(600, e.clientX)); // Min 320px (w-80), max 600px
        setLeftPanelWidth(newWidth);
      } else if (panelState.isResizing === 'right') {
        const newWidth = Math.max(200, Math.min(600, window.innerWidth - e.clientX)); // Min 200px, max 600px
        setRightPanelWidth(newWidth);
      } else if (panelState.isResizing === 'timeline') {
        const maxHeight = window.innerHeight * 0.8; // 80% of viewport height
        const minHeight = 32; // Can collapse to just the controls bar
        const newHeight = Math.max(minHeight, Math.min(maxHeight, window.innerHeight - e.clientY)); // Dynamic max height
        setTimelineHeight(newHeight);
      }
    });
  }, [panelState.isResizing, setLeftPanelWidth, setRightPanelWidth, setTimelineHeight]);

  const handleMouseUp = useCallback(() => {
    setResizing(null);
  }, [setResizing]);

  useEffect(() => {
    if (panelState.isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = panelState.isResizing === 'timeline' ? 'row-resize' : 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [panelState.isResizing, handleMouseMove, handleMouseUp]);

  return {
    handleMouseDown,
    handleMouseMove,
    handleMouseUp,
  };
}; 