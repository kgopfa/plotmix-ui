import React from 'react';
import { Sparkles, X, CircleFadingPlus } from 'lucide-react';
import { useSetActiveNav, useSetHoverNav, useSetInteractedNav, useAIPromptHistory, useAIPromptHistoryActions } from '@/stores/use-ui-store';

export const AIToolsTab: React.FC = () => {
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const aiPromptHistory = useAIPromptHistory();
  const { addAIPrompt } = useAIPromptHistoryActions();

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      // TODO: Wire up to actual AI action for the designer when ready
      addAIPrompt(message.trim());
      // eslint-disable-next-line no-console
      console.log('AI Tools prompt submitted:', message.trim());
      setMessage('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">AI Tools</h3>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActiveNav(null);
              setHoverNav(null);
              setInteractedNav(null);
              // Prevent immediate re-hovering by adding a small delay
              setTimeout(() => {
                setHoverNav(null);
              }, 50);
            }}
            className="p-1 text-gray-400 hover:text-gray-600 transition-colors rounded-lg hover:bg-gray-100"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="max-w-md">
          {/* Previous prompts list (user prompts only) */}
          {aiPromptHistory.length > 0 && (
            <div className="mb-4">
              <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Previous Prompts</div>
              <div className="space-y-2">
                {aiPromptHistory.map((entry) => (
                  <div key={entry.id} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="text-[13px] text-gray-800 leading-relaxed whitespace-pre-wrap">{entry.text}</div>
                    <div className="mt-1 text-[11px] text-gray-500">{new Date(entry.timestamp).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 bg-white border border-gray-200 rounded-xl shadow-sm">
            <div className="p-4">
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Apply changes to the canvas..."
                  className="w-full min-h-16 p-2 pr-16 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-relaxed font-medium"
                  style={{ fontFamily: 'Inter, system-ui, -apple-system, sans-serif' }}
                />
              </div>

              <div className="flex items-center justify-end pt-3">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!message.trim() || isSubmitting}
                  className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Apply (⌘+Enter)"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor" className="w-4 h-4 text-white">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 