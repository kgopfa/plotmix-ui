import React, { useRef, useCallback } from 'react';
import { extend } from '@pixi/react';
import { Container, Text } from 'pixi.js';
import { AnimatedCanvasObject } from '@/types/canvas';

extend({ Container, Text });

interface AnimatedTextGroupProps {
  element: AnimatedCanvasObject;
}

export const AnimatedTextGroup: React.FC<AnimatedTextGroupProps> = ({ element }) => {
  const charsRef = useRef<Text[]>([]);

  // Calculate character width based on character type
  const getCharacterWidth = useCallback((char: string, fontSize: number) => {
    if (char === ' ') {
      return fontSize * 0.25; // Space character
    } else if (char.match(/[iIlj1]/)) {
      return fontSize * 0.35; // Narrow characters
    } else if (char.match(/[mwMW]/)) {
      return fontSize * 0.8; // Wide characters
    } else if (char.match(/[A-Z]/)) {
      return fontSize * 0.65; // Uppercase letters
    } else {
      return fontSize * 0.55; // Default lowercase/numbers
    }
  }, []);

  // Calculate position for each character
  const calculateCharacterPosition = useCallback((index: number, characters: string[], fontSize: number, letterSpacing: number, totalWidth: number) => {
    // Calculate accumulated width of previous characters
    let xOffset = -totalWidth / 2;
    for (let i = 0; i < index; i++) {
      const char = characters[i];
      const charWidth = getCharacterWidth(char, fontSize);
      xOffset += charWidth + letterSpacing;
    }
    
    // Calculate width for current character and position at its center
    const currentCharWidth = getCharacterWidth(characters[index], fontSize);
    xOffset += currentCharWidth / 2;
    
    return xOffset;
  }, [getCharacterWidth]);

  if (!element.characters || element.type !== 'textGroup') {
    return null;
  }

  const fontSize = element.fontSize || 16;
  const letterSpacing = element.letterSpacing || 0;

  return (
    <pixiContainer>
      {element.characters.map((character: string, index: number) => {
        const xOffset = calculateCharacterPosition(index, element.characters!, fontSize, letterSpacing, element.width);
        
        return (
          <pixiText
            key={`char-${index}`}
            ref={(el: Text | null) => { if (el) charsRef.current[index] = el; }}
            text={character}
            anchor={{ x: 0.5, y: 0.5 }}
            x={xOffset}
            y={0}
            alpha={element.opacity ?? 1}
            style={{
              fontFamily: element.fontFamily || 'Arial, sans-serif',
              fontSize: fontSize,
              fontWeight: (element.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'normal',
              fontStyle: (element.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
              fill: element.fill || '#000000',
              align: 'center',
            }}
          />
        );
      })}
    </pixiContainer>
  );
}; 