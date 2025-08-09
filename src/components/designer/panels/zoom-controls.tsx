import React from 'react';

interface ZoomControlsProps {
  currentZoom: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({ currentZoom }) => {
  const handleZoomIn = () => {
    // Zoom functionality removed
    console.log('Zoom in - functionality removed');
  };

  const handleZoomOut = () => {
    // Zoom functionality removed
    console.log('Zoom out - functionality removed');
  };

  const handleResetZoom = () => {
    // Zoom functionality removed
    console.log('Reset zoom - functionality removed');
  };

  // Format zoom percentage for display
  const formatZoomPercentage = (zoom: number) => {
    return `${Math.round(zoom * 100)}%`;
  };

  return (
    <div className="flex flex-col gap-2 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
      {/* Zoom In Button */}
      <button
        onClick={handleZoomIn}
        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom In"
        aria-label="Zoom In"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <line x1="8" y1="11" x2="14" y2="11" />
          <line x1="11" y1="8" x2="11" y2="14" />
        </svg>
      </button>

      {/* Current Zoom Display */}
      <button
        onClick={handleResetZoom}
        className="px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-100 rounded transition-colors min-w-[48px] text-center"
        title="Reset to 100% (Click to reset)"
        aria-label={`Current zoom: ${formatZoomPercentage(currentZoom)}. Click to reset to 100%`}
      >
        {formatZoomPercentage(currentZoom)}
      </button>

      {/* Zoom Out Button */}
      <button
        onClick={handleZoomOut}
        className="w-8 h-8 flex items-center justify-center text-gray-700 hover:bg-gray-100 rounded transition-colors"
        title="Zoom Out"
        aria-label="Zoom Out"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </button>
    </div>
  );
}; 