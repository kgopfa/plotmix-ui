import { useState, useEffect } from 'react';
import { 
  useScenes, 
  useActiveSceneId, 
  useDeleteScene, 
  useRenameScene
} from '@/stores/use-scene-store';
import { ProjectManager } from '@/lib/project-manager';
import { contextMenuManager } from '@/lib/context-menu-manager';

interface SceneContextMenuPosition {
  x: number;
  y: number;
  targetId: string;
}

interface SceneListProps {
  onSceneExpand: (sceneId: string, isExpanded: boolean) => void;
  expandedScenes: Set<string>;
}

// Scene Context Menu Component
const SceneContextMenu: React.FC<{
  contextMenu: SceneContextMenuPosition | null;
  onAction: (action: string) => void;
  onClose: () => void;
  canDelete: boolean;
}> = ({ contextMenu, onAction, canDelete }) => {
  if (!contextMenu) return null;

  return (
    <div
      className="fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[180px] text-gray-900"
      style={{
        left: contextMenu.x,
        top: contextMenu.y,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => onAction('rename')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        Rename Scene
      </button>
      
      <button
        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center gap-2"
        onClick={() => onAction('duplicate')}
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        Duplicate Scene
      </button>
      
      {canDelete && (
        <>
          <div className="border-t border-gray-100 my-1" />
          <button
            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 hover:text-red-600 flex items-center gap-2"
            onClick={() => onAction('delete')}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Scene
          </button>
        </>
      )}
    </div>
  );
};

export function SceneList({ onSceneExpand, expandedScenes }: SceneListProps) {
  // Scene management - using individual hooks to prevent re-renders
  const scenes = useScenes();
  const activeSceneId = useActiveSceneId();
  const deleteScene = useDeleteScene();
  const renameScene = useRenameScene();
  const projectManager = ProjectManager.getInstance();

  // Local state for scene interactions
  const [sceneContextMenu, setSceneContextMenu] = useState<SceneContextMenuPosition | null>(null);
  const [editingSceneName, setEditingSceneName] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  const handleNewScene = async () => {
    try {
      const newSceneId = projectManager.createScene();

      
      // Auto-expand the newly created scene
      onSceneExpand(newSceneId, true);
    } catch (error) {
      console.error('Failed to create new scene:', error);
    }
  };

  const handleSceneSwitch = async (sceneId: string) => {
    // Don't switch if it's already the active scene
    if (sceneId === activeSceneId) {
      return;
    }
    
    try {
      // For scene switching, we need to use ProjectManager to handle full scene transitions
      await projectManager.switchScene(sceneId);
    } catch (error) {
      console.error('Failed to switch scene:', error);
      // Optionally show user feedback here
    }
  };

  const toggleSceneExpansion = (sceneId: string) => {
    const isExpanded = expandedScenes.has(sceneId);
    onSceneExpand(sceneId, !isExpanded);
  };

  const handleSceneRename = (sceneId: string, newName: string) => {
    if (newName.trim() && newName !== '') {
      renameScene(sceneId, newName.trim());
    }
    setEditingSceneName(null);
    setEditingName('');
  };

  const handleSceneContextMenu = (e: React.MouseEvent, sceneId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    const menuId = 'scene-context-menu';
    contextMenuManager.openContextMenu(menuId);
    
    const targetElement = e.currentTarget as HTMLElement;
    const rect = targetElement.getBoundingClientRect();
    
    setSceneContextMenu({
      x: rect.left,
      y: rect.bottom,
      targetId: sceneId,
    });
  };

  const handleSceneContextMenuAction = (action: string) => {
    if (!sceneContextMenu) return;

    const { targetId: sceneId } = sceneContextMenu;
    const scene = scenes.find(s => s.id === sceneId);
    
    switch (action) {
      case 'rename':
        if (scene) {
          setEditingSceneName(sceneId);
          setEditingName(scene.name);
        }
        break;
      case 'duplicate':
        if (scene) {
          try {
            projectManager.duplicateScene(sceneId);
          } catch (error) {
            console.error('Failed to duplicate scene:', error);
          }
        }
        break;
      case 'delete':
        if (scenes.length > 1) {
          deleteScene(sceneId);
        } else {
          console.warn('Cannot delete the last scene');
        }
        break;
    }
    
    setSceneContextMenu(null);
  };

  // Close context menu on outside clicks
  useEffect(() => {
    const handleClickOutside = () => {
      setSceneContextMenu(null);
      contextMenuManager.closeAllContextMenus();
    };

    if (sceneContextMenu) {
      document.addEventListener('click', handleClickOutside);
      return () => {
        document.removeEventListener('click', handleClickOutside);
      };
    }
  }, [sceneContextMenu]);

  return (
    <>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold">Scenes</h3>
      </div>
      
      {/* New Scene Button */}
      <button
        className="w-full mb-3 px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        onClick={(e) => {
          e.stopPropagation();
          handleNewScene();
        }}
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 6V18M6 12H18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        New Scene
      </button>
      
      <ul>
        {scenes.map(scene => {
          const isActive = scene.id === activeSceneId;
          const isExpanded = expandedScenes.has(scene.id);
          const isEditing = editingSceneName === scene.id;
          
          return (
            <li key={scene.id}>
              <div className="flex items-center">
                {/* Expand/Collapse Button */}
                <button
                  className="w-4 h-4 flex items-center justify-center hover:bg-gray-300 rounded mr-1"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleSceneExpansion(scene.id);
                  }}
                >
                  <svg 
                    className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor" 
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                {/* Scene Name */}
                <div 
                  className={`flex-1 px-2 py-1 rounded cursor-pointer hover:bg-gray-200 flex items-center gap-2 transition-colors ${
                    isActive ? 'bg-blue-100 text-blue-600 font-medium' : ''
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isEditing) {
                      handleSceneSwitch(scene.id);
                    }
                  }}
                  onContextMenu={(e) => handleSceneContextMenu(e, scene.id)}
                >
                  <span className="text-sm">🎬</span>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onBlur={() => handleSceneRename(scene.id, editingName)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSceneRename(scene.id, editingName);
                        } else if (e.key === 'Escape') {
                          setEditingSceneName(null);
                          setEditingName('');
                        }
                      }}
                      className="flex-1 bg-white border border-blue-300 rounded px-1 text-sm"
                      autoFocus
                      onClick={(e) => e.stopPropagation()}
                    />
                  ) : (
                    <span className="flex-1">{scene.name}</span>
                  )}
                  {isActive && (
                    <span className="text-xs text-blue-500">●</span>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {/* Scene Context Menu */}
      <SceneContextMenu
        contextMenu={sceneContextMenu}
        onAction={handleSceneContextMenuAction}
        onClose={() => setSceneContextMenu(null)}
        canDelete={scenes.length > 1}
      />
    </>
  );
} 