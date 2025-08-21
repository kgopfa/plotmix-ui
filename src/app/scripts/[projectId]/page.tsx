'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, RotateCcw, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { apiClient } from '@/lib/api-client';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';

export default function ScriptsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const { name, version, setProjectInfo, setBaseline, captureBaseline } = useProjectStore();
  const { elements, groups, setElements, setGroups, clearCanvas } = useCanvasStore();
  const { animationStates, loadProjectData, resetTimeline } = useTimelineStore();

  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{
    groups: any[];
    elements: any[];
    timeline: {
      scale: number;
      duration: number;
      currentTime: number;
      animationStates: Record<string, any>;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize project data
  const initialize = useCallback(async () => {
    if (!projectId) return;
    setIsLoading(true);
    setError(null);

    try {
      // Clear any stale canvas/timeline state
      clearCanvas();
      resetTimeline();

      // Fetch project data from API
      const res = await apiClient.get<{ data: { project: { id: string; name: string; title?: string; version: string; mainState?: unknown } } }>(`/api/projects/${projectId}`);
      const project = res.data.project;
      
      setProjectInfo({
        projectId: project.id,
        name: project.name,
        title: project.title,
        version: project.version,
      });

      const mainState = (project.mainState as { elements?: unknown[]; groups?: unknown[]; timeline?: unknown }) || {};
      setBaseline(mainState);

      // Hydrate canvas and timeline stores from mainState
      const rawElements = Array.isArray(mainState.elements) ? mainState.elements : [];
      const rawGroups = Array.isArray(mainState.groups) ? mainState.groups : [];

      // Sanitize elements
      const sanitizedElements = rawElements.map((el: unknown) => ({
        animations: Array.isArray((el as any)?.animations) ? (el as any).animations : [],
        fill: typeof (el as any)?.fill === 'string' && (el as any).fill ? (el as any).fill : '#000000',
        ...(el as any),
      }));
      const elements = Array.from(
        new Map(sanitizedElements.map((e: any) => [e.id as string, e])).values()
      ) as any[];

      // Sanitize groups
      const sanitizedGroups = rawGroups.map((g: unknown) => ({
        animations: Array.isArray((g as any)?.animations) ? (g as any).animations : [],
        elementIds: Array.isArray((g as any)?.elementIds) ? (g as any).elementIds : [],
        ...(g as any),
      }));
      const groups = Array.from(
        new Map(sanitizedGroups.map((g: any) => [g.id as string, g])).values()
      ) as any[];

      setElements(elements);
      setGroups(groups);

      // Load timeline data
      const timeline = (mainState.timeline as { animationStates?: any; scale?: number; duration?: number; currentTime?: number }) || {};
      loadProjectData({
        elements,
        groups,
        animationStates: (timeline.animationStates as Record<string, any>) || {},
        scale: typeof timeline.scale === 'number' ? timeline.scale : 1,
        duration: typeof timeline.duration === 'number' ? timeline.duration : 10,
        currentTime: typeof timeline.currentTime === 'number' ? timeline.currentTime : 0,
      });

      // Capture baseline after stores are hydrated
      captureBaseline();

      // Set initial result
      const projectData = {
        groups: groups,
        elements: elements,
        timeline: {
          scale: timeline.scale || 100,
          duration: timeline.duration || 1,
          currentTime: timeline.currentTime || 0,
          animationStates: timeline.animationStates || {}
        }
      };
      setResult(projectData);

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to initialize project', err);
      setError('Failed to load project');
      setIsLoading(false);
    }
  }, [projectId, setProjectInfo, setBaseline, captureBaseline, clearCanvas, resetTimeline, setElements, setGroups, loadProjectData]);

  // Initialize project on mount
  useEffect(() => {
    initialize();
  }, [initialize]);

  // Update stores when result changes
  useEffect(() => {
    if (result && result.groups && result.elements) {
      setGroups(result.groups as any);
      setElements(result.elements as any);
      
      // Update timeline if timeline data exists
      if (result.timeline) {
        loadProjectData({
          elements: result.elements as any,
          groups: result.groups as any,
          animationStates: result.timeline.animationStates || {},
          scale: result.timeline.scale || 1,
          duration: result.timeline.duration || 10,
          currentTime: result.timeline.currentTime || 0,
        });
      }
    }
  }, [result, setGroups, setElements, loadProjectData]);

  const executeCode = () => {
    if (!code.trim()) return;

    try {
      setError(null);

      // Create a safe execution environment with access to project data
      const projectData = {
        groups: groups,
        elements: elements,
        timeline: {
          scale: 100,
          duration: 1,
          currentTime: 0,
          animationStates: animationStates
        }
      };

      // Execute the code with access to project data
      const executeFunction = new Function('project', 'setResult', 'setError', code);
      executeFunction(projectData, setResult, setError);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const resetToOriginal = () => {
    if (result) {
      setResult(result);
      setCode('');
      setError(null);
    }
  };

  const generateScript = async () => {
    if (!prompt.trim()) return;

    try {
      setIsGenerating(true);
      setError(null);

      const response = await fetch(`/api/projects/${projectId}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: prompt.trim() }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate script');
      }

      const data = await response.json();
      if (data.success && data.data.script) {
        setCode(data.data.script);
      } else {
        throw new Error('No script generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading Project</h1>
          <p className="text-gray-600 mb-6">Please wait while we load your project data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Project</h1>
          <p className="text-red-600 mb-6">{error}</p>
          <button
            onClick={() => initialize()}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{name}</h1>
              <p className="text-gray-600">Manipulate project data with JavaScript</p>
            </div>
          </div>
          <div className="text-xs text-gray-600 bg-gray-100 px-3 py-2 font-medium rounded-lg">
            {version}
          </div>
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Side - Code Editor and Prompt Areas */}
        <div className="w-1/2 border-r border-gray-200 p-6">
          {/* Code Editor Area */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Editor</h3>
            <p className="text-sm text-gray-600 mb-3">
              Write JavaScript to manipulate the project object. Use <code className="bg-gray-100 px-1 rounded text-gray-800">project</code> to access data.
            </p>

            <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm">
              <AceEditor
                mode="javascript"
                theme="monokai"
                value={code}
                onChange={setCode}
                name="code-editor"
                editorProps={{ $blockScrolling: true }}
                setOptions={{
                  enableBasicAutocompletion: true,
                  enableLiveAutocompletion: true,
                  enableSnippets: true,
                  showLineNumbers: true,
                  tabSize: 2,
                }}
                width="100%"
                height="240px"
                placeholder={`// Example: Move all elements to the right
project.elements.forEach(element => {
  element.x += 100;
});

// Update the result
setResult(project);`}
              />
            </div>
          </div>

          {/* Prompt Area */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Generate Code</h3>
            </div>

            <div className="mb-4">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe what you want to do with the project elements, groups, or animations..."
                className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 bg-white"
              />
            </div>

          </div>

          {/* All Action Buttons in One Row */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={executeCode}
              disabled={!code.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              <Play className="w-4 h-4" />
            </button>

            <button
              onClick={resetToOriginal}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              onClick={generateScript}
              disabled={!prompt.trim() || isGenerating}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              {isGenerating ? 'Generating...' : 'Generate'}
            </button>
          </div>

          {/* Error Display */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg shadow-sm">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right Side - JSON Result (Larger Height) */}
        <div className="w-1/2 p-6">
          <div className="mb-3">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Data</h3>
            <p className="text-sm text-gray-600">
              Current state of the project object
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden h-[calc(100vh-200px)] shadow-sm">
            <AceEditor
              mode="json"
              theme="monokai"
              value={result ? JSON.stringify(result, null, 2) : 'Loading...'}
              readOnly={true}
              name="json-editor"
              editorProps={{ $blockScrolling: true }}
              setOptions={{
                showLineNumbers: true,
                tabSize: 2,
                showPrintMargin: false,
              }}
              width="100%"
              height="100%"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
