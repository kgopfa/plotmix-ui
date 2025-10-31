'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  X,
  Menu,
} from 'lucide-react';
import { Dialog, DialogBackdrop, DialogPanel, TransitionChild } from '@headlessui/react';
import { useAuth } from '@/lib/auth-context';
import { UserAvatar } from './user-avatar';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string;
  strokeWidth?: number;
}

interface NavigationSidebarProps {
  navigation: NavigationItem[];
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

// Helper function to get user initials from name
function getUserInitials(name?: string): string {
  if (!name) return '';
  
  const names = name.trim()?.split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

// Tooltip removed in favor of expanding sidebar with inline labels

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({ navigation }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { session, isAuthenticated } = useAuth();
  
  const userInitials = getUserInitials(session?.user?.name);

  return (
    <>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <X aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>

            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-2 ring-1 ring-gray-200">
              <div className="flex h-16 shrink-0 items-center">
                <Link href="/" className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-shadow duration-200">
                  <span className="text-white font-bold text-sm">P</span>
                </Link>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="-mx-2 flex-1 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        className={classNames(
                          `${item.color} ${item.hoverColor}`,
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold transition-all duration-200 ease-out transform hover:scale-105 active:scale-95',
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className="w-5 h-5 transition-all duration-200 group-hover:scale-110"
                          strokeWidth={item.strokeWidth}
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
              
              {/* User avatar at bottom - only show if authenticated */}
              {isAuthenticated && userInitials && (
                <div className="px-2 py-3">
                  <UserAvatar showDropdown={true} />
                </div>
              )}
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop - expands on hover to reveal labels */}
      <div className="group hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:hover:w-64 lg:overflow-visible lg:bg-white lg:border-r lg:border-gray-200 transition-[width] duration-200 ease-out">
        <div className="flex flex-col h-full overflow-x-visible w-full">
          <div className="flex h-16 shrink-0 items-center mt-6">
            <div className="w-20 flex justify-center">
              <Link href="/" className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-xl transition-shadow duration-200">
                <span className="text-white font-bold text-sm">P</span>
              </Link>
            </div>
          </div>
          <nav className="mt-6 pb-6 flex-1 overflow-y-auto overflow-x-visible">
            <ul role="list" className="flex flex-col space-y-2 overflow-x-visible">
              {navigation.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={classNames(
                      `${item.color} ${item.hoverColor} hover:shadow-xs`,
                      'grid grid-cols-[80px_1fr] items-center h-10 font-medium transition-colors duration-200 ease-out focus:outline-none w-full'
                    )}
                  >
                    <div className="col-start-1 flex justify-center">
                      <item.icon aria-hidden="true" className="w-5 h-5 shrink-0" strokeWidth={item.strokeWidth} />
                    </div>
                    <div className="col-start-2 overflow-hidden">
                      <span className="block whitespace-nowrap opacity-0 w-0 mt-0.5 text-sm font-semibold group-hover:opacity-100 group-hover:w-44 transition-all duration-200 ml-0 group-hover:ml-1">
                        {item.name}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          {/* User avatar at bottom - only show if authenticated */}
          {isAuthenticated && userInitials && (
            <div className="mb-6">
              <div className="grid grid-cols-[80px_1fr] items-center h-10">
                <div className="col-start-1 flex justify-center">
                  <UserAvatar showDropdown={true} />
                </div>
                {session?.user?.name && (
                  <div className="col-start-2 overflow-hidden">
                    <span className="block whitespace-nowrap opacity-0 w-0 mt-0.5 text-sm font-semibold text-gray-500 group-hover:opacity-100 group-hover:w-44 transition-all duration-200 ml-0 group-hover:ml-1">
                      {session.user.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-white px-4 py-4 shadow-xs sm:px-6 lg:hidden border-b border-gray-200">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-gray-600 lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <Menu aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-gray-900">PlotMix AI</div>
        {/* User avatar in mobile header - only show if authenticated */}
        {isAuthenticated && userInitials && (
          <UserAvatar showDropdown={true} />
        )}
      </div>
    </>
  );
}; 