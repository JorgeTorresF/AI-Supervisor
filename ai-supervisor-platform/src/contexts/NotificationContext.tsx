import React, { createContext, useContext, useState, useCallback } from 'react'

type NotificationType = 'success' | 'error' | 'warning' | 'info'

interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  duration?: number
  createdAt: Date
}

interface NotificationContextType {
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id' | 'createdAt'>) => void
  removeNotification: (id: string) => void
  clearAllNotifications: () => void
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

interface NotificationProviderProps {
  children: React.ReactNode
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'createdAt'>) => {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9)
    const newNotification: Notification = {
      ...notification,
      id,
      createdAt: new Date(),
      duration: notification.duration || 5000
    }

    setNotifications(prev => [newNotification, ...prev])

    // Auto-remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }
  }, [])

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id))
  }, [])

  const clearAllNotifications = useCallback(() => {
    setNotifications([])
  }, [])

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
      <NotificationContainer 
        notifications={notifications}
        onRemove={removeNotification}
      />
    </NotificationContext.Provider>
  )
}

// Notification Container Component
interface NotificationContainerProps {
  notifications: Notification[]
  onRemove: (id: string) => void
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, onRemove }) => {
  if (notifications.length === 0) return null

  const getNotificationIcon = (type: NotificationType): string => {
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    }
    return icons[type]
  }

  const getNotificationColor = (type: NotificationType): string => {
    const colors = {
      success: 'var(--neon-green)',
      error: 'var(--cyber-orange)',
      warning: 'var(--neon-yellow)',
      info: 'var(--neon-cyan)'
    }
    return colors[type]
  }

  return (
    <div className="notification-container">
      {notifications.slice(0, 5).map((notification) => (
        <div 
          key={notification.id}
          className={`notification notification-${notification.type}`}
          style={{ '--notification-color': getNotificationColor(notification.type) } as React.CSSProperties}
        >
          <div className="notification-content">
            <div className="notification-header">
              <span className="notification-icon">
                {getNotificationIcon(notification.type)}
              </span>
              <span className="notification-title">{notification.title}</span>
              <button 
                className="notification-close"
                onClick={() => onRemove(notification.id)}
              >
                ×
              </button>
            </div>
            <div className="notification-message">{notification.message}</div>
          </div>
          <div className="notification-progress"></div>
        </div>
      ))}
      
      <style>{`
        .notification-container {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 1000;
          display: flex;
          flex-direction: column;
          gap: 12px;
          max-width: 400px;
          pointer-events: none;
        }

        .notification {
          background: var(--card-bg);
          border: 1px solid var(--notification-color);
          border-radius: 8px;
          padding: 16px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 20px var(--notification-color);
          animation: slideIn 0.3s ease-out;
          pointer-events: auto;
          position: relative;
          overflow: hidden;
        }

        .notification-content {
          position: relative;
          z-index: 2;
        }

        .notification-header {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }

        .notification-icon {
          font-size: 1.2rem;
        }

        .notification-title {
          font-weight: 600;
          color: var(--text-primary);
          flex: 1;
          font-family: 'Orbitron', monospace;
        }

        .notification-close {
          background: none;
          border: none;
          color: var(--text-secondary);
          font-size: 1.5rem;
          cursor: pointer;
          padding: 0;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .notification-close:hover {
          background: rgba(255, 255, 255, 0.1);
          color: var(--text-primary);
        }

        .notification-message {
          color: var(--text-secondary);
          font-size: 0.9rem;
          line-height: 1.4;
        }

        .notification-progress {
          position: absolute;
          bottom: 0;
          left: 0;
          height: 3px;
          background: var(--notification-color);
          width: 100%;
          animation: progressBar var(--duration, 5s) linear forwards;
        }

        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }

        @keyframes progressBar {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }

        @media (max-width: 480px) {
          .notification-container {
            top: 10px;
            right: 10px;
            left: 10px;
            max-width: none;
          }

          .notification {
            padding: 12px;
          }
        }
      `}</style>
    </div>
  )
}