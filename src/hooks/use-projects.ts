import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

export interface ProjectListItem {
  id: string;
  name: string;
  title?: string | null;
  version: string;
  createdAt: string;
  updatedAt: string;
  source?: 'NATIVE' | 'GENERATED' | string;
  conversation?: { id: string } | null;
}

interface ProjectsResponse {
  success: boolean;
  message: string;
  data: { projects: ProjectListItem[] };
}

export function useProjects(limit: number = 20, source?: string) {
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const src = source ? `&source=${encodeURIComponent(source)}` : '';
      const res = await apiClient.get<ProjectsResponse>(`/api/projects?page=${pageToFetch}&limit=${limit}${src}`);
      const items = res.data?.projects ?? [];
      setProjects(prev => (pageToFetch === 1 ? items : [...prev, ...items]));
      setHasMore(items.length === limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, source]);

  const refetch = useCallback(async () => {
    setPage(1);
    await fetchPage(1);
  }, [fetchPage]);

  const loadNext = useCallback(async () => {
    if (isLoading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchPage(nextPage);
  }, [fetchPage, hasMore, isLoading, page]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return { projects, isLoading, error, refetch, loadNext, hasMore };
}


