export interface GridConfig {
  size: number;
  enabled: boolean;
  visible: boolean;
  snapThreshold: number; // Distance in pixels within which snapping occurs
}

export interface Point {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Rectangle extends Point, Size {}

/**
 * Default grid configuration
 */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  size: 10,
  enabled: true,
  visible: false,
  snapThreshold: 8, // Snap when within 8 pixels of grid line
};

/**
 * Snaps a single coordinate to the nearest grid line
 */
export const snapToGrid = (value: number, gridSize: number): number => {
  return Math.round(value / gridSize) * gridSize;
};

/**
 * Snaps a point to the nearest grid intersection
 */
export const snapPointToGrid = (point: Point, gridConfig: GridConfig): Point => {
  if (!gridConfig.enabled) return point;
  
  return {
    x: snapToGrid(point.x, gridConfig.size),
    y: snapToGrid(point.y, gridConfig.size),
  };
};

/**
 * Smart snapping: only snaps if the point is close enough to a grid line
 */
export const smartSnapToGrid = (value: number, gridSize: number, snapThreshold: number): number => {
  const snapped = snapToGrid(value, gridSize);
  const distance = Math.abs(value - snapped);
  
  return distance <= snapThreshold ? snapped : value;
};

/**
 * Smart snaps a point to grid only if close enough to grid lines
 */
export const smartSnapPointToGrid = (point: Point, gridConfig: GridConfig): Point => {
  if (!gridConfig.enabled) return point;
  
  return {
    x: smartSnapToGrid(point.x, gridConfig.size, gridConfig.snapThreshold),
    y: smartSnapToGrid(point.y, gridConfig.size, gridConfig.snapThreshold),
  };
};

/**
 * Snaps rectangle position and size to grid
 */
export const snapRectangleToGrid = (rect: Rectangle, gridConfig: GridConfig): Rectangle => {
  if (!gridConfig.enabled) return rect;
  
  return {
    x: snapToGrid(rect.x, gridConfig.size),
    y: snapToGrid(rect.y, gridConfig.size),
    width: Math.max(gridConfig.size, snapToGrid(rect.width, gridConfig.size)),
    height: Math.max(gridConfig.size, snapToGrid(rect.height, gridConfig.size)),
  };
};

/**
 * Smart snaps rectangle - only snaps position if close to grid, ensures minimum size
 */
export const smartSnapRectangleToGrid = (rect: Rectangle, gridConfig: GridConfig): Rectangle => {
  if (!gridConfig.enabled) return rect;
  
  return {
    x: smartSnapToGrid(rect.x, gridConfig.size, gridConfig.snapThreshold),
    y: smartSnapToGrid(rect.y, gridConfig.size, gridConfig.snapThreshold),
    width: Math.max(gridConfig.size, snapToGrid(rect.width, gridConfig.size)),
    height: Math.max(gridConfig.size, snapToGrid(rect.height, gridConfig.size)),
  };
};

/**
 * Snaps line endpoints to grid
 */
export const snapLineToGrid = (start: Point, end: Point, gridConfig: GridConfig): { start: Point; end: Point } => {
  if (!gridConfig.enabled) return { start, end };
  
  return {
    start: snapPointToGrid(start, gridConfig),
    end: snapPointToGrid(end, gridConfig),
  };
};

/**
 * Smart snaps line endpoints to grid
 */
export const smartSnapLineToGrid = (start: Point, end: Point, gridConfig: GridConfig): { start: Point; end: Point } => {
  if (!gridConfig.enabled) return { start, end };
  
  return {
    start: smartSnapPointToGrid(start, gridConfig),
    end: smartSnapPointToGrid(end, gridConfig),
  };
};

/**
 * Calculates grid lines for rendering
 */
export const calculateGridLines = (
  viewportBounds: Rectangle,
  gridConfig: GridConfig
): { verticalLines: number[]; horizontalLines: number[] } => {
  if (!gridConfig.visible || !gridConfig.enabled) {
    return { verticalLines: [], horizontalLines: [] };
  }
  
  const { x, y, width, height } = viewportBounds;
  const { size } = gridConfig;
  
  // Calculate the range of grid lines to show
  const startX = Math.floor(x / size) * size;
  const endX = Math.ceil((x + width) / size) * size;
  const startY = Math.floor(y / size) * size;
  const endY = Math.ceil((y + height) / size) * size;
  
  const verticalLines: number[] = [];
  const horizontalLines: number[] = [];
  
  // Generate vertical lines
  for (let lineX = startX; lineX <= endX; lineX += size) {
    verticalLines.push(lineX);
  }
  
  // Generate horizontal lines
  for (let lineY = startY; lineY <= endY; lineY += size) {
    horizontalLines.push(lineY);
  }
  
  return { verticalLines, horizontalLines };
};

/**
 * Checks if snapping should be temporarily disabled (e.g., when Shift is held)
 */
export const shouldDisableSnapping = (event: { shiftKey?: boolean } | null): boolean => {
  return event?.shiftKey === true;
};

/**
 * Gets the effective grid configuration considering temporary overrides
 */
export const getEffectiveGridConfig = (
  baseConfig: GridConfig,
  tempDisabled: boolean = false
): GridConfig => {
  return {
    ...baseConfig,
    enabled: baseConfig.enabled && !tempDisabled,
  };
}; 