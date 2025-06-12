import { useState, useCallback, useEffect } from 'react';
import { AnimatedCanvasObject } from '../types/canvas';
import { 
  SnapGuide, 
  applyElementSnapping
} from '../utils/element-snapping';
import { GridConfig } from '../utils/grid-utils';

export interface ElementSnappingConfig {
  enabled: boolean;
  snapThreshold: number;
  showGuides: boolean;
  enableSpacing: boolean;
  enableDistribution: boolean;
}

export interface UseElementSnappingReturn {
  config: ElementSnappingConfig;
  setConfig: (config: Partial<ElementSnappingConfig>) => void;
  toggleEnabled: () => void;
  toggleGuides: () => void;
  toggleSpacing: () => void;
  toggleDistribution: () => void;
  snapElement: (
    element: AnimatedCanvasObject, 
    allElements: AnimatedCanvasObject[],
    gridConfig?: GridConfig
  ) => { x: number; y: number; guides: SnapGuide[] };
  currentGuides: SnapGuide[];
  setCurrentGuides: (guides: SnapGuide[]) => void;
  clearGuides: () => void;
  isSnapTemporarilyDisabled: boolean;
}

const DEFAULT_CONFIG: ElementSnappingConfig = {
  enabled: true,
  snapThreshold: 10,
  showGuides: true,
  enableSpacing: true,
  enableDistribution: true
};

export const useElementSnapping = (
  initialConfig?: Partial<ElementSnappingConfig>
): UseElementSnappingReturn => {
  const [config, setConfigState] = useState<ElementSnappingConfig>({
    ...DEFAULT_CONFIG,
    ...initialConfig,
  });
  
  const [currentGuides, setCurrentGuides] = useState<SnapGuide[]>([]);
  const [isSnapTemporarilyDisabled, setIsSnapTemporarilyDisabled] = useState(false);
  
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

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  const setConfig = useCallback((newConfig: Partial<ElementSnappingConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }));
  }, []);

  const toggleEnabled = useCallback(() => {
    setConfigState(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const toggleGuides = useCallback(() => {
    setConfigState(prev => ({ ...prev, showGuides: !prev.showGuides }));
  }, []);

  const toggleSpacing = useCallback(() => {
    setConfigState(prev => ({ ...prev, enableSpacing: !prev.enableSpacing }));
  }, []);

  const toggleDistribution = useCallback(() => {
    setConfigState(prev => ({ ...prev, enableDistribution: !prev.enableDistribution }));
  }, []);

  const clearGuides = useCallback(() => {
    setCurrentGuides([]);
  }, []);

  const snapElement = useCallback((
    element: AnimatedCanvasObject,
    allElements: AnimatedCanvasObject[],
    gridConfig?: GridConfig
  ): { x: number; y: number; guides: SnapGuide[] } => {
    // Return original position if snapping is disabled
    if (!config.enabled || isSnapTemporarilyDisabled) {
      return { x: element.x, y: element.y, guides: [] };
    }

    const result = applyElementSnapping(element, allElements, config.snapThreshold, gridConfig, config.enableSpacing, config.enableDistribution);
    
    // Update guides if showing guides is enabled
    if (config.showGuides) {
      setCurrentGuides(result.guides);
    } else {
      setCurrentGuides([]);
    }
    
    return result;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.enabled, config.snapThreshold, config.showGuides, isSnapTemporarilyDisabled]);

  return {
    config,
    setConfig,
    toggleEnabled,
    toggleGuides,
    toggleSpacing,
    toggleDistribution,
    snapElement,
    currentGuides,
    setCurrentGuides,
    clearGuides,
    isSnapTemporarilyDisabled,
  };
}; 