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
        console.log('Project loaded successfully');
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
          className="px-2 py-1 text-sm text-black border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 w-32"
          style={{ color: '#000000', WebkitTextFillColor: '#000000' }}
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="btn disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Save Project"
      >
        💾
      </button>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="btn disabled:bg-gray-400 disabled:cursor-not-allowed"
        title="Load Project"
      >
        📁
      </button>

      {/* Loading/Error Indicators */}
      {isLoading && (
        <div className="text-xs text-blue-600">
          Loading...
        </div>
      )}
      {error && (
        <div className="text-xs text-red-600 max-w-24 truncate" title={error}>
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