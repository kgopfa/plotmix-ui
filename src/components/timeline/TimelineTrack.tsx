import { AnimatedCanvasElement } from '@/components/editor/Canvas';
import { SelectionManager } from '@/lib/SelectionManager';

interface TimelineTrackProps {
  element: AnimatedCanvasElement;
  scale: number;
  currentTime: number;
  isSelected: boolean;
  onAnimationClick?: (animation: AnimatedCanvasElement['animations'][0]) => void;
}

export function TimelineTrack({ element, scale, currentTime, isSelected, onAnimationClick }: TimelineTrackProps) {
  const handleTrackClick = () => {
    SelectionManager.getInstance().select(element);
  };

  return (
    <div 
      className={`h-8 flex items-center border-b border-gray-200 last:border-0 ${isSelected ? 'bg-blue-200' : ''} cursor-pointer`}
    >
      {/* Track Label */}
      <div 
        className={`w-32 px-2 text-sm font-medium truncate ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}
        onClick={handleTrackClick}
      >
        {element.name}
      </div>

      {/* Track Content */}
      <div 
        className="flex-1 relative h-full"
        onClick={handleTrackClick}
      >
        {/* Time Markers */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 10 }).map((_, i) => (
            <div
              key={i}
              className="h-full border-l border-gray-200"
              style={{ width: `${scale}px` }}
            />
          ))}
        </div>

        {/* Animations */}
        {element.animations.map(animation => (
          <div
            key={animation.id}
            className={`absolute top-1 bottom-1 rounded cursor-pointer transition-colors ${
              isSelected ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
            }`}
            style={{
              left: `${animation.startTime * scale}px`,
              width: `${animation.duration * scale}px`
            }}
            onClick={(e) => {
              e.stopPropagation(); // Prevent track selection when clicking animation
              onAnimationClick?.(animation);
            }}
          />
        ))}

        {/* Playhead */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500"
          style={{ left: `${currentTime * scale}px` }}
        />
      </div>
    </div>
  );
} 