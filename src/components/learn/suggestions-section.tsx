'use client';

import { Sparkles } from 'lucide-react';

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'design' | 'algorithm' | 'system';
}

interface SuggestionsSectionProps {
  suggestions: Suggestion[];
  onSuggestionClick: (suggestion: Suggestion) => void;
}

export const SuggestionsSection: React.FC<SuggestionsSectionProps> = ({ 
  suggestions, 
  onSuggestionClick 
}) => {
  return (
    <div className="mb-20">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl ml-2 font-semibold text-gray-900">
          Quick Suggestions
        </h2>
      </div>
      
      <div className="relative overflow-hidden">
        {/* Top row - scrolls left */}
        <div className="flex gap-4 animate-scroll-left">
          {[...suggestions, ...suggestions, ...suggestions].map((suggestion, index) => (
            <button
              key={`top-${suggestion.id}-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="group relative bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 flex-shrink-0 w-64"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
                  {suggestion.title}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
            </button>
          ))}
        </div>
        
        {/* Bottom row - scrolls right */}
        <div className="flex gap-4 mt-4 animate-scroll-right">
          {[...suggestions, ...suggestions, ...suggestions].map((suggestion, index) => (
            <button
              key={`bottom-${suggestion.id}-${index}`}
              onClick={() => onSuggestionClick(suggestion)}
              className="group relative bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-105 active:scale-95 flex-shrink-0 w-64"
            >
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 text-sm leading-tight mb-2">
                  {suggestion.title}
                </h3>
                <p className="text-gray-600 text-xs leading-relaxed">
                  {suggestion.description}
                </p>
              </div>
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <Sparkles className="w-4 h-4 text-indigo-500" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}; 