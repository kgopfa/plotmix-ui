'use client';

interface MarketingSuggestion {
  id: string;
  title: string;
  prompt: string;
}

const suggestions: MarketingSuggestion[] = [
  {
    id: '1',
    title: 'Explain quantum computing basics',
    prompt: 'Explain quantum computing basics in simple terms',
  },
  {
    id: '2',
    title: 'How does blockchain work?',
    prompt: 'How does blockchain work?',
  },
  {
    id: '3',
    title: 'What is machine learning?',
    prompt: 'What is machine learning and how does it work?',
  },
  {
    id: '4',
    title: 'Explain photosynthesis',
    prompt: 'Explain photosynthesis step by step',
  },
];

interface MarketingSuggestionsProps {
  onSuggestionClick: (suggestion: MarketingSuggestion) => void;
}

export function MarketingSuggestions({ onSuggestionClick }: MarketingSuggestionsProps) {
  return (
    <div className="mt-12">
      <div className="flex flex-wrap justify-center gap-3">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion)}
            className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:border-indigo-500 hover:text-indigo-600 hover:bg-indigo-50 transition-all duration-200"
          >
            {suggestion.title}
          </button>
        ))}
      </div>
    </div>
  );
}

export { type MarketingSuggestion };

