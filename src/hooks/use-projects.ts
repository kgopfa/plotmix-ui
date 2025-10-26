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
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchPage = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const src = source ? `&source=${encodeURIComponent(source)}` : '';
      const res = await apiClient.get<ProjectsResponse>(`/api/projects?page=${pageToFetch}&limit=${limit}${src}`);
      const items = res.data?.projects ?? [];
      setProjects(items);
      
      // Calculate total pages based on the number of items returned
      // If we got a full page, there might be more pages
      if (items.length === limit) {
        setTotalPages(pageToFetch + 1);
      } else {
        setTotalPages(pageToFetch);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch projects';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit, source]);

  const refetch = useCallback(async () => {
    setCurrentPage(1);
    await fetchPage(1);
  }, [fetchPage]);

  const goToPage = useCallback(async (page: number) => {
    if (page < 1 || page === currentPage) return;
    setCurrentPage(page);
    await fetchPage(page);
  }, [fetchPage, currentPage]);

  useEffect(() => {
    fetchPage(1);
  }, [fetchPage]);

  return { projects, isLoading, error, refetch, currentPage, totalPages, goToPage };
}


