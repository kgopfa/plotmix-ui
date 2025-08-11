'use client';

import React from 'react';
import { Play, Pause, RotateCcw } from 'lucide-react';
import { useTimelinePlayback } from '@/stores/use-timeline-store';

export function VerticalPlaybackControls() {
  const { playback, play, pause, stop } = useTimelinePlayback();

  return (
    <div className="flex flex-col items-center gap-3 p-2 rounded-2xl bg-white/90 backdrop-blur border border-gray-200 shadow-xl pointer-events-auto">
      <button
        type="button"
        onClick={playback.isPlaying ? pause : play}
        aria-label={playback.isPlaying ? 'Pause' : 'Play'}
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-md hover:scale-105 active:scale-95 transition"
      >
        {playback.isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
      </button>
      <button
        type="button"
        onClick={stop}
        aria-label="Stop"
        className="h-10 w-10 flex items-center justify-center rounded-xl bg-white border border-gray-200 text-gray-700 shadow hover:scale-105 active:scale-95 transition"
      >
        <RotateCcw className="w-5 h-5" />
      </button>
      <div className="text-[10px] font-mono text-gray-700 px-2 py-1 rounded bg-white/70 border border-gray-200">
        {playback.currentTime.toFixed(2)} / {playback.totalDuration.toFixed(2)}s
      </div>
    </div>
  );
}

export default VerticalPlaybackControls;


