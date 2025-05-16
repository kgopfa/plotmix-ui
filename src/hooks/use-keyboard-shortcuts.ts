import { useEffect } from 'react';
import { AnimatedCanvasElement } from '@/types/canvas';
import { ToolType } from '@/types/editor';

interface UseKeyboardShortcutsProps {
  selectedElement: AnimatedCanvasElement | null;
  onDeleteElement: (elementId: string) => void;
  onToolChange?: (tool: ToolType) => void;
}

export function useKeyboardShortcuts({ 
  selectedElement, 
  onDeleteElement,
  onToolChange 
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        onDeleteElement(selectedElement.id);
      }

      if (e.key === 'Escape' && onToolChange) {
        onToolChange('select');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onDeleteElement, onToolChange]);
} 