/**
 * Application configuration
 * 
 * Configuration is controlled via environment variables in your .env file:
 * 
 * # Auto-save Configuration
 * NEXT_PUBLIC_AUTOSAVE_ENABLED=false          # Set to 'true' to enable auto-save
 * NEXT_PUBLIC_AUTOSAVE_DELAY_MS=1200         # Delay before auto-save (milliseconds)
 * 
 * # Canvas Configuration  
 * NEXT_PUBLIC_CANVAS_WIDTH=1920              # Default canvas width
 * NEXT_PUBLIC_CANVAS_HEIGHT=1080             # Default canvas height
 * 
 * # Performance Configuration
 * NEXT_PUBLIC_ENABLE_DEBOUNCING=true         # Enable/disable debouncing
 * NEXT_PUBLIC_DRAG_UPDATE_THROTTLE=16        # Drag update frequency (milliseconds)
 * 
 * Create a .env file in your project root with these variables to customize behavior.
 */

export const config = {
  // Auto-save configuration
  autosave: {
    enabled: process.env.NEXT_PUBLIC_AUTOSAVE_ENABLED === 'true',
    delayMs: parseInt(process.env.NEXT_PUBLIC_AUTOSAVE_DELAY_MS || '1200', 10),
  },
  
  // Canvas configuration
  canvas: {
    defaultWidth: parseInt(process.env.NEXT_PUBLIC_CANVAS_WIDTH || '1920', 10),
    defaultHeight: parseInt(process.env.NEXT_PUBLIC_CANVAS_HEIGHT || '1080', 10),
  },
  
  // Performance configuration
  performance: {
    enableDebouncing: process.env.NEXT_PUBLIC_ENABLE_DEBOUNCING !== 'false',
    dragUpdateThrottle: parseInt(process.env.NEXT_PUBLIC_DRAG_UPDATE_THROTTLE || '16', 10), // ~60fps
  },
} as const;

// Type for the config object
export type AppConfig = typeof config;

// Helper function to get config values
export function getConfig<T extends keyof AppConfig>(key: T): AppConfig[T] {
  return config[key];
}

// Helper function to check if auto-save is enabled
export function isAutosaveEnabled(): boolean {
  return config.autosave.enabled;
}
