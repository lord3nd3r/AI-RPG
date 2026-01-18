'use client'

import React from 'react'
import Modal from './Modal'

interface ConfirmModalProps {
  open: boolean
  title?: string
  description?: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmModal({ open, title = 'Confirm', description, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <Modal title={title} open={open} onClose={onCancel}>
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{description}</p>
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} className="px-4 py-2">Cancel</button>
          <button onClick={onConfirm} className="px-4 py-2 bg-red-600 text-white rounded">Delete</button>
        </div>
      </div>
    </Modal>
  )
}
