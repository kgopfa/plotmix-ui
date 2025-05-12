import { AnimatedCanvasElement } from '@/components/editor/Canvas';
import { SelectionManager } from '@/lib/SelectionManager';
import { AnimationBlock } from './AnimationBlock';

const MAX_DURATION_SECONDS = 120;
const PIXELS_PER_SECOND = 100;
const TIMELINE_WIDTH = MAX_DURATION_SECONDS * PIXELS_PER_SECOND;

interface TimelineTrackProps {
  element: AnimatedCanvasElement;
  scale: number;
  currentTime: number;
  isSelected: boolean;
  onAnimationClick?: (animation: AnimatedCanvasElement['animations'][0]) => void;
  onAnimationChange: (
    elementId: string,
    animationId: string,
    update: { startTime: number; duration: number }
  ) => void;
}

export function TimelineTrack({
  element,
  scale,
  currentTime,
  isSelected,
  onAnimationClick,
  onAnimationChange,
}: TimelineTrackProps) {
  const handleTrackClick = () => {
    SelectionManager.getInstance().select(element);
  };

  return (
    <div
      className={`h-8 flex items-center border-b border-gray-200 ${isSelected ? 'bg-blue-200' : ''} cursor-pointer`}
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
        style={{ width: `${TIMELINE_WIDTH}px` }}
        onClick={handleTrackClick}
      >
        {/* Optional internal ticks (could be removed since ruler handles it) */}
        <div className="absolute inset-0">
          {Array.from({ length: 121 }).map((_, i) => {
            return (
              i % 5 === 0 && (
                <div
                  key={i}
                  className="absolute h-full border-l border-gray-200"
                  style={{ left: `${i * scale}px`, width: 0 }}
                />
              )
            );
          })}
        </div>

        {/* Animations */}
        {element.animations.map((animation) => (
          <AnimationBlock
            key={animation.id}
            animation={animation}
            scale={scale}
            isSelected={isSelected}
            onClick={() => onAnimationClick?.(animation)}
            onChange={(update) => onAnimationChange(element.id, animation.id, update)}
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
