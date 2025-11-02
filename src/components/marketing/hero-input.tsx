'use client';

export function HeroInput({ query, setQuery }: { query: string; setQuery: (query: string) => void }) {

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // Navigate to chat with the query pre-filled
      window.location.href = `/chat?q=${encodeURIComponent(query)}`;
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="bg-white border border-gray-300 rounded-xl flex items-center gap-3 p-4">
        <textarea
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Ask anything you want to learn..."
          rows={4}
          className="flex-1 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-700 placeholder-gray-500 text-base leading-relaxed font-normal"
        />
      </div>
    </form>
  );
}
