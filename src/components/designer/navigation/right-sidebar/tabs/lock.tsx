import React from 'react';
import { Lock, Unlock } from 'lucide-react';

interface LockTabProps {
  isLocked: boolean;
  onToggleLock: () => void;
}

export const LockTab: React.FC<LockTabProps> = ({ isLocked, onToggleLock }) => {
  return (
    <div className="p-6 text-gray-800">
      <div className="space-y-4">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Canvas Position Lock
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            {isLocked 
              ? "Canvas position is locked and cannot be moved." 
              : "Canvas position is unlocked and can be freely moved."
            }
          </p>
        </div>
        
        <div className="flex justify-center">
          <button
            onClick={onToggleLock}
            className={`
              flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium
              transition-all duration-200 ease-out transform hover:scale-105 active:scale-95
              ${isLocked
                ? 'bg-orange-100 text-orange-700 hover:bg-orange-200 border border-orange-300'
                : 'bg-green-100 text-green-700 hover:bg-green-200 border border-green-300'
              }
            `}
          >
            {isLocked ? (
              <>
                <Unlock className="w-4 h-4" />
                Unlock Canvas
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                Lock Canvas
              </>
            )}
          </button>
        </div>
        
        <div className="text-center">
          <div className={`
            inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium
            ${isLocked
              ? 'bg-orange-50 text-orange-700 border border-orange-200'
              : 'bg-green-50 text-green-700 border border-green-200'
            }
          `}>
            {isLocked ? (
              <>
                <Lock className="w-4 h-4" />
                Locked
              </>
            ) : (
              <>
                <Unlock className="w-4 h-4" />
                Unlocked
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 