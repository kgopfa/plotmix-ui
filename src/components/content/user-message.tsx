interface UserMessageProps {
  message: string;
  timestamp?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message, timestamp }) => {
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
    <div className="flex justify-end mb-6">
      <div className="bg-gray-50 text-gray-800 border border-gray-200 rounded-xl px-4 py-3 max-w-xs">
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <p className="text-xs text-gray-500 mt-2 opacity-80">
            {formatTimestamp(timestamp)}
          </p>
        )}
      </div>
    </div>
  );
}; 