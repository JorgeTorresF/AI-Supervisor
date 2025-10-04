import React, { createContext, useContext, useState, ReactNode } from 'react'
import { X } from 'lucide-react'

interface Toast {
  id: string
  message: string
  type: 'success' | 'error' | 'info' | 'warning'
  duration?: number
}

interface ToastContextType {
  addToast: (message: string, type?: Toast['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextType | undefined>(undefined)

interface ToastProviderProps {
  children: ReactNode
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: Toast['type'] = 'info', duration = 5000) => {
    const id = Math.random().toString(36).substring(2, 9)
    const newToast: Toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, newToast])
    
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }
  }

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }

  const getToastStyles = (type: Toast['type']) => {
    const baseStyles = 'mb-2 p-4 rounded-lg shadow-lg border flex items-center justify-between max-w-md'
    
    switch (type) {
      case 'success':
        return `${baseStyles} bg-green-900 border-green-700 text-green-100`
      case 'error':
        return `${baseStyles} bg-red-900 border-red-700 text-red-100`
      case 'warning':
        return `${baseStyles} bg-yellow-900 border-yellow-700 text-yellow-100`
      default:
        return `${baseStyles} bg-blue-900 border-blue-700 text-blue-100`
    }
  }

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      
      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50">
        {toasts.map(toast => (
          <div key={toast.id} className={getToastStyles(toast.type)}>
            <span className="flex-1">{toast.message}</span>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-3 text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const context = useContext(ToastContext)
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}