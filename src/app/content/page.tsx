'use client';

import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { navigation } from '@/data/shared-navigation';

export default function ContentPage() {
  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Main content area - responsive layout */}
      <main className="min-h-screen bg-white pt-16 lg:pt-0 lg:pl-20 lg:pr-[calc(100vw/7)]">
        <div className="flex items-center justify-center min-h-screen">
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
      </main>

      <ContentSidebar />
    </>
  );
}
