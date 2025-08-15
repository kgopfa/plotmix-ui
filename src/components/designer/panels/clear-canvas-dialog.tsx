'use client'

import { ConfirmModal } from '@/components/shared/confirm-modal'

interface ClearCanvasDialogProps {
  open: boolean
  onClose: () => void
  onConfirm: () => void
}

export function ClearCanvasDialog({ open, onClose, onConfirm }: ClearCanvasDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onClose()
  }

  return (
    <ConfirmModal
      open={open}
      title="Clear Canvas"
      description={
        <p>
          Are you sure you want to clear the entire canvas? All elements, groups, and animations will be permanently removed. This action cannot be undone.
        </p>
      }
      confirmLabel="Clear Canvas"
      cancelLabel="Cancel"
      variant="designer"
      onConfirm={handleConfirm}
      onCancel={onClose}
      align="content"
    />
  )
}