import { useRef, useState, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, ChevronUp, ChevronDown } from 'lucide-react';
import { TimelineTrack } from '@/components/designer/timeline/timeline-track';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { usePanelState, useUIStore } from '@/stores/use-ui-store';
import { useShallow } from 'zustand/react/shallow';

export function Timeline() {
  // Get data directly from stores
  const elements = useCanvasElements().filter(el => !el.isAnimationPath);
  const groups = useCanvasGroups();

  // Get selection state
  const { isSelected, isGroupSelected } = useSelectionStore(
    useShallow((state) => ({
      isSelected: state.isSelected,
      isGroupSelected: state.isGroupSelected
    }))
  );

  // Get timeline state and actions
  const { playback, ui: timelineUI, getEffectiveDuration, setScale } = useTimelineStore(
    useShallow((state) => ({
      playback: state.playback,
      ui: state.ui,
      getEffectiveDuration: state.getEffectiveDuration,
      setScale: state.setScale
    }))
  );

  const { play, pause, stop, updateAnimation } = useTimelineStore(
    useShallow((state) => ({
      play: state.play,
      pause: state.pause,
      stop: state.stop,
      updateAnimation: state.updateAnimation
    }))
  );

  // Get panel state for collapse functionality
  const { isTimelineCollapsed } = usePanelState();
  const toggleTimelineCollapse = useUIStore(state => state.toggleTimelineCollapse);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  // Zoom controls moved to main navigation; timeline no longer manages zoom

  // Pre-warm animation durations for newly detected animations
  useEffect(() => {
    const allAnimations = [
      ...elements.flatMap(el => el.animations),
      ...groups.flatMap(g => g.animations)
    ];

    // Pre-warm the getEffectiveDuration cache by calling it for each animation
    // This triggers the fallback logic which initializes the cache
    allAnimations.forEach(animation => {
      getEffectiveDuration(animation.id);
    });
  }, [elements, groups, getEffectiveDuration]);

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

  // Handle play/pause toggle
  const handlePlayPause = () => {
    if (playback.isPlaying) {
      pause();
    } else {
      play();
    }
  };

  // Handle stop
  const handleStop = () => {
    stop();
  };

  // Handle animation changes (these will need to be connected to the appropriate store actions)
  const handleAnimationChange = (elementId: string, animationId: string, update: { startTime: number; duration: number }) => {
    updateAnimation(elementId, animationId, update, 'element');
  };

  const handleGroupAnimationChange = (groupId: string, animationId: string, update: { startTime: number; duration: number }) => {
    updateAnimation(groupId, animationId, update, 'group');
  };


  // Create hierarchical track structure - memoized for performance
  const hierarchicalTracks = useMemo(() => {
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
    const emitted = new Set<string>();

    // Add typed groups (text, custom, polygon) - exclude animation path groups
    groups
      .filter(group => !group.isDefaultGroup && !group.isAnimationPath)
      .forEach(group => {
        const groupIsSelected = isGroupSelected(group);

        const groupKey = `group:${group.id}`;
        if (!emitted.has(groupKey)) {
          tracks.push({
            id: group.id,
            type: 'group',
            name: group.name,
            item: group,
            animations: group.animations,
            isSelected: groupIsSelected,
            isGroup: true,
            isExpanded: expandedElements.has(group.id),
            depth: 0
          });
          emitted.add(groupKey);
        }
        
        // For custom groups, add element children if group is expanded (polygon groups are not expandable)
        if (group.type === 'custom' && expandedElements.has(group.id)) {
          const groupElements = elements.filter(el => group.elementIds.includes(el.id));

          groupElements.forEach(element => {
            const elementKey = `element:${element.id}:child:${group.id}`;
            if (!emitted.has(elementKey)) {
              tracks.push({
                id: element.id,
                type: 'element',
                name: element.name,
                item: element,
                animations: element.animations,
                isSelected: isSelected(element),
                isChild: true,
                parentGroupId: group.id,
                depth: 1
              });
              emitted.add(elementKey);
            }
          });
        }
      });

    // Add individual elements not in custom/polygon groups (excluding characters, they appear under text groups)
    elements
      .filter(el => {
        // Include elements that are in default groups or not in any typed group
        const group = groups.find(g => g.elementIds.includes(el.id));
        return !group || group.isDefaultGroup;
      })
      .forEach(element => {
        const elementKey = `element:${element.id}:root`;
        if (!emitted.has(elementKey)) {
          tracks.push({
            id: element.id,
            type: 'element',
            name: element.name,
            item: element,
            animations: element.animations,
            isSelected: isSelected(element),
            depth: 0
          });
          emitted.add(elementKey);
        }
      });

    return tracks;
  }, [elements, groups, expandedElements, isSelected, isGroupSelected]);

  // Memoize ruler ticks for performance
  const rulerTicks = useMemo(() =>
    Array.from({ length: 121 }).map((_, i) => ({
      index: i,
      isMajor: i % 5 === 0,
      left: i * timelineUI.scale,
      time: formatTime(i)
    })),
    [timelineUI.scale]
  );

  return (
    <div
      className={`mr-2 mb-2 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl overflow-hidden ${isTimelineCollapsed
        ? 'h-18'
        : 'h-full flex flex-col'
        }`}
    >
      {/* Controls */}
      <div className="h-18 border-b border-gray-200/50 flex items-center px-4 justify-between bg-white/50 backdrop-blur-sm rounded-t-2xl">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="h-12 w-12 flex items-center justify-center bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-xl shadow-lg shadow-purple-500/30 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            {playback.isPlaying ? <Pause size={24} fill="currentColor" strokeWidth={0} className="drop-shadow-sm" /> : <Play size={24} fill="currentColor" strokeWidth={0} className="drop-shadow-sm" />}
          </button>
          <button
            onClick={handleStop}
            className="h-12 w-12 flex items-center justify-center bg-white/80 backdrop-blur-sm border border-gray-200/50 rounded-xl shadow-md shadow-gray-200/30 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
          >
            <RotateCcw size={26} stroke="#dd7be0" strokeWidth={2} />
          </button>
          <div className="text-sm font-mono text-gray-700 w-32 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200/30">
            {formatTime(playback.currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom controls removed from timeline; collapse button remains */}

          {/* Timeline Collapse/Expand Button */}
          <button
            onClick={toggleTimelineCollapse}
            className="h-10 w-10 flex items-center justify-center bg-white/60 backdrop-blur-sm border border-gray-200 rounded-lg cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
            title={isTimelineCollapsed ? "Expand Timeline" : "Collapse Timeline"}
          >
            {isTimelineCollapsed ? (
              <ChevronUp size={16} stroke="#6b7280" strokeWidth={2} />
            ) : (
              <ChevronDown size={16} stroke="#6b7280" strokeWidth={2} />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable timeline container (ruler + tracks) - only visible when not collapsed */}
      <div className={`flex-1 overflow-y-auto transition-all duration-600 ease-in-out bg-white/30 backdrop-blur-sm rounded-b-2xl ${
        isTimelineCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-full'
      }`}>
          <div
            className="relative w-max"
            style={{ width: `${timelineUI.scale * 120 + 128}px` }} // 128 = w-32 name column
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {/* Ruler (scrolls with timeline) */}
            <div className={`h-6 relative border-b border-gray-200/50 transition-all duration-300 ease-in-out bg-white/50 backdrop-blur-sm ${
              isTimelineCollapsed ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'
            }`}>
              <div className="absolute top-0 left-32 h-full w-full" style={{ transform: `translateX(-${scrollLeft}px)` }}>
                {rulerTicks.map((tick) => (
                  <div
                    key={tick.index}
                    className="absolute h-full border-l border-gray-200/50"
                    style={{ left: `${tick.left}px`, width: 0 }}
                  >
                    {tick.isMajor && (
                      <div className="absolute top-0 text-[10px] text-gray-600 font-mono translate-x-[-50%] bg-white/80 backdrop-blur-sm px-1 rounded">
                        {tick.time}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Hierarchical Tracks */}
            {hierarchicalTracks.map((track) => (
              <TimelineTrack
                key={`${track.type}-${track.id}-${track.parentGroupId ?? 'root'}`}
                element={track.item}
                trackType={track.type}
                scale={timelineUI.scale}
                currentTime={playback.currentTime}
                isSelected={track.isSelected}
                onAnimationChange={track.type === 'group'
                  ? handleGroupAnimationChange
                  : handleAnimationChange
                }
                isGroup={track.isGroup}
                isExpanded={track.isExpanded}
                isChild={track.isChild}
                depth={track.depth}
                customName={track.name}
                onToggleExpansion={track.type === 'group' ? () => toggleElementExpansion(track.id) : undefined}
                onGroupSelect={(group) => {
                  const { selectGroup } = useSelectionStore.getState();
                  selectGroup(group);
                }}
              />
            ))}

            {hierarchicalTracks.length === 0 && (
              <div className="p-8 text-center text-gray-500 bg-white/40 backdrop-blur-sm rounded-lg m-4">
                No elements or groups with animations to display
              </div>
            )}
          </div>
        </div>
    </div>
  );
} 