'use client';

import React from 'react';
import { useTimelinePlayback } from '@/stores/use-timeline-store';

export function PlaybackControls() {
  const { playback, play, pause, stop, setPlaybackSpeed } = useTimelinePlayback();

  return (
    <div className="flex items-center gap-3 w-full">
      <button
        className="px-2 py-1 rounded bg-gray-900 text-white text-sm"
        onClick={play}
      >
        Play
      </button>
      <button
        className="px-2 py-1 rounded bg-gray-100 text-gray-900 text-sm"
        onClick={pause}
      >
        Pause
      </button>
      <button
        className="px-2 py-1 rounded bg-gray-100 text-gray-900 text-sm"
        onClick={stop}
      >
        Stop
      </button>
      <div className="ml-auto flex items-center gap-2 text-xs text-gray-600">
        <span>{playback.currentTime.toFixed(2)}s / {playback.totalDuration.toFixed(2)}s</span>
        <select
          className="border rounded px-1 py-0.5"
          value={playback.playbackSpeed}
          onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
        >
          {[0.5, 1, 1.5, 2].map(s => (
            <option key={s} value={s}>{s}x</option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default PlaybackControls;


