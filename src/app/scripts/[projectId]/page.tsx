'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Play, RotateCcw } from 'lucide-react';
import { useProjectStore } from '@/stores/use-project-store';
import { useCanvasStore } from '@/stores/use-canvas-store';
import { useTimelineStore } from '@/stores/use-timeline-store';

export default function ScriptsPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = params.projectId as string;
  
  const { projectId: storeProjectId, name } = useProjectStore();
  const { elements, groups, setElements, setGroups } = useCanvasStore();
  const { animationStates } = useTimelineStore();
  
  const [code, setCode] = useState('');
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

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
    <div className="min-h-screen bg-zinc-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Scripts</h1>
              <p className="text-gray-600">Manipulate project data with JavaScript</p>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            Project: {name || 'Untitled'}
          </div>
        </div>
      </div>

      {/* Split Screen Content */}
      <div className="flex h-[calc(100vh-120px)]">
        {/* Left Side - Code Editor */}
        <div className="w-1/2 bg-white border-r border-gray-200 p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Code Editor</h3>
            <p className="text-sm text-gray-600">
              Write JavaScript to manipulate the project object. Use <code className="bg-gray-100 px-1 rounded">project</code> to access data.
            </p>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder={`// Example: Move all elements to the right
project.elements.forEach(element => {
  element.x += 100;
});

// Update the result
setResult(project);`}
            className="w-full h-80 p-4 font-mono text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
          />

          <div className="mt-4 flex items-center gap-3">
            <button
              onClick={executeCode}
              disabled={!code.trim()}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <Play className="w-4 h-4" />
              Execute
            </button>
            
            <button
              onClick={resetToOriginal}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset
            </button>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}
        </div>

        {/* Right Side - JSON Result */}
        <div className="w-1/2 bg-white p-6">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Project Data</h3>
            <p className="text-sm text-gray-600">
              Current state of the project object
            </p>
          </div>
          
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 h-80 overflow-auto">
            <pre className="text-xs text-gray-800 whitespace-pre-wrap">
              {result ? JSON.stringify(result, null, 2) : 'Loading...'}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
