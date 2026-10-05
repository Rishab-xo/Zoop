import { useEffect, useState } from 'react'

interface Toast {
  id: number
  message: string
  type: 'success' | 'error'
}

let addToastGlobal: ((msg: string, type: 'success' | 'error') => void) | null = null

export function toast(message: string, type: 'success' | 'error' = 'success') {
  addToastGlobal?.(message, type)
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])
  let counter = 0

  addToastGlobal = (message, type) => {
    const id = ++counter
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 3500)
  }

  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          {t.type === 'success' ? '✓' : '✕'} {t.message}
        </div>
      ))}
    </div>
  )
}
