import { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth-context';

interface UseSessionValidationOptions {
  interval?: number; // Validation interval in milliseconds
  onInvalidSession?: () => void;
}

/**
 * Hook for automatic session validation
 * Validates the session at regular intervals and on specific events
 */
export function useSessionValidation(options: UseSessionValidationOptions = {}) {
  const { validateSession, isAuthenticated } = useAuth();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const { interval = 5 * 60 * 1000, onInvalidSession } = options; // Default: 5 minutes

  // Start periodic validation
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const startValidation = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      intervalRef.current = setInterval(async () => {
        const isValid = await validateSession();
        if (!isValid && onInvalidSession) {
          onInvalidSession();
        }
      }, interval);
    };

    // Initial validation
    validateSession().then((isValid) => {
      if (!isValid && onInvalidSession) {
        onInvalidSession();
        return;
      }
      startValidation();
    });

    // Cleanup on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, validateSession, interval, onInvalidSession]);

  // Validate on window focus (user returns to tab)
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleFocus = async () => {
      const isValid = await validateSession();
      if (!isValid && onInvalidSession) {
        onInvalidSession();
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [isAuthenticated, validateSession, onInvalidSession]);

  // Validate on online status change
  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }

    const handleOnline = async () => {
      const isValid = await validateSession();
      if (!isValid && onInvalidSession) {
        onInvalidSession();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated, validateSession, onInvalidSession]);

  return {
    validateSession,
  };
}
