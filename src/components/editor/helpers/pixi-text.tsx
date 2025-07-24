import React, { useRef, useEffect } from 'react';
import { extend } from '@pixi/react';
import { Text, TextStyle } from 'pixi.js';
import type { AnimatedCanvasObject } from '@/types/canvas';

// Extend PIXI Text for React
extend({ Text });

interface PixiTextProps {
  element: AnimatedCanvasObject;
  x: number;
  y: number;
  anchor?: { x: number; y: number };
  alpha?: number;
}

export const PixiText: React.FC<PixiTextProps> = ({ element, x, y, anchor = { x: 0, y: 0 }, alpha = 1 }) => {
  const textRef = useRef<Text>(null);

  useEffect(() => {
    if (!textRef.current) return;

    const text = textRef.current;
    
    // Create TextStyle with all the font properties
    const style = new TextStyle({
      fontFamily: element.fontFamily || 'Arial, sans-serif',
      fontSize: element.fontSize || 16,
      fontWeight: (element.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
      fontStyle: (element.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
      fill: element.fill || '#000000',
      align: (element.textAlign as 'left' | 'center' | 'right') || 'left',
      lineHeight: element.lineHeight || 1.2,
      wordWrap: true,
      wordWrapWidth: element.width - 16,
    });

    // Update text properties
    text.text = element.type === 'character' ? (element.character || element.text || ' ') : (element.text || 'Text');
    text.style = style;
    text.anchor.set(anchor.x, anchor.y);
    text.alpha = alpha;
  }, [element, anchor, alpha]);

  return (
    <pixiText
      ref={textRef}
      x={x}
      y={y}
    />
  );
}; 