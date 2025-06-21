class ContextMenuManager {
  private static instance: ContextMenuManager;
  private activeMenuId: string | null = null;

  private constructor() {}

  public static getInstance(): ContextMenuManager {
    if (!ContextMenuManager.instance) {
      ContextMenuManager.instance = new ContextMenuManager();
    }
    return ContextMenuManager.instance;
  }

  public openContextMenu(menuId: string): void {
    // Close any existing context menu
    if (this.activeMenuId && this.activeMenuId !== menuId) {
      this.closeContextMenu(this.activeMenuId);
    }
    
    this.activeMenuId = menuId;
  }

  public closeContextMenu(menuId?: string): void {
    if (!menuId || this.activeMenuId === menuId) {
      // Dispatch event to close all context menus
      const event = new CustomEvent('close-context-menu', {
        detail: { menuId: this.activeMenuId }
      });
      window.dispatchEvent(event);
      this.activeMenuId = null;
    }
  }

  public closeAllContextMenus(): void {
    this.closeContextMenu();
  }

  public getActiveMenuId(): string | null {
    return this.activeMenuId;
  }
}

export const contextMenuManager = ContextMenuManager.getInstance(); 