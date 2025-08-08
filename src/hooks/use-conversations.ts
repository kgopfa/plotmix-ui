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
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const fetchPage = useCallback(async (pageToFetch: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiClient.get<ConversationsResponse>(`/api/conversations?page=${pageToFetch}&limit=${limit}`);
      const items = res.data || [];
      setConversations(prev => (pageToFetch === 1 ? items : [...prev, ...items]));
      setHasMore(items.length === limit);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch conversations';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [limit]);

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

  return { conversations, isLoading, error, refetch, loadNext, hasMore };
}


