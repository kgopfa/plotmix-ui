'use client';

import React, { Component, ReactNode } from 'react';
import { WebGLErrorHandler, WebGLErrorInfo } from '@/lib/webgl-error-handler';

interface PIXIErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: WebGLErrorInfo | null;
  retryCount: number;
  isRecovering: boolean;
}

interface PIXIErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: WebGLErrorInfo) => void;
  onRecovery?: () => void;
  maxRetries?: number;
}

/**
 * Error Boundary specifically designed for PIXI.js applications
 * Handles WebGL context loss, shader compilation errors, and other PIXI-related issues
 */
export class PIXIErrorBoundary extends Component<PIXIErrorBoundaryProps, PIXIErrorBoundaryState> {
  private errorHandler: WebGLErrorHandler;
  private unsubscribeErrorCallback?: () => void;

  constructor(props: PIXIErrorBoundaryProps) {
    super(props);
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    };

    this.errorHandler = WebGLErrorHandler.getInstance();
  }

  componentDidMount() {
    // Subscribe to WebGL error events
    this.unsubscribeErrorCallback = this.errorHandler.onError((errorInfo) => {
      this.handleWebGLError(errorInfo);
    });
  }

  componentWillUnmount() {
    // Clean up error callback subscription
    if (this.unsubscribeErrorCallback) {
      this.unsubscribeErrorCallback();
    }
  }

  static getDerivedStateFromError(error: Error): Partial<PIXIErrorBoundaryState> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('PIXI Error Boundary caught an error:', error, errorInfo);
    
    // Create WebGL error info
    const webglErrorInfo: WebGLErrorInfo = {
      type: 'shader_compilation',
      message: error.message || 'Unknown PIXI error',
      error,
      timestamp: Date.now()
    };

    this.setState({
      errorInfo: webglErrorInfo
    });

    // Notify parent component
    this.props.onError?.(error, webglErrorInfo);
  }

  private handleWebGLError(errorInfo: WebGLErrorInfo) {
    console.log('PIXI Error Boundary received WebGL error:', errorInfo);

    // Handle different types of WebGL errors
    switch (errorInfo.type) {
      case 'context_lost':
        this.setState({
          hasError: true,
          error: errorInfo.error || new Error(errorInfo.message),
          errorInfo,
          isRecovering: true
        });
        break;
        
      case 'context_restored':
        if (this.state.hasError && this.state.isRecovering) {
          this.handleRecovery();
        }
        break;
        
      case 'shader_compilation':
        this.setState({
          hasError: true,
          error: errorInfo.error || new Error(errorInfo.message),
          errorInfo
        });
        break;
        
      case 'webgl_not_supported':
        this.setState({
          hasError: true,
          error: new Error('WebGL is not supported on this device'),
          errorInfo
        });
        break;
    }
  }

  private handleRecovery = async () => {
    const { maxRetries = 3 } = this.props;
    
    if (this.state.retryCount >= maxRetries) {
      console.error('Max retry attempts reached');
      this.setState({ isRecovering: false });
      return;
    }

    this.setState({ isRecovering: true });

    try {
      // Wait a bit before attempting recovery
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if WebGL context is available again
      const webglSupport = WebGLErrorHandler.checkWebGLSupport();
      
      if (webglSupport.supported && !this.errorHandler.isWebGLContextLost()) {
        console.log('WebGL context recovered, resetting error boundary');
        
        this.setState({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: 0,
          isRecovering: false
        });

        this.props.onRecovery?.();
      } else {
        // Increment retry count and try again
        this.setState(prevState => ({
          retryCount: prevState.retryCount + 1
        }));
        
        // Retry after a delay
        setTimeout(() => this.handleRecovery(), 2000);
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error);
      this.setState({ isRecovering: false });
    }
  };

  private handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      isRecovering: false
    });
  };

  private handleForceCanvas = () => {
    // Force canvas renderer by reloading the page with a flag
    const url = new URL(window.location.href);
    url.searchParams.set('forceCanvas', 'true');
    window.location.href = url.toString();
  };

  render() {
    if (this.state.hasError) {
      // Show custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Graphics Error
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {this.state.errorInfo?.type === 'context_lost' 
                  ? 'The graphics context was lost. This can happen when switching tabs or when the system is under heavy load.'
                  : this.state.errorInfo?.type === 'webgl_not_supported'
                  ? 'WebGL is not supported on this device. Please try using a different browser or device.'
                  : 'An error occurred while rendering graphics. This might be due to shader compilation issues or WebGL problems.'
                }
              </p>
            </div>

            {this.state.error && (
              <details className="mb-4">
                <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                  Technical Details
                </summary>
                <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32">
                  {this.state.error.message}
                  {this.state.error.stack && (
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            <div className="flex flex-col gap-2">
              {this.state.isRecovering ? (
                <div className="flex items-center justify-center py-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  <span className="ml-2 text-sm text-gray-600">Attempting recovery...</span>
                </div>
              ) : (
                <>
                  <button
                    onClick={this.handleRetry}
                    className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Try Again
                  </button>
                  
                  <button
                    onClick={this.handleForceCanvas}
                    className="w-full bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 transition-colors"
                  >
                    Use Canvas Renderer
                  </button>
                  
                  <button
                    onClick={() => window.location.reload()}
                    className="w-full bg-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-400 transition-colors"
                  >
                    Reload Page
                  </button>
                </>
              )}
            </div>

            {this.state.retryCount > 0 && (
              <div className="mt-4 text-xs text-gray-500 text-center">
                Retry attempt: {this.state.retryCount} / {this.props.maxRetries || 3}
              </div>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook for using PIXI Error Boundary functionality
 */
export function usePIXIErrorHandler() {
  const errorHandler = WebGLErrorHandler.getInstance();
  
  const [errorInfo, setErrorInfo] = React.useState<WebGLErrorInfo | null>(null);
  const [isRecovering, setIsRecovering] = React.useState(false);

  React.useEffect(() => {
    const unsubscribe = errorHandler.onError((error) => {
      setErrorInfo(error);
      
      if (error.type === 'context_lost') {
        setIsRecovering(true);
      } else if (error.type === 'context_restored') {
        setIsRecovering(false);
        setErrorInfo(null);
      }
    });

    return unsubscribe;
  }, []);

  const retry = React.useCallback(() => {
    setErrorInfo(null);
    setIsRecovering(false);
  }, []);

  return {
    errorInfo,
    isRecovering,
    retry,
    isWebGLContextLost: errorHandler.isWebGLContextLost()
  };
}
