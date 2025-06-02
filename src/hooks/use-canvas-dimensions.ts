import { useState, useLayoutEffect, useRef } from 'react';

interface Dimensions {
  width: number;
  height: number;
}

export function useCanvasDimensions() {
  const [dimensions, setDimensions] = useState<Dimensions>({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!containerRef.current) return;

    const updateSize = () => {
      const rect = containerRef.current!.getBoundingClientRect();
      setDimensions({ width: rect.width, height: rect.height });
    };

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(containerRef.current);
    updateSize(); // initial

    return () => resizeObserver.disconnect();
  }, []);

  return { dimensions, containerRef };
}
