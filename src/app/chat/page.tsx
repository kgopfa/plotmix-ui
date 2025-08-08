'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SuggestionsSection } from '@/components/chat/suggestions-section';
import { PromptInput } from '@/components/chat/prompt-input';
import { navigation } from '@/data/shared-navigation';
import { suggestions, type Suggestion } from '@/data/chat-suggestions';
import { Palette, Sparkles, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useProjectGeneration } from '@/hooks/use-project-generation';
import { ChatAttachment, ChatOptions } from '@/types/project-generation';

export default function ChatPage() {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [options, setOptions] = useState<ChatOptions>({});
  const { isAuthenticated } = useAuth();
  const { submitChat, isLoading, error } = useProjectGeneration();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;
    
    try {
      const response = await submitChat(prompt, attachments, options);
      if (response && response.success) {
        // Navigate to the content page with the generated project
        router.push(`/content/${response.data.project.id}`);
      }
    } catch (err) {
      console.error('Failed to submit chat:', err);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setPrompt(suggestion.prompt);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const handleSearch = (query: string) => {
    // Handle search functionality
    console.log('Search query:', query);
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20">
        {/* Header with search bar */}
        <div className="sticky top-0 z-40 flex flex-row h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
        
          <div className="flex flex-row items-center gap-x-4 ml-auto">
            {isAuthenticated ? (
              <>
                <button className="flex flex-row items-center gap-x-1 bg-transparent border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
                  <Palette strokeWidth={2.25} className="size-4 text-blue-500" />
                  Designer
                </button>

                <Link href="/chat" onClick={(e) => e.preventDefault()} className="flex flex-row items-center gap-x-1 bg-transparent border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200">
                  <Sparkles className="size-4 text-purple-500" />
                  New Chat
                </Link>
              </>
            ) : (
              <Link href="/login" className="flex flex-row items-center justify-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white w-24 py-2 rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                <LogIn className="size-4 -ml-1" />
                Login
              </Link>
            )}
          </div>
        </div>

        <div className="min-h-[calc(100vh-4rem)] bg-white flex items-center justify-center">
          
          {/* Main Content */}
          <div className="flex flex-col max-w-4xl w-full px-6 py-8">
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
              isLoading={isLoading}
            />

            {/* Error Display */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {/* Footer */}
            <div className="mt-6 text-center">
              <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
                <p className="text-xs text-gray-500">
                  Press ⌘+Enter to generate
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
