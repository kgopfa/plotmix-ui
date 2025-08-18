import { useState, useCallback, useEffect } from 'react';
import { AnimatedCanvasObject } from '../types/canvas';
import { 
  SnapGuide, 
  applyElementSnapping
} from '../utils/element-snapping';


export interface ElementSnappingConfig {
  enabled: boolean;
  snapThreshold: number;
  showGuides: boolean;
  enableSpacing: boolean;
  enableDistribution: boolean;
  canvasBounds?: { width: number; height: number; centerX?: number; centerY?: number };
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
    allElements: AnimatedCanvasObject[]
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

  // Sync external initialConfig changes (e.g., from store) into local config
  // Avoid depending on object identities; track primitive fields only
  const icEnabled = initialConfig?.enabled;
  const icSnapThreshold = initialConfig?.snapThreshold;
  const icShowGuides = initialConfig?.showGuides;
  const icEnableSpacing = initialConfig?.enableSpacing;
  const icEnableDistribution = initialConfig?.enableDistribution;
  const icWidth = initialConfig?.canvasBounds?.width;
  const icHeight = initialConfig?.canvasBounds?.height;
  const icCenterX = initialConfig?.canvasBounds?.centerX;
  const icCenterY = initialConfig?.canvasBounds?.centerY;

  useEffect(() => {
    if (!initialConfig) return;
    setConfigState((prev) => {
      const next: ElementSnappingConfig = {
        ...prev,
        ...initialConfig,
        canvasBounds: initialConfig.canvasBounds
          ? {
              width: initialConfig.canvasBounds.width ?? prev.canvasBounds?.width,
              height: initialConfig.canvasBounds.height ?? prev.canvasBounds?.height,
              centerX: initialConfig.canvasBounds.centerX ?? prev.canvasBounds?.centerX,
              centerY: initialConfig.canvasBounds.centerY ?? prev.canvasBounds?.centerY,
            }
          : prev.canvasBounds,
      } as ElementSnappingConfig;

      const unchanged =
        next.enabled === prev.enabled &&
        next.snapThreshold === prev.snapThreshold &&
        next.showGuides === prev.showGuides &&
        next.enableSpacing === prev.enableSpacing &&
        next.enableDistribution === prev.enableDistribution &&
        (prev.canvasBounds?.width ?? undefined) === (next.canvasBounds?.width ?? undefined) &&
        (prev.canvasBounds?.height ?? undefined) === (next.canvasBounds?.height ?? undefined) &&
        (prev.canvasBounds?.centerX ?? undefined) === (next.canvasBounds?.centerX ?? undefined) &&
        (prev.canvasBounds?.centerY ?? undefined) === (next.canvasBounds?.centerY ?? undefined);

      return unchanged ? prev : next;
    });
  }, [icEnabled, icSnapThreshold, icShowGuides, icEnableSpacing, icEnableDistribution, icWidth, icHeight, icCenterX, icCenterY, initialConfig]);
  
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
    allElements: AnimatedCanvasObject[]
  ): { x: number; y: number; guides: SnapGuide[] } => {
    // Return original position if snapping is disabled
    if (!config.enabled || isSnapTemporarilyDisabled) {
      return { x: element.x, y: element.y, guides: [] };
    }

    // Use regular snapping
    const result = applyElementSnapping(element, allElements, config.snapThreshold, config.enableSpacing, config.enableDistribution, config.canvasBounds);
    
    // Update guides if showing guides is enabled
    if (config.showGuides) {
      setCurrentGuides(result.guides);
    } else {
      setCurrentGuides([]);
    }
    
    return result;
  }, [config.enabled, config.snapThreshold, config.showGuides, config.enableSpacing, config.enableDistribution, config.canvasBounds, isSnapTemporarilyDisabled]);

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