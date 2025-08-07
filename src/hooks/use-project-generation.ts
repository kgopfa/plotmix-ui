import { useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { 
  ChatRequest, 
  ProjectGenerationResponse, 
  FollowUpChatRequest, 
  FollowUpChatResponse,
  ChatMessage,
  ChatAttachment,
  ChatOptions 
} from '@/types/project-generation';

interface UseProjectGenerationReturn {
  // State
  isLoading: boolean;
  error: string | null;
  
  // Actions
  submitChat: (prompt: string, attachments?: ChatAttachment[], options?: ChatOptions) => Promise<ProjectGenerationResponse | null>;
  submitFollowUp: (conversationId: string, message: string) => Promise<ChatMessage | null>;
  
  // Utilities
  clearError: () => void;
}

export function useProjectGeneration(): UseProjectGenerationReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submitChat = async (
    prompt: string, 
    attachments?: ChatAttachment[], 
    options?: ChatOptions
  ): Promise<ProjectGenerationResponse | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: ChatRequest = {
        prompt,
        attachments,
        options
      };

      const response = await apiClient.post<ProjectGenerationResponse>('/api/projects/generate', request);
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
    conversationId: string, 
    message: string
  ): Promise<ChatMessage | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const request: FollowUpChatRequest = {
        conversationId,
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