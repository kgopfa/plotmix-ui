import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  ChatRequest, 
  ChatResponse, 
  FollowUpChatRequest, 
  FollowUpChatResponse,
  ChatMessage,
  ChatAttachment,
  ChatOptions 
} from '@/types/chat';

interface UseChatReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  submitChat: (prompt: string, attachments?: ChatAttachment[], options?: ChatOptions) => Promise<ChatResponse | null>;
  submitFollowUp: (contentId: string, message: string) => Promise<ChatMessage | null>;
  
  // Utilities
  clearError: () => void;
}

export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitChat = async (
    prompt: string, 
    attachments?: ChatAttachment[], 
    options?: ChatOptions
  ): Promise<ChatResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatRequest = {
        prompt,
        attachments,
        options
      };

      const response = await apiClient.post<ChatResponse>('/api/chat', request);
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit chat';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitFollowUp = async (
    contentId: string, 
    message: string
  ): Promise<ChatMessage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: FollowUpChatRequest = {
        contentId,
        message
      };

      const response = await apiClient.post<FollowUpChatResponse>('/api/chat/followup', request);
      return response.message;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit follow-up message';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => {
    setError(null);
  };

  return {
    isLoading,
    error,
    submitChat,
    submitFollowUp,
    clearError
  };
} 