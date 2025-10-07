'use client';

import React, { useRef, useEffect } from 'react';
import {
  SwatchBook,
  VectorSquare,
  Layers,
  Film,
} from 'lucide-react';
import { useActiveRightPanel, useSetActiveRightPanel, useUIStore } from '@/stores/use-ui-store';
import { useSelectionStore } from '@/stores/use-selection-store';
import { PropertiesTab } from './tabs/properties';
import { AnimationsTab } from './tabs/animations';
import { LayersTab } from './tabs/layers-tab';
import { ScenesTab } from './tabs/scenes-tab';

// Navigation item type for right sidebar
type RightNavKey = 'properties' | 'animations' | 'layers' | 'scenes';
interface RightNavItem {
  name: string;
  key: RightNavKey;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  color: string;
  hoverColor: string;
  activeColor: string;
}

const navigation: RightNavItem[] = [
  { 
    name: 'Properties', 
    key: 'properties', 
    icon: SwatchBook,
    color: 'text-blue-600',
    hoverColor: 'hover:bg-blue-50 hover:text-blue-700',
    activeColor: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/30'
  },
  { 
    name: 'Animations', 
    key: 'animations', 
    icon: VectorSquare,
    color: 'text-purple-600',
    hoverColor: 'hover:bg-purple-50 hover:text-purple-700',
    activeColor: 'bg-gradient-to-r from-purple-500 to-purple-600 text-white shadow-lg shadow-purple-500/30'
  },
  { 
    name: 'Layers', 
    key: 'layers', 
    icon: Layers,
    color: 'text-red-600',
    hoverColor: 'hover:bg-red-50 hover:text-red-700',
    activeColor: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30'
  },
  { 
    name: 'Scenes', 
    key: 'scenes', 
    icon: Film,
    color: 'text-green-600',
    hoverColor: 'hover:bg-green-50 hover:text-green-700',
    activeColor: 'bg-gradient-to-r from-green-500 to-green-600 text-white shadow-lg shadow-green-500/30'
  },
];

// Tab Content Component
const TabContent: React.FC<{ navKey: string; onInspectorChange: any; onGroupInspectorChange: any }> = ({ 
  navKey, 
  onInspectorChange, 
  onGroupInspectorChange 
}) => {
  const { selectedElements, selectedGroups, getFirstSelected } = useSelectionStore();
  const selectedElement = getFirstSelected();
  const selectedGroup = selectedGroups[0] || null;
  const selectedElementsCount = selectedElements.length;

  const hasValidGroupSelection = selectedGroup && !selectedGroup.isDefaultGroup && selectedGroup.id;
  const hasIndividualElement = selectedElement && selectedElementsCount === 1 && !hasValidGroupSelection;
  const hasGroupSelection = hasValidGroupSelection;
  const hasSelection = selectedElement || hasGroupSelection;

  switch (navKey) {
    case 'properties':
      if (!hasSelection) {
        return (
          <div className="h-full p-4 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col items-center justify-center">
            <div className="text-center text-gray-500 space-y-2">
              <SwatchBook className="w-12 h-12 mx-auto text-gray-400" />
              <p className="text-sm font-medium">No Selection</p>
              <p className="text-xs text-gray-400">Select an element or group to view properties</p>
            </div>
          </div>
        );
      }
      return (
        <PropertiesTab
          selectedElement={hasIndividualElement ? selectedElement : undefined}
          selectedGroup={hasGroupSelection ? selectedGroup : undefined}
          onInspectorChange={onInspectorChange}
          onGroupInspectorChange={onGroupInspectorChange}
        />
      );
    
    case 'animations':
      return (
        <AnimationsTab
          selectedElement={hasIndividualElement ? selectedElement : undefined}
          selectedGroup={hasGroupSelection ? selectedGroup : undefined}
          onInspectorChange={onInspectorChange}
          onGroupInspectorChange={onGroupInspectorChange}
        />
      );
    
    case 'layers':
      return <LayersTab />;
    
    case 'scenes':
      return <ScenesTab />;
    
    default:
      return null;
  }
};

export const RightSidebar: React.FC<{ onInspectorChange: any; onGroupInspectorChange: any }> = ({
  onInspectorChange,
  onGroupInspectorChange
}) => {
  const activePanel = useActiveRightPanel();
  const setActiveRightPanel = useSetActiveRightPanel();
  const tabPanelRef = useRef<HTMLDivElement | null>(null);
  const setRightPanelWidth = useUIStore(state => state.setRightPanelWidth);

  // Track actual panel width
  useEffect(() => {
    if (!tabPanelRef.current) return;
    const el = tabPanelRef.current;
    const updateWidth = () => setRightPanelWidth(el.offsetWidth);
    updateWidth();
    const resizeObserver = new ResizeObserver(() => updateWidth());
    resizeObserver.observe(el);
    return () => resizeObserver.disconnect();
  }, [setRightPanelWidth, activePanel]);

  return (
    <>
      <div className="m-2 fixed right-0 top-16 z-40 w-16 overflow-visible transition-all duration-300 ease-out translate-x-0 opacity-100">
        <div className="relative bg-white/95 backdrop-blur-sm border border-gray-200/50 shadow-xl shadow-gray-200/50 rounded-2xl flex flex-col items-center h-full">
          <nav className="mt-6 pb-6 flex-1">
            <ul role="list" className="flex flex-col items-center space-y-3">
              {navigation.map((item) => {
                const isActive = activePanel === item.key;
                return (
                  <li key={item.key}>
                    <div className="relative">
                      <button
                        type="button"
                        className={`
                          relative group flex flex-col items-center justify-center
                          w-12 h-12 rounded-xl font-medium
                          transition-all duration-200 ease-out
                          transform hover:scale-105 active:scale-95
                          ${isActive 
                            ? item.activeColor 
                            : `${item.color} ${item.hoverColor} hover:shadow-md`
                          }
                        `}
                        onClick={() => {
                          setActiveRightPanel(activePanel === item.key ? null : item.key);
                        }}
                        title={item.name}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={`w-5 h-5 transition-all duration-200 ${
                            isActive ? 'drop-shadow-sm' : 'group-hover:scale-110'
                          }`}
                        />
                        <span className="sr-only">{item.name}</span>
                        {/* Active indicator */}
                        {isActive && (
                          <div className="absolute -left-1 top-1/2 transform -translate-y-1/2 w-1 h-6 bg-white rounded-full shadow-sm"></div>
                        )}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>
      </div>

      {/* Tab Panel - Shows when active - FULL HEIGHT like left sidebar */}
      {activePanel && (
        <div
          ref={tabPanelRef}
          className="fixed pointer-events-auto z-[40] w-80 2xl:w-96"
          style={{
            right: '80px', // Position before sidebar
            top: '72px',
            maxHeight: 'calc(100vh - 80px)',
            height: 'calc(100vh - 80px)'
          }}
        >
          <div className="h-full overflow-hidden">
            <TabContent 
              navKey={activePanel}
              onInspectorChange={onInspectorChange}
              onGroupInspectorChange={onGroupInspectorChange}
            />
          </div>
        </div>
      )}
    </>
  );
}; 