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
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-card rounded-lg shadow-2xl max-w-xl w-full p-6 z-10 border border-muted">
        {title && (
          <div className="flex items-center gap-3 mb-4">
            <img src="/icons/gothic-sigil.svg" alt="icon" className="w-6 h-6" />
            <h3 className="text-lg font-bold">{title}</h3>
          </div>
        )}
        <div>{children}</div>
      </div>
    </div>
  )
}
