import { useRef, useState } from 'react';
import { TimelineTrack } from '@/components/editor/timeline/timeline-track';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { TimelineState } from '@/types/timeline';
import { TimeManagerState } from '@/lib/time-manager';


interface TimelineProps {
  elements: AnimatedCanvasObject[];
  groups?: CanvasGroup[];
  timelineState: TimelineState;
  timeState: TimeManagerState;
  onPlayPause: () => void;
  onStop: () => void;
  onAnimationChange: (elementId: string, animationId: string, update: { startTime: number; duration: number }) => void;
  onGroupAnimationChange?: (groupId: string, animationId: string, update: { startTime: number; duration: number }) => void;
}

export function Timeline({
  elements,
  groups = [],
  timelineState,
  timeState,
  onPlayPause,
  onStop,
  onAnimationChange,
  onGroupAnimationChange,
}: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
    }
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    const milliseconds = Math.floor((time % 1) * 1000);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(3, '0')}`;
  };

  const toggleElementExpansion = (elementId: string) => {
    setExpandedElements(prev => {
      const newSet = new Set(prev);
      if (newSet.has(elementId)) {
        newSet.delete(elementId);
      } else {
        newSet.add(elementId);
      }
      return newSet;
    });
  };

  // Create hierarchical track structure
  const createHierarchicalTracks = () => {
    const tracks: Array<{
      id: string;
      type: 'element' | 'group';
      name: string;
      item: AnimatedCanvasObject | CanvasGroup;
      animations: Array<{
        id: string;
        type: string;
        startTime: number;
        duration: number;
        properties: Record<string, unknown>;
        easing?: string;
      }>;
      isSelected: boolean;
      isGroup?: boolean;
      isExpanded?: boolean;
      isChild?: boolean;
      parentGroupId?: string;
      depth: number;
    }> = [];

    // Add typed groups (text, custom, polygon)
    groups
      .filter(group => !group.isDefaultGroup)
      .forEach(group => {
        const isSelected = false; // Selection temporarily disabled
        
        tracks.push({
          id: group.id,
          type: 'group',
          name: group.name,
          item: group,
          animations: group.animations,
          isSelected,
          isGroup: true,
          isExpanded: expandedElements.has(group.id),
          depth: 0
        });
        
        // For text groups, add character children if group is expanded
        if (group.type === 'text' && expandedElements.has(group.id)) {
          const characters = elements.filter(el => 
            el.type === 'character' && group.elementIds.includes(el.id)
          ).sort((a, b) => (a.characterIndex || 0) - (b.characterIndex || 0));
          
          characters.forEach(character => {
            tracks.push({
              id: character.id,
              type: 'element',
              name: `'${character.character || 'char'}'`,
              item: character,
              animations: character.animations,
              isSelected: false, // Selection temporarily disabled
              isChild: true,
              parentGroupId: group.id,
              depth: 1
            });
          });
        }
        
        // For custom/polygon groups, add element children if group is expanded
        if ((group.type === 'custom' || group.type === 'polygon') && expandedElements.has(group.id)) {
          const groupElements = elements.filter(el => group.elementIds.includes(el.id));
          
          groupElements.forEach(element => {
            tracks.push({
              id: element.id,
              type: 'element',
              name: element.name,
              item: element,
              animations: element.animations,
              isSelected: false, // Selection temporarily disabled
              isChild: true,
              parentGroupId: group.id,
              depth: 1
            });
          });
        }
      });

    // Add individual elements not in custom/polygon groups (excluding characters, they appear under text groups)
    elements
      .filter(el => {
        // Skip characters - they appear under text groups
        if (el.type === 'character') return false;
        
        // Skip textGroup elements - they're now represented as typed groups
        if (el.type === 'textGroup') return false;
        
        // Include elements that are in default groups or not in any typed group
        const group = groups.find(g => g.elementIds.includes(el.id));
        return !group || group.isDefaultGroup;
      })
      .forEach(element => {
        tracks.push({
          id: element.id,
          type: 'element',
          name: element.name,
          item: element,
          animations: element.animations,
          isSelected: false, // Selection temporarily disabled
          depth: 0
        });
      });

    return tracks;
  };

  const hierarchicalTracks = createHierarchicalTracks();

  return (
    <footer className={`border-t border-gray-200 bg-white transition-all duration-200 ${
      isCollapsed 
        ? 'h-8 absolute bottom-0 left-0 right-0 z-50' 
        : 'h-60 relative'
    }`}>
      {/* Controls */}
      <div className="h-8 border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={onPlayPause}
            className="w-20 h-6 flex items-center justify-center bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            {timeState.isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={onStop}
            className="w-20 h-6 flex items-center justify-center bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors"
          >
            Stop
          </button>
          <div className="text-sm font-mono text-gray-700 w-32">
            {formatTime(timeState.elapsedTime)}
          </div>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center justify-center w-6 h-6 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded transition-colors"
          title={isCollapsed ? 'Expand Timeline' : 'Collapse Timeline'}
        >
          {isCollapsed ? (
            <span className="text-sm">▲</span>
          ) : (
            <span className="text-sm">▼</span>
          )}
        </button>
      </div>

      {/* Scrollable timeline container (ruler + tracks) - only visible when not collapsed */}
      {!isCollapsed && (
        <div className="h-[calc(100%-32px)] overflow-y-auto">
          <div
            className="relative w-max"
            style={{ width: `${timelineState.scale * 120 + 128}px` }} // 128 = w-32 name column
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {/* Ruler (scrolls with timeline) */}
            <div className="h-6 relative border-b border-gray-200">
              <div className="absolute top-0 left-32 h-full w-full" style={{ transform: `translateX(-${scrollLeft}px)` }}>
                {Array.from({ length: 121 }).map((_, i) => {
                  const isMajor = i % 5 === 0;
                  return (
                    <div
                      key={i}
                      className="absolute h-full border-l border-gray-200"
                      style={{ left: `${i * timelineState.scale}px`, width: 0 }}
                    >
                      {isMajor && (
                        <div className="absolute top-0 text-[10px] text-gray-500 font-mono translate-x-[-50%]">
                          {formatTime(i)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Hierarchical Tracks */}
            {hierarchicalTracks.map((track) => (
              <TimelineTrack
                key={track.id}
                element={track.item}
                trackType={track.type}
                scale={timelineState.scale}
                currentTime={timeState.elapsedTime}
                isSelected={track.isSelected}
                onAnimationChange={track.type === 'group' && onGroupAnimationChange 
                  ? onGroupAnimationChange 
                  : onAnimationChange
                }
                isGroup={track.isGroup}
                isExpanded={track.isExpanded}
                isChild={track.isChild}
                depth={track.depth}
                customName={track.name}
                onToggleExpansion={track.type === 'group' ? () => toggleElementExpansion(track.id) : undefined}
                onGroupSelect={() => {
                  // Group selection temporarily disabled
                }}
              />
            ))}
            
            {hierarchicalTracks.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No elements or groups with animations to display
              </div>
            )}
          </div>
        </div>
      )}
    </footer>
  );
} 