'use client'

import { useState, useRef, useEffect } from 'react'
import { User, CreditCard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserAvatarProps {
  className?: string
  showDropdown?: boolean
}

export function UserAvatar({ className = '', showDropdown = true }: UserAvatarProps) {
  const { isAuthenticated, session } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  // Helper function to get user initials from name
  const getUserInitials = (name?: string): string => {
    if (!name) return '';
    
    const names = name.trim()?.split(' ');
    if (names.length === 1) {
      return names[0].charAt(0).toUpperCase();
    }
    
    return (names[0].charAt(0) + names[names.length - 1].charAt(0)).toUpperCase();
  }

  const userInitials = getUserInitials(session?.user?.name)
  const userName = session?.user?.name
  const userEmail = session?.user?.email

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if click is on container or dropdown
      const isClickOnContainer = containerRef.current?.contains(target);
      
      // Only close if click is outside container (which includes both avatar and dropdown)
      if (!isClickOnContainer) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen])

  // Secure logout function that implements dual logout
  const handleSecureLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    setIsLoggingOut(true);
    setIsOpen(false);
    
    try {
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      
      router.push('/login'); 
    } catch (error) {
      // Fallback: force redirect to login
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

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
      name: isLoggingOut ? 'Logging out...' : 'Logout',
      href: '#',
      icon: LogOut,
      onClick: handleSecureLogout,
      disabled: isLoggingOut,
    },
  ]

  if (!isAuthenticated || !userInitials) {
    return null
  }

  if (!showDropdown) {
    return (
      <div 
        className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center border border-indigo-300 transition-colors duration-200"
      >
        <span className="text-indigo-800 text-sm font-semibold">{userInitials}</span>
      </div>
    )
  }

  return (
    <div className="relative" ref={containerRef}>
      <div 
        className="h-9 w-9 rounded-full bg-slate-300 flex items-center justify-center border border-indigo-300 hover:bg-slate-200 transition-colors duration-200 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-indigo-800 text-sm font-semibold">{userInitials}</span>
      </div>
      
      {isOpen && (
        <div 
          ref={dropdownRef}
          className="absolute right-0 z-[60] mt-2 w-64 origin-top-right rounded-xl bg-white/95 backdrop-blur-sm px-4 py-6 text-sm font-semibold text-gray-700 shadow-xl shadow-gray-200/50 ring-1 ring-gray-200/50"
        >
          {/* User info header */}
          <div className="border-b border-gray-200 pb-3 mb-3">
            <div className="flex items-center gap-x-3">
              <div className="h-8 w-8 rounded-full bg-purple-200 flex items-center justify-center">
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
                onClick={(e) => {
                  if (item.onClick) {
                    e.preventDefault()
                    item.onClick()
                  }
                  setIsOpen(false)
                }}
                className={`flex items-center gap-x-3 p-2 rounded-lg transition-colors duration-200 ${
                  item.disabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'hover:bg-gray-50 hover:text-indigo-600'
                }`}
              >
                <Icon className={`size-4 ${item.disabled ? 'text-gray-400' : 'text-gray-500'}`} />
                {item.name}
              </a>
            )
          })}
        </div>
      )}
    </div>
  )
} 