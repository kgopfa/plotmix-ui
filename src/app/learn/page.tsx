'use client';

import { useState, useRef } from 'react';
import { 
  Sparkles, 
  Paperclip, 
  Image as ImageIcon, 
  FileText, 
  Settings, 
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
}

interface PromptOptions {
  model: string;
  temperature: number;
  maxTokens: number;
  topP: number;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  prompt: string;
  category: 'design' | 'algorithm' | 'system';
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
    title: 'Design TicketMaster',
    description: 'Design a ticket booking system',
    prompt: 'Design a ticket booking system like TicketMaster. Include user registration, event creation, ticket purchasing with seat selection, payment processing, and handling high concurrent traffic during popular events.',
    category: 'design'
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
    title: 'Explain Binary Search',
    description: 'Visualize binary search algorithm',
    prompt: 'Create a visual representation of binary search algorithm. Show a sorted array and demonstrate how the algorithm finds a target value by repeatedly dividing the search interval in half.',
    category: 'algorithm'
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
    title: 'Explain Quick Sort',
    description: 'Visualize quicksort algorithm',
    prompt: 'Create a visual representation of the quicksort algorithm. Show how the pivot selection, partitioning, and recursive sorting work step by step with a sample array.',
    category: 'algorithm'
  },
  {
    id: '8',
    title: 'Design Uber',
    description: 'Design a ride-sharing system',
    prompt: 'Design a ride-sharing system like Uber. Include user and driver apps, real-time location tracking, ride matching algorithm, payment processing, and handling peak demand scenarios.',
    category: 'design'
  }
];

export default function LearnPage() {
  const [prompt, setPrompt] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showOptions, setShowOptions] = useState(false);
  const [options, setOptions] = useState<PromptOptions>({
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2048,
    topP: 1.0
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    
    // Handle prompt submission here
    console.log('Submitting prompt:', { prompt, attachments, options });
    
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
    <div className="min-h-screen bg-white flex items-center justify-center">
      {/* Main Content */}
      <main className="flex flex-col max-w-4xl w-full px-6 py-8">
        {/* Suggestions Section */}
        <div className="mb-20">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl ml-2 font-semibold text-gray-900">
              Quick Suggestions
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.id}
                onClick={() => handleSuggestionClick(suggestion)}
                className="group relative bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-indigo-300 hover:shadow-lg transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
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
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-green-500" />
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
                className="w-full min-h-[140px] p-4 pr-16 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-base leading-relaxed"
                style={{ fontFamily: 'inherit' }}
              />
              
              {/* Submit Button */}
              <button
                type="submit"
                disabled={!prompt.trim()}
                className="absolute bottom-4 right-4 p-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30"
                title="Generate content (⌘+Enter)"
              >
                <Sparkles className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Bottom Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              {/* Left side - Attachment buttons */}
              <div className="flex items-center gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept=".txt,.pdf,.doc,.docx,.csv,.json,.md"
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  accept="image/*"
                />
                
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
                  title="Attach files"
                >
                  <Paperclip className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                </button>
                
                <button
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 hover:text-blue-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
                  title="Attach images"
                >
                  <ImageIcon className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                </button>
              </div>

              {/* Right side - Options toggle */}
              <button
                type="button"
                onClick={() => setShowOptions(!showOptions)}
                className="group relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 hover:text-purple-700 transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
              >
                <Settings className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                <span className="text-sm font-medium">Options</span>
                {showOptions ? (
                  <ChevronUp className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                ) : (
                  <ChevronDown className="w-4 h-4 transition-all duration-200 group-hover:scale-110" />
                )}
              </button>
            </div>

            {/* Options Panel */}
            {showOptions && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Model Selection */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Model
                    </label>
                    <select
                      value={options.model}
                      onChange={(e) => setOptions(prev => ({ ...prev, model: e.target.value }))}
                      className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
                    >
                      <option value="gpt-4">GPT-4</option>
                      <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                      <option value="claude-3">Claude 3</option>
                    </select>
                  </div>

                  {/* Temperature */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Temperature: {options.temperature}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="2"
                      step="0.1"
                      value={options.temperature}
                      onChange={(e) => setOptions(prev => ({ ...prev, temperature: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Max Tokens */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Max Tokens: {options.maxTokens}
                    </label>
                    <input
                      type="range"
                      min="100"
                      max="4096"
                      step="100"
                      value={options.maxTokens}
                      onChange={(e) => setOptions(prev => ({ ...prev, maxTokens: parseInt(e.target.value) }))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {/* Top P */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Top P: {options.topP}
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={options.topP}
                      onChange={(e) => setOptions(prev => ({ ...prev, topP: parseFloat(e.target.value) }))}
                      className="w-full h-2 bg-gradient-to-r from-gray-200 to-gray-300 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
            <p className="text-xs text-gray-500">
              Press ⌘+Enter to generate • AI will create visual content for your canvas
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
