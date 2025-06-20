import React, { useRef, useCallback } from 'react';
import { extend } from '@pixi/react';
import { Container, Text } from 'pixi.js';
import * as PIXI from 'pixi.js';
import { AnimatedCanvasObject } from '@/types/canvas';

extend({ Container, Text });

interface AnimatedTextGroupProps {
  element: AnimatedCanvasObject;
}

export const AnimatedTextGroup: React.FC<AnimatedTextGroupProps> = ({ element }) => {
  const charsRef = useRef<Text[]>([]);

  // Calculate accurate character width using PIXI measurement
  const getCharacterWidth = useCallback((char: string, fontSize: number, fontFamily: string) => {
    // Create a temporary Text object to measure the character
    const tempText = new PIXI.Text(char, {
      fontSize,
      fontFamily,
    });
    
    // Get the width from the text bounds
    const bounds = tempText.getBounds();
    
    // Clean up the temporary text object
    tempText.destroy();
    
    return bounds.width;
  }, []);

  // Calculate position for each character
  const calculateCharacterPosition = useCallback((index: number, characters: string[], fontSize: number, letterSpacing: number, totalWidth: number, fontFamily: string) => {
    // Calculate accumulated width of previous characters
    let xOffset = -totalWidth / 2;
    for (let i = 0; i < index; i++) {
      const char = characters[i];
      const charWidth = getCharacterWidth(char, fontSize, fontFamily);
      xOffset += charWidth + letterSpacing;
    }
    
    // Calculate width for current character and position at its center
    const currentCharWidth = getCharacterWidth(characters[index], fontSize, fontFamily);
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
        const xOffset = calculateCharacterPosition(index, element.characters!, fontSize, letterSpacing, element.width, element.fontFamily || 'Arial, sans-serif');
        
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