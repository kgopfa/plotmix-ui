import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useSelectionStore } from '@/stores/use-selection-store';
import { AnimationBlock } from './animation-block';
import { 
  Square, 
  Circle, 
  Triangle, 
  RotateCcw, 
  Minus, 
  PenTool, 
  Image, 
  Type, 
  FileText, 
  Folder, 
  Package2, 
  Pentagon,
  LetterText
} from 'lucide-react';

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
  customName?: string; // Allow custom name override
  onGroupSelect?: (group: CanvasGroup) => void;
}

// Icon component for element types
const ElementIcon = ({ element, isChild = false }: { element: AnimatedCanvasObject | CanvasGroup; isChild?: boolean }) => {
  const iconSize = 14;
  const iconClass = "text-gray-600";
  
  // Handle groups first
  if ('elementIds' in element) {
    const group = element as CanvasGroup;
    switch (group.type) {
      case 'text':
        return <FileText size={iconSize} className={iconClass} />;
      case 'custom':
        return <Folder size={iconSize} className={iconClass} />;
      case 'polygon':
        return <Pentagon size={iconSize} className={iconClass} />;
      default:
        return <Package2 size={iconSize} className={iconClass} />;
    }
  }
  
  // Handle child indicator
  if (isChild) {
    return <span className="text-gray-400 text-xs">└</span>;
  }
  
  // Handle individual elements
  const animatedElement = element as AnimatedCanvasObject;
  switch (animatedElement.type) {
    case 'rectangle':
      return <Square size={iconSize} className={iconClass} />;
    case 'circle':
      return <Circle size={iconSize} className={iconClass} />;
    case 'triangle':
      return <Triangle size={iconSize} className={iconClass} />;
    case 'arc':
      return <RotateCcw size={iconSize} className={iconClass} />;
    case 'line':
      return <Minus size={iconSize} className={iconClass} />;
    case 'path':
      return <PenTool size={iconSize} className={iconClass} />;
    case 'image':
      return <Image size={iconSize} className={iconClass} />;
    case 'text':
      return <Type size={iconSize} className={iconClass} />;
    case 'textGroup':
      return <FileText size={iconSize} className={iconClass} />;
    case 'character':
      return <LetterText size={iconSize} className={iconClass} />;
    default:
      return <Circle size={iconSize} className={iconClass} />;
  }
};

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
  customName,
  onGroupSelect,
}: TimelineTrackProps) {
  // Use Zustand store for selection
  const { select } = useSelectionStore();
  
  // Determine if this is a group track
  const isGroup = isGroupProp ?? (trackType === 'group' || ('elementIds' in element));
  
  // Get the appropriate properties
  const name = customName || element.name;
  const animations = element.animations || [];
  const id = element.id;

  const handleTrackClick = () => {
    if (isGroup && onGroupSelect) {
      // For groups, use the callback to select the group properly
      const group = element as CanvasGroup;
      onGroupSelect(group);
    } else {
      const animatedElement = element as AnimatedCanvasObject;
      // Completely prevent character selection - characters should not be selectable
      if (animatedElement.type === 'character' && animatedElement.parentTextGroupId) {
        // Characters are not selectable, do nothing
        return;
      }
      select(animatedElement);
    }
  };

  const handleExpandToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleExpansion) {
      onToggleExpansion();
    }
  };

  // Check if this is a textgroup character
  const isTextGroupCharacter = !isGroup && 'type' in element && element.type === 'character' && (element as AnimatedCanvasObject).parentTextGroupId;

  return (
    <div
      className={`h-8 flex items-center border-b border-gray-200 text-gray-700 ${
        isTextGroupCharacter ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
      } ${
        isSelected ? 'bg-blue-50' : ''
      } ${isChild ? 'bg-gray-50' : ''}`}
    >
      {/* Track Label */}
      <div
        className={`w-32 text-sm font-medium truncate flex items-center gap-2 ${
          isSelected ? 'text-blue-600' : ''
        } ${isChild ? 'text-gray-600' : ''}`}
        style={{ paddingLeft: `${8 + depth * 16}px` }}
        onClick={handleTrackClick}
      >
        {(isGroup || ('type' in element && element.type === 'textGroup')) && onToggleExpansion && (!isGroup || !('type' in element) || (element as CanvasGroup).type !== 'polygon') && (
          <button
            onClick={handleExpandToggle}
            className="w-4 h-4 flex items-center justify-center hover:bg-gray-200 rounded text-xs"
          >
            {isExpanded ? '▼' : '▶'}
          </button>
        )}
        <ElementIcon element={element} isChild={isChild} />
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
          className="absolute top-0 bottom-0 w-0.5 bg-fuchsia-300"
          style={{ left: `${currentTime * scale}px` }}
        />
      </div>
    </div>
  );
}
