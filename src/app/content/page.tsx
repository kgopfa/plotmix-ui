'use client';

import Link from 'next/link';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { Link2, Pencil, UserPlus } from 'lucide-react';
import { navigation } from '@/data/shared-navigation';

export default function ContentPage() {
  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Main content area - responsive layout */}
      <main className="relative min-h-screen bg-white pt-16 lg:pt-0 lg:pl-20 lg:pr-[calc(100vw/7)]">
        <div className="flex flex-row items-center px-10 h-36">
          <div className="flex flex-col gap-y-2">
            <h2 className="text-3xl font-bold text-gray-900">Sharded counter design guide</h2>

            <div className="flex flex-row items-center gap-x-2">
              <p className="text-gray-500 text-sm font-medium">John Doe</p>
              <div className="w-1 h-1 bg-gray-400 rounded-full" />
              <p className="text-gray-500 text-sm font-medium">2 hours ago</p>
            </div>
          </div>

          <div className="flex flex-row h-10 rounded-lg border border-gray-200 ml-auto">
            <button
              type="button"
              className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700  hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <UserPlus strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
              Share
            </button>
            <div className="w-px bg-gray-200" />
            <button
              type="button"
              className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700  hover:bg-gray-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              <Link2 strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
            </button>

          </div>
        </div>
        <div className="flex justify-center mt-14 min-h-screen">
          <div className="w-full max-w-7xl mx-auto">

            {/* Video Player Container */}
            <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-lg">
              <video
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                poster="/placeholder-video.jpg"
              >
                <source src="/sample-video.mp4" type="video/mp4" />
                <source src="/sample-video.webm" type="video/webm" />
                <track
                  kind="subtitles"
                  src="/sample-video.vtt"
                  srcLang="en"
                  label="English"
                />
                Your browser does not support the video tag.
              </video>

              {/* Video Player Overlay for better UX */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
            </div>
          </div>
        </div>
        
        {/* Edit Button - Bottom Right of Main */}
        <div className="fixed bottom-8 right-[calc(100vw/7+2rem)] z-50">
          <Link
            href="/editor"
            className="inline-flex items-center gap-x-2 p-5 rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform hover:scale-105"
          >
            <Pencil strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
            <span className="hidden sm:block font-bold">Edit Content</span>
          </Link>
        </div>
      </main>

      <ContentSidebar />
    </>
  );
}
