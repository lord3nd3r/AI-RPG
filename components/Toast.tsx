'use client'

import React, { useEffect } from 'react'

interface ToastProps {
  message: string
  type?: 'success' | 'error' | 'info'
  onClose?: () => void
}

export default function Toast({ message, type = 'info', onClose }: ToastProps) {
  useEffect(() => {
    const t = setTimeout(() => onClose && onClose(), 3000)
    return () => clearTimeout(t)
  }, [onClose])

  const colors = {
    success: 'bg-green-600',
    error: 'bg-red-600',
    info: 'bg-primary',
  }

  return (
    <div className={`fixed bottom-6 right-6 z-50 ${colors[type]} text-white px-4 py-2 rounded shadow-lg`}>
      {message}
    </div>
  )
}
