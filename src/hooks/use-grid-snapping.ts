import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  GridConfig, 
  DEFAULT_GRID_CONFIG, 
  smartSnapPointToGrid, 
  smartSnapRectangleToGrid,
  smartSnapLineToGrid,
  getEffectiveGridConfig,
  shouldDisableSnapping,
  Point,
  Rectangle
} from '../utils/grid-utils';

export interface UseGridSnappingReturn {
  gridConfig: GridConfig;
  setGridConfig: (config: Partial<GridConfig>) => void;
  toggleGrid: () => void;
  toggleSnapEnabled: () => void;
  snapPoint: (point: Point, event?: { shiftKey?: boolean }) => Point;
  snapRectangle: (rect: Rectangle, event?: { shiftKey?: boolean }) => Rectangle;
  snapLine: (start: Point, end: Point, event?: { shiftKey?: boolean }) => { start: Point; end: Point };
  isSnapTemporarilyDisabled: boolean;
}

export const useGridSnapping = (initialConfig?: Partial<GridConfig>): UseGridSnappingReturn => {
  const [gridConfig, setGridConfigState] = useState<GridConfig>({
    ...DEFAULT_GRID_CONFIG,
    ...initialConfig,
  });
  
  const [isSnapTemporarilyDisabled, setIsSnapTemporarilyDisabled] = useState(false);
  const keydownListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);
  const keyupListenerRef = useRef<((e: KeyboardEvent) => void) | null>(null);

  // Track Shift key state for temporary snapping disable
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsSnapTemporarilyDisabled(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsSnapTemporarilyDisabled(false);
      }
    };

    keydownListenerRef.current = handleKeyDown;
    keyupListenerRef.current = handleKeyUp;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      if (keydownListenerRef.current) {
        document.removeEventListener('keydown', keydownListenerRef.current);
      }
      if (keyupListenerRef.current) {
        document.removeEventListener('keyup', keyupListenerRef.current);
      }
    };
  }, []);

  const setGridConfig = useCallback((config: Partial<GridConfig>) => {
    setGridConfigState(prev => ({ ...prev, ...config }));
  }, []);

  const toggleGrid = useCallback(() => {
    setGridConfigState(prev => ({ ...prev, visible: !prev.visible }));
  }, []);

  const toggleSnapEnabled = useCallback(() => {
    setGridConfigState(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const snapPoint = useCallback((
    point: Point, 
    event?: { shiftKey?: boolean }
  ): Point => {
    const tempDisabled = shouldDisableSnapping(event || null) || isSnapTemporarilyDisabled;
    const effectiveConfig = getEffectiveGridConfig(gridConfig, tempDisabled);
    return smartSnapPointToGrid(point, effectiveConfig);
  }, [gridConfig, isSnapTemporarilyDisabled]);

  const snapRectangle = useCallback((
    rect: Rectangle, 
    event?: { shiftKey?: boolean }
  ): Rectangle => {
    const tempDisabled = shouldDisableSnapping(event || null) || isSnapTemporarilyDisabled;
    const effectiveConfig = getEffectiveGridConfig(gridConfig, tempDisabled);
    return smartSnapRectangleToGrid(rect, effectiveConfig);
  }, [gridConfig, isSnapTemporarilyDisabled]);

  const snapLine = useCallback((
    start: Point, 
    end: Point, 
    event?: { shiftKey?: boolean }
  ): { start: Point; end: Point } => {
    const tempDisabled = shouldDisableSnapping(event || null) || isSnapTemporarilyDisabled;
    const effectiveConfig = getEffectiveGridConfig(gridConfig, tempDisabled);
    return smartSnapLineToGrid(start, end, effectiveConfig);
  }, [gridConfig, isSnapTemporarilyDisabled]);

  return {
    gridConfig,
    setGridConfig,
    toggleGrid,
    toggleSnapEnabled,
    snapPoint,
    snapRectangle,
    snapLine,
    isSnapTemporarilyDisabled,
  };
}; 