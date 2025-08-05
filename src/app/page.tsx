'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SearchBar } from '@/components/shared/search-bar';
import { ProjectCard } from '@/components/shared/project-card';
import { navigation } from '@/data/shared-navigation';
import { communityProjects } from '@/data/community-projects';
import { Palette, Sparkles, Share2, ChevronDown, ChevronUp } from 'lucide-react';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllProjects, setShowAllProjects] = useState(false);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    // Add your search logic here
    console.log('Searching for:', query);
  };

  const handleProjectClick = (projectId: number) => {
    // Handle project click - could navigate to project detail page
    console.log('Project clicked:', projectId);
  };

  const handleViewMore = () => {
    setShowAllProjects(true);
  };

  const handleViewLess = () => {
    setShowAllProjects(false);
  };

  // Show only first 8 projects initially, or all if showAllProjects is true
  const displayedProjects = showAllProjects
    ? communityProjects
    : communityProjects.slice(0, 8);

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

          {/* Hero section */}
          <div className='p-8'>
            {/* Community Projects */}
            <div className="flex flex-col border border-gray-200 rounded-3xl px-8 py-7">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                <div>
                  <h1 className="text-xl font-semibold text-gray-900 mb-2">See what you can do</h1>
                  <p className="text-gray-600 text-sm">Explore community projects and get inspired</p>
                </div>
                <Link href="/editor" className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                  <Sparkles className="size-4" />
                  Create Your Own
                </Link>
              </div>

              {/* Community Projects Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-6 max-w-none">
                {displayedProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onClick={() => handleProjectClick(project.id)}
                  />
                ))}
              </div>

              {/* View More/Less Button */}
              {communityProjects.length > 8 && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={showAllProjects ? handleViewLess : handleViewMore}
                    className="flex items-center gap-x-2 text-purple-700 hover:text-purple-800 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-purple-50"
                  >
                    <span>
                      {showAllProjects
                        ? 'Collapse'
                        : 'View more community projects'
                      }
                    </span>
                    {showAllProjects ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Featured Projects */}
            <div className="flex flex-col rounded-3xl px-8">
              <div className="flex flex-row gap-x-4">
                
              </div>
            </div>

            {/* Main content area */}
            <div className="flex items-center justify-center flex-1 p-8">

            </div>
          </div>
        </div>
      </main>
    </>
  );
} 