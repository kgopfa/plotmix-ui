'use client';

import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { navigation } from '@/data/shared-navigation';
import { PlaybackCanvas } from '@/components/content/playback-canvas';

export default function ContentPage() {
  return (
    <>
      <NavigationSidebar navigation={navigation} />
      
      {/* Main content area - responsive layout */}
      <main className="min-h-screen bg-gray-50 pt-16 lg:pt-0 lg:pl-20 lg:pr-[calc(100vw/7)]">
        <div className="flex flex-col h-full">
          {/* Playback Canvas - Takes remaining space */}
          <div className="flex-1 relative">
            <PlaybackCanvas />
          </div>
        </div>
      </main>
      
      <ContentSidebar />
    </>
  );
}
