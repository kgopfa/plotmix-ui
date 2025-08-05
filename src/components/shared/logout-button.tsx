"use client"

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const { signOut, session } = useAuth();
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // Prevent multiple logout attempts
    
    setIsLoggingOut(true);
    
    try {
      // First, call backend logout to blacklist the token
      if (session?.accessToken) {
        // Extract the actual token string from the accessToken object
        const tokenString = typeof session.accessToken === 'string' 
          ? session.accessToken 
          : JSON.stringify(session.accessToken);
        
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${tokenString}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          console.warn('Backend logout failed, but continuing with frontend logout');
        }
      }

      // Then, call NextAuth signOut to clear frontend session
      await signOut();
      
      // Redirect to login page
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Even if there's an error, try to clear the frontend session
      await signOut();
      router.push('/login');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
      disabled={isLoggingOut}
    >
      {isLoggingOut ? 'Signing out...' : (children || 'Sign Out')}
    </button>
  );
} 