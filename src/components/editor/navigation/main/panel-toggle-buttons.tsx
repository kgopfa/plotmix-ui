import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useUIStore } from '@/stores/use-ui-store';

export const PanelToggleButtons = () => {
  const [showPanelMenu, setShowPanelMenu] = useState(false);
  const panelButtonRef = useRef<HTMLButtonElement>(null);
  const panelMenuRef = useRef<HTMLDivElement>(null);

  const leftPanelVisible = useUIStore(state => state.panels.leftPanelVisible);
  const rightPanelVisible = useUIStore(state => state.panels.rightPanelVisible);
  const isTimelineCollapsed = useUIStore(state => state.panels.isTimelineCollapsed);
  const toggleLeftPanel = useUIStore(state => state.toggleLeftPanel);
  const toggleRightPanel = useUIStore(state => state.toggleRightPanel);
  const toggleTimelineCollapse = useUIStore(state => state.toggleTimelineCollapse);

  // Handle click outside to close panel menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        showPanelMenu &&
        panelMenuRef.current &&
        panelButtonRef.current &&
        !panelMenuRef.current.contains(event.target as Node) &&
        !panelButtonRef.current.contains(event.target as Node)
      ) {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showPanelMenu]);

  // Handle escape key to close panel menu
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showPanelMenu) {
        setShowPanelMenu(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showPanelMenu]);

  const togglePanelMenu = useCallback(() => {
    setShowPanelMenu(!showPanelMenu);
  }, [showPanelMenu]);

  return (
    <div className="relative border-l pl-2">
      <button
        ref={panelButtonRef}
        className={`btn flex items-center gap-1 ${showPanelMenu ? 'bg-blue-100' : ''}`}
        onClick={togglePanelMenu}
        title="Panel Options"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 3H21V21H3V3ZM5 5V19H8V5H5ZM10 5V19H19V5H10Z" fill="currentColor"/>
        </svg>
        <span className="text-sm font-medium">Panels</span>
        <svg 
          className={`w-3 h-3 transition-transform ${showPanelMenu ? 'rotate-180' : ''}`} 
          viewBox="0 0 12 12" 
          fill="none"
        >
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {/* Panel Options Menu */}
      {showPanelMenu && (
        <div
          ref={panelMenuRef}
          className="absolute top-full left-0 mt-1 z-50 bg-white border border-gray-200 rounded shadow-lg"
          style={{ minWidth: '200px' }}
        >
          <div className="p-3 space-y-3">
            <div className="font-medium text-sm text-gray-700 pb-2">Panel Visibility</div>
            
            {/* Left Panel Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📋</span>
                <span className="text-sm text-gray-700">Scene Explorer</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={leftPanelVisible}
                  onChange={toggleLeftPanel}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${leftPanelVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${leftPanelVisible ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Right Panel Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔧</span>
                <span className="text-sm text-gray-700">Inspector</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={rightPanelVisible}
                  onChange={toggleRightPanel}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${rightPanelVisible ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${rightPanelVisible ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>

            {/* Timeline Toggle */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xl">📅</span>
                <span className="text-sm text-gray-700">Timeline</span>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!isTimelineCollapsed}
                  onChange={toggleTimelineCollapse}
                  className="sr-only"
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${!isTimelineCollapsed ? 'bg-blue-600' : 'bg-gray-300'}`}>
                  <div className={`w-5 h-5 bg-white rounded-full shadow transform transition-transform ${!isTimelineCollapsed ? 'translate-x-5' : 'translate-x-0'} mt-0.5 ml-0.5`}></div>
                </div>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}; 