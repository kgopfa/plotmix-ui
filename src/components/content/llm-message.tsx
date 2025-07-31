import { Copy, Share, ThumbsDown, ThumbsUp } from "lucide-react";

interface LLMMessageProps {
  message: string;
  timestamp?: string;
}

export const LLMMessage: React.FC<LLMMessageProps> = ({ message }) => {
  return (
    <div className="flex justify-start mb-2">
      <div className="px-4 py-3 w-full">
        <div className="flex items-start space-x-2">
          <div className="flex-1">
            <p className="text-sm text-gray-800 leading-relaxed">{message}</p>
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