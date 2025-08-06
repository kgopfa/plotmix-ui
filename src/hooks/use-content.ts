import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ChatResponse } from '@/types/project-generation';

interface UseContentReturn {
  content: ChatResponse | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContent(contentId: string): UseContentReturn {
  const [content, setContent] = useState<ChatResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    if (!contentId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<ChatResponse>(`/api/content/${contentId}`);
      setContent(response);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch content';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, [contentId]);

  return {
    content,
    isLoading,
    error,
    refetch: fetchContent
  };
} 