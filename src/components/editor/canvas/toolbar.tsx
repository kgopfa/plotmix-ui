interface ToolbarProps {
  currentTool: 'select' | 'rectangle' | 'circle' | 'triangle';
  onToolChange: (tool: 'select' | 'rectangle' | 'circle' | 'triangle') => void;
}

export function Toolbar({ currentTool, onToolChange }: ToolbarProps) {
  return (
    <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-white shadow rounded flex gap-2 p-2 z-10">
      <button
        className={`btn flex items-center gap-1 ${currentTool === 'rectangle' ? 'bg-gray-100' : ''}`}
        onClick={() => onToolChange('rectangle')}
      >
        <span>🔲</span>
        <span>Rectangle</span>
      </button>
      <button
        className={`btn flex items-center gap-1 ${currentTool === 'circle' ? 'bg-gray-100' : ''}`}
        onClick={() => onToolChange('circle')}
      >
        <span>⭕</span>
        <span>Circle</span>
      </button>
      <button
        className={`btn flex items-center gap-1 ${currentTool === 'triangle' ? 'bg-gray-100' : ''}`}
        onClick={() => onToolChange('triangle')}
      >
        <span>△</span>
        <span>Triangle</span>
      </button>
    </div>
  );
} 