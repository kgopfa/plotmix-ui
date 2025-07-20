import React from 'react';

export interface ScreenInfo {
  width: number;
  height: number;
  aspectRatio: number;
  isUltrawide: boolean;
  isWide: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
}

export const getScreenInfo = (): ScreenInfo => {
  if (typeof window === 'undefined') {
    return {
      width: 1920,
      height: 1080,
      aspectRatio: 16/9,
      isUltrawide: false,
      isWide: true,
      isMobile: false,
      isTablet: false,
      isDesktop: true
    };
  }
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspectRatio = width / height;
  
  return {
    width,
    height,
    aspectRatio,
    isUltrawide: aspectRatio > 2,
    isWide: aspectRatio > 1.5,
    isMobile: width < 768,
    isTablet: width >= 768 && width < 1024,
    isDesktop: width >= 1024
  };
};

export const getOptimalCanvasOffset = (screenHeight: number, aspectRatio: number): number => {
  if (aspectRatio > 2) {
    // Ultrawide screens: positioned higher (closer to top)
    return Math.min(25, screenHeight * 0.04);
  } else if (aspectRatio > 1.5) {
    // Wide screens: positioned higher (closer to top)
    return Math.min(50, screenHeight * 0.06);
  } else {
    // Standard screens: positioned higher (closer to top)
    return Math.min(75, screenHeight * 0.08);
  }
};

// Alternative function for even higher positioning
export const getHighCanvasOffset = (screenHeight: number, aspectRatio: number): number => {
  if (aspectRatio > 2) {
    // Ultrawide screens: positioned very high (closer to top)
    return Math.min(50, screenHeight * 0.08);
  } else if (aspectRatio > 1.5) {
    // Wide screens: positioned very high (closer to top)
    return Math.min(75, screenHeight * 0.1);
  } else {
    // Standard screens: positioned very high (closer to top)
    return Math.min(100, screenHeight * 0.12);
  }
};

// Function to get canvas position with option for higher positioning
export const getCanvasPosition = (dimensions: { width: number; height: number }, highPosition: boolean = false): { x: number; y: number } => {
  const aspectRatio = dimensions.width / dimensions.height;
  
  const y = highPosition 
    ? getHighCanvasOffset(dimensions.height, aspectRatio)
    : getOptimalCanvasOffset(dimensions.height, aspectRatio);
  
  return { x: 0, y };
};

export const getResponsivePadding = (containerWidth: number, containerHeight: number): number => {
  const minDimension = Math.min(containerWidth, containerHeight);
  return Math.min(50, minDimension * 0.05);
};

// Hook for responsive screen detection
export const useScreenInfo = (): ScreenInfo => {
  const [screenInfo, setScreenInfo] = React.useState<ScreenInfo>(getScreenInfo);

  React.useEffect(() => {
    const updateScreenInfo = () => {
      setScreenInfo(getScreenInfo());
    };

    window.addEventListener('resize', updateScreenInfo);
    return () => window.removeEventListener('resize', updateScreenInfo);
  }, []);

  return screenInfo;
}; 