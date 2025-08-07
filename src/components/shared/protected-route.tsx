"use client"

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export default function ProtectedRoute({ children, fallback }: ProtectedRouteProps) {
  const { isAuthenticated, loading, validateSession } = useAuth();
  const router = useRouter();
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  // Validate session when component mounts
  useEffect(() => {
    if (isAuthenticated && !loading) {
      setIsValidating(true);
      validateSession().then((isValid) => {
        if (!isValid) {
          // Session is invalid, redirect to login
          router.push('/login');
        }
      }).finally(() => {
        setIsValidating(false);
      });
    }
  }, [isAuthenticated, loading, validateSession, router]);

  if (loading || isValidating) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
} 