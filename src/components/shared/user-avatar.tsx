'use client'

import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { User, CreditCard, LogOut } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'

interface UserAvatarProps {
  className?: string
  showDropdown?: boolean
}

interface DropdownPosition {
  top: number
  left: number
  transform: string
}

export function UserAvatar({ className = '', showDropdown = true }: UserAvatarProps) {
  const { isAuthenticated, session } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0, transform: '' })
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const avatarRef = useRef<HTMLDivElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

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

  // Secure logout function that implements dual logout
  const handleSecureLogout = async () => {
    console.log('=== LOGOUT FUNCTION CALLED ===');
    
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    console.log('Starting secure logout...');
    console.log('Session:', session);
    
    setIsLoggingOut(true);
    setIsOpen(false);
    
    try {
      // Test basic connectivity first
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      console.log('Testing connectivity to:', apiUrl);
      
      try {
        const healthResponse = await fetch(`${apiUrl}/api/health`);
        console.log('Health check response:', healthResponse.status, healthResponse.ok);
      } catch (healthError) {
        console.error('Health check failed:', healthError);
      }
      
      // Step 1: Backend logout (token blacklisting) via Next.js API route
      console.log('Calling Next.js API route for logout...');
      
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      console.log('Logout response status:', response.status);
      console.log('Logout response ok:', response.ok);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.warn('Backend logout failed with status:', response.status);
        console.warn('Backend logout error response:', errorText);
      } else {
        const responseData = await response.json();
        console.log('Backend logout successful:', responseData);
      }
      
      // Step 2: Frontend logout (NextAuth session clearing)
      console.log('Starting frontend logout...');
      await signOut({ 
        callbackUrl: '/login',
        redirect: false 
      });
      console.log('Frontend logout completed');
      
      // Step 3: Manual redirect to ensure proper cleanup
      console.log('Redirecting to login...');
      router.push('/login');
      
    } catch (error) {
      console.error('Logout failed:', error);
      console.error('Error details:', {
        name: (error as Error).name,
        message: (error as Error).message,
        stack: (error as Error).stack
      });
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

  // Calculate dropdown position
  const calculateDropdownPosition = () => {
    if (!avatarRef.current) return;

    const avatarRect = avatarRef.current.getBoundingClientRect();
    const dropdownHeight = 200; // Approximate height of dropdown
    const dropdownWidth = 224; // w-56 = 14rem = 224px
    
    let top = avatarRect.bottom + 8; // 8px gap below avatar
    let left = avatarRect.left;
    let transform = '';

    // Check if dropdown would go below viewport
    if (top + dropdownHeight > window.innerHeight) {
      top = avatarRect.top - dropdownHeight - 8; // Position above avatar
    }

    // Check if dropdown would go outside right edge
    if (left + dropdownWidth > window.innerWidth) {
      left = window.innerWidth - dropdownWidth - 16; // 16px margin from edge
    }

    // Check if dropdown would go outside left edge
    if (left < 16) {
      left = 16;
    }

    setDropdownPosition({ top, left, transform });
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node;
      
      // Check if click is on avatar or dropdown
      const isClickOnAvatar = avatarRef.current?.contains(target);
      const isClickOnDropdown = dropdownRef.current?.contains(target);
      
      // Only close if click is outside both avatar and dropdown
      if (!isClickOnAvatar && !isClickOnDropdown) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Recalculate position when dropdown opens
  useEffect(() => {
    if (isOpen) {
      calculateDropdownPosition();
    }
  }, [isOpen]);

  const AvatarButton = () => (
    <div 
      ref={avatarRef}
      className="h-10 w-10 rounded-full bg-purple-200 flex items-center justify-center border border-indigo-300 hover:bg-purple-300 transition-colors duration-200 cursor-pointer"
      onClick={() => {
        setIsOpen(!isOpen)
      }}
    >
      <span className="text-indigo-800 text-sm font-semibold">{userInitials}</span>
    </div>
  )

  if (!showDropdown) {
    return <AvatarButton />
  }

  return (
    <>
      <AvatarButton />
      
      {isOpen && typeof window !== 'undefined' && createPortal(
        <div 
          ref={dropdownRef}
          className="fixed z-50 w-64 border border-gray-300 rounded-xl bg-white px-4 py-6 text-sm font-semibold text-gray-700 shadow-lg ring-1 ring-gray-900/5" 
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            transform: dropdownPosition.transform
          }}
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
        </div>,
        document.body
      )}
    </>
  )
} 