import { useState } from 'react';
import { 
  AnimatedCanvasElement,
  ElementAnimation
} from '@/types/canvas';
import { PropertiesTab } from './tabs/properties';
import { AnimationsTab } from './tabs/animations';
import { useAnimationHandlers } from '../../../hooks/useAnimationHandlers';

interface InspectorProps {
  selectedElement: AnimatedCanvasElement | null;
  onInspectorChange: (
    prop: string,
    value: string | number | boolean | ElementAnimation[] | NonNullable<AnimatedCanvasElement['lineOptions']> | {
      animationId: string;
      elementId: string;
    }
  ) => void;
}

// Main Inspector Component
type Tab = 'properties' | 'animations';

export function Inspector({ selectedElement, onInspectorChange }: InspectorProps) {
  const [activeTab, setActiveTab] = useState<Tab>('properties');
  
  const {
    localAnimations,
    handleEnterPathMode,
    handleAnimationChange,
    handleAddAnimation,
    handleDeleteAnimation
  } = useAnimationHandlers(selectedElement, onInspectorChange);

  if (!selectedElement) {
    return (
      <aside className="w-80 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
        <p>Select an element to edit properties</p>
      </aside>
    );
  }

  return (
    <aside className="w-80 min-w-48 max-w-xs bg-gray-50 border-l border-gray-200 p-2 overflow-y-auto text-gray-800">
      <div className="flex border-b mb-4">
        <button
          className={`px-4 py-2 ${activeTab === 'properties' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('properties')}
        >
          Properties
        </button>
        <button
          className={`px-4 py-2 ${activeTab === 'animations' ? 'border-b-2 border-blue-500' : ''}`}
          onClick={() => setActiveTab('animations')}
        >
          Animations
        </button>
      </div>

      {activeTab === 'properties' ? (
        <PropertiesTab
          selectedElement={selectedElement}
          onInspectorChange={onInspectorChange}
        />
      ) : (
        <AnimationsTab
          selectedElement={selectedElement}
          localAnimations={localAnimations}
          onAddAnimation={handleAddAnimation}
          onDeleteAnimation={handleDeleteAnimation}
          onAnimationChange={handleAnimationChange}
          onEnterPathMode={handleEnterPathMode}
        />
      )}
    </aside>
  );
} 