import React from 'react';
import { Sparkles } from 'lucide-react';

export const AIToolsTab: React.FC = () => {
  const aiFeatures = [
    {
      name: 'Auto Animations',
      description: 'Generate smooth transitions',
      icon: '🎭',
      status: 'Available'
    },
    {
      name: 'Smart Layout',
      description: 'Arrange elements intelligently',
      icon: '🧠',
      status: 'Beta'
    },
    {
      name: 'Style Transfer',
      description: 'Apply visual styles automatically',
      icon: '🎨',
      status: 'Coming Soon'
    },
    {
      name: 'Content Generation',
      description: 'AI-powered text and shapes',
      icon: '✨',
      status: 'Coming Soon'
    }
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Available':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">Available</span>;
      case 'Beta':
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">Beta</span>;
      case 'Coming Soon':
        return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">Coming Soon</span>;
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-96 bg-white border border-gray-200 shadow-lg rounded-lg flex flex-col">
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-semibold text-gray-900">AI Tools</h3>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        <div className="space-y-3 text-sm">
          {aiFeatures.map((feature, index) => (
            <div key={index} className="p-3 bg-purple-50 rounded-lg">
              <div className="flex items-start justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{feature.icon}</span>
                  <div className="font-medium text-gray-700">{feature.name}</div>
                </div>
                {getStatusBadge(feature.status)}
              </div>
              <div className="text-gray-600 text-xs ml-6">{feature.description}</div>
            </div>
          ))}
        </div>
        <div className="mt-4 p-3 bg-gradient-to-r from-purple-100 to-blue-100 rounded-lg">
          <div className="text-xs text-gray-700 font-medium mb-1">Pro Tip</div>
          <div className="text-xs text-gray-600">
            AI features learn from your design patterns to provide better suggestions over time.
          </div>
        </div>
      </div>
    </div>
  );
}; 