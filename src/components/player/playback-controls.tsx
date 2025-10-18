import { Play } from "lucide-react";

export default function PlaybackControls() {
  return (
    <div>
      <div aria-hidden="true" className="rounded-xl">
        <div className="xl:mt-3 2xl:mt-6 hidden grid-cols-1 sm:grid">
          <div className="flex items-center gap-x-2 w-full">
            <div className="flex items-center gap-x-1 bg-gradient-to-r from-purple-600 to-purple-700 rounded-full p-3 shadow-md hover:scale-105 active:scale-95 transition">
              <Play fill="white" className="size-6" color="white" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
