import { Copy, Share, ThumbsDown, ThumbsUp } from "lucide-react";

interface LLMMessageProps {
  message: string;
  timestamp?: string;
}

export const LLMMessage: React.FC<LLMMessageProps> = ({ message, timestamp }) => {
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timestamp;
    }
  };
  return (
    <div className="flex justify-start mb-2">
      <div className="px-2 py-3 w-full">
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <p className="text-sm text-gray-800 leading-relaxed">{message}</p>
            {timestamp && (
              <p className="text-xs text-gray-500 mt-1 opacity-80">
                {formatTimestamp(timestamp)}
              </p>
            )}
            <div className="flex flex-row gap-2 mt-2 -ml-2">
              <button
                type="button"
                onClick={() => {/* Place holder */ }}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {/* Place holder */ }}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ThumbsUp className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {/* Place holder */ }}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ThumbsDown className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => {/* Place holder */ }}
                className="inline-flex items-center justify-center w-10 h-10 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Share className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 