import { ToolType } from '@/types/editor';
import { useRef } from 'react';

interface ToolbarProps {
  currentTool: ToolType;
  onToolChange: (tool: ToolType) => void;
  isPathMode?: boolean;
  onExitPathMode?: () => void;
  onSvgImport?: (file: File) => void;
}

export function Toolbar({ 
  currentTool, 
  onToolChange, 
  isPathMode, 
  onExitPathMode,
  onSvgImport 
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSvgClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
    onToolChange('svg');
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (file.type === 'image/svg+xml') {
        if (onSvgImport) {
          onSvgImport(file);
        }
      } else {
        alert('Please select an SVG file');
      }
      // Reset the input
      e.target.value = '';
    }
  };

  // Vertical toolbar used for both regular and path mode
  const renderVerticalToolbar = () => (
    <div className="absolute left-2 top-1/2 -translate-y-1/2 bg-white shadow rounded flex flex-col gap-2 p-2 z-10">
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'rectangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('rectangle')}
        title="Rectangle"
      >
        <span className="text-xl">🔲</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'circle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('circle')}
        title="Circle"
      >
        <span className="text-xl">⭕</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'triangle' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('triangle')}
        title="Triangle"
      >
        <span className="text-xl text-black">△</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'line' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('line')}
        title="Line"
      >
        <span className="text-xl">🔗</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'draw' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('draw')}
        title="Free Draw"
      >
        <span className="text-xl">✏️</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'text' ? (isPathMode ? 'bg-blue-100' : 'bg-gray-100') : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('text')}
        title="Text"
      >
        <span className="text-xl">T</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'svg' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={handleSvgClick}
        title="Import SVG"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="17 8 12 3 7 8"></polyline>
          <line x1="12" y1="3" x2="12" y2="15"></line>
        </svg>
        <span className="text-xs mt-1 text-gray-700">SVG</span>
      </button>
      <button
        className={`flex flex-col items-center justify-center p-2 ${currentTool === 'select' ? 'bg-gray-100' : 'hover:bg-gray-100'}`}
        onClick={() => onToolChange('select')}
        title="Selection Tool"
      >
        <span className="text-xl">👆</span>
      </button>
      
      {/* Hidden file input for SVG upload */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".svg,image/svg+xml"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />
    </div>
  );

  if (isPathMode) {
    return (
      <>
        {/* Path mode header */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-blue-500 text-white shadow rounded flex gap-2 p-2 z-10">
          <span className="font-medium">Drawing Animation Path</span>
          <button
            className="ml-4 bg-white text-blue-500 px-2 rounded hover:bg-gray-100"
            onClick={onExitPathMode}
          >
            Cancel
          </button>
        </div>
        
        {/* Vertical toolbar */}
        {renderVerticalToolbar()}
      </>
    );
  }
  
  return renderVerticalToolbar();
}