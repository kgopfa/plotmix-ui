'use client';

import { useState, useEffect } from 'react';
import { UserMessage } from '@/components/content/user-message';
import { LLMMessage } from '@/components/content/llm-message';
import { CircleFadingPlus } from 'lucide-react';
import { useProjectGeneration } from '@/hooks/use-project-generation';
import { useConversation } from '@/hooks/use-conversation';
import { ChatMessage } from '@/types/project-generation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export function ContentSidebar({ conversationId }: { conversationId: string }) {
  const { submitFollowUp, isLoading: isSubmitting } = useProjectGeneration();

  // Get conversation ID from content and fetch conversation
  const { conversation, isLoading: isConversationLoading } = useConversation(conversationId || '');

  const [activeTab, setActiveTab] = useState('Chat');
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

  // Dummy content data for the "Content" tab
  const synopsis = 'A concise walkthrough of the concept with a short demo to reinforce application in real contexts.';
  const metadata = {
    estimatedTime: '12 min',
    difficulty: 'Intermediate',
    tags: ['Monitoring', 'Dashboards', 'Alerts']
  };
  const learningObjectives = [
    'Explain the purpose of SLOs vs SLIs in monitoring.',
    'Configure a basic alert policy with actionable thresholds.',
    'Interpret a dashboard to identify service degradation.'
  ];
  const downloads = [
    { name: 'Slide deck (PDF)', size: '2.1 MB' },
    { name: 'Demo dataset (CSV)', size: '340 KB' },
    { name: 'Facilitator guide (DOCX)', size: '410 KB' }
  ];
  const references = [
    { title: 'Site Reliability Engineering (Google)', href: '#' },
    { title: 'Monitoring 101: Choosing SLIs', href: '#' },
    { title: 'Alerting Best Practices', href: '#' }
  ];

  // Update chat history when conversation changes
  useEffect(() => {
    if (conversation) {
      // Convert conversation messages to chat history format
      const messages = conversation.messages
        .filter(msg => msg.messageType === 'user' || msg.messageType === 'llm')
        .map(msg => ({
          id: msg.id,
          message: msg.content,
          isUser: msg.messageType === 'user',
          timestamp: msg.createdAt
        }));
      setChatHistory(messages);
    }
  }, [conversation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSubmitting) return;

    try {
      const userMessage: ChatMessage = {
        id: Date.now().toString(),
        message: message.trim(),
        isUser: true,
        timestamp: new Date().toISOString()
      };

      // Add user message to chat history immediately
      setChatHistory(prev => [...prev, userMessage]);
      setMessage('');

      // Submit follow-up message using conversation ID
      if (!conversationId) {
        console.error('No conversation ID available');
        return;
      }
      const aiResponse = await submitFollowUp(conversationId, message.trim());
      if (aiResponse) {
        setChatHistory(prev => [...prev, aiResponse]);
      }
    } catch (err) {
      console.error('Failed to submit follow-up message:', err);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="hidden xl:fixed xl:inset-y-0 xl:right-0 xl:z-50 xl:flex xl:w-1/4 2xl:w-1/7 xl:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-l border-gray-200 bg-white px-6">
        {/* Horizontal tabs */}
        <div className="sticky top-0 bg-white flex mt-2 space-x-6 p-2">
          <button
            onClick={() => setActiveTab('Chat')}
            className={classNames(
              activeTab === 'Chat'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'py-2 border-b-3 font-semibold text-sm'
            )}
          >
            Activity
          </button>
          <button
            onClick={() => setActiveTab('Sections')}
            className={classNames(
              activeTab === 'Sections'
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
              'py-2 border-b-3 font-semibold text-sm'
            )}
          >
            Content
          </button>
        </div>

        {/* Tab content */}
        <div className="flex-1 flex flex-col h-full">
          {activeTab === 'Chat' && (
            <>
              {/* Chat heading */}
              <div className="space-y-4">
                <div className="space-y-2">
                  {/* Scrollable messages area */}
                  <div className="flex-1 overflow-y-auto">
                    <div className="space-y-4">
                      {isConversationLoading ? (
                        <div className="text-center py-4">
                          <div className="text-gray-500 text-sm">Loading conversation...</div>
                        </div>
                      ) : (
                        chatHistory.map((message: ChatMessage) => (
                          message.isUser ? (
                            <UserMessage
                              key={message.id}
                              message={message.message}
                              timestamp={message.timestamp}
                            />
                          ) : (
                            <LLMMessage
                              key={message.id}
                              message={message.message}
                              timestamp={message.timestamp}
                            />
                          )
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sticky input area at bottom */}
              <div className="sticky bottom-0 bg-transparent">
                <div className="max-w-md mx-auto">
                  <div className="mb-4 bg-white border border-gray-200 rounded-xl shadow-sm">
                    <div className="p-4">
                      <div className="relative">
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder="Type your message..."
                          className="w-full min-h-[60px] p-3 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-relaxed"
                          style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                        />
                      </div>

                      {/* Bottom Controls */}
                      <div className="flex items-center justify-between pt-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 transition-colors"
                          >
                            <CircleFadingPlus className="w-6 h-6" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={handleSubmit}
                          disabled={!message.trim() || isSubmitting}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? (
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor" className="w-4 h-4 text-white">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                            </svg>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
          {activeTab === 'Sections' && (
            <div className="flex-1 overflow-y-auto pr-1">
              <div className="space-y-5 divide-y divide-gray-100">
                {/* Overview */}
                <section className="space-y-2 pt-0 first:pt-0">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Overview</div>
                  <div className="text-sm leading-relaxed text-gray-700">{synopsis}</div>
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-[11px] font-medium text-indigo-700 ring-1 ring-inset ring-indigo-700/10">{metadata.estimatedTime}</span>
                    <span className="inline-flex items-center rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">{metadata.difficulty}</span>
                    {metadata.tags.map((t) => (
                      <span key={t} className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-medium text-gray-700">{t}</span>
                    ))}
                  </div>
                </section>

                {/* Learning objectives */}
                <section className="space-y-2 pt-5">
                  <div className="flex items-center justify-between">
                    <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Learning objectives</div>
                    <button
                      type="button"
                      onClick={() => console.log('Copy objectives')}
                      className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      Copy
                    </button>
                  </div>
                  <ul className="list-disc list-inside space-y-1.5">
                    {learningObjectives.map((obj, idx) => (
                      <li key={idx} className="text-sm leading-6 text-gray-700">{obj}</li>
                    ))}
                  </ul>
                </section>

                {/* Downloads */}
                <section className="space-y-2 pt-5">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">Downloads</div>
                  <div className="space-y-2">
                    {downloads.map((file) => (
                      <div key={file.name} className="flex items-center justify-between rounded-md border border-gray-200 px-3 py-2 transition-colors hover:bg-gray-50">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-gray-900">{file.name}</span>
                          <span className="text-xs text-gray-500">{file.size}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => console.log('Download clicked', file.name)}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                        >
                          Download
                        </button>
                      </div>
                    ))}
                  </div>
                </section>

                {/* References */}
                <section className="space-y-2 pt-5 pb-6">
                  <div className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">References & Sources</div>
                  <ul className="space-y-1.5">
                    {references.map((ref) => (
                      <li key={ref.title} className="text-sm leading-6">
                        <a href={ref.href} onClick={(e) => e.preventDefault()} className="text-indigo-600 hover:text-indigo-700">
                          {ref.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 