import { useEffect } from 'react';
import { AnimatedCanvasObject } from '@/types/canvas';
import { ToolType } from '@/types/editor';

interface UseKeyboardShortcutsProps {
  selectedElements: AnimatedCanvasObject[];
  onDeleteElement: (elementId: string) => void;
  onToolChange?: (tool: ToolType) => void;
  onSelectAll?: () => void;
  isLineChaining?: boolean;
  onExitLineChaining?: () => void;
}

export function useKeyboardShortcuts({ 
  selectedElements, 
  onDeleteElement,
  onToolChange,
  onSelectAll,
  isLineChaining = false,
  onExitLineChaining
}: UseKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Select All (Ctrl+A / Cmd+A)
      if ((e.metaKey || e.ctrlKey) && e.key === 'a' && onSelectAll) {
        e.preventDefault();
        onSelectAll();
        return;
      }

      // Delete selected elements
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElements.length > 0) {
        selectedElements.forEach(element => onDeleteElement(element.id));
      }

      // Escape to exit line chaining mode or switch to select tool
      if (e.key === 'Escape') {
        if (isLineChaining && onExitLineChaining) {
          onExitLineChaining();
        } else if (onToolChange) {
          onToolChange('select');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [selectedElements, onDeleteElement, onToolChange, onSelectAll, isLineChaining, onExitLineChaining]);
} 