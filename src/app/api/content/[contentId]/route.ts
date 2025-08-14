import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ChatResponse } from '@/types/project-generation';

export async function GET(
  request: NextRequest,
  { params }: { params: { contentId: string } }
) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { contentId } = params;

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    // TODO: Integrate with actual database/backend
    // For now, we'll simulate the response
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 300));

    // Mock content data - in real implementation this would come from database
    const content: ChatResponse = {
      contentId,
      title: `Generated content for content ID: ${contentId}`,
      description: `This is a mock content description for ${contentId}. In a real implementation, this would be fetched from the database based on the content ID.`,
      videoUrl: '/demo/coding.avif',
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
          message: 'Original prompt that generated this content',
          isUser: true,
          timestamp: new Date().toISOString()
        },
        {
          id: '2',
          message: 'AI response explaining the generated content',
          isUser: false,
          timestamp: new Date().toISOString()
        }
      ],
      projectData: {
        version: '2.0',
        metadata: {
          name: `Generated Project - ${contentId}`,
          createdAt: new Date().toISOString(),
          modifiedAt: new Date().toISOString(),
          description: `Project generated for content ID: ${contentId}`,
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
              canvasSize: { currentSizeId: 'fhd' }
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
                isTimelineCollapsed: true
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

    return NextResponse.json(content);
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 