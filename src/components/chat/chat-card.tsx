import React from 'react';
import { MessagesSquare, Trash2 } from 'lucide-react';

export interface ChatCardProps {
  title: string;
  lastMessageAt?: string | Date | null;
  messageCount?: number;
  onClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

function formatRelativeTime(date: Date | null) {
  if (!date) return 'No messages yet';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);
  const weeks = Math.floor(days / 7);
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  return `${weeks}w ago`;
}

export function ChatCard({ title, lastMessageAt, messageCount, onClick, onDelete, isDeleting }: ChatCardProps) {
  const lastDate = lastMessageAt ? new Date(lastMessageAt) : null;
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-purple-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-x-3">
        <MessagesSquare className="size-5 text-gray-700 mt-0.5" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-x-2">
            <h3 className="font-semibold text-gray-900 truncate">{title || 'Untitled chat'}</h3>
          </div>
          <div className="mt-1 flex items-center gap-x-3 text-xs text-gray-500">
            <span>Last message {formatRelativeTime(lastDate)}</span>
            {typeof messageCount === 'number' && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span>{messageCount} messages</span>
              </>
            )}
          </div>
        </div>
        {onDelete && (
          <div className="ml-auto">
            <button
              type="button"
              aria-label="Delete conversation"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDeleting) onDelete();
              }}
              className={`p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
              disabled={isDeleting}
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


