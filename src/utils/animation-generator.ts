import type { Container } from 'pixi.js';
import { Graphics } from 'pixi.js';
import type {
  AnimatedCanvasObject,
  ElementAnimation,
  AnimatableProperties,
  BaseAnimationConfig,
  CanvasGroup,
  GroupAnimatableProperties,
} from '@/types/canvas';
import { createShapeGraphics } from '@/utils/drawing-utils';


export interface ColorAnimationConfig extends BaseAnimationConfig {
  type: 'color';
  oldChild: Graphics;
  newChild: Graphics;
}

export interface PathAnimationConfig extends BaseAnimationConfig {
  type: 'path';
  pathElement: AnimatedCanvasObject | CanvasGroup;
  targetElement: AnimatedCanvasObject;
  pathTopLeftX: number;
  pathTopLeftY: number;
}

export interface PolygonAnimationConfig extends BaseAnimationConfig {
  type: 'polygon';
  pathElement: CanvasGroup;
  targetElement: AnimatedCanvasObject;
  pathTopLeftX: number;
  pathTopLeftY: number;
}

export interface PhysicsAnimationConfig extends BaseAnimationConfig {
  type: 'physics';
  velocity: number;
  angle: number;
  gravity: number;
  acceleration?: number;
  accelerationAngle?: number;
  friction?: number;
  xProp?: string;
  yProp?: string;
}

export interface GroupAnimationConfig extends BaseAnimationConfig {
  type: 'group';
  group: CanvasGroup;
  elementTargets: Container[];
  // Stagger properties for group animations
  stagger?: number;
  staggerFrom?: 'start' | 'end' | 'center';
  staggerEase?: string;
}

export function isColorAnimationConfig(config: BaseAnimationConfig): config is ColorAnimationConfig {
  return 'type' in config && config.type === 'color';
}

export function isPathAnimationConfig(config: BaseAnimationConfig): config is PathAnimationConfig {
  return 'type' in config && config.type === 'path';
}

export function isPhysicsAnimationConfig(config: BaseAnimationConfig): config is PhysicsAnimationConfig {
  return 'type' in config && config.type === 'physics';
}

export function isGroupAnimationConfig(config: BaseAnimationConfig): config is GroupAnimationConfig {
  return 'type' in config && config.type === 'group';
}

export function isPolygonAnimationConfig(config: BaseAnimationConfig): config is PolygonAnimationConfig {
  return 'type' in config && config.type === 'polygon';
}

/**
 * Extracts a path from an array of line elements that form a polygon.
 * Takes the first line's start point, then all line end points in order.
 */
function extractPolygonPath(lineElements: AnimatedCanvasObject[]): Array<{x: number, y: number}> {
  if (lineElements.length === 0) return [];
  
  const path: Array<{x: number, y: number}> = [];
  
  // Get the first line's start point
  const firstLine = lineElements[0];
  if (!firstLine.lineOptions?.points) return [];
  
  path.push(firstLine.lineOptions.points.start);
  
  // Push every line's end point
  for (const line of lineElements) {
    if (line.lineOptions?.points) {
      path.push(line.lineOptions.points.end);
    }
  }
  
  return path;
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

    case 'physics':
      return {
        velocity: Number(animeProps.velocity) ?? 400,
        angle: Number(animeProps.angle) ?? 60,
        gravity: Number(animeProps.gravity) ?? 800,
        acceleration: animeProps.acceleration ? Number(animeProps.acceleration) : undefined,
        accelerationAngle: animeProps.accelerationAngle ? Number(animeProps.accelerationAngle) : undefined,
        friction: animeProps.friction ? Number(animeProps.friction) : undefined,
        xProp: animeProps.xProp as string,
        yProp: animeProps.yProp as string
      };

    default:
      return {};
  }
}

function generateGroupAnimationProperties(
  animation: ElementAnimation,
  group: CanvasGroup
): GroupAnimatableProperties {
  const animeProps = { ...animation.properties };

  switch (animation.type) {
    case 'move':
      return {
        x: group.x + (Number(animeProps.x) ?? 0),
        y: group.y + (Number(animeProps.y) ?? 0)
      };

    case 'scale':
      return {
        scaleX: Number(animeProps.scaleX) ?? 1,
        scaleY: Number(animeProps.scaleY) ?? 1
      };

    case 'rotate':
      return {
        rotation: Number(animeProps.rotation) ?? 0
      };

    case 'fade':
      return {
        alpha: animeProps.alpha ?? 1
      };

    default:
      return {};
  }
}

export function generateAnimationConfig(
  element: AnimatedCanvasObject,
  animation: ElementAnimation,
  target: Container,
  allCanvasObjects?: AnimatedCanvasObject[]
): BaseAnimationConfig | ColorAnimationConfig | PathAnimationConfig | PhysicsAnimationConfig | PolygonAnimationConfig {
  const animationProps = generateAnimationProperties(animation, element);
  const baseConfig = {
    target,
    duration: animation.duration,
    startTime: animation.startTime,
    ease: animation.easing ?? 'power1.out',
    repeat: animation.repeat,
    repeatDelay: animation.repeatDelay,
    yoyo: animation.yoyo,
    yoyoReturnEase: animation.yoyoReturnEasing ?? animation.easing ?? 'power1.out'
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
    const newChild = createShapeGraphics(element, fillColor, target);
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
    const pathElement = (animation.properties as Record<string, unknown>)['pathElement'] as AnimatedCanvasObject | CanvasGroup;
    
    // Check if it's an AnimatedCanvasObject (doesn't have elementIds property)
    if (pathElement && !('elementIds' in pathElement)) {
      // Handle different types of single path elements
      if (pathElement.type === 'line' && pathElement.lineOptions?.points) {
        // For lines, use the line's start point as the path start
        const { start, end } = pathElement.lineOptions.points;
        const pathTopLeftX = start.x;
        const pathTopLeftY = start.y;
        
        const updatedProps = {
          ...animationProps,
          x: pathTopLeftX,
          y: pathTopLeftY,
          // Add end point for line path animation
          endX: end.x,
          endY: end.y
        };
        
        return {
          ...baseConfig,
          type: 'path',
          pathElement: pathElement,
          targetElement: element,
          pathTopLeftX,
          pathTopLeftY,
          properties: updatedProps
        };
      } else {
        // For other shapes (rectangle, circle, etc.), use the previous logic
        const pathTopLeftX = pathElement.x - pathElement.width / 2;
        const pathTopLeftY = pathElement.y - pathElement.height / 2;
        
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
          properties: updatedProps
        };
      }
    }
    
    // Handle CanvasGroup (like polygon - bunch of lines in a group)
    if (pathElement && 'elementIds' in pathElement && pathElement.type === 'polygon') {
      const group = pathElement as CanvasGroup;
      
      // Extract the line elements that make up the polygon
      let pathPoints: Array<{x: number, y: number}> = [];
      
      if (allCanvasObjects) {
        // Get all line elements in the group
        const lineElements = allCanvasObjects.filter(obj => 
          group.elementIds.includes(obj.id) && 
          obj.type === 'line' && 
          obj.lineOptions?.points
        );
        
        if (lineElements.length > 0) {
          // Extract and connect the line endpoints to form a continuous path
          // For a proper polygon, we need to order the lines to form a connected path
          pathPoints = extractPolygonPath(lineElements);
        }
      }
      
      // Use the group's center position as the reference point
      const pathTopLeftX = pathElement.x;
      const pathTopLeftY = pathElement.y;
      
      const updatedProps = {
        ...animationProps,
        x: pathTopLeftX,
        y: pathTopLeftY,
        // Add the extracted path points for polygon animation
        pathPoints: pathPoints.length > 0 ? pathPoints : undefined,
        // Mark this as a polygon path so the timeline manager handles it differently
        isPolygonPath: true
      };
      
      return {
        ...baseConfig,
        type: 'polygon',
        pathElement: pathElement,
        targetElement: element,
        pathTopLeftX,
        pathTopLeftY,
        // Add the isPolygonPath flag and path points to the properties for the timeline manager
        properties: { ...updatedProps, isPolygonPath: true }
      };
    }
  }

  if (animation.type === 'physics') {
    const velocity = animationProps.velocity ?? 400;
    const angle = animationProps.angle ?? 60;
    const gravity = animationProps.gravity ?? 800;
    const acceleration = animationProps.acceleration;
    const accelerationAngle = animationProps.accelerationAngle;
    const friction = animationProps.friction;
    const xProp = animationProps.xProp;
    const yProp = animationProps.yProp;
    
    return {
      ...baseConfig,
      type: 'physics',
      velocity,
      angle,
      gravity,
      acceleration,
      accelerationAngle,
      friction,
      xProp,
      yProp,
      properties: {}
    };
  }

  return {
    ...baseConfig,
    properties: animationProps
  };
}

export function generateGroupAnimationConfig(
  group: CanvasGroup,
  animation: ElementAnimation,
  elementTargets: Container[]
): GroupAnimationConfig {
  const animationProps = generateGroupAnimationProperties(animation, group);
  
  return {
    type: 'group',
    target: elementTargets[0],
    elementTargets,
    group,
    duration: animation.duration,
    startTime: animation.startTime,
    ease: animation.easing ?? 'power1.out',
    repeat: animation.repeat,
    repeatDelay: animation.repeatDelay,
    yoyo: animation.yoyo,
    yoyoReturnEase: animation.yoyoReturnEasing ?? animation.easing ?? 'power1.out',
    properties: animationProps,
    // Add stagger properties
    stagger: animation.stagger,
    staggerFrom: animation.staggerFrom,
    staggerEase: animation.staggerEase
  };
} 