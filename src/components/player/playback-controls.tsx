import { Play } from "lucide-react";

export default function PlaybackControls() {
  return (
    <div>
      <div aria-hidden="true" className="flex rounded-full items-center justify-center w-12 h-12 mt-4 bg-gradient-to-r from-purple-600 to-purple-700 shadow-md hover:scale-105">
        <Play fill="white" className="size-6" color="white" />
      </div>
    </div>
  )
}
