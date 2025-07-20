# Responsive Canvas Positioning

This document explains how the design canvas adapts to different screen sizes and provides optimal positioning across various devices.

## Overview

The responsive canvas positioning system ensures that the design canvas is optimally placed on different screen sizes, from mobile devices to ultrawide monitors. The system automatically calculates the best position and zoom level based on the available screen space.

## Key Components

### 1. Responsive Canvas Position Hook

**File**: `src/hooks/use-responsive-canvas-position.ts`

This custom hook calculates the optimal canvas position based on screen dimensions:

```typescript
const { x: centerX, y: centerY } = useResponsiveCanvasPosition(containerDimensions);
```

**Features**:
- Automatically adjusts vertical offset based on screen aspect ratio
- Provides consistent positioning across different devices
- Memoized for performance optimization

### 2. Viewport Utilities

**File**: `src/components/editor/viewport/viewport-utils.ts`

Enhanced viewport functions that support responsive positioning:

- `centerOnDesign()` - Centers canvas with responsive positioning
- `zoomToFit()` - Fits canvas to viewport with optimal zoom
- `resetZoom()` - Resets zoom with responsive centering
- `calculateCanvasPosition()` - Calculates optimal position

### 3. Application Canvas Integration

**File**: `src/components/editor/application-canvas.tsx`

The main canvas component that:
- Listens for window resize events
- Updates canvas position when screen dimensions change
- Provides responsive zoom and centering controls

## Screen Size Adaptations

### Ultrawide Screens (Aspect Ratio > 2:1)
- **Position**: Much higher placement (closer to top navigation)
- **Offset**: 15% of screen height (max 150px)
- **Use Case**: Ultrawide monitors, multi-monitor setups

### Wide Screens (Aspect Ratio 1.5:1 - 2:1)
- **Position**: Much higher placement (closer to top navigation)
- **Offset**: 18% of screen height (max 200px)
- **Use Case**: Standard desktop monitors, laptops

### Standard Screens (Aspect Ratio < 1.5:1)
- **Position**: Much higher placement (closer to top navigation)
- **Offset**: 22% of screen height (max 250px)
- **Use Case**: Tablets, mobile devices in landscape

## Implementation Details

### Position Calculation

```typescript
const calculateCanvasPosition = (containerWidth: number, containerHeight: number) => {
  const screenAspectRatio = containerWidth / containerHeight;
  let verticalOffset = 0;
  
  if (screenAspectRatio > 2) {
    verticalOffset = Math.min(150, containerHeight * 0.15);
  } else if (screenAspectRatio > 1.5) {
    verticalOffset = Math.min(200, containerHeight * 0.18);
  } else {
    verticalOffset = Math.min(250, containerHeight * 0.22);
  }
  
  return { x: 0, y: -verticalOffset };
};
```

### Zoom Calculation

```typescript
const calculateOptimalZoom = (containerDimensions, canvasDimensions) => {
  const padding = Math.min(50, Math.min(containerWidth, containerHeight) * 0.05);
  const scaleX = (containerWidth - padding * 2) / canvasWidth;
  const scaleY = (containerHeight - padding * 2) / canvasHeight;
  return Math.min(scaleX, scaleY, 5);
};
```

## Usage Examples

### Basic Implementation

```typescript
import { useResponsiveCanvasPosition } from '@/hooks/use-responsive-canvas-position';

const MyCanvasComponent = () => {
  const dimensions = { width: window.innerWidth, height: window.innerHeight };
  const { x: centerX, y: centerY } = useResponsiveCanvasPosition(dimensions);
  
  return (
    <CanvasContainer x={centerX} y={centerY}>
      {/* Canvas content */}
    </CanvasContainer>
  );
};
```

### With Viewport Controls

```typescript
import { centerOnDesign, zoomToFit } from '@/components/editor/viewport';

const handleCenterCanvas = () => {
  centerOnDesign(viewportRef.current, screenWidth, screenHeight, canvasWidth, canvasHeight);
};

const handleZoomToFit = () => {
  zoomToFit(viewportRef.current, screenWidth, screenHeight, canvasWidth, canvasHeight);
};
```

## Responsive Features

### 1. Dynamic Positioning
- Canvas automatically repositions when window is resized
- Maintains optimal placement across different screen sizes
- Smooth transitions between positions

### 2. Adaptive Zoom
- Zoom-to-fit considers actual available viewport space
- Responsive padding that scales with screen size
- Maximum zoom limits to prevent excessive scaling

### 3. Screen Size Indicators
- Canvas size selector shows appropriate device icons
- Visual feedback for different aspect ratios
- Easy switching between canvas sizes

## Best Practices

### 1. Performance
- Use memoized calculations to avoid unnecessary recalculations
- Debounce window resize events for smooth performance
- Cache position calculations when possible

### 2. Accessibility
- Ensure canvas remains accessible on all screen sizes
- Provide keyboard shortcuts for positioning controls
- Maintain minimum touch target sizes

### 3. User Experience
- Provide visual feedback during position changes
- Allow users to override automatic positioning
- Save user preferences for positioning

## Troubleshooting

### Common Issues

1. **Canvas appears off-screen**
   - Check if viewport dimensions are correctly calculated
   - Verify that position calculations are being applied
   - Ensure viewport is properly initialized

2. **Position doesn't update on resize**
   - Verify window resize event listeners are active
   - Check that position calculation is triggered
   - Ensure viewport reference is valid

3. **Zoom behavior is inconsistent**
   - Verify canvas and container dimensions are correct
   - Check zoom calculation logic
   - Ensure maximum zoom limits are appropriate

### Debug Tools

```typescript
// Enable debug logging
const DEBUG_CANVAS_POSITION = true;

if (DEBUG_CANVAS_POSITION) {
  console.log('Canvas position:', { centerX, centerY });
  console.log('Screen dimensions:', dimensions);
  console.log('Canvas dimensions:', { canvasWidth, canvasHeight });
}
```

## Future Enhancements

### Planned Features
- User-defined positioning preferences
- Advanced aspect ratio handling
- Multi-monitor support
- Touch device optimizations
- Animation during position changes

### Customization Options
- Configurable position offsets
- Custom zoom behavior
- Position presets for different workflows
- Integration with user preferences system 