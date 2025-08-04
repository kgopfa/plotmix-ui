"use client"

import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

export default function LogoutButton({ className = '', children }: LogoutButtonProps) {
  const { signOut } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <button
      onClick={handleLogout}
      className={className}
    >
      {children || 'Sign Out'}
    </button>
  );
} 