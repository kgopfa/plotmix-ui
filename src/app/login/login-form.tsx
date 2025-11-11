"use client"

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginForm() {
  const router = useRouter();

  // MVP: Auth disabled - redirect to chat immediately
  useEffect(() => {
    router.push('/chat');
  }, [router]);

  // Show loading while redirecting
  return (
    <div className="flex min-h-screen items-center justify-center bg-white">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
}
