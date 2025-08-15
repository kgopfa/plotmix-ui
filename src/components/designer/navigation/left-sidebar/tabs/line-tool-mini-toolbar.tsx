import React from 'react';
import { Minus, Waves } from 'lucide-react';

export type LineType = 'straight' | 'curved';

interface LineToolMiniToolbarProps {
  isVisible: boolean;
  onLineTypeChange: (lineType: LineType) => void;
  currentLineType: LineType;
}

export const LineToolMiniToolbar: React.FC<LineToolMiniToolbarProps> = ({
  isVisible,
  onLineTypeChange,
  currentLineType
}) => {
  if (!isVisible) return null;

  return (
    <div className="absolute left-20 top-0 bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-xl flex flex-col gap-2 p-2 min-w-[120px]">
      <div className="text-xs font-medium text-gray-600 px-2 py-1 border-b border-gray-100">
        Line Type
      </div>
      
      <button
        onClick={() => onLineTypeChange('straight')}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
          currentLineType === 'straight'
            ? 'bg-blue-500 text-white shadow-md'
            : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
        }`}
        title="Straight Line"
      >
        <Minus className="w-4 h-4" />
        <span>Straight</span>
      </button>
      
              <button
          onClick={() => onLineTypeChange('curved')}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out ${
            currentLineType === 'curved'
              ? 'bg-blue-500 text-white shadow-md'
              : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
          }`}
          title="Curved Line"
        >
          <Waves className="w-4 h-4" />
          <span>Curved</span>
        </button>
    </div>
  );
};
