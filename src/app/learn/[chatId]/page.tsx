'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SuggestionsSection } from '@/components/learn/suggestions-section';
import { PromptInput } from '@/components/learn/prompt-input';
import { navigation } from '@/data/shared-navigation';
import { suggestions, type Suggestion } from '@/data/learn-suggestions';
import Link from 'next/link';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
}

export default function ChatPage() {
  const params = useParams();
  const chatId = params.chatId as string;
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    
    // Simulate content generation
    setTimeout(() => {
      setIsGenerating(false);
      // Navigate to content page with generated content ID
      window.location.href = `/content/${chatId}-${Date.now()}`;
    }, 2000);
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setPrompt(suggestion.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <style jsx>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            
            @keyframes scroll-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            
            .animate-scroll-left {
              animation: scroll-left 40s linear infinite;
              will-change: transform;
            }
            
            .animate-scroll-right {
              animation: scroll-right 40s linear infinite;
              will-change: transform;
            }
            
            .animate-scroll-left:hover,
            .animate-scroll-right:hover {
              animation-play-state: paused;
            }
          `}</style>
          
          {/* Main Content */}
          <div className="flex flex-col max-w-4xl w-full px-6 py-8">
            {/* Chat Header */}
            <div className="mb-8 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">Chat Session</h1>
              <p className="text-gray-600">Chat ID: {chatId}</p>
            </div>

            <SuggestionsSection 
              suggestions={suggestions} 
              onSuggestionClick={handleSuggestionClick} 
            />

            <PromptInput
              prompt={prompt}
              attachments={attachments}
              onPromptChange={setPrompt}
              onAttachmentsChange={setAttachments}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
            />

            {/* Generate Content Button */}
            {prompt.trim() && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleSubmit}
                  disabled={isGenerating}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Generating Content...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generate Content
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">
                  Press ⌘+Enter to generate content
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
} 