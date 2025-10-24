import { useRef, useState, useMemo, useEffect } from 'react';
import { Play, Pause, ChevronUp, ChevronDown, Square } from 'lucide-react';
import { TimelineTrack } from '@/components/designer/timeline/timeline-track';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useCanvasElements, useCanvasGroups } from '@/stores/use-canvas-store';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';
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
  const { playback, ui: timelineUI, setScale, getTotalDuration, getTotalPlayTime } = useTimelineStoreV2(
    useShallow((state: any) => ({
      playback: state.playback,
      ui: state.ui,
      setScale: state.setScale,
      getTotalDuration: state.getTotalDuration,
      getTotalPlayTime: state.getTotalPlayTime
    }))
  );

  const { timelineAnimations } = useTimelineStoreV2();

  const { play, pause, stop, seek, updateAnimation } = useTimelineStoreV2(
    useShallow((state: any) => ({
      play: state.play,
      pause: state.pause,
      stop: state.stop,
      seek: state.seek,
      updateAnimation: state.updateAnimation
    }))
  );

  // Get panel state for collapse functionality
  const { isTimelineCollapsed } = usePanelState();
  const toggleTimelineCollapse = useUIStore(state => state.toggleTimelineCollapse);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const labelScrollContainerRef = useRef<HTMLDivElement>(null);
  const rulerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [expandedElements, setExpandedElements] = useState<Set<string>>(new Set());
  const [labelColumnWidth, setLabelColumnWidth] = useState(192); // 192px = w-48
  const [isResizingLabels, setIsResizingLabels] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const isScrollingSyncRef = useRef(false);

  // Zoom controls moved to main navigation; timeline no longer manages zoom

  // Pre-warm animation durations for newly detected animations
  // Note: This pre-warming logic is removed as the V2 timeline store handles durations differently
  // useEffect(() => {
  //   const allAnimations = timelineAnimations.flatMap(anim => anim.tracks);
  //   allAnimations.forEach(animation => {
  //     getEffectiveDuration(animation.id);
  //   });
  // }, [timelineAnimations, getEffectiveDuration]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      setScrollLeft(scrollContainerRef.current.scrollLeft);
      
      // Sync vertical scroll to labels column
      if (labelScrollContainerRef.current && !isScrollingSyncRef.current) {
        isScrollingSyncRef.current = true;
        labelScrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollTop;
        // Reset flag after scroll completes
        requestAnimationFrame(() => {
          isScrollingSyncRef.current = false;
        });
      }
    }
  };

  const handleLabelScroll = () => {
    // Sync vertical scroll from labels to content
    if (labelScrollContainerRef.current && scrollContainerRef.current && !isScrollingSyncRef.current) {
      isScrollingSyncRef.current = true;
      scrollContainerRef.current.scrollTop = labelScrollContainerRef.current.scrollTop;
      // Reset flag after scroll completes
      requestAnimationFrame(() => {
        isScrollingSyncRef.current = false;
      });
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

  // Handle label column resize
  const handleLabelResizeMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizingLabels(true);
    
    const startX = e.clientX;
    const startWidth = labelColumnWidth;

    const handleMouseMove = (e: MouseEvent) => {
      const delta = e.clientX - startX;
      const newWidth = Math.max(120, Math.min(400, startWidth + delta)); // Min 120px, max 400px
      setLabelColumnWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizingLabels(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Handle playhead dragging for seeking
  const handleRulerMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!rulerRef.current || !scrollContainerRef.current) return;
    
    e.preventDefault();
    setIsDraggingPlayhead(true);
    
    const seekToPosition = (clientX: number) => {
      if (!rulerRef.current || !scrollContainerRef.current) return;
      
      const rect = rulerRef.current.getBoundingClientRect();
      const scrollLeft = scrollContainerRef.current.scrollLeft;
      const offsetX = clientX - rect.left + scrollLeft;
      const time = offsetX / timelineUI.scale;
      const clampedTime = Math.max(0, Math.min(time, totalProjectDuration));
      
      seek(clampedTime);
    };
    
    // Seek immediately on mouse down
    seekToPosition(e.clientX);
    
    const handleMouseMove = (e: MouseEvent) => {
      seekToPosition(e.clientX);
    };
    
    const handleMouseUp = () => {
      setIsDraggingPlayhead(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
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
            animations: timelineAnimations
              .filter(anim => anim.target.type === 'group' && anim.target.id === group.id)
              .flatMap(anim => anim.tracks),
            isSelected: groupIsSelected,
            isGroup: true,
            isExpanded: expandedElements.has(group.id),
            depth: 0
          });
          emitted.add(groupKey);
        }
        
        // Mark all elements in this group as emitted in root context to prevent them appearing as standalone
        group.elementIds.forEach(elementId => {
          emitted.add(`element:${elementId}:root`);
        });
        
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
                animations: timelineAnimations
                  .filter(anim => anim.target.type === 'element' && anim.target.id === element.id)
                  .flatMap(anim => anim.tracks),
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
            animations: timelineAnimations
              .filter(anim => anim.target.type === 'element' && anim.target.id === element.id)
              .flatMap(anim => anim.tracks),
            isSelected: isSelected(element),
            depth: 0
          });
          emitted.add(elementKey);
        }
      });

    return tracks;
  }, [elements, groups, expandedElements, isSelected, isGroupSelected]);

  // Calculate total project duration for ruler
  const totalProjectDuration = getTotalDuration();
  const globalTime = playback.currentTime;
  const totalPlayTime = getTotalPlayTime();
  
  // Memoize ruler ticks for performance - now shows total project duration
  const rulerTicks = useMemo(() => {
    const duration = Math.max(totalProjectDuration, 10); // Minimum 10 seconds
    return Array.from({ length: Math.ceil(duration) + 1 }).map((_, i) => ({
      index: i,
      isMajor: i % 5 === 0,
      left: i * timelineUI.scale,
      time: formatTime(i)
    }));
  }, [timelineUI.scale, totalProjectDuration]);

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
            className="h-12 w-12 flex items-center justify-center bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl shadow-md shadow-gray-200/30 cursor-pointer transition-all duration-200 hover:scale-105 active:scale-95 hover:shadow-lg"
          >
            <Square size={24} stroke="#dd7be0" />
          </button>
          <div className="text-sm font-mono text-gray-700 w-40 bg-white/60 backdrop-blur-sm rounded-lg px-3 py-2 border border-gray-200/30">
            <div className="text-xs text-gray-500">Total: {formatTime(totalPlayTime)}</div>
            <div className="text-xs">Scene: {formatTime(globalTime)}</div>
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

      {/* Timeline Grid - Two column layout: fixed labels + scrollable content */}
      <div className={`flex-1 flex transition-all duration-600 ease-in-out bg-white/30 backdrop-blur-sm rounded-b-2xl ${
        isTimelineCollapsed ? 'opacity-0 max-h-0' : 'opacity-100 max-h-full'
      }`}>
        
        {/* Left Column - Track Labels (Fixed, Resizable) */}
        <div 
          ref={labelScrollContainerRef}
          className="flex-shrink-0 overflow-y-auto border-r border-gray-200/50 relative" 
          style={{ width: `${labelColumnWidth}px` }}
          onScroll={handleLabelScroll}
        >
          {/* Ruler placeholder */}
          <div className="h-6 border-b border-gray-200/50 bg-white/50 backdrop-blur-sm"></div>
          
          {/* Track Labels */}
          {hierarchicalTracks.map((track) => (
            <TimelineTrack
              key={`label-${track.type}-${track.id}-${track.parentGroupId || 'root'}`}
              element={track.item}
              trackType={track.type}
              scale={timelineUI.scale}
              currentTime={globalTime}
              isSelected={track.isSelected}
              animations={track.animations}
              onAnimationChange={track.type === 'group' ? handleGroupAnimationChange : handleAnimationChange}
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
              labelOnly={true}
            />
          ))}
          
          {hierarchicalTracks.length === 0 && (
            <div className="p-4 text-center text-sm text-gray-500">
              No tracks
            </div>
          )}
          
          {/* Resize Handle */}
          <div
            className={`absolute right-0 top-0 bottom-0 w-0.5 cursor-col-resize hover:bg-blue-700/50 transition-colors ${
              isResizingLabels ? 'bg-blue-700' : ''
            }`}
            onMouseDown={handleLabelResizeMouseDown}
          />
        </div>

        {/* Right Column - Track Content (Scrollable) */}
        <div 
          className="flex-1 overflow-auto"
          ref={scrollContainerRef}
          onScroll={handleScroll}
        >
          <div
            className="relative"
            style={{ width: `${timelineUI.scale * Math.max(totalProjectDuration, 10)}px`, minWidth: '100%' }}
          >
            {/* Ruler */}
            <div 
              ref={rulerRef}
              className={`h-6 relative border-b border-gray-200/50 bg-white/50 backdrop-blur-sm ${
                isDraggingPlayhead ? 'cursor-grabbing' : 'cursor-pointer'
              }`}
              onMouseDown={handleRulerMouseDown}
            >
              {rulerTicks.map((tick) => (
                <div
                  key={tick.index}
                  className="absolute h-full border-l border-gray-200/50 pointer-events-none"
                  style={{ left: `${tick.left}px`, width: 0 }}
                >
                  {tick.isMajor && (
                    <div 
                      className={`absolute top-0 text-[10px] text-gray-600 font-mono bg-white/80 backdrop-blur-sm px-1 rounded z-10 ${
                        tick.index === 0 ? 'left-0' : '-translate-x-1/2'
                      }`}
                    >
                      {tick.time}
                    </div>
                  )}
                </div>
              ))}
              
              {/* Global playhead indicator on ruler */}
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-gradient-to-b from-fuchsia-400 to-fuchsia-600 shadow-lg pointer-events-none z-20"
                style={{ left: `${globalTime * timelineUI.scale}px` }}
              >
                {/* Playhead handle */}
                <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-fuchsia-500 rounded-full shadow-lg border-2 border-white" />
              </div>
            </div>

            {/* Track Content */}
            {hierarchicalTracks.map((track) => (
              <TimelineTrack
                key={`content-${track.type}-${track.id}-${track.parentGroupId || 'root'}`}
                element={track.item}
                trackType={track.type}
                scale={timelineUI.scale}
                currentTime={globalTime}
                isSelected={track.isSelected}
                animations={track.animations}
                onAnimationChange={track.type === 'group' ? handleGroupAnimationChange : handleAnimationChange}
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
                contentOnly={true}
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
    </div>
  );
} 