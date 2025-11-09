import React, { useRef, useState } from 'react';
import { useProjectManager } from '@/hooks/use-project-manager';

export const ProjectControls = () => {
  const {
    loadFromFile,
    downloadProject,
    isLoading,
    error
  } = useProjectManager();
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState('');

  const handleSave = () => {
    try {
      downloadProject(projectName || 'my-animation-project');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleLoad = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await loadFromFile(file);
      } catch (error) {
        console.error('Load failed:', error);
      }
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="flex items-center gap-2 border-r pr-2 mr-2">
      {/* Project Name Input */}
      <div className="flex items-center gap-1">
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Project name"
          className="px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-32 bg-white/95 backdrop-blur-sm transition-all duration-200"
          style={{ color: '#374151', WebkitTextFillColor: '#374151' }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg shadow-green-500/30 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
        title="Save Project"
      >
        <svg className="w-5 h-5 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
        </svg>
      </button>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="group relative inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/30 hover:from-blue-600 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 disabled:cursor-not-allowed transition-all duration-200 ease-out transform hover:scale-105 active:scale-95"
        title="Load Project"
      >
        <svg className="w-5 h-5 transition-all duration-200 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-5l-2-2H5a2 2 0 00-2 2z" />
        </svg>
      </button>

      {/* Loading/Error Indicators */}
      {isLoading && (
        <div className="text-xs text-blue-600 font-medium">
          Loading...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 max-w-24 truncate font-medium" title={error}>
          Error: {error}
        </div>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}; 