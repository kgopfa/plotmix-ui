'use client';

import React, { useEffect, useState } from 'react';
import { WebGLErrorHandler } from '@/lib/webgl-error-handler';

interface WebGLSupportCheckerProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onWebGLNotSupported?: () => void;
  onWebGLSupported?: () => void;
}

interface WebGLSupportState {
  isSupported: boolean;
  isChecking: boolean;
  error?: string;
  contextType?: 'webgl2' | 'webgl' | 'experimental-webgl' | null;
}

/**
 * Component that checks WebGL support and provides fallback UI if needed
 */
export function WebGLSupportChecker({ 
  children, 
  fallback, 
  onWebGLNotSupported,
  onWebGLSupported 
}: WebGLSupportCheckerProps) {
  const [supportState, setSupportState] = useState<WebGLSupportState>({
    isSupported: false,
    isChecking: true
  });

  useEffect(() => {
    const checkWebGLSupport = () => {
      try {
        const result = WebGLErrorHandler.checkWebGLSupport();
        
        if (result.supported && result.context) {
          // Determine context type
          let contextType: 'webgl2' | 'webgl' | 'experimental-webgl' | null = null;
          const canvas = document.createElement('canvas');
          
          if (canvas.getContext('webgl2')) {
            contextType = 'webgl2';
          } else if (canvas.getContext('webgl')) {
            contextType = 'webgl';
          } else if (canvas.getContext('experimental-webgl')) {
            contextType = 'experimental-webgl';
          }

          setSupportState({
            isSupported: true,
            isChecking: false,
            contextType
          });

          onWebGLSupported?.();
        } else {
          setSupportState({
            isSupported: false,
            isChecking: false,
            error: 'WebGL is not supported on this device'
          });

          onWebGLNotSupported?.();
        }
      } catch (error) {
        setSupportState({
          isSupported: false,
          isChecking: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });

        onWebGLNotSupported?.();
      }
    };

    // Check immediately
    checkWebGLSupport();
  }, [onWebGLNotSupported, onWebGLSupported]);

  // Show loading state while checking - use same 3-dot pattern as the rest of the app
  if (supportState.isChecking) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-100">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
        </div>
      </div>
    );
  }

  // Show fallback if WebGL is not supported
  if (!supportState.isSupported) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
          <div className="flex items-center mb-4">
            <div className="flex-shrink-0">
              <svg className="h-8 w-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-gray-900">
                Graphics Not Supported
              </h3>
            </div>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-600">
              Your device or browser doesn't support WebGL, which is required for the graphics features in this application.
            </p>
          </div>

          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Try these solutions:</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Update your browser to the latest version</li>
              <li>• Enable hardware acceleration in your browser settings</li>
              <li>• Try using Chrome, Firefox, or Safari</li>
              <li>• Check if your graphics drivers are up to date</li>
            </ul>
          </div>

          <div className="flex flex-col gap-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
            
            <button
              onClick={() => {
                const url = new URL(window.location.href);
                url.searchParams.set('forceCanvas', 'true');
                window.location.href = url.toString();
              }}
              className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
            >
              Use Canvas Renderer
            </button>
          </div>

          {supportState.error && (
            <details className="mt-4">
              <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                Technical Details
              </summary>
              <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600">
                {supportState.error}
              </div>
            </details>
          )}
        </div>
      </div>
    );
  }

  // WebGL is supported, render children
  return <>{children}</>;
}

/**
 * Hook to check WebGL support programmatically
 */
export function useWebGLSupport() {
  const [supportState, setSupportState] = useState<WebGLSupportState>({
    isSupported: false,
    isChecking: true
  });

  useEffect(() => {
    const checkSupport = () => {
      try {
        const result = WebGLErrorHandler.checkWebGLSupport();
        
        if (result.supported && result.context) {
          let contextType: 'webgl2' | 'webgl' | 'experimental-webgl' | null = null;
          const canvas = document.createElement('canvas');
          
          if (canvas.getContext('webgl2')) {
            contextType = 'webgl2';
          } else if (canvas.getContext('webgl')) {
            contextType = 'webgl';
          } else if (canvas.getContext('experimental-webgl')) {
            contextType = 'experimental-webgl';
          }

          setSupportState({
            isSupported: true,
            isChecking: false,
            contextType
          });
        } else {
          setSupportState({
            isSupported: false,
            isChecking: false,
            error: 'WebGL is not supported'
          });
        }
      } catch (error) {
        setSupportState({
          isSupported: false,
          isChecking: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    };

    checkSupport();
  }, []);

  return supportState;
}
