import { useCallback, useState } from 'react';
import { ProjectManager } from '@/lib/project-manager';
import { ProjectLoadOptions, ProjectSaveOptions } from '@/types/project';

interface ProjectManagerHook {
  // Core operations
  saveProject: (name?: string, options?: ProjectSaveOptions) => string;
  loadProject: (jsonData: string, options?: ProjectLoadOptions) => Promise<void>;
  
  // File operations
  downloadProject: (name?: string, options?: ProjectSaveOptions) => void;
  loadFromFile: (file: File, options?: ProjectLoadOptions) => Promise<void>;
  
  // Utilities
  validateProject: (jsonData: string) => Promise<boolean>;
  createBackup: () => string;
  getProjectStats: () => { elements: number; groups: number; animations: number };
  
  // State
  isLoading: boolean;
  error: string | null;
}

export function useProjectManager(): ProjectManagerHook {
  const projectManager = ProjectManager.getInstance();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProject = useCallback((name?: string, options?: ProjectSaveOptions) => {
    try {
      setError(null);
      const jsonData = projectManager.saveProject(name, options);
      return jsonData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Save failed';
      setError(errorMessage);
      console.error('Save failed:', error);
      throw error;
    }
  }, [projectManager]);

  const loadProject = useCallback(async (jsonData: string, options?: ProjectLoadOptions) => {
    try {
      setIsLoading(true);
      setError(null);
      await projectManager.loadProject(jsonData, options);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Load failed';
      setError(errorMessage);
      console.error('Load failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [projectManager]);

  const downloadProject = useCallback((name?: string, options?: ProjectSaveOptions) => {
    try {
      const jsonData = saveProject(name, options);
      const blob = new Blob([jsonData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${name || 'project'}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
      throw error;
    }
  }, [saveProject]);

  const loadFromFile = useCallback((file: File, options?: ProjectLoadOptions) => {
    return new Promise<void>((resolve, reject) => {
      if (!file.type.includes('json') && !file.name.endsWith('.json')) {
        const error = new Error('Please select a valid JSON file');
        setError(error.message);
        reject(error);
        return;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const jsonData = e.target?.result as string;
          if (!jsonData) {
            throw new Error('Failed to read file content');
          }
          await loadProject(jsonData, options);
          resolve();
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => {
        const error = new Error('Failed to read file');
        setError(error.message);
        reject(error);
      };
      reader.readAsText(file);
    });
  }, [loadProject]);

  const validateProject = useCallback(async (jsonData: string) => {
    try {
      setError(null);
      await projectManager.loadProject(jsonData, { validateOnly: true });
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setError(errorMessage);
      return false;
    }
  }, [projectManager]);

  const createBackup = useCallback(() => {
    try {
      setError(null);
      return projectManager.createBackup();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Backup failed';
      setError(errorMessage);
      throw error;
    }
  }, [projectManager]);

  const getProjectStats = useCallback(() => {
    try {
      return projectManager.getProjectStats();
    } catch (error) {
      console.error('Failed to get project stats:', error);
      return { elements: 0, groups: 0, animations: 0 };
    }
  }, [projectManager]);

  return {
    saveProject,
    loadProject,
    downloadProject,
    loadFromFile,
    validateProject,
    createBackup,
    getProjectStats,
    isLoading,
    error,
  };
}

/**
 * Hook for auto-backup functionality
 */
export function useAutoBackup(intervalMinutes: number = 5) {
  const { createBackup } = useProjectManager();

  const startAutoBackup = useCallback(() => {
    const interval = setInterval(() => {
      try {
        const backup = createBackup();
        // Store in localStorage with timestamp
        const timestamp = new Date().toISOString();
        localStorage.setItem(`auto-backup-${timestamp}`, backup);
        
        // Keep only last 5 auto-backups
        const allKeys = Object.keys(localStorage).filter(key => key.startsWith('auto-backup-'));
        if (allKeys.length > 5) {
          allKeys.sort();
          localStorage.removeItem(allKeys[0]);
        }
        
        console.log(`Auto-backup created at ${timestamp}`);
      } catch (error) {
        console.error('Auto-backup failed:', error);
      }
    }, intervalMinutes * 60 * 1000);

    return () => clearInterval(interval);
  }, [createBackup, intervalMinutes]);

  const getAutoBackups = useCallback(() => {
    const backups: Array<{ timestamp: string; data: string }> = [];
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('auto-backup-'));
    
    allKeys.forEach(key => {
      const timestamp = key.replace('auto-backup-', '');
      const data = localStorage.getItem(key);
      if (data) {
        backups.push({ timestamp, data });
      }
    });
    
    return backups.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, []);

  const clearAutoBackups = useCallback(() => {
    const allKeys = Object.keys(localStorage).filter(key => key.startsWith('auto-backup-'));
    allKeys.forEach(key => localStorage.removeItem(key));
  }, []);

  return {
    startAutoBackup,
    getAutoBackups,
    clearAutoBackups,
  };
} 