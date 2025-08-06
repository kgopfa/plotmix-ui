# Chat Flow Implementation

## Overview

This document outlines the implementation of the chat flow in PlotMix AI, which enables users to generate content through AI-powered conversations and continue those conversations in the content sidebar.

## Architecture

### 1. User Input Flow (`/chat` page)

**Components:**
- `PromptInput` - Handles user input with attachments and options
- `SuggestionsSection` - Provides predefined prompt suggestions
- `useChat` hook - Manages chat state and API interactions

**Flow:**
1. User enters a prompt (with optional attachments and configuration options)
2. Frontend calls `/api/projects/generate` endpoint with the request
3. Backend processes the request and returns content data
4. Frontend navigates to `/content/[contentId]` with the generated content

### 2. Content Display (`/content/[contentId]` page)

**Components:**
- Main content area with video player and metadata
- `ContentSidebar` - Contains chat and transcript tabs
- `useContent` hook - Fetches and manages content data

**Flow:**
1. Page loads with content ID from URL
2. `useContent` hook fetches content data from `/api/content/[contentId]`
3. Content is displayed with video, transcript, and initial chat history

### 3. Follow-up Chat (Content Sidebar)

**Components:**
- Chat tab in `ContentSidebar`
- `useChat` hook for follow-up messages
- Real-time chat history updates

**Flow:**
1. User types follow-up message in chat input
2. Message is sent to `/api/chat/followup` endpoint
3. AI response is received and added to chat history
4. Chat interface updates with new messages

## API Endpoints

### POST `/api/projects/generate`
Handles initial chat requests and content generation.

**Request:**
```typescript
{
  prompt: string;
  attachments?: ChatAttachment[];
  options?: ChatOptions;
}
```

**Response:**
```typescript
{
  contentId: string;
  title: string;
  description: string;
  videoUrl?: string;
  transcript?: TranscriptSegment[];
  chatHistory: ChatMessage[];
  projectData?: ProjectData;
  createdAt: string;
  author: string;
}
```

### POST `/api/chat/followup`
Handles follow-up chat messages in content sidebar.

**Request:**
```typescript
{
  contentId: string;
  message: string;
}
```

**Response:**
```typescript
{
  message: ChatMessage;
  updatedChatHistory: ChatMessage[];
}
```

### GET `/api/content/[contentId]`
Fetches content data by ID.

**Response:**
```typescript
ChatResponse // Same as chat endpoint response
```

## Data Types

### ChatMessage
```typescript
{
  id: string;
  message: string;
  isUser: boolean;
  timestamp: string;
}
```

### ChatAttachment
```typescript
{
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
  url?: string;
}
```

### ChatOptions
```typescript
{
  webSearch?: boolean;
  audio?: boolean;
  music?: boolean;
}
```

## Hooks

### useChat()
Manages chat state and API interactions.

**Methods:**
- `submitChat(prompt, attachments?, options?)` - Submit initial chat
- `submitFollowUp(contentId, message)` - Submit follow-up message
- `clearError()` - Clear error state

**State:**
- `isLoading` - Loading state
- `error` - Error message

### useContent(contentId)
Manages content data fetching and state.

**Methods:**
- `refetch()` - Refetch content data

**State:**
- `content` - Content data
- `isLoading` - Loading state
- `error` - Error message

## Implementation Notes

### Current State
- ✅ API routes implemented with mock data
- ✅ Frontend components updated to use new hooks
- ✅ Chat flow working end-to-end
- ✅ Error handling and loading states
- ✅ TypeScript types defined

### TODO
- 🔄 Integrate with actual AI backend service
- 🔄 Implement database storage for content and chat history
- 🔄 Add real-time chat updates (WebSocket)
- 🔄 Implement file upload for attachments
- 🔄 Add authentication checks for content access

### Backend Integration
The frontend is now configured to send requests to the correct backend endpoints:

1. ✅ `/api/projects/generate` - Initial chat requests (configured)
2. 🔄 `/api/chat/followup` - Follow-up messages (needs backend endpoint)
3. 🔄 `/api/content/[contentId]` - Content fetching (needs backend endpoint)
4. 🔄 Implement proper error handling for AI service failures

## Testing

To test the chat flow:

1. Navigate to `/chat`
2. Enter a prompt and submit
3. Should navigate to `/content/[contentId]` with generated content
4. Use the chat sidebar to send follow-up messages
5. Verify chat history updates correctly

## Error Handling

- Network errors are caught and displayed to user
- Loading states prevent multiple submissions
- Graceful fallbacks for missing content/video
- Type-safe error messages 