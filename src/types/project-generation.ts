export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
}

export interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
}

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
  url?: string;
}

export interface ChatOptions {
  webSearch?: boolean;
  audio?: boolean;
  music?: boolean;
}

export interface ChatRequest {
  prompt: string;
  attachments?: ChatAttachment[];
  options?: ChatOptions;
}

export interface ProjectGenerationResponse {
  success: boolean;
  message: string;
  data: {
    project: {
      id: string;
      name: string;
      createdAt: string;
      updatedAt: string;
      userId: string;
      title: string | null;
      description: string | null;
      source: string | null;
      mainState: any;
      version: string;
      features: Record<string, unknown>;
    };
    conversationId: string;
    user: {
      id: string;
      name: string;
      email: string;
    };
  };
}

export interface FollowUpChatRequest {
  conversationId: string;
  message: string;
}

export interface FollowUpChatResponse {
  message: ChatMessage;
  updatedChatHistory: ChatMessage[];
} 