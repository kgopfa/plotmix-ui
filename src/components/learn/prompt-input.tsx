'use client';

import { useRef } from 'react';
import { 
  Plus, 
  SlidersHorizontal, 
  Globe, 
  AudioLines, 
  Music2, 
  X
} from 'lucide-react';
import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react';

interface Attachment {
  id: string;
  name: string;
  type: 'file' | 'image';
  size: string;
}

interface PromptInputProps {
  prompt: string;
  attachments: Attachment[];
  onPromptChange: (prompt: string) => void;
  onAttachmentsChange: (attachments: Attachment[]) => void;
  onSubmit: (e: React.FormEvent) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

export const PromptInput: React.FC<PromptInputProps> = ({
  prompt,
  attachments,
  onPromptChange,
  onAttachmentsChange,
  onSubmit,
  onKeyDown
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: Attachment[] = Array.from(files).map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      name: file.name,
      type: file.type.startsWith('image/') ? 'image' : 'file',
      size: `${(file.size / 1024).toFixed(1)} KB`
    }));

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm">
      <form onSubmit={onSubmit} className="p-6">
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
            onChange={(e) => onPromptChange(e.target.value)}
            onKeyDown={onKeyDown}
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
            className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30"
            title="Generate content (⌘+Enter)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor" className="w-4 h-4 text-white">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
            </svg>
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
  );
}; 