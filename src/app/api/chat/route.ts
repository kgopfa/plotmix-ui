import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChatRequest, ChatResponse } from '@/types/chat';

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: ChatRequest = await request.json();
    const { prompt, attachments, options } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // TODO: Integrate with actual AI service/backend
    // For now, we'll simulate the response
    
    // Generate a unique content ID
    const contentId = `content-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate AI processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Create mock response data
    const response: ChatResponse = {
      contentId,
      title: `Generated content for: ${prompt.substring(0, 50)}...`,
      description: `This content was generated based on your prompt: "${prompt}"`,
      videoUrl: '/demo/coding.avif', // Mock video URL
      transcript: [
        {
          id: '1',
          timestamp: '00:00',
          text: 'Introduction to the generated content'
        },
        {
          id: '2',
          timestamp: '00:15',
          text: 'Main content explanation'
        },
        {
          id: '3',
          timestamp: '00:30',
          text: 'Conclusion and next steps'
        }
      ],
      chatHistory: [
        {
          id: '1',
          message: prompt,
          isUser: true,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          message: `I've generated content based on your request: "${prompt}". The content includes a video explanation and interactive elements that you can explore. You can continue our conversation in the chat sidebar or open the content in the editor to make modifications.`,
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ],
      projectData: {
        version: '2.0',
        metadata: {
          name: `Generated Project - ${prompt.substring(0, 30)}`,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          description: `Project generated from prompt: ${prompt}`,
          author: session.user?.name || 'Unknown',
          tags: ['generated', 'ai-created']
        },
        scenes: [
          {
            id: 'scene-1',
            name: 'Main Scene',
            canvas: {
              elements: [],
              groups: [],
              dimensions: { width: 1920, height: 1080 },
              canvasSize: { currentSizeId: 'hd' }
            },
            timeline: {
              scale: 1,
              duration: 5000,
              currentTime: 0,
              animationStates: {}
            },
            ui: {
              zoom: 1,
              selectedElements: [],
              selectedGroups: [],
              panelState: {
                leftPanelVisible: true,
                rightPanelVisible: true,
                leftPanelWidth: 280,
                rightPanelWidth: 320,
                timelineHeight: 200,
                isTimelineCollapsed: false
              },
              toolState: {
                activeTool: 'select',
                isPathMode: false,
                showPaths: false
              }
            }
          }
        ],
        activeSceneId: 'scene-1'
      },
      createdAt: new Date().toISOString(),
      author: session.user?.name || 'Unknown'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 