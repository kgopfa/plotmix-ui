import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';

interface ConversationMessage {
  id: string;
  content: string;
  messageType: 'user' | 'llm';
  metadata: any;
  attachments: any[] | null;
  options: any;
  createdAt: string;
  conversationId: string;
  userId: string;
}

interface ConversationData {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  projectId: string;
  messages: ConversationMessage[];
}

interface ConversationResponse {
  success: boolean;
  message: string;
  data: ConversationData;
}

interface UseConversationReturn {
  conversation: ConversationData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useConversation(conversationId: string): UseConversationReturn {
  const [conversation, setConversation] = useState<ConversationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConversation = async () => {
    if (!conversationId) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('📡 Fetching conversation:', conversationId);
      const response = await apiClient.get<ConversationResponse>(`/api/conversations/${conversationId}`);
      console.log('✅ Conversation data received:', response);
      setConversation(response.data);
    } catch (err) {
      console.error('❌ Error fetching conversation:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch conversation';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchConversation();
  }, [conversationId]);

  return {
    conversation,
    isLoading,
    error,
    refetch: fetchConversation
  };
}
