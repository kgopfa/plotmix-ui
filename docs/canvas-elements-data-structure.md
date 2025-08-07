# Canvas Elements Data Structure

## Overview

Canvas elements are the fundamental building blocks of the PlotMix canvas. Each element stores comprehensive data about its visual appearance, position, styling, and animations. This document details the complete data structure for `AnimatedCanvasObject`.

## Core Element Structure

```typescript
interface AnimatedCanvasObject {
  // Basic identification
  id: string;
  name: string;
  type: 'rectangle' | 'circle' | 'triangle' | 'arc' | 'line' | 'path' | 'image' | 'text';
  
  // Position and size
  x: number;
  y: number;
  width: number;
  height: number;
  
  // Visual properties
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  visible?: boolean;
  zIndex?: number;
  
  // Transform properties
  rotation?: number;
  pivotX?: number;
  pivotY?: number;
  
  // Animations
  animations: ElementAnimation[];
  
  // Grouping
  groupId?: string;
  parent?: string | null;
}
```

## Detailed Property Reference

### Basic Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `id` | `string` | Unique identifier for the element | Required |
| `name` | `string` | Human-readable name for the element | Required |
| `type` | `ShapeType` | The type of shape/element | Required |

### Position and Size

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `x` | `number` | X coordinate (left position) | Required |
| `y` | `number` | Y coordinate (top position) | Required |
| `width` | `number` | Element width in pixels | Required |
| `height` | `number` | Element height in pixels | Required |

### Visual Styling

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `fill` | `string` | Fill color (hex, rgb, or named color) | Required |
| `stroke` | `string` | Stroke/border color | `undefined` |
| `strokeWidth` | `number` | Stroke width in pixels | `undefined` |
| `opacity` | `number` | Element opacity (0-1) | `1` |
| `visible` | `boolean` | Whether element is visible | `true` |
| `zIndex` | `number` | Layering order (higher = on top) | `0` |

### Shape-Specific Properties

#### Rectangle Properties
```typescript
cornerRadius?: number; // Rounded corners radius
```

#### Circle Properties
```typescript
radius?: number; // Circle radius (overrides width/height)
```

#### Line Properties
```typescript
lineOptions?: {
  points: {
    start: { x: number; y: number };
    end: { x: number; y: number };
  };
  controlPoint?: { x: number; y: number }; // For curved lines
  arrow: boolean; // Whether line has arrow
  dotted: boolean; // Whether line is dotted
  isCurved?: boolean; // Whether line is curved vs straight
};
```

#### Path Properties
```typescript
pathPoints?: Array<{ x: number; y: number }>; // Path vertices
```

#### Image Properties
```typescript
imageData?: string; // Base64 encoded image data
```

#### Text Properties
```typescript
text?: string; // Text content
fontSize?: number; // Font size in pixels
fontFamily?: string; // Font family name
fontWeight?: string; // Font weight (normal, bold, etc.)
fontStyle?: string; // Font style (normal, italic)
textAlign?: string; // Text alignment (left, center, right)
lineHeight?: number; // Line height multiplier
letterSpacing?: number; // Letter spacing in pixels
wordWrap?: boolean; // Whether text wraps
wordWrapWidth?: number; // Wrap width in pixels

// Rich text properties
textStroke?: string; // Text stroke color
textStrokeJoin?: 'round' | 'miter' | 'bevel'; // Stroke join style
textDropShadow?: {
  color: string;
  blur: number;
  angle: number;
  distance: number;
  alpha: number;
};
textGradient?: {
  type: 'linear' | 'radial';
  colors: Array<{ color: string; offset: number }>;
  angle?: number; // For linear gradients
  center?: { x: number; y: number }; // For radial gradients
  radius?: number; // For radial gradients
};
```

### Transform Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `rotation` | `number` | Rotation in degrees | `0` |
| `pivotX` | `number` | X pivot point for rotation | `0` |
| `pivotY` | `number` | Y pivot point for rotation | `0` |

### Shadow Properties

| Property | Type | Description | Default |
|----------|------|-------------|---------|
| `shadowEnabled` | `boolean` | Whether shadow is enabled | `false` |
| `shadowColor` | `string` | Shadow color | `'#000000'` |
| `shadowBlur` | `number` | Shadow blur radius | `0` |
| `shadowOffsetX` | `number` | Shadow X offset | `0` |
| `shadowOffsetY` | `number` | Shadow Y offset | `0` |
| `shadowOpacity` | `number` | Shadow opacity (0-1) | `1` |
| `shadowAngle` | `number` | Shadow angle in degrees | `0` |

### Animation Properties

| Property | Type | Description |
|----------|------|-------------|
| `animations` | `ElementAnimation[]` | Array of animations applied to this element |
| `isAnimationPath` | `boolean` | Whether this element serves as an animation path |

### Grouping and Hierarchy

| Property | Type | Description |
|----------|------|-------------|
| `groupId` | `string` | ID of the group this element belongs to |
| `parent` | `string \| null` | ID of parent element or group |

## Element Types

### Rectangle
- **Type**: `'rectangle'`
- **Properties**: All basic properties + `cornerRadius`
- **Use Case**: Basic shapes, buttons, containers

### Circle
- **Type**: `'circle'`
- **Properties**: All basic properties + `radius`
- **Use Case**: Circular shapes, buttons, decorative elements

### Triangle
- **Type**: `'triangle'`
- **Properties**: All basic properties
- **Use Case**: Directional indicators, decorative shapes

### Arc
- **Type**: `'arc'`
- **Properties**: All basic properties + `arcOptions`
- **Use Case**: Pie charts, circular progress indicators

### Line
- **Type**: `'line'`
- **Properties**: All basic properties + `lineOptions`
- **Use Case**: Connectors, arrows, dividers

### Path
- **Type**: `'path'`
- **Properties**: All basic properties + `pathPoints`
- **Use Case**: Complex shapes, custom paths

### Image
- **Type**: `'image'`
- **Properties**: All basic properties + `imageData`
- **Use Case**: Photos, icons, graphics

### Text
- **Type**: `'text'`
- **Properties**: All basic properties + text-specific properties
- **Use Case**: Labels, titles, content

## Example Element Objects

### Simple Rectangle
```typescript
{
  id: "rect-1",
  name: "My Rectangle",
  type: "rectangle",
  x: 100,
  y: 100,
  width: 200,
  height: 100,
  fill: "#ff0000",
  stroke: "#000000",
  strokeWidth: 2,
  cornerRadius: 10,
  opacity: 1,
  visible: true,
  zIndex: 1,
  rotation: 0,
  animations: [],
  groupId: "group-1"
}
```

### Text Element
```typescript
{
  id: "text-1",
  name: "My Text",
  type: "text",
  x: 50,
  y: 50,
  width: 300,
  height: 50,
  fill: "#000000",
  text: "Hello World",
  fontSize: 24,
  fontFamily: "Arial",
  fontWeight: "bold",
  textAlign: "center",
  opacity: 1,
  visible: true,
  zIndex: 2,
  animations: [],
  groupId: undefined
}
```

## Storage Location

Elements are stored in the Canvas Store:
- **File**: `src/stores/use-canvas-store.ts`
- **Property**: `elements: AnimatedCanvasObject[]`
- **Access**: `useCanvasStore.getState().elements`

## Related Documentation

- [Canvas Groups Data Structure](./canvas-groups-data-structure.md)
- [Animation Storage System](./animation-storage-system.md)
- [Canvas State Storage Overview](./canvas-state-storage-overview.md)
