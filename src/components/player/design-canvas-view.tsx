'use client';

import React, { useRef } from 'react';
import { extend } from '@pixi/react';
import { Container, Graphics, Rectangle } from 'pixi.js';
import type { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { drawShape, applyShadowToContainer } from '@/utils/drawing-utils';
import { RichTextRenderer } from '@/components/designer/helpers/rich-text-renderer';

extend({ Container, Graphics });

type Props = {
  designWidth: number;
  designHeight: number;
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  clipToCanvas?: boolean;
  clipCornerRadius?: number;
  backgroundColor?: number; // default 0xFFFFFF
  borderColor?: number; // default 0xE2E8F0
  borderWidth?: number; // default 1
};

export function DesignCanvasView({
  designWidth,
  designHeight,
  elements,
  groups,
  clipToCanvas = true,
  clipCornerRadius = 0,
  backgroundColor = 0xffffff,
  borderColor = 0xE2E8F0,
  borderWidth = 0,
}: Props) {
  const mainContainerRef = useRef<Container | null>(null);
  const maskRef = useRef<Graphics | null>(null);
  const shapeRefs = useRef<Record<string, Container>>({});
  const groupContainers = useRef<Record<string, Container>>({});

  return (
    <pixiContainer
      x={designWidth}
      y={designHeight}
      interactive={false}
      eventMode="none"
      sortableChildren={true}
      data-pixi-container="design-canvas-view"
      hitArea={new Rectangle(-designWidth / 2, -designHeight / 2, designWidth, designHeight)}
      ref={(container) => {
        mainContainerRef.current = container;
      }}
      // Clip all rendering to the design rectangle when enabled
      mask={clipToCanvas ? (maskRef.current as unknown as Container | undefined) : undefined}
    >
      {/* Canvas frame background */}
      <pixiGraphics
        zIndex={-1}
        draw={(g) => {
          g.clear();
          g.rect(-designWidth / 2, -designHeight / 2, designWidth, designHeight);
          g.fill({ color: backgroundColor });
        }}
        interactive={false}
        eventMode="none"
      />

      {/* Group containers (non-default) */}
      {groups
        .filter((group) => group.visible !== false && !group.isDefaultGroup)
        .map((group) => {
          const groupElements = elements.filter((el) => el.groupId === group.id && el.visible !== false);

          return (
            <pixiContainer
              key={`group-${group.id}`}
              x={group.x}
              y={group.y}
              rotation={group.rotation || 0}
              alpha={group.opacity ?? 1}
              zIndex={Math.max(...groupElements.map((el) => el.zIndex || 0))}
              interactive={false}
              eventMode="none"
              ref={(node) => {
                if (node) groupContainers.current[group.id] = node;
              }}
            >
              {groupElements.map((el) => {
                const relativeX = el.x - group.x;
                const relativeY = el.y - group.y;

                return (
                  <pixiContainer
                    key={el.id}
                    x={relativeX}
                    y={relativeY}
                    pivot={{ x: 0, y: 0 }}
                    alpha={el.opacity ?? 1}
                    zIndex={el.zIndex || 0}
                    rotation={el.rotation || 0}
                    interactive={false}
                    eventMode="none"
                    ref={(node) => {
                      if (node) {
                        shapeRefs.current[el.id] = node;
                        if (el.type !== 'text') applyShadowToContainer(node, el);
                      }
                    }}
                  >
                    <pixiGraphics draw={(g) => drawShape(g, el)} />

                    {/* Render text separately for text elements */}
                    {el.type === 'text' && (
                      <RichTextRenderer element={el} isEditing={false} />
                    )}
                  </pixiContainer>
                );
              })}
            </pixiContainer>
          );
        })}

      {/* Ungrouped or default-group elements */}
      {elements
        .filter((el) => {
          const group = groups.find((g) => g.id === el.groupId);
          return (!group || group.isDefaultGroup) && el.visible !== false;
        })
        .map((el) => (
          <pixiContainer
            key={el.id}
            x={el.x}
            y={el.y}
            pivot={{ x: 0, y: 0 }}
            alpha={el.opacity ?? 1}
            zIndex={el.zIndex || 0}
            rotation={el.rotation || 0}
            interactive={false}
            eventMode="none"
            ref={(node) => {
              if (node) {
                shapeRefs.current[el.id] = node;
                if (el.type !== 'text') applyShadowToContainer(node, el);
              }
            }}
          >
            <pixiGraphics draw={(g) => drawShape(g, el)} />

            {/* Render text separately for text elements */}
            {el.type === 'text' && (
              <RichTextRenderer element={el} isEditing={false} />
            )}
          </pixiContainer>
        ))}
    </pixiContainer>
  );
}


