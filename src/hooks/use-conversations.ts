import { useCallback, useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';

interface ConversationListItem {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId: string | null;
  project?: {
    id: string;
    title: string | null;
    name: string;
  } | null;
  _count?: {
    messages: number;
  };
  messages?: Array<{
    createdAt: string;
  }>; // last message as first (desc)
}

interface ConversationsResponse {
  success: boolean;
  message: string;
  data: ConversationListItem[];
}

export function useConversations(limit: number = 20) {
  const [conversations, setConversations] = useState<ConversationListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  const fetchPage = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ConversationsResponse>(`/api/conversations?page=${pageToFetch}&limit=${limit}`);
      const items = res.data || [];
      setConversations(items);
      
      // Calculate total pages based on the number of items returned
      // If we got a full page, assume there might be more
      if (items.length === limit) {
        // If we got a full page, there might be more pages, but we don't know the exact total
        setTotalPages(pageToFetch + 1);
      } else {
        setTotalPages(pageToFetch);
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

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

  return { conversations, isLoading, error, refetch, currentPage, totalPages, goToPage };
}


