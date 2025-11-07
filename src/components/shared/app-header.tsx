'use client';

import QuickActionButtons from '@/components/shared/quick-action-buttons';

type AppHeaderProps = {
  secondary?: 'chat' | 'content' | 'none' | string;
};

export function AppHeader({ secondary = 'none' }: AppHeaderProps) {
  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 sm:px-6 md:px-6 lg:px-8">
      <div className="ml-auto flex items-center gap-x-4">
        <QuickActionButtons secondary={secondary as any} />
      </div>
    </div>
  );
}

export default AppHeader;


