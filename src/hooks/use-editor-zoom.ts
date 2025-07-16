import { useCallback, useRef } from 'react';
import { ReactZoomPanPinchRef } from 'react-zoom-pan-pinch';

export interface EditorZoomRef {
  zoomIn: () => void;
  zoomOut: () => void;
  resetZoom: () => void;
  setZoom: (scale: number) => void;
  getCurrentZoom: () => number;
  centerOnElement: (id?: string) => void;
  zoomToFitElement: (id?: string) => void;
  getViewportCenter: () => { x: number; y: number };
  resetToCenter: () => void;
  resetZoomToOneHundredPercent: () => void;
}

export const useEditorZoom = () => {
  const zoomRef = useRef<ReactZoomPanPinchRef>(null);

  const zoomIn = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.zoomIn();
    }
  }, []);

  const zoomOut = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.zoomOut();
    }
  }, []);

  const resetZoom = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.resetTransform();
    }
  }, []);

  const setZoom = useCallback((scale: number) => {
    if (zoomRef.current) {
      zoomRef.current.setTransform(zoomRef.current.instance.transformState.positionX, zoomRef.current.instance.transformState.positionY, scale);
    }
  }, []);

  const getCurrentZoom = useCallback(() => {
    if (zoomRef.current) {
      return zoomRef.current.instance.transformState.scale;
    }
    return 1;
  }, []);

  const centerOnElement = useCallback((id?: string) => {
    if (zoomRef.current && id) {
      // This would need to be implemented with element positioning logic
      // For now, just center the viewport
      zoomRef.current.centerView();
    }
  }, []);

  const zoomToFitElement = useCallback((id?: string) => {
    if (zoomRef.current && id) {
      // This would need to be implemented with element bounds calculation
      // For now, just center the viewport
      zoomRef.current.centerView();
    }
  }, []);

  const getViewportCenter = useCallback(() => {
    if (zoomRef.current) {
      const { positionX, positionY } = zoomRef.current.instance.transformState;
      return { x: positionX, y: positionY };
    }
    return { x: 0, y: 0 };
  }, []);

  const resetToCenter = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.centerView();
    }
  }, []);

  const resetZoomToOneHundredPercent = useCallback(() => {
    if (zoomRef.current) {
      zoomRef.current.setTransform(zoomRef.current.instance.transformState.positionX, zoomRef.current.instance.transformState.positionY, 1);
    }
  }, []);

  return {
    zoomRef,
    zoomIn,
    zoomOut,
    resetZoom,
    setZoom,
    getCurrentZoom,
    centerOnElement,
    zoomToFitElement,
    getViewportCenter,
    resetToCenter,
    resetZoomToOneHundredPercent,
  };
}; 