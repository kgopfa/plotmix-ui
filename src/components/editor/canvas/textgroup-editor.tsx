import { useEffect, useRef, useState } from 'react';
import { AnimatedCanvasObject } from '@/types/canvas';

// Helper function to calculate character width using PIXI measurement (matching canvas-object-factory.ts)
function getCharWidthPixi(char: string, fontSize: number = 16, fontFamily: string = 'Arial, sans-serif'): number {
  // Create a temporary canvas element to measure text
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');
  if (!context) return fontSize * 0.6; // Fallback
  
  context.font = `${fontSize}px ${fontFamily}`;
  const metrics = context.measureText(char);
  
  // Clean up
  canvas.remove();
  
  return metrics.width;
}

interface TextGroupEditorProps {
  element: AnimatedCanvasObject; // The textGroup element
  characterElements: AnimatedCanvasObject[]; // The individual character elements
  onTextGroupChange: (textGroupId: string, newText: string, characterElements: AnimatedCanvasObject[]) => void;
  onTextEnd: () => void;
  canvasElement?: HTMLCanvasElement | null;
}

export const TextGroupEditor = ({ 
  element, 
  characterElements, 
  onTextGroupChange, 
  onTextEnd, 
  canvasElement 
}: TextGroupEditorProps) => {
  // Initialize with the current text from the textGroup
  const currentText = element.characters?.join('') || element.text || '';
  const [text, setText] = useState(currentText);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleTextEnd = () => {
    if (text.trim() && text !== currentText) {
      // Calculate new character positions and create updated character elements
      const newCharacters = text.split('');
      const fontSize = element.fontSize || 16;
      const letterSpacing = element.letterSpacing || 0;
      
      // Calculate total width for the new text
      let totalWidth = 0;
      newCharacters.forEach((char) => {
        // Use accurate character width using PIXI measurement
        const charWidth = getCharWidthPixi(char, fontSize, element.fontFamily || 'Arial, sans-serif');
        totalWidth += charWidth + letterSpacing;
      });
      
      // Remove the last letter spacing
      const newTextWidth = Math.max(totalWidth - letterSpacing, fontSize);
      
      // Create new character elements with updated positions
      const updatedCharacterElements: AnimatedCanvasObject[] = [];
      let currentX = element.x - newTextWidth / 2;
      
      newCharacters.forEach((char, index) => {
        const charWidth = getCharWidthPixi(char, fontSize, element.fontFamily || 'Arial, sans-serif');
        const charX = currentX + charWidth / 2;
        
        // Create or update character element
        const existingChar = characterElements[index];
        const characterElement: AnimatedCanvasObject = {
          ...existingChar, // Preserve existing properties if available
          id: existingChar?.id || `char-${element.id}-${index}`,
          name: existingChar?.name || `Character ${index + 1}`,
          type: 'character',
          character: char,
          text: char,
          characterIndex: index,
          parentTextGroupId: element.id,
          x: charX,
          y: element.y,
          width: charWidth,
          height: element.height,
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || 'Arial, sans-serif',
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          fill: element.fill || '#000000',
          stroke: element.stroke,
          strokeWidth: element.strokeWidth || 0,
          opacity: element.opacity || 1,
          visible: element.visible !== false,
          groupId: element.groupId,
          animations: existingChar?.animations || [],
          // Set other required properties
          rotation: existingChar?.rotation || 0,
          shadowEnabled: existingChar?.shadowEnabled || false,
          shadowColor: existingChar?.shadowColor || '#000000',
          shadowBlur: existingChar?.shadowBlur || 0,
          shadowOffsetX: existingChar?.shadowOffsetX || 0,
          shadowOffsetY: existingChar?.shadowOffsetY || 0,
          shadowOpacity: existingChar?.shadowOpacity || 0,
          pivotX: charWidth / 2,
          pivotY: (element.height || fontSize * 1.5) / 2,
          textAlign: 'center',
          lineHeight: element.lineHeight || 1.2,
        };
        
        updatedCharacterElements.push(characterElement);
        currentX += charWidth + letterSpacing;
      });
      
      onTextGroupChange(element.id, text, updatedCharacterElements);
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
    <div className="relative">
      <textarea
        ref={textareaRef}
        value={text}
        onChange={handleTextAreaChange}
        onKeyDown={handleKeyDown}
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y,
          width: Math.max(element.width, 200), // Ensure minimum width for editing
          height: element.height,
          fontSize: element.fontSize || 16,
          fontFamily: element.fontFamily || 'Arial, sans-serif',
          fontWeight: element.fontWeight || 'normal',
          fontStyle: element.fontStyle || 'normal',
          color: element.fill || '#000000',
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          border: '2px solid #4F46E5',
          borderRadius: '4px',
          padding: '4px 8px',
          resize: 'none',
          overflow: 'hidden',
          zIndex: 1000,
          outline: 'none',
          textAlign: (element.textAlign as 'left' | 'center' | 'right') || 'left',
          lineHeight: '1.2',
          boxSizing: 'border-box',
        }}
        placeholder="Type text here..."
      />
      
      {/* Helper text */}
      <div
        style={{
          position: 'fixed',
          left: position.x,
          top: position.y + (element.height || 24) + 8,
          fontSize: '12px',
          color: '#666',
          backgroundColor: 'rgba(255, 255, 255, 0.9)',
          padding: '2px 6px',
          borderRadius: '3px',
          zIndex: 1001,
          whiteSpace: 'nowrap',
        }}
      >
        Press Enter to save, Esc to cancel
      </div>
    </div>
  );
}; 