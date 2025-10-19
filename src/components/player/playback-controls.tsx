import { Play, Pause, Square } from "lucide-react";
import { useTimelineStoreV2 } from "@/stores/use-timeline-store-v2";

export default function PlaybackControls() {
  const isPlaying = useTimelineStoreV2((state) => state.playback.isPlaying);
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

  return (
    <div className="inline-flex flex-col p-5 xl:rounded-xl 2xl:rounded-2xl bg-gradient-to-r from-indigo-500 to-purple-600 shadow-xl">
      <button
        onClick={handlePlayPause}
        className="text-white transition-all duration-200 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause fill="white" className="xl:size-4 2xl:size-5" color="white" />
        ) : (
          <Play fill="white" className="xl:size-4 2xl:size-5" color="white" />
        )}
      </button>
      <div className="w-full h-px my-4" />
      <button
        onClick={handleStop}
        className="text-white transition-all duration-200 transform hover:scale-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        aria-label="Stop"
      >
        <Square className="xl:size-4 2xl:size-5" />
      </button>
    </div>
  )
}
