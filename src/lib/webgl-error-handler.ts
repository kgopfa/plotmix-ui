/**
 * WebGL Error Handler for PIXI.js Applications
 * 
 * This module provides comprehensive error handling for WebGL context issues,
 * shader compilation failures, and graceful fallback mechanisms.
 */

import { Application, Renderer } from 'pixi.js';

export interface WebGLErrorInfo {
  type: 'context_lost' | 'context_restored' | 'shader_compilation' | 'webgl_not_supported';
  message: string;
  error?: Error;
  timestamp: number;
}

export class WebGLErrorHandler {
  private static instance: WebGLErrorHandler;
  private errorCallbacks: Set<(error: WebGLErrorInfo) => void> = new Set();
  private isContextLost = false;
  private retryAttempts = 0;
  private maxRetries = 3;

  private constructor() {
    this.setupGlobalErrorHandlers();
  }

  static getInstance(): WebGLErrorHandler {
    if (!WebGLErrorHandler.instance) {
      WebGLErrorHandler.instance = new WebGLErrorHandler();
    }
    return WebGLErrorHandler.instance;
  }

  /**
   * Check if WebGL is supported on the current device
   */
  static checkWebGLSupport(): { supported: boolean; context?: WebGLRenderingContext | WebGL2RenderingContext } {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || 
                 canvas.getContext('webgl') || 
                 canvas.getContext('experimental-webgl');
      
      return {
        supported: !!gl,
        context: gl || undefined
      };
    } catch (error) {
      console.warn('WebGL support check failed:', error);
      return { supported: false };
    }
  }

  /**
   * Validate shader source code
   */
  static validateShaderSource(source: string | null | undefined): boolean {
    if (!source || typeof source !== 'string') {
      return false;
    }
    
    // Basic validation - check for common shader issues
    const trimmedSource = source.trim();
    if (trimmedSource.length === 0) {
      return false;
    }

    // Check for basic shader structure
    const hasMain = trimmedSource.includes('main()');
    const hasVersion = trimmedSource.includes('#version') || trimmedSource.includes('precision');
    
    return hasMain && hasVersion;
  }

  /**
   * Safe shader error logging that handles null values
   */
  static safeLogShaderError(error: any, shaderSource?: string): void {
    try {
      let errorMessage = 'Unknown shader error';
      
      if (error && typeof error === 'string') {
        errorMessage = error;
      } else if (error && error.message) {
        errorMessage = error.message;
      } else if (error && error.toString) {
        errorMessage = error.toString();
      }

      // Validate shader source if provided
      if (shaderSource && !WebGLErrorHandler.validateShaderSource(shaderSource)) {
        console.warn('Invalid shader source detected:', shaderSource);
      }

      console.error('Shader compilation error:', errorMessage);
      
      // Log additional context if available
      if (shaderSource) {
        console.log('Shader source preview:', shaderSource.substring(0, 200) + '...');
      }
    } catch (logError) {
      console.error('Failed to log shader error:', logError);
    }
  }

  /**
   * Setup global error handlers for WebGL context events
   */
  private setupGlobalErrorHandlers(): void {
    // Handle WebGL context loss
    document.addEventListener('webglcontextlost', (event) => {
      event.preventDefault();
      this.handleContextLost();
    });

    // Handle WebGL context restoration
    document.addEventListener('webglcontextrestored', () => {
      this.handleContextRestored();
    });
  }

  /**
   * Handle WebGL context loss
   */
  private handleContextLost(): void {
    this.isContextLost = true;
    this.retryAttempts = 0;
    
    const errorInfo: WebGLErrorInfo = {
      type: 'context_lost',
      message: 'WebGL context has been lost. Attempting recovery...',
      timestamp: Date.now()
    };

    this.notifyErrorCallbacks(errorInfo);
    console.warn('WebGL context lost - attempting recovery');
  }

  /**
   * Handle WebGL context restoration
   */
  private handleContextRestored(): void {
    this.isContextLost = false;
    
    const errorInfo: WebGLErrorInfo = {
      type: 'context_restored',
      message: 'WebGL context has been restored',
      timestamp: Date.now()
    };

    this.notifyErrorCallbacks(errorInfo);
    console.log('WebGL context restored');
  }

  /**
   * Handle shader compilation errors
   */
  handleShaderError(error: any, shaderSource?: string): void {
    WebGLErrorHandler.safeLogShaderError(error, shaderSource);
    
    const errorInfo: WebGLErrorInfo = {
      type: 'shader_compilation',
      message: 'Shader compilation failed',
      error: error instanceof Error ? error : new Error(String(error)),
      timestamp: Date.now()
    };

    this.notifyErrorCallbacks(errorInfo);
  }

  /**
   * Check if WebGL context is currently lost
   */
  isWebGLContextLost(): boolean {
    return this.isContextLost;
  }

  /**
   * Register error callback
   */
  onError(callback: (error: WebGLErrorInfo) => void): () => void {
    this.errorCallbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.errorCallbacks.delete(callback);
    };
  }

  /**
   * Notify all registered error callbacks
   */
  private notifyErrorCallbacks(error: WebGLErrorInfo): void {
    this.errorCallbacks.forEach(callback => {
      try {
        callback(error);
      } catch (callbackError) {
        console.error('Error in WebGL error callback:', callbackError);
      }
    });
  }

  /**
   * Attempt to recover from WebGL errors
   */
  async attemptRecovery(app: Application): Promise<boolean> {
    if (this.retryAttempts >= this.maxRetries) {
      console.error('Max recovery attempts reached');
      return false;
    }

    this.retryAttempts++;
    
    try {
      // Force garbage collection of WebGL resources
      if (app.renderer && app.renderer.gl) {
        app.renderer.gl.getExtension('WEBGL_lose_context')?.loseContext();
      }

      // Wait a bit before attempting recovery
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if context is available again
      const webglSupport = WebGLErrorHandler.checkWebGLSupport();
      if (webglSupport.supported) {
        console.log('WebGL context recovered successfully');
        return true;
      }
    } catch (error) {
      console.error('Recovery attempt failed:', error);
    }

    return false;
  }
}

/**
 * Enhanced PIXI Application configuration with error handling
 */
export function createRobustPIXIApplication(options: {
  width: number;
  height: number;
  backgroundColor?: number;
  antialias?: boolean;
  resolution?: number;
  autoDensity?: boolean;
  forceCanvas?: boolean;
}): Application {
  const webglSupport = WebGLErrorHandler.checkWebGLSupport();
  
  // If WebGL is not supported or context is lost, fall back to canvas
  const useCanvas = options.forceCanvas || !webglSupport.supported;
  
  const appOptions = {
    width: options.width,
    height: options.height,
    backgroundColor: options.backgroundColor ?? 0xF1F5F9,
    antialias: options.antialias ?? true,
    resolution: options.resolution ?? (typeof window !== 'undefined' ? window.devicePixelRatio || 2 : 2),
    autoDensity: options.autoDensity ?? true,
    // Force canvas renderer if WebGL is not available
    ...(useCanvas && { forceCanvas: true })
  };

  try {
    const app = new Application(appOptions);
    
    // Setup error handling for the application
    const errorHandler = WebGLErrorHandler.getInstance();
    
    // Handle renderer errors
    app.renderer.on('error', (error) => {
      console.error('PIXI Renderer Error:', error);
      errorHandler.handleShaderError(error);
    });

    // Add context loss handlers to the canvas
    const canvas = app.view;
    if (canvas) {
      canvas.addEventListener('webglcontextlost', (event) => {
        event.preventDefault();
        console.log('WebGL context lost on PIXI canvas');
      });

      canvas.addEventListener('webglcontextrestored', () => {
        console.log('WebGL context restored on PIXI canvas');
        // Force a render to refresh the display
        app.render();
      });
    }

    return app;
  } catch (error) {
    console.error('Failed to create PIXI Application:', error);
    
    // If WebGL fails and we haven't tried canvas yet, retry with canvas
    if (!useCanvas) {
      console.log('Retrying with canvas renderer...');
      return createRobustPIXIApplication({ ...options, forceCanvas: true });
    }
    
    throw error;
  }
}

/**
 * Monkey patch for PIXI's internal error logging to handle null values
 */
export function patchPIXIErrorLogging(): void {
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;

  // Patch console.error to handle null values in shader errors
  console.error = function(...args: any[]) {
    try {
      // Check if this looks like a shader error with null values
      const message = args[0];
      if (typeof message === 'string' && message.includes('split') && args.some(arg => arg === null)) {
        console.warn('Shader error with null values detected - using safe logging');
        WebGLErrorHandler.safeLogShaderError(args);
        return;
      }
      
      // Use original error logging for everything else
      originalError.apply(console, args);
    } catch (error) {
      // Fallback to original error logging if our patch fails
      originalError.apply(console, args);
    }
  };

  // Patch console.warn similarly
  console.warn = function(...args: any[]) {
    try {
      const message = args[0];
      if (typeof message === 'string' && message.includes('split') && args.some(arg => arg === null)) {
        console.log('Shader warning with null values detected - using safe logging');
        WebGLErrorHandler.safeLogShaderError(args);
        return;
      }
      
      originalWarn.apply(console, args);
    } catch (error) {
      originalWarn.apply(console, args);
    }
  };
}

// Auto-patch error logging when module is imported
if (typeof window !== 'undefined') {
  patchPIXIErrorLogging();
}
