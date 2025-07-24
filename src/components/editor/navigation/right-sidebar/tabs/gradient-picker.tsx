import React, { useState } from 'react';
import { Plus, X, Palette } from 'lucide-react';

interface GradientStop {
  color: string;
  offset: number;
}

interface GradientPickerProps {
  gradient: {
    type: 'linear' | 'radial';
    colors: GradientStop[];
    angle?: number;
    center?: { x: number; y: number };
    radius?: number;
  } | undefined;
  onChange: (gradient: {
    type: 'linear' | 'radial';
    colors: GradientStop[];
    angle?: number;
    center?: { x: number; y: number };
    radius?: number;
  }) => void;
  onRemove: () => void;
}

export const GradientPicker: React.FC<GradientPickerProps> = ({ gradient, onChange, onRemove }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const addColorStop = () => {
    if (!gradient) return;
    
    const newStop: GradientStop = {
      color: '#000000',
      offset: gradient.colors.length > 0 ? Math.min(1, gradient.colors[gradient.colors.length - 1].offset + 0.1) : 0
    };
    
    onChange({
      ...gradient,
      colors: [...gradient.colors, newStop]
    });
  };

  const updateColorStop = (index: number, updates: Partial<GradientStop>) => {
    if (!gradient) return;
    
    const newColors = [...gradient.colors];
    newColors[index] = { ...newColors[index], ...updates };
    
    onChange({
      ...gradient,
      colors: newColors
    });
  };

  const removeColorStop = (index: number) => {
    if (!gradient || gradient.colors.length <= 1) return;
    
    const newColors = gradient.colors.filter((_, i) => i !== index);
    onChange({
      ...gradient,
      colors: newColors
    });
  };

  const createGradient = () => {
    onChange({
      type: 'linear',
      colors: [
        { color: '#000000', offset: 0 },
        { color: '#FFFFFF', offset: 1 }
      ],
      angle: 0
    });
  };

  if (!gradient) {
    return (
      <div className="space-y-3">
        <button
          onClick={createGradient}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg hover:from-blue-600 hover:to-purple-600 transition-all duration-200"
        >
          <Palette className="w-4 h-4" />
          <span className="text-sm font-medium">Add Gradient</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <div 
              className="w-6 h-6 rounded border border-gray-300"
              style={{
                background: gradient.type === 'linear' 
                  ? `linear-gradient(${gradient.angle || 0}deg, ${gradient.colors.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ')})`
                  : `radial-gradient(circle at ${gradient.center?.x || 50}% ${gradient.center?.y || 50}%, ${gradient.colors.map(stop => `${stop.color} ${stop.offset * 100}%`).join(', ')})`
              }}
            />
            <span>Gradient</span>
          </button>
        </div>
        <button
          onClick={onRemove}
          className="text-red-500 hover:text-red-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {isExpanded && (
        <div className="space-y-3 pl-4 border-l-2 border-blue-200">
          {/* Gradient Type */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onChange({ ...gradient, type: 'linear' })}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                gradient.type === 'linear'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Linear
            </button>
            <button
              onClick={() => onChange({ ...gradient, type: 'radial' })}
              className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                gradient.type === 'radial'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Radial
            </button>
          </div>

          {/* Gradient Angle (for linear) */}
          {gradient.type === 'linear' && (
            <label className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-blue-600">Angle (°)</span>
              <input
                type="number"
                value={gradient.angle || 0}
                onChange={e => onChange({ ...gradient, angle: Number(e.target.value) })}
                min={0}
                max={360}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors text-sm"
              />
            </label>
          )}

          {/* Color Stops */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-blue-600">Color Stops</span>
              <button
                onClick={addColorStop}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
              >
                <Plus className="w-3 h-3" />
                Add Stop
              </button>
            </div>
            
            {gradient.colors.map((stop, index) => (
              <div key={index} className="flex items-center gap-2">
                <div className="flex-1 flex items-center gap-2">
                  <div className="flex relative">
                    <div className="flex shrink-0 items-center rounded-l-md bg-white px-3 text-sm text-blue-500 outline-1 -outline-offset-1 outline-gray-300">
                      <div
                        className="w-4 h-4 rounded border border-gray-300 cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: stop.color }}
                      />
                    </div>
                    <input
                      type="text"
                      value={stop.color.replace('#', '').toUpperCase()}
                      onChange={e => updateColorStop(index, { color: '#' + e.target.value.toUpperCase() })}
                      className="-ml-px block w-20 grow rounded-r-md bg-white px-3 py-1.5 text-sm text-gray-600 outline-1 -outline-offset-1 outline-gray-300 focus:outline-2 focus:-outline-offset-2 focus:outline-blue-600 uppercase"
                      placeholder="000000"
                    />
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={stop.offset}
                    onChange={e => updateColorStop(index, { offset: Number(e.target.value) })}
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <span className="text-xs text-gray-500 w-8 text-right">
                    {Math.round(stop.offset * 100)}%
                  </span>
                </div>
                {gradient.colors.length > 1 && (
                  <button
                    onClick={() => removeColorStop(index)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}; 