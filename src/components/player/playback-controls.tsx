import { Play, Pause } from "lucide-react";
import { useTimelineStoreV2 } from "@/stores/use-timeline-store-v2";

export default function PlaybackControls() {
  const isPlaying = useTimelineStoreV2((state) => state.playback.isPlaying);
  const play = useTimelineStoreV2((state) => state.play);
  const pause = useTimelineStoreV2((state) => state.pause);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  };

  return (
    <div>
      <button
        onClick={handlePlayPause}
        className="flex rounded-full items-center justify-center w-12 h-12 mt-4 bg-gradient-to-r from-purple-600 to-purple-700 shadow-md hover:scale-105 transition-transform cursor-pointer"
        aria-label={isPlaying ? "Pause" : "Play"}
      >
        {isPlaying ? (
          <Pause fill="white" className="size-6" color="white" />
        ) : (
          <Play fill="white" className="size-6" color="white" />
        )}
      </button>
    </div>
  )
}
