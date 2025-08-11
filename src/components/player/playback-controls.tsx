import { Play } from "lucide-react";

export default function PlaybackControls() {
  return (
    <div>
      <div aria-hidden="true" className="xl:mt-3 2xl:mt-6 xl:py-3 2xl:py-6 rounded-xl">
        <div className="overflow-hidden bg-gray-200 dark:bg-white/10">
          <div style={{ width: '37.5%' }} className="h-2 bg-gradient-to-r from-purple-500 to-purple-700" />
        </div>
        <div className="xl:mt-3 2xl:mt-6 hidden grid-cols-1 sm:grid">
          <div className="flex items-center gap-x-2 w-full">
            <div className="flex items-center gap-x-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-xl py-2 px-4 shadow-md hover:scale-105 active:scale-95 transition">
              <Play fill="white" className="size-4" color="white" />
              <span className="text-white font-semibold text-sm font-mono">Play</span>
            </div>
            <span className="ml-auto text-indigo-700 font-medium text-sm font-mono">00:00 / 02:30</span>
          </div>
        </div>
      </div>
    </div>
  )
}
