import { useCallback } from 'react';

interface UseContainerEmptyAreaClickProps {
  tool: string;
  onEmptyAreaClick?: () => void;
}

export const useContainerEmptyAreaClick = ({
  tool,
  onEmptyAreaClick,
}: UseContainerEmptyAreaClickProps) => {
  const handleContainerClick = useCallback((e: React.MouseEvent) => {
    // Only handle deselection if we're in select mode and clicking on the background
    if (tool === 'select' && e.target === e.currentTarget) {
      onEmptyAreaClick?.();
    }
  }, [tool, onEmptyAreaClick]);

  return handleContainerClick;
}; 