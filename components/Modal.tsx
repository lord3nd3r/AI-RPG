'use client'

import React from 'react'

interface ModalProps {
  title?: string
  open: boolean
  onClose: () => void
  children: React.ReactNode
}

export default function Modal({ title, open, onClose, children }: ModalProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-xl max-w-xl w-full p-6 z-10">
        {title && <h3 className="text-lg font-bold mb-4">{title}</h3>}
        <div>{children}</div>
      </div>
    </div>
  )
}
