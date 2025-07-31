'use client';

import { useState, useRef } from 'react';
import { 
  Sparkles, 
  Plus, 
  SlidersHorizontal, 
  Globe, 
  AudioLines, 
  Music2, 
  X,
  Menu,
  User,
  MessagesSquare,
  Clapperboard,
  CirclePlus
} from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel, Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'design' | 'algorithm' | 'system';
}

const navigation = [
  { 
    name: 'New Chat', 
    href: '#', 
    icon: CirclePlus, 
    current: false, 
    color: 'text-green-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700',
    activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
  },
  { 
    name: 'Chats', 
    href: '#', 
    icon: MessagesSquare, 
    current: false, 
    color: 'text-blue-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700',
    activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
  },
  { 
    name: 'Content', 
    href: '#', 
    icon: Clapperboard, 
    current: false, 
    color: 'text-fuchsia-600',
    hoverColor: 'hover:bg-gradient-to-r hover:from-fuchsia-50 hover:to-fuchsia-50 hover:text-fuchsia-700',
    activeColor: 'bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 text-white shadow-lg shadow-fuchsia-500/30'
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

const suggestions: Suggestion[] = [
  {
    id: '1',
    title: 'Design Twitter',
    description: 'Create a system design for Twitter',
    prompt: 'Design a system similar to Twitter. Include user authentication, tweet creation and storage, timeline generation, follow/unfollow functionality, and real-time notifications. Show the database schema, API endpoints, and system architecture.',
    category: 'design'
  },
  {
    id: '2',
    title: 'Design Spotify Top K Songs',
    description: 'Design a system to find top K songs',
    prompt: 'Design a system to find the top K most played songs on Spotify. Consider millions of users, real-time play counts, and efficient data structures. Include the algorithm, database design, and scaling considerations.',
    category: 'design'
  },
  {
    id: '3',
    title: 'Binary Search',
    description: 'Visualize binary search algorithm',
    prompt: 'Create a visual representation of binary search algorithm. Show a sorted array and demonstrate how the algorithm finds a target value by repeatedly dividing the search interval in half.',
    category: 'algorithm'
  },
  {
    id: '4',
    title: 'Explain Depth First Search',
    description: 'Visualize DFS algorithm step by step',
    prompt: 'Create a visual representation of Depth First Search algorithm. Show a graph with nodes and demonstrate how DFS traverses through the graph step by step, including the stack operations and visited nodes.',
    category: 'algorithm'
  },
  {
    id: '5',
    title: 'Design Twitter',
    description: 'Create a system design for Twitter',
    prompt: 'Design a system similar to Twitter. Include user authentication, tweet creation and storage, timeline generation, follow/unfollow functionality, and real-time notifications. Show the database schema, API endpoints, and system architecture.',
    category: 'design'
  },
  {
    id: '6',
    title: 'Design Netflix',
    description: 'Design a video streaming platform',
    prompt: 'Design a video streaming platform like Netflix. Include video storage and delivery, recommendation system, user profiles, content management, and CDN distribution for global scalability.',
    category: 'design'
  },
  {
    id: '7',
    title: 'Design Uber',
    description: 'Design a ride-sharing system',
    prompt: 'Design a ride-sharing system like Uber. Include user and driver apps, real-time location tracking, ride matching algorithm, payment processing, and handling peak demand scenarios.',
    category: 'design'
  },
  {
    id: '8',
    title: 'Design Spotify Top K',
    description: 'Design a system to find top K songs',
    prompt: 'Design a system to find the top K most played songs on Spotify. Consider millions of users, real-time play counts, and efficient data structures. Include the algorithm, database design, and scaling considerations.',
    category: 'design'
  }
];

export default function LearnPage() {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Handle prompt submission here
    console.log('Submitting prompt:', { prompt, attachments });
    
    // For now, just clear the prompt
    setPrompt('');
  };

  const handleSuggestionClick = (suggestion: Suggestion) => {
    setPrompt(suggestion.prompt);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: `${(file.size / 1024).toFixed(1)} KB`
    }));

    setAttachments(prev => [...prev, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <X aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 ring-1 ring-gray-200">
              <div className="flex h-16 shrink-0 items-center">
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="-mx-2 flex-1 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <a
                        href={item.href}
                        className={classNames(
                          item.current
                            ? item.activeColor
                            : `${item.color} ${item.hoverColor}`,
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-all duration-200 ease-out transform hover:scale-105 active:scale-95',
                        )}
                      >
                        <item.icon 
                          aria-hidden="true" 
                          className={`w-5 h-5 transition-all duration-200 ${item.current ? 'drop-shadow-sm' : 'group-hover:scale-110'}`} 
                        />
                        {item.name}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>
              
              {/* User avatar at bottom */}
              <div className="flex items-center gap-x-3 px-2 py-3">
                <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-sm font-medium text-gray-600">User</span>
              </div>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col items-center h-full">
          <div className="flex h-16 shrink-0 items-center justify-center mt-6">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          </div>
          <nav className="mt-6 pb-6 flex-1">
            <ul role="list" className="flex flex-col items-center space-y-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <div className="relative">
                    <a
                      href={item.href}
                      className={classNames(
                        item.current
                          ? item.activeColor
                          : `${item.color} ${item.hoverColor} hover:shadow-md`,
                        'relative group flex flex-col items-center justify-center w-10 h-10 rounded-xl font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95',
                      )}
                    >
                      <item.icon 
                        aria-hidden="true" 
                        className={`w-5 h-5 transition-all duration-200 ${item.current ? 'drop-shadow-sm' : 'group-hover:scale-110'}`} 
                      />
                      <span className="sr-only">{item.name}</span>
                      {/* Active indicator */}
                      {item.current && (
                        <div className="absolute -right-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-sm"></div>
                      )}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User avatar at bottom */}
          <div className="mb-6">
            <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <User className="h-5 w-5 text-gray-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden border-b border-gray-200">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-600 lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <Menu aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900">PlotMix AI</div>
        <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center">
          <User className="h-4 w-4 text-gray-600" />
        </div>
      </div>

      <main className="lg:pl-20">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <style jsx>{`
            @keyframes scroll-left {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            
            @keyframes scroll-right {
              0% { transform: translateX(-50%); }
              100% { transform: translateX(0); }
            }
            
            .animate-scroll-left {
              animation: scroll-left 40s linear infinite;
              will-change: transform;
            }
            
            .animate-scroll-right {
              animation: scroll-right 40s linear infinite;
              will-change: transform;
            }
            
            .animate-scroll-left:hover,
            .animate-scroll-right:hover {
              animation-play-state: paused;
            }
          `}</style>
          {/* Main Content */}
          <div className="flex flex-col max-w-4xl w-full px-6 py-8">
            {/* Suggestions Section */}
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
                      onClick={() => handleSuggestionClick(suggestion)}
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
                      onClick={() => handleSuggestionClick(suggestion)}
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

            {/* Prompt Input Area */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
              <form onSubmit={handleSubmit} className="p-6">
                {/* Attachments */}
                {attachments.length > 0 && (
                  <div className="mb-4 flex flex-wrap gap-2">
                    {attachments.map(attachment => (
                      <div
                        key={attachment.id}
                        className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-sm"
                      >
                        {attachment.type === 'image' ? (
                          <div className="w-4 h-4 bg-blue-500 rounded-sm" />
                        ) : (
                          <div className="w-4 h-4 bg-green-500 rounded-sm" />
                        )}
                        <span className="text-gray-700 font-medium">
                          {attachment.name}
                        </span>
                        <span className="text-gray-500 text-xs">
                          {attachment.size}
                        </span>
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-lg transition-all duration-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Text Area */}
                <div className="relative">
                  <textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Describe what you want to visualize on the canvas..."
                    className="w-full min-h-[140px] p-4 pr-16 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-base leading-relaxed font-medium"
                    style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                  />
                </div>

                {/* Bottom Controls */}
                <div className="flex items-center justify-between pt-4">
                  {/* Left side - Attachment and Options buttons */}
                  <div className="flex items-center gap-3">
                    {/* Attachments button */}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>

                    {/* Options Popover */}
                    <Popover className="relative">
                      <PopoverButton className="inline-flex items-center justify-center w-10 h-10 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                        <SlidersHorizontal className="w-4 h-4" />
                      </PopoverButton>

                      <PopoverPanel
                        transition
                        className="absolute left-1/2 z-10 mt-2 flex w-screen max-w-max -translate-x-1/2 bg-transparent px-4 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
                      >
                        <div className="w-56 flex-auto overflow-hidden rounded-xl bg-white text-sm shadow-lg ring-1 ring-gray-900/5">
                          <div className="p-4">
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <Globe className="size-4 text-blue-600" />
                                <span className="text-gray-900">Web Search</span>
                              </div>
                              <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-blue-600 transition-colors duration-200 ease-in-out has-checked:bg-blue-600 has-focus-visible:outline-2">
                                <span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
                                <input
                                  name="web-search"
                                  type="checkbox"
                                  aria-label="Enable web search"
                                  className="absolute inset-0 appearance-none focus:outline-hidden"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between py-3">
                              <div className="flex items-center gap-3">
                                <AudioLines className="size-4 text-green-600" />
                                <span className="text-gray-900">Audio</span>
                              </div>
                              <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-green-600 transition-colors duration-200 ease-in-out has-checked:bg-green-600 has-focus-visible:outline-2">
                                <span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
                                <input
                                  name="audio"
                                  type="checkbox"
                                  aria-label="Enable audio"
                                  className="absolute inset-0 appearance-none focus:outline-hidden"
                                />
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between py-2">
                              <div className="flex items-center gap-3">
                                <Music2 className="size-4 text-purple-600" />
                                <span className="text-gray-900">Music</span>
                              </div>
                              <div className="group relative inline-flex w-11 shrink-0 rounded-full bg-gray-200 p-0.5 inset-ring inset-ring-gray-900/5 outline-offset-2 outline-purple-600 transition-colors duration-200 ease-in-out has-checked:bg-purple-600 has-focus-visible:outline-2">
                                <span className="size-5 rounded-full bg-white shadow-xs ring-1 ring-gray-900/5 transition-transform duration-200 ease-in-out group-has-checked:translate-x-5" />
                                <input
                                  name="music"
                                  type="checkbox"
                                  aria-label="Enable music"
                                  className="absolute inset-0 appearance-none focus:outline-hidden"
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </PopoverPanel>
                    </Popover>
                  </div>

                  {/* Right side - Submit Button */}
                  <button
                    type="submit"
                    disabled={!prompt.trim()}
                    className="inline-flex items-center p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                    title="Generate content (⌘+Enter)"
                  >
                    <Sparkles className="w-5 h-5 text-white" />
                  </button>

                  {/* Hidden file inputs */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    accept=".txt,.pdf,.doc,.docx,.csv,.json,.md,image/*"
                  />
                </div>
              </form>
            </div>

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
