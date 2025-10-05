import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Sparkles, X, Trash2 } from 'lucide-react';
import { useSetActiveNav, useSetHoverNav, useSetInteractedNav, useAIPromptHistory, useAIPromptHistoryActions } from '@/stores/use-ui-store';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStoreV2 } from '@/stores/use-timeline-store-v2';

function formatRelativeTime(input: string | number | Date): string {
  const date = new Date(input);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const seconds = Math.max(0, Math.floor(diffMs / 1000));
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds} sec${seconds === 1 ? '' : 's'} ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min${minutes === 1 ? '' : 's'} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? '' : 's'} ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks} week${weeks === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months === 1 ? '' : 's'} ago`;
  const years = Math.floor(days / 365);
  return `${years} year${years === 1 ? '' : 's'} ago`;
}

export const AIToolsTab: React.FC = () => {
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDecision, setShowDecision] = useState(false);
  const [isReverting, setIsReverting] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);
  const aiPromptHistory = useAIPromptHistory();
  const { addAIPrompt, setAIPrompts, clearAIPrompts } = useAIPromptHistoryActions() as {
    addAIPrompt: (t: string) => void;
    setAIPrompts: (items: { id: string; text: string; timestamp: string; summary?: string }[]) => void;
    clearAIPrompts: () => void;
  };
  const autoResize = useCallback(() => {
    const el = textAreaRef.current;
    if (!el) return;
    const maxHeight = 240; // px
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, maxHeight);
    el.style.height = `${newHeight}px`;
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden';
  }, []);

  useEffect(() => {
    (async () => {
      const { projectId } = useProjectStore.getState();
      if (!projectId) return;
      try {
        const res = await apiClient.get<any>(`/api/projects/${projectId}/designer-prompts?limit=50`);
        const prompts = res?.data?.prompts || res?.prompts || [];
        const items = (prompts as any[]).map((p) => ({ id: p.id, text: p.prompt, timestamp: p.createdAt, summary: p.aiResponse }));
        setAIPrompts(items);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load designer prompts', e);
      }
    })();
  }, []);

  useEffect(() => {
    autoResize();
  }, [message, autoResize]);

  const handleSubmit = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!message.trim() || isSubmitting) return;
    try {
      setIsSubmitting(true);
      const prompt = message.trim();
      addAIPrompt(prompt);

      // Call backend AI edit endpoint
      const { projectId, captureBaseline } = useProjectStore.getState();
      if (!projectId) throw new Error('No active project');
      const resp = await apiClient.post<any>(`/api/projects/${projectId}/ai-edit`, { prompt });

      // Extract updated mainState (supports either {project:{mainState}} or {data:{project}} shapes)
      const project = resp?.data?.project || resp?.project || null;
      const mainState = (project?.mainState as any) || null;
      if (!mainState) throw new Error('No mainState returned');

      // Hydrate stores with new state
      const canvas = useCanvasStore.getState();
      const timeline = useTimelineStoreV2.getState();
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      const elements = Array.from(new Map(rawElements.map((e: any) => [e.id, { animations: Array.isArray(e.animations) ? e.animations : [], fill: typeof e.fill === 'string' && e.fill ? e.fill : '#000000', ...e }])).values());
      const groups = Array.from(new Map(rawGroups.map((g: any) => [g.id, { animations: Array.isArray(g.animations) ? g.animations : [], elementIds: Array.isArray(g.elementIds) ? g.elementIds : [], ...g }])).values());
      canvas.setElements(elements as any);
      canvas.setGroups(groups as any);
      const tl = mainState.timeline || {};
      timeline.loadProjectData({
        elements: elements as any,
        groups: groups as any,
        animationStates: (tl.animationStates as any) || {},
        scale: typeof tl.scale === 'number' ? tl.scale : 1,
        duration: typeof tl.duration === 'number' ? tl.duration : 10,
        currentTime: typeof tl.currentTime === 'number' ? tl.currentTime : 0,
      });

      // Update baseline for autosave diffing
      captureBaseline();
      setMessage('');
      setShowDecision(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit(e);
    }
  };

  const handleAccept = () => {
    // Keep the versioned change; baseline already captured
    setShowDecision(false);
  };

  const handleDiscard = async () => {
    const { projectId, captureBaseline, setProjectInfo } = useProjectStore.getState();
    if (!projectId || isReverting) return;
    try {
      setIsReverting(true);
      await apiClient.post<any>(`/api/projects/${projectId}/undo`);
      const refreshed = await apiClient.get<any>(`/api/projects/${projectId}`);
      const project = refreshed.data.project;
      setProjectInfo({ version: project.version, name: project.name, title: project.title });
      const mainState = (project.mainState as any) || {};
      const canvas = useCanvasStore.getState();
      const timeline = useTimelineStoreV2.getState();
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];
      const elements = Array.from(new Map(rawElements.map((e: any) => [e.id, { animations: Array.isArray(e.animations) ? e.animations : [], fill: typeof e.fill === 'string' && e.fill ? e.fill : '#000000', ...e }])).values());
      const groups = Array.from(new Map(rawGroups.map((g: any) => [g.id, { animations: Array.isArray(g.animations) ? g.animations : [], elementIds: Array.isArray(g.elementIds) ? g.elementIds : [], ...g }])).values());
      canvas.setElements(elements as any);
      canvas.setGroups(groups as any);
      const tl = mainState.timeline || {};
      timeline.loadProjectData({
        elements: elements as any,
        groups: groups as any,
        animationStates: (tl.animationStates as any) || {},
        scale: typeof tl.scale === 'number' ? tl.scale : 1,
        duration: typeof tl.duration === 'number' ? tl.duration : 10,
        currentTime: typeof tl.currentTime === 'number' ? tl.currentTime : 0,
      });
      captureBaseline();
    } finally {
      setIsReverting(false);
      setShowDecision(false);
    }
  };

  return (
    <div className="h-full w-80 2xl:w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 ml-0.5">
            <Sparkles className="w-4 h-4 text-purple-500" />
            <h3 className="font-semibold text-gray-800">Generative</h3>
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
          {showDecision && (
            <div className="mb-4 p-3 border border-blue-200 bg-blue-50 rounded-lg flex items-center justify-between">
              <div className="text-[13px] text-blue-800 font-medium">Changes applied</div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleDiscard}
                  disabled={isReverting}
                  className="px-2 py-1 text-[12px] rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  Discard
                </button>
                <button
                  onClick={handleAccept}
                  className="px-2 py-1 text-[12px] rounded-md border border-green-300 text-green-700 hover:bg-green-50"
                >
                  Accept
                </button>
              </div>
            </div>
          )}
          {/* Previous prompts list (user prompts only) */}
          {aiPromptHistory.length > 0 && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs font-medium text-gray-500">Previous Prompts</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={async (e) => {
                      e.stopPropagation();
                      const { projectId } = useProjectStore.getState();
                      if (!projectId) return;
                      await apiClient.delete(`/api/projects/${projectId}/designer-prompts`);
                      clearAIPrompts();
                    }}
                    className="px-2 py-0.5 text-[11px] rounded border border-gray-300 text-gray-700 hover:bg-gray-50"
                    title="Clear all"
                  >
                    Clear
                  </button>
                </div>
              </div>
              <div className="space-y-3">
                {aiPromptHistory.map((entry) => (
                  <div key={entry.id} className="space-y-2">
                    {/* User prompt */}
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 leading-relaxed whitespace-pre-wrap">{entry.text}</div>
                          <div className="mt-1 text-xs font-medium text-gray-400">{formatRelativeTime(entry.timestamp)}</div>
                        </div>
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const { projectId } = useProjectStore.getState();
                            if (!projectId) return;
                            try {
                              await apiClient.delete(`/api/projects/${projectId}/designer-prompts/${entry.id}`);
                              setAIPrompts(aiPromptHistory.filter((i) => i.id !== entry.id));
                            } catch (err) {
                              // eslint-disable-next-line no-console
                              console.warn('Delete prompt failed', err);
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* AI summary response */}
                    {entry.summary && (
                      <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div className="text-xs text-indigo-900 whitespace-pre-wrap">{entry.summary}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-4 bg-white border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="relative">
                <textarea
                  ref={textAreaRef}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Generate design changes..."
                  className="w-full min-h-14 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-relaxed font-medium"
                  style={{ overflowY: 'hidden' }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end -mt-2 mb-4">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!message.trim() || isSubmitting}
              className="inline-flex items-center justify-center px-3 h-8 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30 text-white hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              title="Apply (⌘+Enter)"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <div className="flex items-center gap-1">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.0" stroke="currentColor" className="w-4 h-4 text-white">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 10.5 12 3m0 0 7.5 7.5M12 3v18" />
                  </svg>
                  <span className="text-[12px] font-medium">Submit</span>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 