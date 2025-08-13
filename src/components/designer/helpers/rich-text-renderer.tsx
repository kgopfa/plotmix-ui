import React from 'react';
import { Text, TextStyle, FillGradient, Color } from 'pixi.js';
import { extend } from '@pixi/react';
import type { AnimatedCanvasObject } from '@/types/canvas';

// Extend PIXI components for React
extend({ Text });

interface RichTextRendererProps {
  element: AnimatedCanvasObject;
  isEditing?: boolean;
}

export const RichTextRenderer: React.FC<RichTextRendererProps> = ({ element, isEditing = false }) => {
  if (element.type !== 'text' || !element.text) {
    return null;
  }

  // Debug: Log when RichTextRenderer is called
  console.log(`RichTextRenderer called for element: ${element.id}`, {
    text: element.text,
    wordWrapWidth: element.wordWrapWidth,
    elementWidth: element.width
  });

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
    fontFamily: element.fontFamily || 'Arial',
    fontSize: element.fontSize || 36,
    fontStyle: (element.fontStyle as 'normal' | 'italic' | 'oblique') || 'italic',
    fontWeight: (element.fontWeight as 'normal' | 'bold' | 'bolder' | 'lighter' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900') || 'bold',
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
  });

  return (
    <pixiText
      text={element.text}
      style={richStyle}
      anchor={{ x: 0.5, y: 0.5 }}
      x={0}
      y={0}
      interactive={!isEditing}
      eventMode={!isEditing ? 'dynamic' : 'none'}
    />
  );
}; 