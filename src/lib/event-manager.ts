/**
 * Global Event Manager Singleton
 * 
 * Manages global event listeners efficiently to prevent the performance issues
 * caused by multiple components repeatedly adding/removing the same event listeners.
 * 
 * Benefits:
 * - Eliminates event listener thrashing
 * - Reduces memory usage and garbage collection pressure
 * - Prevents duplicate event handling
 * - Centralizes global event management
 */

type EventHandler = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => void;

class EventManager {
  private static instance: EventManager;
  private listeners = new Map<string, Set<EventHandler>>();
  private boundHandlers = new Map<string, (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => void>();

  private constructor() {}

  static getInstance(): EventManager {
    if (!EventManager.instance) {
      EventManager.instance = new EventManager();
    }
    return EventManager.instance;
  }

  /**
   * Add a global event listener
   * Only adds the actual DOM listener once per event type
   */
  addListener(eventType: string, handler: EventHandler, target: EventTarget = document): void {
    // Create handler set if it doesn't exist
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
      
      // Create bound handler for this event type
      const boundHandler = (event: Event | PointerEvent | MouseEvent | KeyboardEvent) => {
        const handlers = this.listeners.get(eventType);
        if (handlers) {
          handlers.forEach(h => {
            try {
              h(event);
            } catch (error) {
              console.error(`Error in event handler for ${eventType}:`, error);
            }
          });
        }
      };
      
      this.boundHandlers.set(eventType, boundHandler);
      
      // Add the actual DOM event listener
      target.addEventListener(eventType, boundHandler as EventListener, { passive: false });
      console.log(`EventManager: Added global listener for ${eventType}`);
    }

    // Add the handler to our set
    this.listeners.get(eventType)!.add(handler);
  }

  /**
   * Remove a global event listener
   * Only removes the actual DOM listener when no more handlers exist
   */
  removeListener(eventType: string, handler: EventHandler, target: EventTarget = document): void {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      
      // If no more handlers, remove the DOM event listener
      if (handlers.size === 0) {
        const boundHandler = this.boundHandlers.get(eventType);
        if (boundHandler) {
          target.removeEventListener(eventType, boundHandler as EventListener);
          this.boundHandlers.delete(eventType);
          this.listeners.delete(eventType);
          console.log(`EventManager: Removed global listener for ${eventType}`);
        }
      }
    }
  }

  /**
   * Get the count of active listeners for debugging
   */
  getListenerCount(eventType: string): number {
    return this.listeners.get(eventType)?.size || 0;
  }

  /**
   * Get all active event types for debugging
   */
  getActiveEventTypes(): string[] {
    return Array.from(this.listeners.keys());
  }

  /**
   * Clean up all listeners (useful for testing)
   */
  cleanup(): void {
    this.boundHandlers.forEach((handler, eventType) => {
      document.removeEventListener(eventType, handler as EventListener);
      window.removeEventListener(eventType, handler as EventListener);
    });
    
    this.listeners.clear();
    this.boundHandlers.clear();
  }
}

export const eventManager = EventManager.getInstance(); 