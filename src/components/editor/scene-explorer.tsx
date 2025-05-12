import { AnimatedCanvasElement } from '@/types/canvas';
import { SelectionManager } from '@/lib/SelectionManager';

interface SceneExplorerProps {
  elements: AnimatedCanvasElement[];
  selectionManager: SelectionManager;
}

export function SceneExplorer({ elements, selectionManager }: SceneExplorerProps) {
  return (
    <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-r border-gray-200 p-2 overflow-y-auto text-gray-800">
      <h3 className="font-semibold mb-2">Scenes</h3>
      <ul>
        <li>
          <details open>
            <summary className="cursor-pointer hover:bg-gray-200 px-2 py-1 rounded">Scene 1</summary>
            <ul className="ml-4 mt-1 space-y-1">
              {elements.map(element => (
                <li
                  key={element.id}
                  className={`px-2 py-1 rounded cursor-pointer hover:bg-gray-200 hover:text-blue-600 ${
                    selectionManager.isSelected(element) ? 'bg-blue-100 text-blue-600' : ''
                  }`}
                  onClick={() => selectionManager.select(element)}
                >
                  {element.name}
                </li>
              ))}
              {elements.length === 0 && (
                <li className="text-sm text-gray-500 italic">No shapes added yet</li>
              )}
            </ul>
          </details>
        </li>
      </ul>
    </aside>
  );
} 