'use client';

import { HeroInput } from './hero-input';
import { MarketingSuggestions, type MarketingSuggestion } from './marketing-suggestions';
import { useState } from 'react';

export function HeroSection() {
  const [query, setQuery] = useState('');

  const handleSuggestionClick = (suggestion: MarketingSuggestion) => {
    setQuery(suggestion.prompt);
  };

  return (
    <>
      <HeroInput query={query} setQuery={setQuery} />
      <MarketingSuggestions onSuggestionClick={handleSuggestionClick} />
    </>
  );
}

