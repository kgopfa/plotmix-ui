import { useState, useEffect } from 'react';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
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
  data: {
    conversationId: string;
    user: any;
    project: {
      id: string;
      name: string;
      title: string;
      description?: string;
      source: string;
      mainState: ProjectData;
      version: string;
      features: any;
      createdAt: string;
      updatedAt: string;
      userId: string;
      owner: {
        id: string;
        name: string;
        email: string;
        createdAt: string;
        updatedAt: string;
      };
      changes: any[];
      snapshots: any[];
      collaborators: any[];
      conversation: ConversationData;
    };
  };
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
  conversationId: string;
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
      
      // Transform the response to match ContentData interface
      const responseData = projectResponse.data;
      const project = responseData.project;

      // Initialize project store with server data and capture baseline mainState
      const projectStore = useProjectStore.getState();
      projectStore.setProjectInfo({
        projectId: project.id,
        name: project.name,
        title: project.title,
        version: project.version
      });
      projectStore.setBaseline(project.mainState as any);
      
      const transformedContent: ContentData = {
        title: project.title || project.name,
        author: project.owner.name,
        createdAt: project.createdAt,
        conversationId: project.conversation.id,
        transcript: [] // Initialize empty transcript for future implementation
      };
      
      setContent(transformedContent);
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