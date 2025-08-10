'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Palette, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';

type SecondaryAction = 'chat' | 'project';

interface QuickActionButtonsProps {
  secondary?: SecondaryAction; // 'chat' renders New Chat, 'project' renders New Project
  className?: string;
  heightClass?: string; // e.g., 'h-9' (default)
}

interface CreateProjectResponse {
  success: boolean;
  data?: { project?: { id: string } };
  project?: { id: string }; // fallback in case API shape differs
}

export function QuickActionButtons({ className, heightClass = 'h-9' }: QuickActionButtonsProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = React.useState(false);

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

  const baseButtonClasses = `flex flex-row items-center cursor-pointer gap-x-1 bg-transparent border border-gray-300 text-gray-700 px-4 rounded-lg text-xs font-semibold disabled:opacity-60 ${heightClass}`;

  return (
    <div className={['flex flex-row items-center gap-x-4', className].filter(Boolean).join(' ')}>
      <button
        type="button"
        onClick={createAndOpenDesigner}
        disabled={isCreating}
        className={baseButtonClasses}
      >
        <Palette strokeWidth={2.25} className="size-4 text-blue-500" />
        {isCreating ? 'Creating…' : 'New Project'}
      </button>

      <Link href="/chat" className={baseButtonClasses}>
        <Sparkles className="size-4 text-purple-500" />
        New Chat
      </Link>
    </div>
  );
}

export default QuickActionButtons;


