'use client';

import { useParams, useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { ContentSidebar } from '@/components/content/content-sidebar';
import { Link2, Pencil, UserPlus, BookOpen, CheckCircle2 } from 'lucide-react';
import React from 'react';
import { apiClient } from '@/lib/api-client';
import { ProjectCanvasPreview } from '@/components/player/project-canvas-preview';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { navigation } from '@/data/shared-navigation';
import { useContent } from '@/hooks/use-content';
import PlaybackControls from '@/components/player/playback-controls';
import { useAuth } from '@/lib/auth-context';

export default function ContentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const contentId = params.contentId as string;
  const { content, isLoading, error } = useContent(contentId);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Main content area - responsive layout */}
      <main className="relative min-h-screen bg-zinc-100 2xl:pt-10 xl:pt-0 xl:pl-20 xl:pr-[calc(100vw/4)] 2xl:pr-[calc(100vw/7)]">
        <div className="flex flex-row items-center px-10 xl:h-30 2xl:h-36">
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
                <h2 className="text-3xl font-bold text-gray-900 xl:text-2xl 2xl:text-3xl">{content.title}</h2>
                <div className="flex flex-row items-center gap-x-2 2xl:mt-2">
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

          <div className="flex flex-row items-center gap-x-4 ml-auto">
            <div className="flex flex-row h-10 rounded-lg border-2 border-indigo-200 bg-white">
              <button
                type="button"
                onClick={() => console.log('Self Check clicked')}
                className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <CheckCircle2 strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
                Self Assessment
              </button>
              <div className="w-0.5 bg-indigo-200" />
              <button
                type="button"
                onClick={() => console.log('Theory & Sources clicked')}
                className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <BookOpen strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
                Theory & Sources
              </button>
            </div>
            <div className="flex flex-row h-10 rounded-lg border-2 border-indigo-200 bg-white">
              <button
                type="button"
                className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700  hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <UserPlus strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
                Share
              </button>
              <div className="w-0.5 bg-indigo-200" />
              <button
                type="button"
                className="inline-flex items-center gap-x-2 px-5 py-2.5 text-sm font-semibold text-gray-700  hover:bg-indigo-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <Link2 strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 size-5" />
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-center xl:mt-0 2xl:mt-20 min-h-screen">
          <div className="w-full flex flex-col max-w-2xl xl:max-w-3xl 2xl:max-w-7xl mx-auto">
            <div className="p-0.5 bg-gradient-to-r from-indigo-500 to-purple-600">
              <div className="relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center">
                <ProjectCanvasPreview projectId={contentId} />
              </div>
            </div>
          </div>
        </div>

        {/* Playback controls - fixed on the left, to the right of the navigation panel */}
        <div className="fixed top-1/2 -translate-y-1/2 left-4 xl:left-[calc(5rem+0.75rem)] z-40">
          <PlaybackControls />
        </div>

        {/* Open in Designer button - fixed on the right, to the left of the sidebar */}
        {/* Only show for authenticated users */}
        {isAuthenticated && (
          <div className="fixed top-1/2 -translate-y-1/2 right-4 xl:right-[calc(100vw/4+0.75rem)] 2xl:right-[calc(100vw/7+0.75rem)] z-40">
            <button
              onClick={() => setShowConfirm(true)}
              className="inline-flex items-center gap-x-2 p-5 xl:rounded-xl 2xl:rounded-2xl text-white bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all duration-200 transform hover:scale-105"
            >
              <Pencil strokeWidth={2.5} aria-hidden="true" className="-ml-0.5 xl:size-4 2xl:size-5" />
              {/* <span className="hidden sm:block font-bold xl:text-sm 2xl:text-base">Open in Designer</span> */}
            </button>
          </div>
        )}

        <ConfirmModal
          open={showConfirm}
          title="Open in Designer"
          description={(
            <div className="space-y-2">
              <p>Opening the editor separates the editing workflow from the chat conversation.</p>
            </div>
          )}
          confirmLabel="Continue to Designer"
          cancelLabel="Cancel"
          variant="default"
          align="content"
          onCancel={() => setShowConfirm(false)}
          onConfirm={async () => {
            try {
              // Optionally, we could set source to NATIVE here without disassociating
              await apiClient.post(`/api/projects/${contentId}/convert-to-native`);
            } catch (e) {
              // non-blocking
            } finally {
              router.push(`/designer/${contentId}`);
            }
          }}
        />
      </main>

      <ContentSidebar conversationId={content?.conversationId || ''} />
    </>
  );
} 