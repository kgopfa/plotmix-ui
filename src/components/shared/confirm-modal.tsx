import React from 'react';

type ModalVariant = 'default' | 'projects' | 'chats' | 'designer' | 'danger';

interface ConfirmModalProps {
  open: boolean;
  title: string;
  description?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  align?: 'viewport' | 'content';
  variant?: ModalVariant;
}

const variantStyles = {
  default: {
    confirmButton: 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700',
    cancelButton: 'border-indigo-500 text-indigo-700 hover:bg-indigo-50'
  },
  projects: {
    confirmButton: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700',
    cancelButton: 'border-blue-500 text-blue-700 hover:bg-blue-50'
  },
  chats: {
    confirmButton: 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700',
    cancelButton: 'border-purple-500 text-purple-700 hover:bg-purple-50'
  },
  designer: {
    confirmButton: 'bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-700 hover:to-cyan-700',
    cancelButton: 'border-teal-500 text-teal-700 hover:bg-teal-50'
  },
  danger: {
    confirmButton: 'bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700',
    cancelButton: 'border-red-500 text-red-700 hover:bg-red-50'
  }
};

export function ConfirmModal({ 
  open, 
  title, 
  description, 
  confirmLabel = 'Confirm', 
  cancelLabel = 'Cancel', 
  onConfirm, 
  onCancel, 
  align = 'viewport',
  variant = 'default'
}: ConfirmModalProps) {
  if (!open) return null;

  const styles = variantStyles[variant];

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${align === 'content' ? 'lg:pl-20 xl:pr-80 2xl:pr-[calc(100vw/7)]' : ''}`}>
      <div className="absolute inset-0 bg-black/30" onClick={onCancel} />
      <div className="relative z-10 w-full max-w-md mx-auto bg-white rounded-2xl shadow-2xl border border-gray-200 p-9">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        {description && <div className="mt-2 text-sm text-gray-600">{description}</div>}
        <div className="mt-6 flex items-center justify-end gap-x-3">
          <button
            type="button"
            onClick={onCancel}
            className={`inline-flex items-center h-10 px-4 py-2 text-sm font-medium rounded-lg border-2 ${styles.cancelButton}`}
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`inline-flex items-center h-10 px-4 py-2 text-sm font-semibold rounded-lg text-white ${styles.confirmButton}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}


