import React, { useRef, useState } from 'react';
import { useProjectManager, useAutoBackup } from '@/hooks/use-project-manager';

interface ProjectToolbarProps {
  className?: string;
}

export function ProjectToolbar({ className = '' }: ProjectToolbarProps) {
  const {
    loadFromFile,
    downloadProject,
    validateProject,
    createBackup,
    getProjectStats,
    isLoading,
    error
  } = useProjectManager();
  
  const { startAutoBackup, getAutoBackups, clearAutoBackups } = useAutoBackup(5); // Auto-backup every 5 minutes
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [projectName, setProjectName] = useState('');
  const [showBackups, setShowBackups] = useState(false);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [autoBackupCleanup, setAutoBackupCleanup] = useState<(() => void) | null>(null);

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

  const handleBackup = () => {
    try {
      createBackup();
      console.log('Backup created successfully');
    } catch (error) {
      console.error('Backup failed:', error);
    }
  };

  const toggleAutoBackup = () => {
    if (autoBackupEnabled) {
      // Disable auto-backup
      if (autoBackupCleanup) {
        autoBackupCleanup();
        setAutoBackupCleanup(null);
      }
      setAutoBackupEnabled(false);
    } else {
      // Enable auto-backup
      const cleanup = startAutoBackup();
      setAutoBackupCleanup(() => cleanup);
      setAutoBackupEnabled(true);
    }
  };

  const loadAutoBackup = async (backupData: string) => {
    try {
      await validateProject(backupData);
      await loadFromFile(new Blob([backupData], { type: 'application/json' }) as File);
      setShowBackups(false);
    } catch (error) {
      console.error('Failed to load backup:', error);
    }
  };

  const stats = getProjectStats();

  return (
    <div className={`flex items-center gap-4 p-2 bg-gray-100 border-b ${className}`}>
      {/* Project Name Input */}
      <div className="flex items-center gap-2">
        <label className="text-sm font-medium text-gray-700">Project:</label>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name"
          className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={isLoading}
        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        💾 Save
      </button>

      {/* Load Button */}
      <button
        onClick={handleLoad}
        disabled={isLoading}
        className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        📁 Load
      </button>

      {/* Backup Button */}
      <button
        onClick={handleBackup}
        disabled={isLoading}
        className="px-3 py-1 text-sm bg-orange-600 text-white rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        🔄 Backup
      </button>

      {/* Auto-Backup Toggle */}
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={autoBackupEnabled}
          onChange={toggleAutoBackup}
          className="rounded"
        />
        Auto-backup (5m)
      </label>

      {/* Backups Button */}
      <div className="relative">
        <button
          onClick={() => setShowBackups(!showBackups)}
          className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
        >
          📚 Backups
        </button>

        {/* Backups Dropdown */}
        {showBackups && (
          <div className="absolute top-full mt-1 left-0 bg-white border border-gray-300 rounded shadow-lg z-50 min-w-64">
            <div className="p-2 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Auto Backups</span>
                <button
                  onClick={clearAutoBackups}
                  className="text-xs text-red-600 hover:text-red-800"
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="max-h-48 overflow-y-auto">
              {getAutoBackups().map((backup, index) => (
                <div
                  key={backup.timestamp}
                  className="p-2 border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => loadAutoBackup(backup.data)}
                >
                  <div className="text-sm">
                    Backup #{index + 1}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(backup.timestamp).toLocaleString()}
                  </div>
                </div>
              ))}
              {getAutoBackups().length === 0 && (
                <div className="p-2 text-sm text-gray-500 text-center">
                  No backups available
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Project Stats */}
      <div className="text-xs text-gray-600 ml-auto">
        {stats.elements} elements • {stats.groups} groups • {stats.animations} animations
      </div>

      {/* Loading Indicator */}
      {isLoading && (
        <div className="text-sm text-blue-600">
          Loading...
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="text-sm text-red-600 max-w-48 truncate" title={error}>
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
} 