import React from 'react';
import { Text, TextStyle, FillGradient, Color } from 'pixi.js';
import { extend } from '@pixi/react';
import type { AnimatedCanvasObject } from '@/types/canvas';
import { useFontLoading } from '@/hooks/use-font-loading';

// Extend PIXI components for React
extend({ Text });

interface RichTextRendererProps {
  element: AnimatedCanvasObject;
  isEditing?: boolean;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ element, isEditing = false }) => {
  const { fontsLoaded, availableFonts } = useFontLoading();
  
  if (element.type !== 'text' || !element.text) {
    return null;
  }

  // If fonts aren't loaded yet, show a loading state or fallback
  if (!fontsLoaded) {
    return (
      <pixiText
        text={element.text}
        style={new TextStyle({
          fontFamily: 'Arial',
          fontSize: element.fontSize || 36,
          fontWeight: '400',
          fontStyle: 'normal',
          fill: '#666666',
        })}
        anchor={{ x: 0, y: 0.5 }}
        x={-element.width / 2}
        y={0}
        interactive={!isEditing}
        eventMode={!isEditing ? 'dynamic' : 'none'}
      />
    );
  }

  // Check if the requested font is available, fallback to Arial if not
  const fontFamily = availableFonts.includes(element.fontFamily || '') 
    ? element.fontFamily 
    : 'Arial';

  const isValidHex = (v: unknown): v is string => typeof v === 'string' && /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(v.trim());
  const toSafeColorNumber = (v: unknown, fallback: string = '#000000') => {
    const c = typeof v === 'string' ? v.trim() : '';
    const hex = isValidHex(c) ? c : fallback;
    return new Color(hex).toNumber();
  };

  // Create gradient fill for rich text using element properties
  const createGradientFill = () => {
    if (element.textGradient) {
      const fill = new FillGradient(0, 0, 0, element.height || 50);
      
      element.textGradient.colors.forEach(({ color, offset }) => {
        fill.addColorStop(offset, toSafeColorNumber(color));
      });
      
      return fill;
    }
    return undefined;
  };

  // Determine fill input for text (color or gradient)
  const baseFill = !element.fill || element.fill.trim().toLowerCase() === 'none' ? '#000000' : element.fill;
  const fillInput = element.textGradient
    ? (createGradientFill() ?? toSafeColorNumber(baseFill))
    : toSafeColorNumber(baseFill);

  // Create rich text style using element properties
  const richStyle = new TextStyle({
    fontFamily: fontFamily,
    fontSize: element.fontSize || 36,
    fontStyle: (element.fontStyle as 'normal' | 'italic' | 'oblique') || 'normal',
    fontWeight: (element.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || '400',
    fill: fillInput,
    stroke: element.textStroke && element.textStrokeWidth && isValidHex(element.textStroke) ? {
      color: toSafeColorNumber(element.textStroke),
      width: element.textStrokeWidth,
      join: element.textStrokeJoin || 'round'
    } : undefined,
    dropShadow: element.textDropShadow ? {
      color: toSafeColorNumber(element.textDropShadow.color),
      blur: element.textDropShadow.blur,
      angle: element.textDropShadow.angle,
      distance: element.textDropShadow.distance,
      alpha: element.textDropShadow.alpha
    } : undefined,
    wordWrap: true, // Always enabled
    wordWrapWidth: element.width, // Always use element width for consistency
    letterSpacing: element.letterSpacing || 0, // Add letter spacing support
    align: (element.textAlign as 'left' | 'center' | 'right') || 'left', // Add text alignment support
  });

  return (
    <pixiText
      text={element.text}
      style={richStyle}
      anchor={{ x: 0, y: 0.5 }}
      x={-element.width / 2}
      y={0}
      interactive={!isEditing}
      eventMode={!isEditing ? 'dynamic' : 'none'}
    />
  );
}; 