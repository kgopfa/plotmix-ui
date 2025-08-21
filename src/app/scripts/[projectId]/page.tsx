'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, RotateCcw, ChevronDown, Sparkles } from 'lucide-react';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';
import AceEditor from 'react-ace';

import 'ace-builds/src-noconflict/mode-javascript';
import 'ace-builds/src-noconflict/mode-json';
import 'ace-builds/src-noconflict/theme-monokai';


export default function ScriptsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const { projectId: storeProjectId, name, version } = useProjectStore();
  const { elements, groups, setElements, setGroups } = useCanvasStore();
  const { animationStates } = useTimelineStore();
  
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  // Verify we're working with the correct project
  useEffect(() => {
    if (projectId !== storeProjectId) {
      router.push('/projects');
    }
  }, [projectId, storeProjectId, router]);

  // Initialize with current project data
  useEffect(() => {
    if (projectId && elements && groups) {
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
      setResult(projectData);
    }
  }, [projectId, elements, groups, animationStates]);

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

      // Update the actual project if result contains valid data
      if (result && result.groups && result.elements) {
        setGroups(result.groups);
        setElements(result.elements);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    }
  };

  const resetToOriginal = () => {
    if (projectId && elements && groups) {
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
      setResult(projectData);
      setCode('');
      setError(null);
    }
  };

  if (!projectId || projectId !== storeProjectId) {
    return (
      <div className="min-h-screen bg-zinc-100 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Invalid Project</h1>
          <p className="text-gray-600 mb-6">Please open a project in the designer to use scripts.</p>
          <button
            onClick={() => router.push('/projects')}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Go to Projects
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
          {/* Code Editor Area - Now Above */}
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

          {/* Prompt Area - Collapsible, Now Below */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-gray-900">Generate Code</h3>
              <button
                onClick={() => setShowPrompt(!showPrompt)}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 flex items-center gap-1 px-2 py-1 rounded-md hover:bg-gray-100 transition-colors"
              >
                {showPrompt ? 'Hide' : 'Show'}
                <ChevronDown className={`w-4 h-4 transition-transform ${showPrompt ? 'rotate-180' : ''}`} />
              </button>
            </div>
            
            {showPrompt && (
              <div className="mb-4">
                <textarea
                  placeholder="Describe what you want to do with the project elements, groups, or animations..."
                  className="w-full h-24 p-3 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none text-gray-900 bg-white"
                />
              </div>
            )}
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

            {showPrompt && (
              <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2 shadow-sm">
                <Sparkles className="w-4 h-4" />
              </button>
            )}
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
