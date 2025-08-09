'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from '@/components/projects/project-card';
import { LogIn, Palette, Sparkles } from 'lucide-react';
import QuickActionButtons from '@/components/shared/quick-action-buttons';
import { useAuth } from '@/lib/auth-context';
import { SearchBar } from '@/components/shared/search-bar';
import { apiClient } from '@/lib/api-client';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, error, loadNext, hasMore, refetch } = useProjects(20, 'NATIVE');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const selectedIds = React.useMemo(() => Object.keys(selected).filter((id) => selected[id]), [selected]);
  const anySelected = selectedIds.length > 0;
  const { isAuthenticated, loading } = useAuth();
  const createAndOpenDesigner = React.useCallback(async () => {
    try {
      const res = await apiClient.post<{ success: boolean; data?: { project?: { id: string } } }>(`/api/projects`);
      const projectId = res?.data?.project?.id;
      if (projectId) {
        router.push(`/designer/${projectId}`);
      }
    } catch (e) {
      console.error('Failed to create project', e);
    }
  }, [router]);

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20 min-h-screen flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-40 flex h-16 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
          <SearchBar placeholder="Search your projects..." />
          <div className="ml-auto flex items-center gap-x-4">
            {anySelected && (
              <button
                type="button"
                onClick={async () => {
                  const confirmed = window.confirm(`Delete ${selectedIds.length} selected projects? This cannot be undone.`);
                  if (!confirmed) return;
                  await apiClient.post(`/api/projects/batch/delete`, { ids: selectedIds });
                  setDeletingId(null);
                  setSelected({});
                  await refetch();
                }}
                className="inline-flex items-center gap-x-2 px-3 py-2 text-xs font-bold rounded-lg border border-red-200 bg-red-600 text-white hover:bg-red-700"
              >
                Delete Selected
              </button>
            )}
            {isAuthenticated ? (
              <QuickActionButtons secondary="project" />
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
                      <h1 className="text-xl font-semibold text-gray-900">Your projects</h1>
                      <p className="text-sm text-gray-600">Click a project to open it in the editor.</p>
                    </div>
                    {anySelected && (
                      <div className="flex flex-row items-center">
                        <span className="text-sm font-medium text-indigo-500 border border-indigo-200 rounded-lg px-3 py-1.5 mr-4">{selectedIds.length} projects selected</span>
                        <button
                          type="button"
                          onClick={() => setSelected({})}
                          className="text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 mr-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>

                  {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">{error}</div>
                  )}

                  {projects.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-y-4 border border-dashed border-gray-300 rounded-2xl p-10">
                      <p className="text-gray-600 text-sm">No projects yet.</p>
                      <button onClick={createAndOpenDesigner} className="inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold">
                        <Sparkles className="size-4" /> Create a project
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3 max-h-[calc(100vh-11rem)] overflow-y-auto pr-2 mb-20">
                      {projects.map((p) => (
                        <ProjectCard
                          key={p.id}
                          title={p.title || p.name}
                          lastUpdatedAt={p.updatedAt}
                          version={p.version}
                          onClick={() => router.push(`/designer/${p.id}`)}
                          showConversationWarning={!!p.conversation}
                          onDelete={async () => {
                            const confirmed = window.confirm('Delete this project? This cannot be undone.');
                            if (!confirmed) return;
                            setDeletingId(p.id);
                            await apiClient.delete(`/api/projects/${p.id}`);
                            setDeletingId(null);
                            await refetch();
                          }}
                          isDeleting={deletingId === p.id}
                          selectable
                          selected={!!selected[p.id]}
                          onToggleSelect={(checked) => setSelected((prev) => ({ ...prev, [p.id]: checked }))}
                        />
                      ))}
                      {hasMore && (
                        <div className="flex justify-center py-2">
                          <button
                            type="button"
                            onClick={() => loadNext()}
                            className="text-sm font-medium text-purple-700 hover:text-purple-800 px-3 py-1.5 border border-purple-200 rounded-lg hover:bg-purple-50"
                          >
                            View more
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


