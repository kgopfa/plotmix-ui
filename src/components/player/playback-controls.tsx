import { Play, Pause, Square } from 'lucide-react';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';

export default function PlaybackControls() {
  const isPlaying = useTimelineStoreV2((state) => state.playback.isPlaying);
  const totalPlayTime = useTimelineStoreV2((state) => state.playback.totalPlayTime);
  const play = useTimelineStoreV2((state) => state.play);
  const pause = useTimelineStoreV2((state) => state.pause);
  const stop = useTimelineStoreV2((state) => state.stop);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  const handleStop = () => {
    stop();
  };

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="inline-flex items-center gap-6 px-5 py-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl text-white *:shrink-0">
      <button
        onClick={handlePlayPause}
        className="transition-all duration-200 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? (
          <Pause fill="white" className="size-5 sm:size-4" color="white" />
        ) : (
          <Play fill="white" className="size-5 sm:size-4" color="white" />
        )}
      </button>
      <span className="text-sm sm:text-xs font-semibold tabular-nums">{formatTime(totalPlayTime)}</span>
      <button
        onClick={handleStop}
        className="transition-all duration-200 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Stop"
      >
        <Square className="size-5 sm:size-4" color="white" />
      </button>
    </div>
  )
}
