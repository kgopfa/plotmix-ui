'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { Link2, Pencil, UserPlus } from 'lucide-react';
import React from 'react';
import { apiClient } from '@/lib/api-client';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { navigation } from '@/data/shared-navigation';
import { useContent } from '@/hooks/use-content';

export default function ContentDetailPage() {
  const params = useParams();
  const contentId = params.contentId as string;
  const { content, isLoading, error } = useContent(contentId);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const router = useParams();

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Main content area - responsive layout */}
      <main className="relative min-h-screen bg-white pt-16 lg:pt-0 lg:pl-20 lg:pr-[calc(100vw/7)]">
        <div className="flex flex-row items-center px-10 h-36">
          <div className="flex flex-col gap-y-2">
            {isLoading ? (
              <div className="animate-pulse">
                <div className="h-8 bg-gray-200 rounded w-96 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-48"></div>
              </div>
            ) : error ? (
              <div className="text-red-600">
                <h2 className="text-3xl font-bold">Error loading content</h2>
                <p className="text-sm">{error}</p>
              </div>
            ) : content ? (
              <>
                <h2 className="text-3xl font-bold text-gray-900">{content.title}</h2>
                <div className="flex flex-row items-center gap-x-2">
                  <p className="text-gray-500 text-sm font-medium">{content.author}</p>
                  <div className="w-1 h-1 bg-gray-400 rounded-full" />
                  <p className="text-gray-500 text-sm font-medium">
                    {new Date(content.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-gray-600">
                <h2 className="text-3xl font-bold">Content not found</h2>
              </div>
            )}
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
          <button
            onClick={() => setShowConfirm(true)}
            className="inline-flex items-center gap-x-2 p-5 rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform hover:scale-105"
          >
            <Pencil strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
            <span className="hidden sm:block font-bold">Open in Editor</span>
          </button>
        </div>

        <ConfirmModal
          open={showConfirm}
          title="Open in Editor"
          description={(
            <div className="space-y-2">
              <p>This project was created from a chat. Opening it in the editor separates the editing workflow from the chat conversation.</p>
              <p className="text-gray-700">Changes made in the editor won’t be reflected back on the conversation page.</p>
            </div>
          )}
          confirmLabel="Continue to Editor"
          cancelLabel="Cancel"
          align="content"
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            try {
              // Optionally, we could set source to NATIVE here without disassociating
              await apiClient.post(`/api/projects/${contentId}/convert-to-native`);
            } catch (e) {
              // non-blocking
            } finally {
              window.location.href = `/editor/${contentId}`;
            }
          }}
        />
      </main>

      <ContentSidebar conversationId={content?.conversationId || ''} />
    </>
  );
} 