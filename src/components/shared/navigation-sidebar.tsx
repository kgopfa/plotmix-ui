'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  X,
  Menu,
  User,
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
  
  const names = name.trim().split(' ');
  if (names.length === 1) {
    return names[0].charAt(0).toUpperCase();
  }
  
  return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
}

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
                <div className="h-8 w-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
                  <span className="text-white font-bold text-sm">R</span>
                </div>
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

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-50 lg:block lg:w-20 lg:overflow-y-auto lg:bg-white lg:border-r lg:border-gray-200">
        <div className="flex flex-col items-center h-full">
          <div className="flex h-16 shrink-0 items-center justify-center mt-6">
            <div className="h-10 w-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <span className="text-white font-bold text-sm">R</span>
            </div>
          </div>
          <nav className="mt-6 pb-6 flex-1">
            <ul role="list" className="flex flex-col items-center space-y-3">
              {navigation.map((item) => (
                <li key={item.name}>
                  <div className="relative">
                    <Link
                      href={item.href}
                      className={classNames(
                        `${item.color} ${item.hoverColor} hover:shadow-md`,
                        'relative group flex flex-col items-center justify-center w-10 h-10 rounded-lg font-medium transition-all duration-200 ease-out transform hover:scale-105 active:scale-95',
                      )}
                    >
                      <item.icon
                        aria-hidden="true"
                        className="w-5 h-5 transition-all duration-200 group-hover:scale-110"
                      />
                      <span className="sr-only">{item.name}</span>
                    </Link>
                  </div>
                </li>
              ))}
            </ul>
          </nav>
          
          {/* User avatar at bottom - only show if authenticated */}
          {isAuthenticated && userInitials && (
            <div className="mb-6">
              <UserAvatar showDropdown={true} />
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