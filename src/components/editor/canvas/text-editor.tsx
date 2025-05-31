import { useEffect, useRef, useState } from 'react';
import { AnimatedCanvasElement } from '@/types/canvas';

interface TextEditorProps {
  element: AnimatedCanvasElement;
  onTextChange: (id: string, text: string) => void;
  onTextEnd: () => void;
  canvasElement?: HTMLCanvasElement | null;
}

export const TextEditor = ({ element, onTextChange, onTextEnd, canvasElement }: TextEditorProps) => {
  const [text, setText] = useState(element.text || 'Type here...');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasElement && textareaRef.current) {
      const rect = canvasElement.getBoundingClientRect();
      
      // Calculate the position relative to the canvas
      const x = rect.left + element.x - element.width / 2;
      const y = rect.top + element.y - element.height / 2;
      
      setPosition({ x, y });
      
      // Focus and select all text
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [element, canvasElement]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (textareaRef.current && !textareaRef.current.contains(event.target as Node)) {
        handleTextEnd();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleTextEnd();
      }
    };

    // Add a small delay to prevent the triggering click from immediately closing the editor
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }, 50); // 50ms delay

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  const handleTextEnd = () => {
    if (text.trim()) {
      onTextChange(element.id, text);
    }
    onTextEnd();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleTextEnd();
    }
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  return (
    <textarea
      ref={textareaRef}
      value={text}
      onChange={handleTextAreaChange}
      onKeyDown={handleKeyDown}
      style={{
        position: 'fixed',
        left: position.x,
        top: position.y,
        width: element.width,
        height: element.height,
        fontSize: element.fontSize || 16,
        fontFamily: element.fontFamily || 'Arial, sans-serif',
        fontWeight: element.fontWeight || 'normal',
        fontStyle: element.fontStyle || 'normal',
        color: element.fill || '#000000',
        backgroundColor: 'transparent',
        border: '2px solid #4F46E5',
        borderRadius: '4px',
        padding: '4px 8px',
        resize: 'none',
        overflow: 'auto',
        zIndex: 1000,
        outline: 'none',
        textAlign: (element.textAlign as 'left' | 'center' | 'right') || 'left',
        lineHeight: '1.2',
        boxSizing: 'border-box',
      }}
      placeholder="Type here..."
    />
  );
};