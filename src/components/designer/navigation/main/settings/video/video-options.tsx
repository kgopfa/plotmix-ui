import React from 'react';
import { Monitor, Tablet, Smartphone, Laptop } from 'lucide-react';
import { useCanvasState, useCanvasActions } from '@/stores/use-ui-store';

export const DisplaySettings: React.FC = () => {
  const canvasState = useCanvasState();
  const { setCanvasSize } = useCanvasActions();

  // Device presets
  const devices = [
    { 
      id: 'desktop-fhd',
      name: 'Desktop',
      icon: Laptop,
      description: 'Full HD display'
    },
    { 
      id: 'tablet',
      name: 'Tablet',
      icon: Tablet,
      description: 'iPad & similar'
    },
    { 
      id: 'mobile',
      name: 'Mobile',
      icon: Smartphone,
      description: 'Phone portrait'
    }
  ];

  const handleDeviceChange = (deviceId: string) => {
    setCanvasSize(deviceId);
  };

  return (
    <div className="bg-white shadow-2xl rounded-lg py-8 px-6 space-y-4 border border-gray-200 backdrop-blur-sm w-64">
      <div className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
        <Monitor className="w-4 h-4 mr-2 text-blue-600" />
        Display Settings
      </div>

      {/* Device Selection */}
      <div className="space-y-2">
        {devices.map((device) => {
          const Icon = device.icon;
          const isSelected = canvasState.currentSizeId === device.id;
          
          return (
            <button
              key={device.id}
              onClick={() => handleDeviceChange(device.id)}
              className={`w-full px-3 py-2.5 rounded transition-colors text-left flex items-center gap-3 ${
                isSelected
                  ? 'bg-blue-500 text-white shadow-sm'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-normal text-sm">{device.name}</div>
                <div className={`text-xs ${isSelected ? 'text-blue-100' : 'text-gray-500'}`}>
                  {device.description}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}; 