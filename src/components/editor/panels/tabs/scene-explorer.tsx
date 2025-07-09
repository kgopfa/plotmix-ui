import { useState, useEffect } from 'react';
import { AnimatedCanvasObject, CanvasGroup } from '@/types/canvas';
import { useActiveSceneId } from '@/stores/use-scene-store';
import { SceneList } from '../scene-list';
import { ElementHierarchy } from '../element-hierarchy';

interface SceneExplorerProps {
  elements: AnimatedCanvasObject[];
  groups: CanvasGroup[];
  onElementVisibilityChange: (elementId: string, visible: boolean) => void;
  onGroupVisibilityChange: (groupId: string, visible: boolean) => void;
  onParentChange: (
    childId: string,
    newParentId: string | null,
    childType: 'element' | 'group'
  ) => void;
  onCopyElement?: (elementId: string) => void;
  onCopyGroup?: (groupId: string) => void;
  onGroupElements?: (elementIds: string[]) => void;
  onMoveToFront?: (elementId: string, isElement: boolean) => void;
  onMoveToBack?: (elementId: string, isElement: boolean) => void;
}

export function SceneExplorer(props: SceneExplorerProps) {
  const activeSceneId = useActiveSceneId();
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());

  // Ensure the active scene is always expanded
  useEffect(() => {
    if (activeSceneId && !expandedScenes.has(activeSceneId)) {
      setExpandedScenes(prev => new Set(prev).add(activeSceneId));
    }
  }, [activeSceneId, expandedScenes]);

  const handleSceneExpand = (sceneId: string, isExpanded: boolean) => {
    setExpandedScenes(prev => {
      const newSet = new Set(prev);
      if (isExpanded) {
        newSet.add(sceneId);
      } else {
        newSet.delete(sceneId);
      }
      return newSet;
    });
  };

  return (
    <div className="absolute inset-y-0 mr-2 mt-2 mb-2 w-96 bg-white border border-gray-200 shadow-lg rounded-lg p-2 text-gray-800 overflow-y-auto pb-4">
      {/* Scene list (creation, switching, rename, duplicate, delete) */}
      <SceneList onSceneExpand={handleSceneExpand} expandedScenes={expandedScenes} />

      {/* Element & group hierarchy for the active scene */}
      <ElementHierarchy
        elements={props.elements}
        groups={props.groups}
        activeSceneId={activeSceneId}
        isSceneExpanded={activeSceneId ? expandedScenes.has(activeSceneId) : false}
        onElementVisibilityChange={props.onElementVisibilityChange}
        onGroupVisibilityChange={props.onGroupVisibilityChange}
        onParentChange={props.onParentChange}
        onCopyElement={props.onCopyElement}
        onCopyGroup={props.onCopyGroup}
        onGroupElements={props.onGroupElements}
        onMoveToFront={props.onMoveToFront}
        onMoveToBack={props.onMoveToBack}
      />
    </div>
  );
}

export default SceneExplorer; 