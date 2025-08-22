'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, RotateCcw, Sparkles, Save, RotateCcw as Overwrite, Loader2 } from 'lucide-react';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import { apiClient } from '@/lib/api-client';
import { CodeExecutor, type ProjectData } from '@/utils/code-executor';
import { DiffUtils } from '@/utils/diff-utils';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';

export default function ScriptsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;

  const { name, version, setProjectInfo, setBaseline, captureBaseline, checkStateDiff, persistIfDirty } = useProjectStore();
  const { elements, groups, setElements, setGroups, clearCanvas } = useCanvasStore();
  const { animationStates, loadProjectData, resetTimeline } = useTimelineStore();

  const [code, setCode] = useState('');
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isOverwriting, setIsOverwriting] = useState(false);
  const [result, setResult] = useState<ProjectData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isExecuting, setIsExecuting] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

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

  // Log when result state changes (for debugging)
  useEffect(() => {
    if (result) {
      console.log('🔄 Result state changed:', {
        hasResult: !!result,
        resultType: typeof result,
        resultKeys: result ? Object.keys(result) : [],
        resultPreview: result ? JSON.stringify(result).substring(0, 200) + '...' : 'null'
      });
    }
  }, [result]);

  // Log when result state changes (for debugging)
  useEffect(() => {
    console.log('🔄 Result state changed:', {
      hasResult: !!result,
      resultType: typeof result,
      resultKeys: result ? Object.keys(result) : [],
      resultPreview: result ? JSON.stringify(result).substring(0, 200) + '...' : 'null'
    });
  }, [result]);

  const executeCode = () => {
    if (!code.trim()) return;

    try {
      setIsExecuting(true);
      setError(null);
      console.log('🚀 Executing code:', code.substring(0, 100) + (code.length > 100 ? '...' : ''));

      // Create a safe execution environment with access to project data
      const projectData: ProjectData = {
        groups: groups,
        elements: elements,
        timeline: {
          scale: 100,
          duration: 1,
          currentTime: 0,
          animationStates: animationStates
        }
      };

      console.log('📊 Project data before execution:', {
        elementsCount: projectData.elements.length,
        groupsCount: projectData.groups.length,
        hasTimeline: !!projectData.timeline
      });

      // Execute the code using the CodeExecutor
      const executionResult = CodeExecutor.execute(
        code,
        projectData,
        (newResult) => {
          console.log('✅ Code execution completed, setting result:', {
            hasResult: !!newResult,
            resultType: typeof newResult,
            resultKeys: newResult ? Object.keys(newResult) : [],
            resultPreview: newResult ? JSON.stringify(newResult).substring(0, 200) + '...' : 'null'
          });
          setResult(newResult);
          
          // Check if the result is different from the original project data
          if (newResult) {
            // Compare with the original project data (NOT the stores)
            const originalProjectData = {
              groups: groups,
              elements: elements,
              timeline: {
                scale: 100,
                duration: 1,
                currentTime: 0,
                animationStates: animationStates
              }
            };
            
            const hasChanges = JSON.stringify(newResult) !== JSON.stringify(originalProjectData);
            console.log('🔄 Result comparison:', { hasChanges });
            setIsDirty(hasChanges);
          }
        },
        (error) => {
          console.error('❌ Code execution error:', error);
          setError(error);
        }
      );

      console.log('📋 Execution result:', executionResult);

      if (!executionResult.success) {
        setError(executionResult.error || 'Code execution failed');
      }

    } catch (err) {
      console.error('💥 Unexpected error in executeCode:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setIsExecuting(false);
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

      const data = await apiClient.post<{ success: boolean; data: { script: string } }>(`/api/projects/${projectId}/generate-script`, {
        prompt: prompt.trim()
      });
      
      if (data.success && data.data.script) {
        console.log('📝 Generated script:', data.data.script);
        
        // Validate that the script calls setResult
        if (!data.data.script.includes('setResult')) {
          console.warn('⚠️ Generated script does not call setResult - adding it automatically');
          const enhancedScript = data.data.script + '\n\n// Ensure result is set\nsetResult(project);';
          setCode(enhancedScript);
        } else {
          setCode(data.data.script);
        }
      } else {
        throw new Error('No script generated');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate script');
    } finally {
      setIsGenerating(false);
    }
  };

  const createNewProject = async () => {
    if (!result) return;

    try {
      setIsSaving(true);
      setError(null);

      const data = await apiClient.post<{ success: boolean; data: { project: { id: string } } }>('/api/projects', {
        name: `${name} - Script Result`,
        mainState: result,
        configuration: {
          canvas: { width: 1920, height: 1080 },
          editor: { snappingEnabled: true, gridEnabled: false },
          animation: { playbackRate: 1, isLooping: false, autoPlay: false }
        }
      });
      
      if (data.success && data.data.project) {
        // Navigate to the new project
        router.push(`/designer/${data.data.project.id}`);
      } else {
        throw new Error('Failed to create new project');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create new project');
    } finally {
      setIsSaving(false);
    }
  };

  const overwriteCurrentProject = async () => {
    if (!result || !projectId) return;

    try {
      setIsOverwriting(true);
      setError(null);

      // First, update the stores with the result data so the project store can detect changes
      setGroups(result.groups as any);
      setElements(result.elements as any);
      
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

      // Use the existing project store diffing and persistence
      const success = await persistIfDirty('Script execution result');
      
      if (success) {
        // Update the baseline and mark as not dirty
        setIsDirty(false);
        // Refresh the project data
        initialize();
      } else {
        throw new Error('No changes detected or save failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to overwrite project');
    } finally {
      setIsOverwriting(false);
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
          <div className="mb-2">
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
              disabled={!code.trim() || isExecuting}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              {isExecuting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
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
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Save/Overwrite Buttons - Only show when project is dirty */}
          {isDirty && result && (
            <div className="flex items-center gap-3 mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex-1">
                <p className="text-sm text-yellow-800 font-medium">Project has unsaved changes</p>
                <p className="text-xs text-yellow-600">Choose to save as new project or overwrite current project</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={createNewProject}
                  disabled={isSaving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={overwriteCurrentProject}
                  disabled={isOverwriting}
                  className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2 shadow-sm"
                >
                  {isOverwriting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Overwrite className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          )}

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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-lg font-semibold text-gray-900">Project Data</h3>
              {result && (
                <div className="flex items-center gap-2">
                  {isDirty && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Modified
                    </span>
                  )}
                  <span className="text-xs text-gray-500">
                    {result.elements?.length || 0} elements, {result.groups?.length || 0} groups
                  </span>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600">
              {result ? 'Current state after script execution' : 'Loading project data...'}
            </p>
          </div>

          <div className="border border-gray-200 rounded-lg overflow-hidden h-[calc(100vh-200px)] shadow-sm relative">
            {isExecuting && (
              <div className="absolute inset-0 bg-black/10 flex items-center justify-center z-10">
                <div className="bg-white rounded-lg px-4 py-3 flex items-center gap-3 shadow-lg">
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                  <span className="text-sm font-medium text-gray-700">Executing script...</span>
                </div>
              </div>
            )}
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
              key={result ? JSON.stringify(result).length : 'loading'} // Force re-render when result changes
            />
          </div>
        </div>
      </div>
    </div>
  );
}
