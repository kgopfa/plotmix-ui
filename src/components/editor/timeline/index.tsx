import { useRef, useState } from 'react';
import { TimelineTrack } from '@/components/editor/timeline/timeline-track';
import { AnimatedCanvasElement } from '@/types/canvas';
import { TimelineState } from '@/types/timeline';
import { TimeManagerState } from '@/lib/time-manager';


interface TimelineProps {
  elements: AnimatedCanvasElement[];
  timelineState: TimelineState;
  timeState: TimeManagerState;
  onPlayPause: () => void;
  onStop: () => void;
  onAnimationChange: (elementId: string, animationId: string, update: { startTime: number; duration: number }) => void;
  selectionManager: { isSelected: (element: AnimatedCanvasElement) => boolean };
}

export function Timeline({
  elements,
  timelineState,
  timeState,
  onPlayPause,
  onStop,
  onAnimationChange,
  selectionManager,
}: TimelineProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isCollapsed, setIsCollapsed] = useState(false);

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

            {/* Tracks */}
            {elements.map((element) => (
              <TimelineTrack
                key={element.id}
                element={element}
                scale={timelineState.scale}
                currentTime={timeState.elapsedTime}
                isSelected={selectionManager.isSelected(element)}
                onAnimationChange={onAnimationChange}
              />
            ))}
          </div>
        </div>
      )}
    </footer>
  );
} 