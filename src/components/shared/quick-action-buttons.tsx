'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Palette, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';

type SecondaryAction = 'chat' | 'project';

interface QuickActionButtonsProps {
  secondary?: SecondaryAction; // 'chat' renders New Chat, 'project' renders New Project
  className?: string;
  heightClass?: string; // e.g., 'h-9' (default)
  borderColorClass?: string; // tailwind color class e.g., 'border-blue-500'
}

interface CreateProjectResponse {
  success: boolean;
  data?: { project?: { id: string } };
  project?: { id: string }; // fallback in case API shape differs
}

export function QuickActionButtons({ className, heightClass = 'h-9', borderColorClass = 'border-gray-300' }: QuickActionButtonsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);
  const { isAuthenticated } = useAuth();

  const createAndOpenDesigner = async () => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const res = await apiClient.post<CreateProjectResponse>('/api/projects');
      const projectId = res?.data?.project?.id || (res as any)?.project?.id;
      if (!projectId) throw new Error('Missing project id');
      router.push(`/designer/${projectId}`);
    } catch (err) {
      console.error('Failed to create project', err);
    } finally {
      setIsCreating(false);
    }
  };

  // Show login link when not authenticated (marketing header style)
  if (!isAuthenticated) {
    return (
      <Link href="/login" className="text-sm font-semibold text-gray-900 hover:text-indigo-600">
        Sign in <span aria-hidden="true">&rarr;</span>
      </Link>
    );
  }

  const baseButtonClasses = `flex flex-row items-center cursor-pointer gap-x-1 bg-transparent border text-gray-700 px-4 rounded-lg text-xs font-semibold disabled:opacity-60 ${heightClass}`;
  // Ensure borderColorClass wins over any border color in className by appending last
  const buttonClasses = [baseButtonClasses, className, borderColorClass]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="flex flex-row items-center gap-x-4">
      <button
        type="button"
        onClick={createAndOpenDesigner}
        disabled={isCreating}
        className={buttonClasses}
      >
        <Palette strokeWidth={2.25} className="size-4 text-blue-500" />
        {isCreating ? 'Creating…' : 'New Project'}
      </button>

      <Link href="/chat" className={buttonClasses}>
        <Sparkles className="size-4 text-purple-500" />
        New Chat
      </Link>
    </div>
  );
}

export default QuickActionButtons;


