'use client';

import { useRouter } from 'next/navigation';
import React from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';
import { useProjects } from '@/hooks/use-projects';
import { ProjectCard } from '@/components/projects/project-card';
import { Sparkles } from 'lucide-react';
import QuickActionButtons from '@/components/shared/quick-action-buttons';
import { useAuth } from '@/lib/auth-context';
import { SearchBar } from '@/components/shared/search-bar';
import { apiClient } from '@/lib/api-client';
import { ConfirmModal } from '@/components/shared/confirm-modal';
import { Pagination } from '@/components/shared/pagination';

export default function ProjectsPage() {
  const router = useRouter();
  const { projects, isLoading, error, currentPage, totalPages, goToPage, refetch } = useProjects(10, 'NATIVE');
  const [selected, setSelected] = React.useState<Record<string, boolean>>({});
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [openingId, setOpeningId] = React.useState<string | null>(null);
  const [showDeleteSelectedModal, setShowDeleteSelectedModal] = React.useState(false);
  const [showDeleteProjectModal, setShowDeleteProjectModal] = React.useState(false);
  const [projectToDelete, setProjectToDelete] = React.useState<string | null>(null);
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

  const handleDeleteSelected = async () => {
    await apiClient.post(`/api/projects/batch/delete`, { ids: selectedIds });
    setDeletingId(null);
    setSelected({});
    await refetch();
    setShowDeleteSelectedModal(false);
  };

  const handleDeleteProject = async () => {
    if (!projectToDelete) return;
    setDeletingId(projectToDelete);
    await apiClient.delete(`/api/projects/${projectToDelete}`);
    setDeletingId(null);
    await refetch();
    setShowDeleteProjectModal(false);
    setProjectToDelete(null);
  };

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
                onClick={() => setShowDeleteSelectedModal(true)}
                className={`inline-flex items-center gap-x-2 h-9 px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-red-800 to-pink-800 ${openingId ? 'opacity-60 cursor-not-allowed' : 'hover:from-red-900 hover:to-pink-900'}`}
                disabled={!!openingId}
              >
                Delete Selected
              </button>
            )}
            <QuickActionButtons secondary="project" />
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
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 gap-3">
                        {projects.map((p) => (
                          <ProjectCard
                            key={p.id}
                            title={p.title || p.name}
                            lastUpdatedAt={p.updatedAt}
                            version={p.version}
                            onClick={() => {
                              if (openingId) return;
                              setOpeningId(p.id);
                              router.push(`/designer/${p.id}`);
                            }}
                            showConversationWarning={!!p.conversation}
                            onDelete={() => {
                              setProjectToDelete(p.id);
                              setShowDeleteProjectModal(true);
                            }}
                            isDeleting={deletingId === p.id}
                            selectable
                            selected={!!selected[p.id]}
                            onToggleSelect={(checked) => setSelected((prev) => ({ ...prev, [p.id]: checked }))}
                            disabled={!!openingId}
                            isOpening={openingId === p.id}
                          />
                        ))}
                      </div>
                      {totalPages > 1 && (
                        <Pagination
                          currentPage={currentPage}
                          totalPages={totalPages}
                          onPageChange={goToPage}
                          isLoading={isLoading}
                        />
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Selected Projects Modal */}
      <ConfirmModal
        open={showDeleteSelectedModal}
        title="Delete Selected Projects"
        description={`Are you sure you want to delete ${selectedIds.length} selected projects? This action cannot be undone.`}
        confirmLabel="Delete Projects"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteSelected}
        onCancel={() => setShowDeleteSelectedModal(false)}
      />

      {/* Delete Single Project Modal */}
      <ConfirmModal
        open={showDeleteProjectModal}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        confirmLabel="Delete Project"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleDeleteProject}
        onCancel={() => {
          setShowDeleteProjectModal(false);
          setProjectToDelete(null);
        }}
      />
    </>
  );
}


