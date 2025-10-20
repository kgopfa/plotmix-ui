import { Play, Pause, Square } from "lucide-react";
import { useTimelineStoreV2 } from "@/stores/use-timeline-store-v2";

export default function PlaybackControls() {
  const isPlaying = useTimelineStoreV2((state) => state.playback.isPlaying);
  const currentTime = useTimelineStoreV2((state) => state.playback.currentTime);
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
    <div className="inline-flex flex-col px-4 py-5 2xl:px-5 2xl:py-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl">
      <div className="flex justify-center">
        <button
          onClick={handlePlayPause}
          className="text-white transition-all duration-200 mr-0.5 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? (
            <Pause fill="white" className="xl:size-4 2xl:size-5" color="white" />
          ) : (
            <Play fill="white" className="xl:size-4 2xl:size-5" color="white" />
          )}
        </button>
      </div>
      <div className="w-full h-px my-4" />
      <div className="text-xs 2xl:text-sm ml-0.5 font-bold text-white text-center whitespace-nowrap tabular-nums">
        {formatTime(currentTime)}
      </div>
      <div className="w-full h-px my-4" />
      <div className="flex justify-center">
        <button
          onClick={handleStop}
          className="text-white transition-all duration-200 mr-0.5 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          aria-label="Stop"
        >
          <Square className="xl:size-4 2xl:size-5" />
        </button>
      </div>
    </div>
  )
}
