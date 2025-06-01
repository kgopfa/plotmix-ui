import { useState, useEffect } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export function useCanvasDimensions() {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });

  useEffect(() => {
    const updateDimensions = () => {
      const sidebarWidth = 288; // w-72 in Tailwind
      const topBarHeight = 48; // h-12

      setDimensions({
        width: window.innerWidth - sidebarWidth * 2,
        height: window.innerHeight - topBarHeight,
      });
    };

    // Initial dimensions
    updateDimensions();

    // Update dimensions on window resize
    window.addEventListener('resize', updateDimensions);

    // Cleanup
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  return dimensions;
} 