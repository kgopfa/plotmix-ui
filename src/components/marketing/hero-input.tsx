'use client';

import { ArrowUp } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export function HeroInput({ query, setQuery }: { query: string; setQuery: (query: string) => void }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Wait for auth to load
    if (authLoading) return;

    if (!isAuthenticated) {
      // Store the prompt in sessionStorage for retrieval after login
      sessionStorage.setItem('plotmix-pending-prompt', query.trim());
      // Redirect to login page
      router.push('/login');
    } else {
      // User is authenticated, go directly to chat with the prompt
      router.push(`/chat?q=${encodeURIComponent(query.trim())}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-xl flex items-end gap-3 p-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything you want to learn..."
          rows={4}
          className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-700 placeholder-gray-500 text-base leading-relaxed font-normal"
        />
        {query.trim() && (
          <button
            type="submit"
            className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 flex items-center justify-center shadow-lg"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        )}
      </div>
    </form>
  );
}
