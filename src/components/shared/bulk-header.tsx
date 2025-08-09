import React from 'react';

interface BulkHeaderProps {
  title: string;
  subtitle?: string;
  anySelected: boolean;
  onCancel: () => void;
  cancelVariant?: 'indigo' | 'gray';
}

export function BulkHeader({ title, subtitle, anySelected, onCancel, cancelVariant = 'indigo' }: BulkHeaderProps) {
  const cancelClasses =
    cancelVariant === 'indigo'
      ? 'text-sm font-medium text-indigo-600 hover:text-indigo-700 px-3 py-1.5 rounded-lg border border-indigo-200 hover:bg-indigo-50'
      : 'text-sm font-medium text-gray-600 hover:text-gray-800 px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50';

  return (
    <div className="mb-6 flex items-center justify-between">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        {subtitle && <p className="text-sm text-gray-600">{subtitle}</p>}
      </div>
      {anySelected && (
        <button type="button" onClick={onCancel} className={cancelClasses}>
          Cancel
        </button>
      )}
    </div>
  );
}


