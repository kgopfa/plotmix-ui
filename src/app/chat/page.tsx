'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SuggestionsSection } from '@/components/chat/suggestions-section';
import { PromptInput } from '@/components/chat/prompt-input';
import { navigation } from '@/data/shared-navigation';
import { suggestions, type Suggestion } from '@/data/chat-suggestions';
import { LogIn } from 'lucide-react';
import QuickActionButtons from '@/components/shared/quick-action-buttons';
import AppHeader from '@/components/shared/app-header';
import { useAuth } from '@/lib/auth-context';
import { useProjectGeneration } from '@/hooks/use-project-generation';
import { ChatAttachment, ChatOptions } from '@/types/project-generation';

const UNAUTHENTICATED_CHAT_KEY = 'plotmix-unauthenticated-chat-project-id';
const PENDING_PROMPT_KEY = 'plotmix-pending-prompt';

export default function ChatPage() {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [options, _] = useState<ChatOptions>({});
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { submitChat, isLoading, error } = useProjectGeneration();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [existingProjectId, setExistingProjectId] = useState<string | null>(null);
  const promptInitialized = useRef(false);
  const [showMvpNotice, setShowMvpNotice] = useState(false);
  const [isNoticeDismissed, setIsNoticeDismissed] = useState(false);

  // Check if MVP notice was previously dismissed
  useEffect(() => {
    const mvpNoticeDismissed = localStorage.getItem('plotmix-mvp-notice-dismissed');
    if (mvpNoticeDismissed) {
      setIsNoticeDismissed(true);
    } else {
      // Show notice after a short delay
      const timer = setTimeout(() => setShowMvpNotice(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleDismissMvpNotice = () => {
    setShowMvpNotice(false);
    setIsNoticeDismissed(true);
    localStorage.setItem('plotmix-mvp-notice-dismissed', 'true');
  };

  const handleOpenMvpNotice = () => {
    setShowMvpNotice(true);
    setIsNoticeDismissed(false);
    localStorage.removeItem('plotmix-mvp-notice-dismissed');
  };

  // Check if unauthenticated user already has a chat
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      const storedProjectId = localStorage.getItem(UNAUTHENTICATED_CHAT_KEY);
      if (storedProjectId) {
        setExistingProjectId(storedProjectId);
      }
    } else if (isAuthenticated) {
      // Clear the stored project ID when user logs in
      localStorage.removeItem(UNAUTHENTICATED_CHAT_KEY);
      setExistingProjectId(null);
    }
  }, [isAuthenticated, authLoading]);

  // Load prompt from query parameter or sessionStorage (after login)
  useEffect(() => {
    // Only initialize once
    if (promptInitialized.current) return;

    // Wait for auth to finish loading
    if (authLoading) return;

    // First check query parameter
    const queryParam = searchParams.get('q');
    if (queryParam) {
      const decodedPrompt = decodeURIComponent(queryParam);
      setPrompt(decodedPrompt);
      promptInitialized.current = true;
      // Clean up the URL after a short delay
      setTimeout(() => {
        router.replace('/chat', { scroll: false });
      }, 100);
      return;
    }

    // Then check sessionStorage for pending prompt (after login)
    // Only check if user is authenticated (they just logged in)
    if (isAuthenticated) {
      const pendingPrompt = sessionStorage.getItem(PENDING_PROMPT_KEY);
      if (pendingPrompt) {
        setPrompt(pendingPrompt);
        sessionStorage.removeItem(PENDING_PROMPT_KEY);
        promptInitialized.current = true;
      }
    }
  }, [searchParams, router, isAuthenticated, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() || isLoading) return;

    // Check if the prompt matches Binary Search
    const binarySearchSuggestion = suggestions.find(s => s.id === '3');
    const isBinarySearch = binarySearchSuggestion && prompt.trim() === binarySearchSuggestion.prompt.trim();
    
    if (!isBinarySearch) {
      // Show MVP notice popup instead of error
      setShowMvpNotice(true);
      setIsNoticeDismissed(false);
      return;
    }
    
    // Hide MVP notice if Binary Search is submitted
    setShowMvpNotice(false);
    
    // Prevent unauthenticated users from creating multiple chats
    if (!isAuthenticated && existingProjectId) {
      router.push(`/content/${existingProjectId}`);
      return;
    }
    
    try {
      const response = await submitChat(prompt, attachments, options);
      if (response && response.success) {
        const projectId = response.data.project.id;
        
        // Store project ID for unauthenticated users
        if (!isAuthenticated) {
          localStorage.setItem(UNAUTHENTICATED_CHAT_KEY, projectId);
        }
        
        // Navigate to the content page with the generated project
        router.push(`/content/${projectId}`);
      }
    } catch (err) {
      console.error('Failed to submit chat:', err);
    }
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setPrompt(suggestion.prompt);
    // Hide MVP notice when selecting a suggestion
    if (suggestion.id === '3') {
      setShowMvpNotice(false);
    }
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
              <QuickActionButtons secondary="chat" />
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
            {!isAuthenticated && existingProjectId ? (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <p className="text-sm text-blue-800 mb-3">
                  You've already created a chat. You can view it below or sign in to create unlimited chats.
                </p>
                <Link 
                  href={`/content/${existingProjectId}`}
                  className="inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200"
                >
                  View My Chat
                </Link>
              </div>
            ) : (
              <SuggestionsSection 
                suggestions={suggestions} 
                onSuggestionClick={handleSuggestionClick} 
              />
            )}

            {/* MVP Notice Popup - Fixed position on the right */}
            {showMvpNotice && (
              <div 
                className="fixed right-6 top-24 z-50 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 p-6"
                style={{
                  animation: 'slideInFromRight 0.3s ease-out'
                }}
              >
                {/* Header with icon and close button */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 leading-tight">
                        Early Access Preview
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={handleDismissMvpNotice}
                    className="flex-shrink-0 p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:scale-110 active:scale-95"
                    aria-label="Close"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                {/* Content */}
                <p className="text-sm text-gray-700 leading-relaxed">
                  Thank you for trying Plotmix! I'm excited to share the platform with you. For now, unfortunately only the <strong className="font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Binary Search</strong> example is available to give a glimpse of what the platform will be able to do in the future. I'm working hard to expand our capabilities, and I'd love to hear your feedback as we continue building. Cheers!
                </p>
              </div>
            )}

            {/* Floating Info Button - Shows when notice is dismissed */}
            {!showMvpNotice && isNoticeDismissed && (
              <button
                onClick={handleOpenMvpNotice}
                className="fixed right-6 top-24 z-50 w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-500 rounded-full flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 transition-all duration-200 hover:scale-110 active:scale-95 group"
                aria-label="Show MVP information"
                style={{
                  animation: 'slideInFromRight 0.3s ease-out'
                }}
              >
                <svg className="w-6 h-6 text-white transition-transform duration-200 group-hover:scale-110" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            )}

            <PromptInput
              prompt={prompt}
              attachments={attachments}
              onPromptChange={setPrompt}
              onAttachmentsChange={setAttachments}
              onSubmit={handleSubmit}
              onKeyDown={handleKeyDown}
              isLoading={isLoading}
              disabled={!isAuthenticated && !!existingProjectId}
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
