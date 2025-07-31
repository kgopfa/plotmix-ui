interface UserMessageProps {
  message: string;
  timestamp?: string;
}

export const UserMessage: React.FC<UserMessageProps> = ({ message, timestamp }) => {
  return (
    <div className="flex justify-end mb-6">
      <div className="bg-indigo-500 text-white shadow-sm rounded-lg px-4 py-3 max-w-xs">
        <p className="text-sm leading-relaxed">{message}</p>
        {timestamp && (
          <p className="text-xs text-indigo-100 mt-2 opacity-80">
            {timestamp}
          </p>
        )}
      </div>
    </div>
  );
}; 