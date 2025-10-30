'use client';

import Link from 'next/link';
import { LogIn } from 'lucide-react';
import QuickActionButtons from '@/components/shared/quick-action-buttons';
import { useAuth } from '@/lib/auth-context';

type AppHeaderProps = {
  secondary?: 'chat' | 'content' | 'none' | string;
};

export function AppHeader({ secondary = 'none' }: AppHeaderProps) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:px-6 md:px-6 lg:px-8">
      <div className="ml-auto flex items-center gap-x-4">
        {isAuthenticated ? (
          <QuickActionButtons secondary={secondary as any} />
        ) : (
          <Link
            href="/login"
            className="flex flex-row items-center justify-center gap-x-2 bg-gradient-to-r from-purple-700 to-indigo-700 text-white w-24 py-2 rounded-lg text-xs font-semibold hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 shadow-lg shadow-indigo-500/25"
          >
            <LogIn className="size-4 -ml-1" />
            Login
          </Link>
        )}
      </div>
    </div>
  );
}

export default AppHeader;


