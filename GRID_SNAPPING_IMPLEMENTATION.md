# Grid Snapping Implementation

This document outlines the grid snapping functionality implemented for the PIXI.js-based canvas drawing application.

## Overview

The grid snapping system provides:
- **Visual grid overlay** with configurable appearance
- **Smart snapping** that only activates when close to grid lines
- **Configurable grid size** (5px to 50px)
- **Temporary disable** via Shift key
- **Grid visibility toggle**
- **Performance optimizations** for smooth interaction

## Architecture

### Core Components

1. **`src/utils/grid-utils.ts`** - Core grid snapping utilities
2. **`src/hooks/useGridSnapping.ts`** - React hook for grid state management
3. **`src/components/editor/canvas/grid-overlay.tsx`** - Visual grid rendering
4. **`src/components/editor/canvas/grid-controls.tsx`** - UI controls for grid settings

### Key Features

#### Smart Snapping
- Only snaps when within 8px (configurable) of a grid line
- Prevents jarring behavior when moving elements freely
- Applies to element creation, movement, and resizing

#### Visual Grid
- Renders with PIXI.js Graphics for performance
- Major grid lines every 5 units for better visual hierarchy
- Fades in/out based on zoom level to prevent visual noise
- Hidden when zoomed out too far (< 0.5x)

#### Keyboard Control
- **Shift key**: Temporarily disables snapping while held
- Works for all operations (creation, movement, resizing)

## Usage

### Grid Configuration

```typescript
interface GridConfig {
  size: number;          // Grid size in pixels (5, 10, 15, 20, 25, 50)
  enabled: boolean;      // Enable/disable snapping
  visible: boolean;      // Show/hide grid overlay
  snapThreshold: number; // Distance within which snapping occurs (default: 8px)
}
```

### Hook Usage

```typescript
const {
  gridConfig,
  setGridConfig,
  toggleGrid,
  toggleSnapEnabled,
  snapPoint,
  snapRectangle,
  snapLine,
  isSnapTemporarilyDisabled
} = useGridSnapping({
  size: 10,
  enabled: true,
  visible: false,
  snapThreshold: 8
});
```

### Snapping Functions

#### Point Snapping
```typescript
const snappedPoint = snapPoint({ x: 123, y: 456 });
// Result: { x: 120, y: 460 } (for 10px grid)
```

#### Line Snapping
```typescript
const { start, end } = snapLine(
  { x: 123, y: 456 }, 
  { x: 234, y: 567 }
);
// Both endpoints are snapped to grid
```

#### Rectangle Snapping
```typescript
const snappedRect = snapRectangle({
  x: 123, y: 456,
  width: 97, height: 83
});
// Position and size snapped to grid
```

## Integration Points

### Element Creation
Grid snapping is applied when creating new elements:
```typescript
const snappedPos = snapPoint({ x: e.global.x, y: e.global.y }, e);
const newElement = createNewObject(tool, snappedPos.x, snappedPos.y, ...);
```

### Element Dragging
Snapping is applied during drag operations:
```typescript
const snappedPos = snapPoint({ x, y });
return { ...el, x: snappedPos.x, y: snappedPos.y };
```

### Line Creation
Special handling for line endpoints:
```typescript
const { start: finalStart, end: finalEnd } = snapLine(lineStartPoint, snappedEnd, e);
```

## UI Controls

The grid controls provide:
- **Grid visibility toggle** - Show/hide the visual grid
- **Snap toggle** - Enable/disable snapping behavior  
- **Grid size selector** - Choose from preset sizes (5-50px)
- **Shift key indicator** - Shows when snapping is temporarily disabled

## Performance Considerations

### Grid Rendering
- Only renders visible grid lines within viewport
- Adjusts line opacity based on zoom level
- Uses efficient PIXI.js Graphics for rendering

### Snapping Calculations
- Smart thresholds prevent unnecessary snapping
- Memoized functions in React hooks
- Minimal calculations during drag operations

## Best Practices

### Default Settings
- **Grid size**: 10px (good balance for most use cases)
- **Snap threshold**: 8px (feels natural, not too aggressive)
- **Grid visibility**: Off by default (reduces visual clutter)

### User Experience
- Visual feedback for temporary disable (Shift key indicator)
- Consistent snapping behavior across all tools
- Grid adapts to zoom level for optimal visibility

### Performance
- Grid overlay only renders when visible
- Efficient viewport-based line calculation
- Smooth transitions for grid appearance changes

## Technical Implementation

### Grid Line Calculation
```typescript
const startX = Math.floor(x / size) * size;
const endX = Math.ceil((x + width) / size) * size;
// Generate lines from startX to endX with size intervals
```

### Smart Snapping Logic
```typescript
const snapped = Math.round(value / gridSize) * gridSize;
const distance = Math.abs(value - snapped);
return distance <= snapThreshold ? snapped : value;
```

### Zoom-based Visibility
```typescript
const effectiveGridSize = gridConfig.size * zoom;
let alpha = effectiveGridSize < 5 ? 0 : Math.min(0.6, zoom * 0.3);
```

## Troubleshooting

### Common Issues

1. **Grid not visible**: Check `gridConfig.visible` and zoom level
2. **Snapping not working**: Verify `gridConfig.enabled` and Shift key state
3. **Performance issues**: Ensure grid only renders when needed

### Debug Tools
- Check `isSnapTemporarilyDisabled` state
- Monitor grid configuration changes
- Verify snap threshold settings

## Future Enhancements

Potential improvements:
- **Magnetic guidelines** between elements
- **Custom grid patterns** (hex, isometric)
- **Snap to element edges** in addition to grid
- **Grid subdivisions** for finer control
- **Persistent user preferences**

## Dependencies

- PIXI.js 8.x for grid rendering
- React hooks for state management
- TypeScript for type safety
- Tailwind CSS for UI styling 