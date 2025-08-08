import React from 'react';
import { Trash2 } from 'lucide-react';

export interface ProjectCardProps {
  title: string;
  lastUpdatedAt?: string | Date;
  version?: string;
  onClick?: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (checked: boolean) => void;
}

function formatRelativeTime(date?: string | Date) {
  if (!date) return 'No updates yet';
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const sec = Math.floor(diffMs / 1000);
  const min = Math.floor(sec / 60);
  const hrs = Math.floor(min / 60);
  const days = Math.floor(hrs / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  if (sec < 60) return `${sec}s ago`;
  if (min < 60) return `${min}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  if (days < 7) return `${days}d ago`;
  if (weeks < 4) return `${weeks}w ago`;
  return `${months}mo ago`;
}

export function ProjectCard({
  title,
  lastUpdatedAt,
  version,
  onClick,
  onDelete,
  isDeleting,
  selectable = false,
  selected = false,
  onToggleSelect,
}: ProjectCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.(); }}
      className="text-left bg-white border border-gray-200 rounded-2xl p-4 hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer"
    >
      <div className="flex items-start gap-x-3">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 truncate">{title}</h3>
          <div className="mt-1 flex items-center gap-x-3 text-xs text-gray-500">
            <span>Last update {formatRelativeTime(lastUpdatedAt)}</span>
            {version && (
              <>
                <span className="w-1 h-1 bg-gray-300 rounded-full" />
                <span className='bg-gray-100 px-1.5 py-0.5 rounded-sm text-gray-600 text-xs font-medium'>v{version}</span>
              </>
            )}
          </div>
        </div>
        {(selectable || onDelete) && (
          <div className="ml-auto flex items-center gap-x-2">
            {selectable && (
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-gray-200 text-blue-600 accent-blue-600 focus:ring-0 focus:outline-none"
                checked={selected}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => {
                  e.stopPropagation();
                  onToggleSelect?.(e.target.checked);
                }}
                aria-label="Select project"
              />
            )}
            {onDelete && (
              <button
                type="button"
                aria-label="Delete project"
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDeleting) onDelete();
                }}
                className={`p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors ${isDeleting ? 'opacity-60 cursor-not-allowed' : ''}`}
                disabled={isDeleting}
              >
                <Trash2 className="size-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}


