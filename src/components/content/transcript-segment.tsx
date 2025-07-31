interface TranscriptSegmentProps {
  timestamp: string;
  text: string;
  isActive?: boolean;
  onClick?: () => void;
}

export function TranscriptSegment({ timestamp, text, isActive = false, onClick }: TranscriptSegmentProps) {
  return (
    <div 
      className={`flex items-start space-x-3 p-3 rounded-lg cursor-pointer transition-colors ${
        isActive 
          ? 'bg-indigo-50 border border-indigo-200' 
          : 'hover:bg-gray-50'
      }`}
      onClick={onClick}
    >
      <div className="flex-shrink-0">
        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-2 py-1 rounded">
          {timestamp}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-700 leading-relaxed">
          {text}
        </p>
      </div>
    </div>
  );
} 