'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { SearchBar } from '@/components/shared/search-bar';
import { ProjectCard } from '@/components/shared/project-card';
import { FeaturedProjectsTabs } from '@/components/shared/featured-projects-tabs';
import { navigation } from '@/data/shared-navigation';
import { communityProjects } from '@/data/community-projects';
import { recentlyViewedProjects, sharedProjects, FeaturedProject } from '@/data/featured-projects';
import { Palette, Sparkles, Share2, ChevronDown, ChevronUp, LogIn } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllProjects, setShowAllProjects] = useState(false);
  const [activeTab, setActiveTab] = useState('Recently viewed');
  const [selectedSort, setSelectedSort] = useState('lastViewed');
  const [showAllFeaturedProjects, setShowAllFeaturedProjects] = useState(false);
  
  const { isAuthenticated, session, loading } = useAuth();

  // Debug logging
  console.log('HomePage auth state:', { 
    isAuthenticated, 
    loading, 
    hasSession: !!session, 
    userName: session?.user?.name,
    userEmail: session?.user?.email 
  });

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

  const handleFeaturedViewMore = () => {
    setShowAllFeaturedProjects(true);
  };

  const handleFeaturedViewLess = () => {
    setShowAllFeaturedProjects(false);
  };

  const handleTabChange = (tabName: string) => {
    setActiveTab(tabName);
    // Reset sort to appropriate default for the tab
    if (tabName === 'Recently viewed') {
      setSelectedSort('lastViewed');
    } else {
      setSelectedSort('alphabetical');
    }
  };

  const handleSortChange = (sortValue: string) => {
    setSelectedSort(sortValue);
  };

  // For unauthenticated users, always show all community projects
  // For authenticated users, show only first 8 initially, or all if showAllProjects is true
  const displayedProjects = !isAuthenticated 
    ? communityProjects
    : (showAllProjects ? communityProjects : communityProjects.slice(0, 8));

  // Get current featured projects based on active tab
  const getCurrentFeaturedProjects = (): FeaturedProject[] => {
    if (activeTab === 'Recently viewed') {
      return recentlyViewedProjects;
    } else {
      return sharedProjects;
    }
  };

  // Sort featured projects based on selected sort option
  const getSortedFeaturedProjects = (): FeaturedProject[] => {
    const projects = getCurrentFeaturedProjects();
    
    switch (selectedSort) {
      case 'alphabetical':
        return [...projects].sort((a, b) => a.title.localeCompare(b.title));
      case 'dateCreated':
        return [...projects].sort((a, b) => b.id - a.id); // Using ID as proxy for creation date
      case 'lastViewed':
        return [...projects].sort((a, b) => {
          if (!a.lastViewed || !b.lastViewed) return 0;
          return new Date(b.lastViewed).getTime() - new Date(a.lastViewed).getTime();
        });
      default:
        return projects;
    }
  };

  const tabs = [
    { name: 'Recently viewed', current: activeTab === 'Recently viewed' },
    { name: 'Shared projects', current: activeTab === 'Shared projects' },
  ];

  const sortOptions = [
    { name: 'Alphabetical', value: 'alphabetical' },
    { name: 'Date created', value: 'dateCreated' },
    { name: 'Last viewed', value: 'lastViewed' },
  ];

  const sortedFeaturedProjects = getSortedFeaturedProjects();
  const hasMoreCommunityProjects = isAuthenticated && communityProjects.length > 8;
  const hasMoreFeaturedProjects = sortedFeaturedProjects.length > 8;

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20">
        <div className="min-h-screen bg-white">
          {/* Show loading state while authentication is being determined */}
          {loading && (
            <div className="flex min-h-screen items-center justify-center bg-white">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Main content - only show when not loading */}
          {!loading && (
            <>
              {/* Header with search bar */}
              <div className="sticky top-0 z-40 flex flex-row h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:gap-x-6 sm:px-6 lg:px-8">
                <SearchBar
                  placeholder="Search"
                  onSearch={handleSearch}
                  className="max-w-2xl"
                />

                <div className="flex flex-row items-center gap-x-4 ml-auto">
                  {isAuthenticated ? (
                    <>
                      <button className="flex flex-row items-center gap-x-1 bg-transparent border border-gray-500 text-gray-700 px-4 py-2 rounded-3xl text-xs font-medium">
                        <Palette className="size-4 text-purple-700" />
                        Design
                      </button>

                      <Link href="/learn" className="flex flex-row items-center gap-x-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 rounded-3xl text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                        <Sparkles className="size-4" />
                        Generate
                      </Link>
                    </>
                  ) : (
                    <Link href="/login" className="flex flex-row items-center gap-x-1 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-4 py-2 rounded-3xl text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                      <LogIn className="size-4" />
                      Login
                    </Link>
                  )}
                </div>
              </div>

              {/* Hero section */}
              <div className='p-8'>
                {/* Community Projects */}
                <div className="flex flex-col border border-gray-200 rounded-3xl px-8 py-7">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-5">
                    <div>
                      <h1 className="text-xl font-semibold text-gray-900 mb-2">
                        {isAuthenticated ? 'See what you can do' : 'Welcome to PlotMix'}
                      </h1>
                      <p className="text-gray-600 text-sm">
                        {isAuthenticated 
                          ? 'Explore community projects and get inspired' 
                          : 'Explore community projects and create amazing designs'
                        }
                      </p>
                    </div>
                    {isAuthenticated ? (
                      <Link href="/editor" className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                        <Sparkles className="size-4" />
                        Create Your Own
                      </Link>
                    ) : (
                      <Link href="/register" className="mt-4 sm:mt-0 inline-flex items-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white px-6 py-3 rounded-2xl text-sm font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25">
                        <Sparkles className="size-4" />
                        Get Started
                      </Link>
                    )}
                  </div>

                  {/* Community Projects Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-4 max-w-none">
                    {displayedProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        variant="compact"
                        onClick={() => handleProjectClick(project.id)}
                      />
                    ))}
                  </div>

                  {/* View More/Less Button - Only show for authenticated users */}
                  {hasMoreCommunityProjects && (
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

                {/* Featured Projects - Only show for authenticated users */}
                {isAuthenticated && (
                  <div className={`flex flex-col ${showAllFeaturedProjects ? 'border border-gray-200 rounded-3xl px-8 py-7' : 'px-4 py-7 mt-4'}`}>
                    <div className="mb-6">
                      <h2 className="text-xl font-semibold text-gray-900 mb-2">Featured Projects</h2>
                      <p className="text-gray-600 text-sm">Your recently viewed and shared projects</p>
                    </div>

                    {/* Tabs and Sort */}
                    <FeaturedProjectsTabs
                      tabs={tabs}
                      onTabChange={handleTabChange}
                      sortOptions={sortOptions}
                      selectedSort={selectedSort}
                      onSortChange={handleSortChange}
                    />

                    {/* Featured Projects Grid */}
                    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-8 gap-6 mt-6 ${
                      showAllFeaturedProjects ? 'max-h-96 overflow-y-auto' : ''
                    }`}>
                      {sortedFeaturedProjects.map((project) => (
                        <ProjectCard
                          key={project.id}
                          project={project}
                          variant={showAllFeaturedProjects ? "compact" : "default"}
                          onClick={() => handleProjectClick(project.id)}
                        />
                      ))}
                    </div>

                    {/* Featured Projects View More/Less Button - Only show if there are more projects */}
                    {hasMoreFeaturedProjects && (
                      <div className="flex justify-center mt-6">
                        <button
                          onClick={showAllFeaturedProjects ? handleFeaturedViewLess : handleFeaturedViewMore}
                          className="flex items-center gap-x-2 text-purple-700 hover:text-purple-800 font-medium text-sm transition-colors px-4 py-2 rounded-lg hover:bg-purple-50"
                        >
                          <span>
                            {showAllFeaturedProjects
                              ? 'Show community projects'
                              : 'View all featured projects'
                            }
                          </span>
                          {showAllFeaturedProjects ? (
                            <ChevronUp className="size-4" />
                          ) : (
                            <ChevronDown className="size-4" />
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  );
} 