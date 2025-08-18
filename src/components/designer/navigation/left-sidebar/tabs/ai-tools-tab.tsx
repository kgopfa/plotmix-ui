import React from 'react';
import { Sparkles, X, CircleFadingPlus } from 'lucide-react';
import { useSetActiveNav, useSetHoverNav, useSetInteractedNav, useAIPromptHistory, useAIPromptHistoryActions } from '@/stores/use-ui-store';
import { apiClient } from '@/lib/api-client';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';

export const AIToolsTab: React.FC = () => {
  const setActiveNav = useSetActiveNav();
  const setHoverNav = useSetHoverNav();
  const setInteractedNav = useSetInteractedNav();
  const [message, setMessage] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [showDecision, setShowDecision] = React.useState(false);
  const [isReverting, setIsReverting] = React.useState(false);
  const aiPromptHistory = useAIPromptHistory();
  const { addAIPrompt, setAIPrompts } = useAIPromptHistoryActions();
  React.useEffect(() => {
    (async () => {
      const { projectId } = useProjectStore.getState();
      if (!projectId) return;
      try {
        const res = await apiClient.get<any>(`/api/projects/${projectId}/designer-prompts?limit=50`);
        const prompts = res?.data?.prompts || res?.prompts || [];
        const items = (prompts as any[]).map((p) => ({ id: p.id, text: p.prompt, timestamp: p.createdAt }));
        setAIPrompts(items);
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn('Failed to load designer prompts', e);
      }
    })();
  }, []);

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
      const timeline = useTimelineStore.getState();
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
      const timeline = useTimelineStore.getState();
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
              <div className="text-xs font-medium text-gray-500 mb-2">Previous Prompts</div>
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

          <div className="mb-4 bg-white border border-gray-200 rounded-lg">
            <div className="p-4">
              <div className="relative">
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Generate design changes..."
                  className="w-full min-h-14 p-2 pr-16 resize-none border-0 focus:ring-0 focus:outline-none bg-transparent text-gray-900 placeholder-gray-500 text-sm leading-relaxed font-medium"
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
                    <Sparkles className="w-4 h-4 text-white" />
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