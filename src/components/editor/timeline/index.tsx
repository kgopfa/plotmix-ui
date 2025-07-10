import { useRef, useState, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Monitor } from 'lucide-react';
import { TimelineTrack } from '@/components/editor/timeline/timeline-track';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { usePanelState } from '@/stores/use-ui-store';
import { useShallow } from 'zustand/react/shallow';

interface TimelineProps {
  canvasZoom: number;
  onCanvasZoom: (zoom: number) => void;
}

export function Timeline({ canvasZoom, onCanvasZoom }: TimelineProps) {
  // Get data directly from stores
  const elements = useCanvasElements().filter(el => !el.isAnimationPath);
  const groups = useCanvasGroups();

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

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());

  // Zoom mode: 'time' or 'view'
  const [zoomMode, setZoomMode] = useState<'time' | 'view'>('view');

  // Slider value derived from mode
  const sliderValue = zoomMode === 'time' ? timelineUI.scale : canvasZoom * 100;

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

    // Add typed groups (text, custom, polygon) - exclude animation path groups
    groups
      .filter(group => !group.isDefaultGroup && !group.isAnimationPath)
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

        // For custom groups, add element children if group is expanded (polygon groups are not expandable)
        if (group.type === 'custom' && expandedElements.has(group.id)) {
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

        // textGroup elements that aren't in typed groups should be shown
        if (el.type === 'textGroup') {
          const group = groups.find(g => g.elementIds.includes(el.id));
          return !group || group.isDefaultGroup;
        }

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
  }, [elements, groups, expandedElements]);

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
      className={`mr-2 mb-2 bg-white rounded-lg border border-gray-200 shadow-lg ${isTimelineCollapsed
        ? 'h-18'
        : 'h-full flex flex-col'
        }`}
    >
      {/* Controls */}
      <div className="h-18 border-b border-gray-200 flex items-center px-4 justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={handlePlayPause}
            className="h-12 w-12 flex items-center justify-center bg-fuchsia-500 text-white rounded-full shadow-lg shadow-fuchsia-200 transition-all duration-200 cursor-pointer hover:scale-110"
          >
            {playback.isPlaying ? <Pause size={24} fill="currentColor" strokeWidth={0} /> : <Play size={24} fill="currentColor" strokeWidth={0} />}
          </button>
          <button
            onClick={handleStop}
            className="h-12 w-12 flex items-center justify-center bg-transparent cursor-pointer transition-all duration-200 hover:scale-110"
          >
            <RotateCcw size={26} stroke="#dd7be0" strokeWidth={2} />
          </button>
          <div className="text-sm font-mono text-gray-700 w-32">
            {formatTime(playback.currentTime)}
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Zoom Mode Buttons */}
          <div className="flex gap-1 overflow-hidden">
            <button
              className={`px-2 text-xs w-18 h-8 rounded-md flex flex-row items-center justify-center cursor-pointer text-gray-600 ${zoomMode === 'time' ? 'bg-zinc-200' : 'bg-transparent'}`}
              onClick={() => setZoomMode('time')}
            >
              <Clock size={18} />
              <span className="font-medium ml-1 text-xs">Time</span>
            </button>
            <button
              className={`px-2 text-xs w-18 h-8 rounded-md flex flex-row items-center justify-center cursor-pointer text-blue-600 ${zoomMode === 'view' ? 'bg-blue-200' : 'bg-transparent'}`}
              onClick={() => setZoomMode('view')}
            >
              <Monitor size={18} />
              <span className="font-medium ml-1 text-xs">View</span>
            </button>
          </div>

          {/* Zoom Slider */}
          <input
            type="range"
            min={zoomMode === 'time' ? 20 : 10}
            max={zoomMode === 'time' ? 400 : 500}
            step={zoomMode === 'time' ? 10 : 10}
            value={sliderValue}
            onChange={e => {
              const val = Number(e.target.value);
              if (zoomMode === 'time') {
                setScale(val);
              } else {
                onCanvasZoom(val / 100);
              }
            }}
            className="h-2 w-32 cursor-pointer appearance-none bg-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-300 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-400 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-blue-400 [&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:cursor-pointer"
            title="Zoom"
          />

        </div>
      </div>

      {/* Scrollable timeline container (ruler + tracks) - only visible when not collapsed */}
      <div className={`flex-1 overflow-y-auto transition-all duration-600 ease-in-out ${
        isTimelineCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-full'
      }`}>
          <div
            className="relative w-max"
            style={{ width: `${timelineUI.scale * 120 + 128}px` }} // 128 = w-32 name column
            ref={scrollContainerRef}
            onScroll={handleScroll}
          >
            {/* Ruler (scrolls with timeline) */}
            <div className={`h-6 relative border-b border-gray-200 transition-all duration-300 ease-in-out ${
              isTimelineCollapsed ? 'opacity-0 scale-y-0' : 'opacity-100 scale-y-100'
            }`}>
              <div className="absolute top-0 left-32 h-full w-full" style={{ transform: `translateX(-${scrollLeft}px)` }}>
                {rulerTicks.map((tick) => (
                  <div
                    key={tick.index}
                    className="absolute h-full border-l border-gray-200"
                    style={{ left: `${tick.left}px`, width: 0 }}
                  >
                    {tick.isMajor && (
                      <div className="absolute top-0 text-[10px] text-gray-500 font-mono translate-x-[-50%]">
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
                key={track.id}
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
    </div>
  );
} 