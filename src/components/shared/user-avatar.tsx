'use client'

import { Popover, PopoverButton, PopoverPanel } from '@headlessui/react'
import { User, CreditCard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from 'next-auth/react'

interface UserAvatarProps {
  className?: string
  showDropdown?: boolean
}

export function UserAvatar({ className = '', showDropdown = true }: UserAvatarProps) {
  const { isAuthenticated, session } = useAuth()

  // Helper function to get user initials from name
  const getUserInitials = (name?: string): string => {
    if (!name) return '';
    
    const names = name.trim().split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  const userInitials = getUserInitials(session?.user?.name)
  const userName = session?.user?.name
  const userEmail = session?.user?.email

  if (!isAuthenticated || !userInitials) {
    return null
  }

  const menuItems = [
    {
      name: 'Account Settings',
      href: '/settings',
      icon: User,
    },
    {
      name: 'Plan and Billing',
      href: '/billing',
      icon: CreditCard,
    },
    {
      name: 'Logout',
      href: '#',
      icon: LogOut,
      onClick: () => signOut({ callbackUrl: '/login' }),
    },
  ]

  const AvatarButton = () => (
    <div className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center border border-indigo-300 hover:bg-purple-300 transition-colors duration-200 cursor-pointer">
      <span className="text-indigo-800 text-sm font-semibold">{userInitials}</span>
    </div>
  )

  if (!showDropdown) {
    return <AvatarButton />
  }

  return (
    <Popover className="relative">
      <PopoverButton className="inline-flex items-center text-sm font-semibold text-gray-900 hover:bg-gray-50 rounded-lg p-1 transition-colors duration-200">
        <AvatarButton />
      </PopoverButton>

      <PopoverPanel
        transition
        className="absolute right-0 z-10 mt-2 flex w-screen max-w-min bg-transparent px-4 transition data-closed:translate-y-1 data-closed:opacity-0 data-enter:duration-200 data-enter:ease-out data-leave:duration-150 data-leave:ease-in"
      >
        <div className="w-56 shrink rounded-xl bg-white p-4 text-sm font-semibold text-gray-900 shadow-lg ring-1 ring-gray-900/5">
          {/* User info header */}
          <div className="border-b border-gray-200 pb-3 mb-3">
            <div className="flex items-center gap-x-3">
              <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center border border-indigo-300">
                <span className="text-indigo-800 text-xs font-semibold">{userInitials}</span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{userName || 'User'}</p>
                <p className="text-xs text-gray-500">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Menu items */}
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <a
                key={item.name}
                href={item.href}
                onClick={item.onClick}
                className="flex items-center gap-x-3 p-2 hover:bg-gray-50 hover:text-indigo-600 rounded-lg transition-colors duration-200"
              >
                <Icon className="size-4 text-gray-500" />
                {item.name}
              </a>
            )
          })}
        </div>
      </PopoverPanel>
    </Popover>
  )
} 