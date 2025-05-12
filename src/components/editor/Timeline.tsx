import { useRef, useState } from 'react';
import { TimelineTrack } from '@/components/timeline/TimelineTrack';
import { AnimatedCanvasElement } from '@/types/canvas';
import { TimelineState } from '@/lib/types';
import { TimeManagerState } from '@/lib/TimeManager';

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
    <footer className="h-60 border-t border-gray-200 bg-white">
      {/* Controls */}
      <div className="h-8 border-b border-gray-200 flex items-center px-4">
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
      </div>

      {/* Scrollable timeline container (ruler + tracks) */}
      <div className="h-[calc(100%-56px)] overflow-y-auto">
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
    </footer>
  );
} 