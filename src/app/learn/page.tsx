'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SuggestionsSection } from '@/components/learn/suggestions-section';
import { PromptInput } from '@/components/learn/prompt-input';
import { navigation } from '@/data/shared-navigation';
import { suggestions, type Suggestion } from '@/data/learn-suggestions';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
}

export default function LearnPage() {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Create a new chat session and navigate to it
    const chatId = `chat-${Date.now()}`;
    window.location.href = `/learn/${chatId}`;
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
            />

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
