import { AnimatedCanvasElement } from './Canvas';

interface InspectorProps {
  selectedElement: AnimatedCanvasElement | null;
  onInspectorChange: (prop: string, value: string | number | boolean) => void;
  onAddAnimation: (elementId: string) => void;
}

export function Inspector({ selectedElement, onInspectorChange, onAddAnimation }: InspectorProps) {
  if (!selectedElement) {
    return (
      <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
        <h3 className="font-semibold mb-2">Inspector</h3>
        <p>Select an element to edit properties</p>
      </aside>
    );
  }
 
  return (
    <aside className="w-72 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
      <h3 className="font-semibold mb-2">Inspector</h3>
      <form className="flex flex-col gap-2">
        <label>
          Name:
          <input
            type="text"
            value={selectedElement.name}
            onChange={e => onInspectorChange('name', e.target.value)}
            className="w-full px-2 py-1 border rounded"
          />
        </label>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            onAddAnimation(selectedElement.id);
          }}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          + Add Animation
        </button>

        <label>
          X:
          <input
            type="number"
            value={selectedElement.x}
            onChange={e => onInspectorChange('x', Number(e.target.value))}
          />
        </label>
        <label>
          Y:
          <input
            type="number"
            value={selectedElement.y}
            onChange={e => onInspectorChange('y', Number(e.target.value))}
          />
        </label>
        <label>
          Width:
          <input
            type="number"
            value={selectedElement.width}
            onChange={e => onInspectorChange('width', Number(e.target.value))}
          />
        </label>
        <label>
          Height:
          <input
            type="number"
            value={selectedElement.height}
            onChange={e => onInspectorChange('height', Number(e.target.value))}
          />
        </label>
        {selectedElement.type === 'rectangle' && (
          <label>
            Border Radius:
            <input
              type="number"
              value={selectedElement.cornerRadius ?? 0}
              onChange={e => onInspectorChange('cornerRadius', Number(e.target.value))}
            />
          </label>
        )}
        {(selectedElement.type === 'circle' || selectedElement.type === 'triangle') && (
          <label>
            Radius:
            <input
              type="number"
              value={selectedElement.radius ?? 0}
              onChange={e => onInspectorChange('radius', Number(e.target.value))}
            />
          </label>
        )}
        <label>
          Border:
          <input
            type="color"
            value={selectedElement.stroke ?? '#000000'}
            onChange={e => onInspectorChange('stroke', e.target.value)}
          />
        </label>
        <label>
          Border Width:
          <input
            type="number"
            value={selectedElement.strokeWidth ?? 1}
            onChange={e => onInspectorChange('strokeWidth', Number(e.target.value))}
          />
        </label>
        <label>
          Fill:
          <input
            type="color"
            value={selectedElement.fill}
            onChange={e => onInspectorChange('fill', e.target.value)}
          />
        </label>
        <label>
          Opacity:
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            value={selectedElement.opacity ?? 1}
            onChange={e => onInspectorChange('opacity', Number(e.target.value))}
          />
        </label>
        <label>
          <input
            type="checkbox"
            checked={selectedElement.shadowEnabled ?? false}
            onChange={e => onInspectorChange('shadowEnabled', e.target.checked)}
          />
          Shadow enabled
        </label>
        <fieldset
          disabled={!selectedElement.shadowEnabled}
          className={
            'flex flex-col gap-2 ' +
            (!selectedElement.shadowEnabled ? 'opacity-50 pointer-events-none' : '')
          }
        >
          <label>
            Shadow Color:
            <input
              type="color"
              value={selectedElement.shadowColor ?? '#000000'}
              onChange={e => onInspectorChange('shadowColor', e.target.value)}
            />
          </label>
          <label>
            Shadow Blur:
            <input
              type="number"
              value={selectedElement.shadowBlur ?? 0}
              onChange={e => onInspectorChange('shadowBlur', Number(e.target.value))}
            />
          </label>
          <label>
            Shadow Offset X:
            <input
              type="number"
              value={selectedElement.shadowOffsetX ?? 10}
              onChange={e => onInspectorChange('shadowOffsetX', Number(e.target.value))}
            />
          </label>
          <label>
            Shadow Offset Y:
            <input
              type="number"
              value={selectedElement.shadowOffsetY ?? 10}
              onChange={e => onInspectorChange('shadowOffsetY', Number(e.target.value))}
            />
          </label>
          <label>
            Shadow Opacity:
            <input
              type="number"
              min={0}
              max={1}
              step={0.01}
              value={selectedElement.shadowOpacity ?? 0.5}
              onChange={e => onInspectorChange('shadowOpacity', Number(e.target.value))}
            />
          </label>
        </fieldset>
      </form>
    </aside>
  );
} 