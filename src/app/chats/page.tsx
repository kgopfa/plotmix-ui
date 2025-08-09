'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';
import { useConversations } from '@/hooks/use-conversations';
import { ChatCard } from '@/components/chat/chat-card';
import { LogIn, Palette, Sparkles } from 'lucide-react';
import QuickActionButtons from '@/components/shared/quick-action-buttons';
import { useAuth } from '@/lib/auth-context';
import { SearchBar } from '@/components/shared/search-bar';
import React from 'react';
import { getSession } from 'next-auth/react';
import { apiClient } from '@/lib/api-client';

export default function ChatsPage() {
  const router = useRouter();
  const { conversations, isLoading, error, refetch, loadNext, hasMore } = useConversations(20);
  const { isAuthenticated, loading } = useAuth();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const selectedIds = React.useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const anySelected = selectedIds.length > 0;

  const handleDelete = async (conversationId: string, projectId: string | null) => {
    const confirmed = window.confirm('Delete this conversation and its associated project? This cannot be undone.');
    if (!confirmed) return;
    try {
      setDeletingId(conversationId);
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const session = await getSession();
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if ((session as any)?.accessToken) {
        headers['Authorization'] = `Bearer ${(session as any).accessToken as string}`;
      }

      if (projectId) {
        await fetch(`${baseUrl}/api/projects/${projectId}`, { method: 'DELETE', headers });
      } else {
        await fetch(`${baseUrl}/api/conversations/${conversationId}`, { method: 'DELETE', headers });
      }

      await refetch();
    } catch (err) {
      console.error('Failed to delete', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20 min-h-screen flex flex-col overflow-y-auto">
        {/* Header with actions */}
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <SearchBar placeholder="Search your chats..." />
          <div className="ml-auto flex items-center gap-x-4">
            {anySelected && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm(`Delete ${selectedIds.length} selected chats? This cannot be undone.`);
                  if (!confirmed) return;
                  await apiClient.post(`/api/conversations/batch/delete`, { ids: selectedIds });
                  setSelected({});
                  await refetch();
                }}
                className="inline-flex items-center gap-x-2 px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-600 text-white hover:bg-red-700"
              >
                Delete Selected
              </button>
            )}
            {isAuthenticated ? (
              <QuickActionButtons secondary="chat" />
            ) : (
              <Link href="/login" className="flex items-center justify-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white w-24 py-2 rounded-lg text-xs font-semibold">
                <LogIn className="size-4 -ml-1" />
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="flex-1 bg-white">
          {(loading || isLoading) && (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {!loading && !isLoading && (
            <div className="py-10">
              <div className="flex justify-center">
                <div className="w-full max-w-7xl mx-auto">
                  <div className="mb-6 flex items-center justify-between">
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900">Your chats</h1>
                      <p className="text-sm text-gray-600">Browse your conversations. Click to open the related content.</p>
                    </div>
                    {anySelected && (
                      <div className="flex flex-row items-center">
                        <span className="text-sm font-medium text-indigo-500 border border-indigo-200 rounded-lg px-3 py-1.5 mr-4">{selectedIds.length} chats selected</span>
                        <button
                          type="button"
                          onClick={() => setSelected({})}
                          className="text-sm font-medium px-3 py-1.5 mr-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                  )}

                  {conversations.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-y-4 border border-dashed border-gray-300 rounded-2xl p-10">
                      <p className="text-gray-600 text-sm">No chats yet.</p>
                      <Link href="/chat" className="inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                        <Sparkles className="size-4" /> Start a new chat
                      </Link>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-11rem)] overflow-y-auto pr-2 mb-20">
                      {conversations.map((c, idx) => {
                        const title = c.project?.title || c.project?.name || 'Untitled';
                        const messageCount = c._count?.messages;
                        const lastMessageAt = c.messages && c.messages.length > 0 ? c.messages[0].createdAt : null;
                        const open = () => {
                          const projectId = c.project?.id || c.projectId;
                          if (projectId) router.push(`/content/${projectId}`);
                        };
                        const projectId = c.project?.id || c.projectId || null;
                        return (
                          <ChatCard
                            key={c.id}
                            title={title}
                            lastMessageAt={lastMessageAt}
                            messageCount={messageCount}
                            onClick={open}
                            onDelete={() => handleDelete(c.id, projectId)}
                            isDeleting={deletingId === c.id}
                            selectable
                            selected={!!selected[c.id]}
                            onToggleSelect={(checked) => setSelected((prev) => ({ ...prev, [c.id]: checked }))}
                          />
                        );
                      })}
                      {hasMore && (
                        <div className="flex justify-center py-2">
                          <button
                            type="button"
                            onClick={() => loadNext()}
                            className="text-sm font-medium text-purple-700 hover:text-purple-800 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50"
                            disabled={isLoading}
                          >
                            {isLoading ? 'Loading…' : 'View more'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}


