import React from 'react';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  align?: 'viewport' | 'content';
}

export function ConfirmModal({ open, title, description, confirmLabel = 'Confirm', cancelLabel = 'Cancel', onConfirm, onCancel, align = 'viewport' }: ConfirmModalProps) {
  if (!open) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${align === 'content' ? 'lg:pl-20 xl:pr-80 2xl:pr-[calc(100vw/7)]' : ''}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        {description && <div className="mt-2 text-sm text-gray-600">{description}</div>}
        <div className="mt-6 flex items-center justify-end gap-x-3">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="inline-flex items-center px-4 py-2 text-sm font-semibold rounded-lg text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


