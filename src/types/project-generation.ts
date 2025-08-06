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

export interface ChatResponse {
  version: string;
  projectId: string;
  conversationId: string;
  userId: string;
  messageCount: number;
  canvasGenerated: boolean;
  totalSteps: number;
}

export interface FollowUpChatRequest {
  contentId: string;
  message: string;
}

export interface FollowUpChatResponse {
  message: ChatMessage;
  updatedChatHistory: ChatMessage[];
} 