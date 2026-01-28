import { useEffect, useState } from 'react';

interface ServiceWorkerState {
  isSupported: boolean;
  isRegistered: boolean;
  isUpdating: boolean;
  registration: ServiceWorkerRegistration | null;
}

export const useServiceWorker = () => {
  const [state, setState] = useState<ServiceWorkerState>({
    isSupported: 'serviceWorker' in navigator,
    isRegistered: false,
    isUpdating: false,
    registration: null,
  });

  useEffect(() => {
    if (!state.isSupported) return;

    const registerSW = async () => {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });

        setState(prev => ({
          ...prev,
          isRegistered: true,
          registration,
        }));

        // Check for updates
        registration.addEventListener('updatefound', () => {
          setState(prev => ({ ...prev, isUpdating: true }));
        });

        // Periodic update check
        setInterval(() => {
          registration.update();
        }, 60 * 60 * 1000); // Check every hour

      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    };

    registerSW();
  }, [state.isSupported]);

  const requestNotificationPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  };

  const scheduleNotification = async (
    title: string,
    body: string,
    delayMs: number,
    data?: { animeId?: number; url?: string }
  ) => {
    if (!state.registration?.active) {
      // Fallback to setTimeout-based notification
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification(title, {
            body,
            icon: '/icon-192.png',
            ...data,
          });
        }
      }, delayMs);
      return;
    }

    // Send to service worker for background scheduling
    state.registration.active.postMessage({
      type: 'SCHEDULE_NOTIFICATION',
      title,
      body,
      delay: delayMs,
      ...data,
    });
  };

  const showNotification = async (title: string, options?: NotificationOptions) => {
    const hasPermission = await requestNotificationPermission();
    if (!hasPermission) return;

    if (state.registration) {
      state.registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        ...options,
      });
    } else if ('Notification' in window) {
      new Notification(title, options);
    }
  };

  return {
    ...state,
    requestNotificationPermission,
    scheduleNotification,
    showNotification,
  };
};