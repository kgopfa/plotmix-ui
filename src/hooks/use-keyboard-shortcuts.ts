import { useEffect } from 'react';
import { AnimatedCanvasObject } from '@/types/canvas';
import { useUIStore, useKeyboardShortcutsStore } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { useCanvasOperations } from '@/stores/use-canvas-store';

interface UseKeyboardShortcutsProps {
  onSelectAll?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onGroup?: () => void;
  onUngroup?: () => void;
}

export function useKeyboardShortcuts({
  onSelectAll,
  onUndo,
  onRedo,
  onCopy,
  onPaste,
  onDuplicate,
  onGroup,
  onUngroup,
}: UseKeyboardShortcutsProps = {}) {
  const { executeShortcut } = useKeyboardShortcutsStore();
  const { selectedElements } = useSelectionStore();
  const { removeElement } = useCanvasOperations();
  const toolState = useUIStore((state) => state.tools);
  const { setLineChaining, setActiveTool, togglePathMode, setAnimationTarget } = useUIStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if we're in an input field or textarea
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // First try to execute shortcuts from the UI store
      const handled = executeShortcut(e);
      if (handled) {
        return;
      }

      // Handle additional shortcuts not in the basic UI store
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;

      switch (e.key.toLowerCase()) {
        case 'a':
          if (isCtrl && onSelectAll) {
            e.preventDefault();
            onSelectAll();
          }
          break;

        case 'z':
          if (isCtrl && !isShift && onUndo) {
            e.preventDefault();
            onUndo();
          } else if (isCtrl && isShift && onRedo) {
            e.preventDefault();
            onRedo();
          }
          break;

        case 'y':
          if (isCtrl && onRedo) {
            e.preventDefault();
            onRedo();
          }
          break;

        case 'c':
          if (isCtrl && onCopy && selectedElements.length > 0) {
            e.preventDefault();
            onCopy();
          }
          break;

        case 'v':
          if (isCtrl && onPaste) {
            e.preventDefault();
            onPaste();
          }
          break;

        case 'd':
          if (isCtrl && onDuplicate && selectedElements.length > 0) {
            e.preventDefault();
            onDuplicate();
          }
          break;

        case 'g':
          if (isCtrl && selectedElements.length > 1) {
            e.preventDefault();
            if (isShift && onUngroup) {
              onUngroup();
            } else if (onGroup) {
              onGroup();
            }
          }
          break;

        case 'delete':
        case 'backspace':
          if (selectedElements.length > 0) {
            e.preventDefault();
            selectedElements.forEach((element: AnimatedCanvasObject) => {
              removeElement(element.id);
            });
          }
          break;

        case 'escape':
          e.preventDefault();
          if (toolState.isLineChaining) {
            setLineChaining(false);
          } else {
            setActiveTool('select');
          }
          if (toolState.isPathMode) {
            togglePathMode();
            setAnimationTarget(null);
          }
          break;

        // Tool shortcuts
        case '1':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('select');
          }
          break;
        case '2':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('rectangle');
          }
          break;
        case '3':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('circle');
          }
          break;
        case '4':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('triangle');
          }
          break;
        case '5':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('line');
          }
          break;
        case '6':
          if (!isCtrl) {
            e.preventDefault();
            setActiveTool('text');
          }
          break;

        // Arrow keys for nudging selected elements
        case 'arrowup':
        case 'arrowdown':
        case 'arrowleft':
        case 'arrowright':
          if (selectedElements.length > 0) {
            e.preventDefault();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    executeShortcut,
    selectedElements,
    removeElement,
    toolState.isLineChaining,
    toolState.isPathMode,
    setLineChaining,
    setActiveTool,
    togglePathMode,
    setAnimationTarget,
    onSelectAll,
    onUndo,
    onRedo,
    onCopy,
    onPaste,
    onDuplicate,
    onGroup,
    onUngroup,
  ]);

  const { getShortcutByAction } = useKeyboardShortcutsStore();

  // Return utility functions for checking shortcuts
  return {
    // Check if a specific shortcut is currently active
    isShortcutActive: (action: string) => {
      return getShortcutByAction(action) !== undefined;
    },
    
    // Get shortcut display text for UI
    getShortcutDisplay: (action: string): string => {
      const shortcut = getShortcutByAction(action);
      if (!shortcut) return '';
      
      let display = '';
      if (shortcut.ctrlKey) display += 'Ctrl+';
      if (shortcut.metaKey) display += 'Cmd+';
      if (shortcut.shiftKey) display += 'Shift+';
      display += shortcut.key;
      
      return display;
    },
  };
} 