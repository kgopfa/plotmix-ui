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
  // Only Binary Search (id: '3') is enabled in MVP
  const isEnabled = (suggestion: Suggestion) => suggestion.id === '3';

  const handleSuggestionClick = (suggestion: Suggestion) => {
    if (isEnabled(suggestion)) {
      onSuggestionClick(suggestion);
    }
  };

  return (
    <div className="mb-20">
      <div className="flex items-center gap-3 mb-6">
        <h2 className="text-xl ml-2 font-semibold text-gray-900">
          Quick <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">Suggestions</span>
        </h2>
      </div>
      
      {/* Slightly wider scroller than content, not full screen */}
      <div className="relative overflow-hidden -mx-4 sm:-mx-6 md:-mx-6 lg:-mx-8 px-4 sm:px-6 md:px-6 lg:px-8">
        {/* Top row - scrolls left */}
        <div className="flex gap-4 animate-scroll-left">
          {[...suggestions, ...suggestions].map((suggestion, index) => {
            const enabled = isEnabled(suggestion);
            return (
              <button
                key={`top-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={!enabled}
                className={`group relative rounded-xl p-4 text-left flex-shrink-0 w-64 transition-all duration-200 ease-out ${
                  enabled
                    ? 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg cursor-pointer'
                    : 'bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm leading-tight mb-2 ${
                    enabled ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {suggestion.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    enabled ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {suggestion.description}
                  </p>
                </div>
                {enabled ? (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-500">
                      Soon
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        
        {/* Bottom row - scrolls right */}
        <div className="flex gap-4 mt-4 animate-scroll-right">
          {[...suggestions, ...suggestions].map((suggestion, index) => {
            const enabled = isEnabled(suggestion);
            return (
              <button
                key={`bottom-${suggestion.id}-${index}`}
                onClick={() => handleSuggestionClick(suggestion)}
                disabled={!enabled}
                className={`group relative rounded-xl p-4 text-left flex-shrink-0 w-64 transition-all duration-200 ease-out ${
                  enabled
                    ? 'bg-white border border-gray-200 hover:border-indigo-300 hover:shadow-lg cursor-pointer'
                    : 'bg-gray-50 border border-gray-200 opacity-60 cursor-not-allowed'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h3 className={`font-semibold text-sm leading-tight mb-2 ${
                    enabled ? 'text-gray-900' : 'text-gray-700'
                  }`}>
                    {suggestion.title}
                  </h3>
                  <p className={`text-xs leading-relaxed ${
                    enabled ? 'text-gray-600' : 'text-gray-500'
                  }`}>
                    {suggestion.description}
                  </p>
                </div>
                {enabled ? (
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                  </div>
                ) : (
                  <div className="absolute top-2 right-2">
                    <div className="px-2 py-0.5 bg-gray-200 rounded text-xs font-medium text-gray-500">
                      Soon
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 