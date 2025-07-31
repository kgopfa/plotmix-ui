'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { UserMessage } from '@/components/content/user-message';
import { LLMMessage } from '@/components/content/llm-message';
import { CircleFadingPlus } from 'lucide-react';

import { navigation } from '@/data/shared-navigation';
import { shardedCounterChat } from '@/data/chat-messages';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('Chat');
  const [message, setMessage] = useState('');


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    // Handle message submission here
    console.log('Submitting message:', { message });

    // For now, just clear the message
    setMessage('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-1/7 lg:flex-col">
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
                {/* Scrollable messages area */}
                <div className="flex-1 overflow-y-auto">
                  <div className="space-y-4">
                    {shardedCounterChat.map((message) => (
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
                    ))}
                  </div>
                </div>

                {/* Sticky input area at bottom */}
                <div className="sticky bottom-0 bg-transparent">
                  <div className="max-w-md mx-auto">
                    <div className="mb-4 bg-white border border-gray-200 rounded-4xl shadow-xl">
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
                            disabled={!message.trim()}
                            className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor" className="w-4 h-4 text-white">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
            {activeTab === 'Sections' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sections</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:00</span>
                      <span className="text-gray-700">Introduction to Sharded Counters</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:15</span>
                      <span className="text-gray-700">Why Use Sharding for High Traffic</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:32</span>
                      <span className="text-gray-700">Basic Sharded Counter Architecture</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:48</span>
                      <span className="text-gray-700">Shard Selection Strategies</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:05</span>
                      <span className="text-gray-700">Consistency Trade-offs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:22</span>
                      <span className="text-gray-700">Performance Benchmarks</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:38</span>
                      <span className="text-gray-700">Implementation Example</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:55</span>
                      <span className="text-gray-700">Best Practices & Conclusion</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="lg:pl-20 lg:pr-1/7">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Content</h1>
          </div>
        </div>
      </main>
    </>
  );
}
