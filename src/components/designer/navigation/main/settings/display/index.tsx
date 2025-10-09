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
      description: 'Full HD display',
      gradient: 'from-indigo-500 to-indigo-600',
      iconColor: 'text-indigo-600',
      iconBg: 'from-indigo-50 to-indigo-100'
    },
    { 
      id: 'tablet',
      name: 'Tablet',
      icon: Tablet,
      description: 'iPad & similar',
      gradient: 'from-emerald-500 to-emerald-600',
      iconColor: 'text-emerald-600',
      iconBg: 'from-emerald-50 to-emerald-100'
    },
    { 
      id: 'mobile',
      name: 'Mobile',
      icon: Smartphone,
      description: 'Phone portrait',
      gradient: 'from-amber-500 to-amber-600',
      iconColor: 'text-amber-600',
      iconBg: 'from-amber-50 to-amber-100'
    }
  ];

  const handleDeviceChange = (deviceId: string) => {
    setCanvasSize(deviceId);
  };

  return (
    <div className="bg-white/95 backdrop-blur-sm shadow-2xl rounded-2xl py-6 px-5 space-y-5 border border-gray-200/50 w-64">
      <div className="flex items-center gap-2 pb-3 border-b border-gray-200/50">
        <div className="p-1.5 bg-gradient-to-br from-rose-50 to-rose-100 rounded-lg">
          <Monitor className="w-4 h-4 text-rose-600" />
        </div>
        <div className="text-sm font-semibold text-gray-900">Choose Display</div>
      </div>

      {/* Device Selection */}
      <div className="space-y-2.5">
        {devices.map((device) => {
          const Icon = device.icon;
          const isSelected = canvasState.currentSizeId === device.id;
          
          return (
            <button
              key={device.id}
              onClick={() => handleDeviceChange(device.id)}
              className={`group w-full px-3 py-3 rounded-xl transition-all duration-200 text-left flex items-center gap-3 transform hover:scale-[1.02] active:scale-[0.98] ${
                isSelected
                  ? `bg-gradient-to-r ${device.gradient} text-white shadow-lg shadow-${device.gradient.split('-')[1]}-500/30`
                  : 'bg-gray-50 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 border border-gray-200/50 hover:border-gray-300'
              }`}
            >
              <div className={`p-2 rounded-lg transition-all duration-200 ${
                isSelected 
                  ? 'bg-white/20' 
                  : `bg-gradient-to-br ${device.iconBg}`
              }`}>
                <Icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                  isSelected ? 'text-white' : device.iconColor
                }`} />
              </div>
              <div className="flex-1">
                <div className={`font-medium text-sm ${isSelected ? 'text-white' : 'text-gray-900'}`}>
                  {device.name}
                </div>
                <div className={`text-xs transition-colors ${
                  isSelected ? 'text-white/80' : 'text-gray-500 group-hover:text-gray-600'
                }`}>
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