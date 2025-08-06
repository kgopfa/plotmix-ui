import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { ProjectData } from '@/types/project';

interface ConversationData {
  id: string;
  title: string;
  userId: string;
  projectId: string;
  createdAt: string;
  updatedAt: string;
  messages: MessageData[];
}

interface MessageData {
  id: string;
  content: string;
  messageType: string;
  conversationId: string;
  createdAt: string;
  attachments?: any;
  options?: any;
  metadata?: any;
}

interface ProjectDataResponse {
  id: string;
  name: string;
  description?: string;
  userId: string;
  mainState: ProjectData;
  features: any;
  createdAt: string;
  updatedAt: string;
}

interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
}

interface ContentData {
  // Project info for display
  title: string;
  author: string;
  createdAt: string;
  // Conversation data
  conversation: ConversationData;
  // Transcript data (for future implementation)
  transcript?: TranscriptSegment[];
}

interface UseContentReturn {
  content: ContentData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useContent(contentId: string): UseContentReturn {
  const [content, setContent] = useState<ContentData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchContent = async () => {
    if (!contentId) return;

    console.log('🔍 Fetching content for contentId:', contentId);
    setIsLoading(true);
    setError(null);

    try {
      // Fetch project data
      console.log('📡 Fetching project data from:', `/api/projects/${contentId}`);
      const projectResponse = await apiClient.get<ProjectDataResponse>(`/api/projects/${contentId}`);
      console.log('✅ Project data received:', projectResponse);
      
      // Fetch conversation for this project
      console.log('📡 Fetching conversations from:', `/api/conversations?projectId=${contentId}`);
      const conversationsResponse = await apiClient.get<{ data: ConversationData[] }>(`/api/conversations?projectId=${contentId}`);
      console.log('✅ Conversations data received:', conversationsResponse);
      
      if (!conversationsResponse.data || conversationsResponse.data.length === 0) {
        throw new Error('No conversation found for this project');
      }

      const conversation = conversationsResponse.data[0]; // Use the first conversation
      console.log('✅ Using conversation:', conversation);

      // Get user info for author (we'll need to fetch this separately or get it from the project)
      // For now, we'll use the userId as author, but ideally we'd fetch user details
      const author = projectResponse.userId; // TODO: Fetch actual user name

      const contentData = {
        title: projectResponse.name,
        author,
        createdAt: projectResponse.createdAt,
        conversation,
        transcript: [] // Empty for now, will be implemented later
      };
      
      console.log('✅ Setting content data:', contentData);
      setContent(contentData);
    } catch (err) {
      console.error('❌ Error fetching content:', err);
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