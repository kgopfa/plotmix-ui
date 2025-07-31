'use client';

import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { navigation } from '@/data/shared-navigation';

export default function ContentPage() {
  return (
    <>
      <NavigationSidebar navigation={navigation} />
      <ContentSidebar />

      <main className="lg:pl-20 lg:pr-1/7">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Content</h1>
          </div>
        </div>
      </main>
    </>
  );
}
