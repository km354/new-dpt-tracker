import { useEffect, useState } from 'react'

export type NotificationPermission = 'default' | 'granted' | 'denied'

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission as NotificationPermission)
    }
  }, [])

  const requestPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications')
      return false
    }

    if (Notification.permission === 'granted') {
      return true
    }

    if (Notification.permission === 'denied') {
      return false
    }

    const permission = await Notification.requestPermission()
    setPermission(permission as NotificationPermission)
    return permission === 'granted'
  }

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return
    }

    new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    })
  }

  return {
    permission,
    requestPermission,
    showNotification,
    isSupported: 'Notification' in window,
  }
}

