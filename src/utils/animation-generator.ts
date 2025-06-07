import type { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type {
  AnimatedCanvasObject,
  ElementAnimation,
  AnimatableProperties,
  BaseAnimationConfig,
} from '@/types/canvas';
import { createShapeGraphics } from '@/utils/drawing-utils';


export interface ColorAnimationConfig extends BaseAnimationConfig {
  type: 'color';
  oldChild: Graphics;
  newChild: Graphics;
}

export interface PathAnimationConfig extends BaseAnimationConfig {
  type: 'path';
  pathElement: AnimatedCanvasObject;
  targetElement: AnimatedCanvasObject;
  pathTopLeftX: number;
  pathTopLeftY: number;
  attachDelay: number;
}

export function isColorAnimationConfig(config: BaseAnimationConfig): config is ColorAnimationConfig {
  return 'type' in config && config.type === 'color';
}

export function isPathAnimationConfig(config: BaseAnimationConfig): config is PathAnimationConfig {
  return 'type' in config && config.type === 'path';
}

function generateAnimationProperties(
  animation: ElementAnimation,
  element: AnimatedCanvasObject
): AnimatableProperties {
  const animeProps = { ...animation.properties };

  switch (animation.type) {
    case 'move':
      return {
        x: element.x + (Number(animeProps.x) ?? 0),
        y: element.y + (Number(animeProps.y) ?? 0)
      };

    case 'scale':
      return {
        scaleX: Number(animeProps.scaleX) ?? 1,
        scaleY: Number(animeProps.scaleY) ?? 1
      };

    case 'rotate':
      return {
        rotation: (Number(animeProps.rotation) ?? 0),
        pivotX: element.pivotX ?? element.width / 2,
        pivotY: element.pivotY ?? element.height / 2
      };

    case 'fade':
      return {
        alpha: animeProps.alpha ?? 1
      };

    case 'color':
      return {
        fillColor: animeProps.fillColor ?? element.fill
      };

    default:
      return {};
  }
}

export function generateAnimationConfig(
  element: AnimatedCanvasObject,
  animation: ElementAnimation,
  target: Container
): BaseAnimationConfig | ColorAnimationConfig | PathAnimationConfig {
  const animationProps = generateAnimationProperties(animation, element);
  const baseConfig = {
    target,
    duration: animation.duration,
    startTime: animation.startTime,
    ease: animation.easing ?? 'power1.out'
  };

  /**
   * Handle color animation which requires special treatment:
   * 1. Create a new Graphics object with the target color (initially transparent)
   * 2. Animate both the old and new objects' alpha values in parallel
   * 3. Keep references to both objects for cleanup
   * 
   * This approach is necessary because PIXI.Graphics objects don't support direct
   * color transitions, requiring us to create a new object and cross-fade between them.
   */
  if (animation.type === 'color') {
    const oldChild = target.children[0] as Graphics;
    if (!(oldChild instanceof Graphics)) {
      throw new Error('Expected first child to be Graphics for color animation');
    }

    const fillColor = animation.properties.fillColor ?? element.fill;
    const newChild = createShapeGraphics(element, fillColor);
    newChild.alpha = 0;
    target.addChild(newChild);

    return {
      ...baseConfig,
      type: 'color',
      oldChild,
      newChild,
      properties: { alpha: 1 }
    };
  }

  if (animation.type === 'path') {
    const pathElement = (animation.properties as Record<string, unknown>)['pathElement'] as AnimatedCanvasObject;
    if (pathElement) {
      console.log(`generateAnimationConfig: pathElement width=${pathElement.width}, height=${pathElement.height} for element ${element.name}`);
      const pathTopLeftX = pathElement.x - pathElement.width / 2;
      const pathTopLeftY = pathElement.y - pathElement.height / 2;
      
      const attachDelay = (animation.properties as Record<string, unknown>)['attachDelay'] as number ?? 0.5;
      
      const updatedProps = {
        ...animationProps,
        x: pathTopLeftX,
        y: pathTopLeftY
      };
      
      return {
        ...baseConfig,
        type: 'path',
        pathElement: pathElement,
        targetElement: element,
        pathTopLeftX,
        pathTopLeftY,
        attachDelay,
        properties: updatedProps
      };
    }
  }

  return {
    ...baseConfig,
    properties: animationProps
  };
} 