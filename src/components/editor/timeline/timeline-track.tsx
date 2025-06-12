import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { SelectionManager } from '@/lib/selection-manager';
import { AnimationBlock } from './animation-block';

const MAX_DURATION_SECONDS = 120;
const PIXELS_PER_SECOND = 100;
const TIMELINE_WIDTH = MAX_DURATION_SECONDS * PIXELS_PER_SECOND;

type TimelineItem = AnimatedCanvasObject | CanvasGroup;

interface TimelineTrackProps {
  element: TimelineItem;
  trackType?: 'element' | 'group';
  scale: number;
  currentTime: number;
  isSelected: boolean;
  onAnimationClick?: (animation: { id: string; type: string; startTime: number; duration: number }) => void;
  onAnimationChange: (
    elementId: string,
    animationId: string,
    update: { startTime: number; duration: number }
  ) => void;
  // Hierarchical props
  isGroup?: boolean;
  isExpanded?: boolean;
  isChild?: boolean;
  depth?: number;
  onToggleExpansion?: () => void;
}

export function TimelineTrack({
  element,
  trackType,
  scale,
  currentTime,
  isSelected,
  onAnimationClick,
  onAnimationChange,
  isGroup: isGroupProp,
  isExpanded,
  isChild,
  depth = 0,
  onToggleExpansion,
}: TimelineTrackProps) {
  // Determine if this is a group track
  const isGroup = isGroupProp ?? (trackType === 'group' || ('elementIds' in element));
  
  // Get the appropriate properties
  const name = element.name;
  const animations = element.animations || [];
  const id = element.id;

  const handleTrackClick = () => {
    if (isGroup) {
      // For groups, we'll handle group selection in the main timeline component
      // This is a placeholder for now
    } else {
      SelectionManager.getInstance().select(element as AnimatedCanvasObject);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpansion) {
      onToggleExpansion();
    }
  };

  return (
    <div
      className={`h-8 flex items-center border-b border-gray-200 text-gray-700 cursor-pointer ${
        isSelected ? 'bg-blue-50' : ''
      } ${isChild ? 'bg-gray-50' : ''}`}
    >
      {/* Track Label */}
      <div
        className={`w-32 text-sm font-medium truncate flex items-center gap-1 ${
          isSelected ? 'text-blue-600' : ''
        } ${isChild ? 'text-gray-600' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleTrackClick}
      >
        {isGroup && (
          <button
            onClick={handleExpandToggle}
            className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded text-xs"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        {isGroup && <span className="text-xs">📦</span>}
        {!isGroup && <span className="text-xs">{isChild ? '└' : '🔵'}</span>}
        <span className="truncate">{name}</span>
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
        {animations.map((animation) => (
          <AnimationBlock
            key={animation.id}
            animation={animation}
            scale={scale}
            isSelected={isSelected}
            onClick={() => onAnimationClick?.(animation)}
            onChange={(update) => onAnimationChange(id, animation.id, update)}
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
