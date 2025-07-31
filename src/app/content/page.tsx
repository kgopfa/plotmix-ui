'use client';

import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { navigation } from '@/data/shared-navigation';

export default function ContentPage() {
  return (
    <>
      <NavigationSidebar navigation={navigation} />
      
      {/* Main content area - responsive layout */}
      <main className="min-h-screen bg-gray-50 pt-16 lg:pt-0 lg:pl-20 lg:pr-[calc(100vw/7)]">
        <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] lg:min-h-screen">
          <div className="text-center space-y-4 sm:space-y-6 p-4 sm:p-6 lg:p-8 w-full max-w-2xl mx-auto">
            <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 mx-auto bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-xl shadow-indigo-500/30">
              <svg className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="space-y-2 sm:space-y-3">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Welcome to PlotMix</h1>
              <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-md mx-auto px-4 sm:px-0">
                Your AI-powered content creation and management platform. Start creating amazing content today.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 px-4 sm:px-0">
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg shadow-lg shadow-indigo-500/30 hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 text-sm sm:text-base">
                Create New Content
              </button>
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200 text-sm sm:text-base">
                Browse Templates
              </button>
            </div>
          </div>
        </div>
      </main>
      
      <ContentSidebar />
    </>
  );
}
