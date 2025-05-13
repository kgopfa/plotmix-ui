import { useEffect } from 'react';
import { AnimatedCanvasElement } from '@/types/canvas';

interface UseKeyboardShortcutsProps {
  selectedElement: AnimatedCanvasElement | null;
  onDeleteElement: (elementId: string) => void;
}

export function useKeyboardShortcuts({ selectedElement, onDeleteElement }: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElement) {
        onDeleteElement(selectedElement.id);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElement, onDeleteElement]);
} 