'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SearchBar } from '@/components/shared/search-bar';
import { navigation } from '@/data/shared-navigation';
import { Palette, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Add your search logic here
    console.log('Searching for:', query);
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20">
        <div className="min-h-screen bg-white">
          {/* Header with search bar */}
          <div className="sticky top-0 z-40 flex flex-row h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
            <SearchBar
              placeholder="Search"
              onSearch={handleSearch}
              className="max-w-2xl"
            />

            <div className="flex flex-row items-center gap-x-4 ml-auto">
              <button className="flex flex-row items-center gap-x-1 bg-transparent border border-gray-500 text-gray-700 px-4 py-2 rounded-3xl text-xs font-medium">
                <Palette className="size-4 text-purple-700" />
                Design
              </button>

              <Link href="/learn" className="flex flex-row items-center gap-x-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 rounded-3xl text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                <Sparkles className="size-4" />
                Generate
              </Link>
            </div>
          </div>

          <div className="flex flex-col p-12">
            <h1 className="text-4xl font-bold text-gray-800">Welcome to PlotMix</h1>
          </div>

          {/* Main content area */}
          <div className="flex items-center justify-center flex-1 p-8">
            
          </div>
        </div>
      </main>
    </>
  );
} 