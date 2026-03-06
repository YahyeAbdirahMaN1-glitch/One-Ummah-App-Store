import { useEffect, useState } from 'react';
import { toast } from 'sonner';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check if notifications are supported
    setIsSupported('Notification' in window);
    
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if (!isSupported) {
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    if (permission === 'granted') {
      return true;
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      
      if (result === 'granted') {
        toast.success('Notifications enabled! You will receive prayer and message alerts.');
        return true;
      } else if (result === 'denied') {
        toast.error('Notification permission denied. Please enable in browser settings.');
        return false;
      }
      return false;
    } catch (error) {
      console.error('Notification permission error:', error);
      toast.error('Failed to request notification permission');
      return false;
    }
  };

  const sendNotification = (title: string, options?: NotificationOptions) => {
    if (!isSupported) {
      console.warn('Notifications not supported');
      return;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      const notification = new Notification(title, {
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        vibrate: [200, 100, 200],
        ...options,
      });

      // Auto-close after 5 seconds
      setTimeout(() => notification.close(), 5000);

      notification.onclick = () => {
        window.focus();
        notification.close();
      };
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const sendPrayerNotification = (prayerName: string, time: string) => {
    sendNotification(`Prayer Time: ${prayerName}`, {
      body: `It's time for ${prayerName} prayer (${time})`,
      icon: '/icon-192x192.png',
      tag: 'prayer-time',
      requireInteraction: true,
    });
  };

  const sendMessageNotification = (senderName: string, message: string) => {
    sendNotification(`New message from ${senderName}`, {
      body: message.substring(0, 100) + (message.length > 100 ? '...' : ''),
      icon: '/icon-192x192.png',
      tag: 'new-message',
      requireInteraction: false,
    });
  };

  return {
    permission,
    isSupported,
    requestPermission,
    sendNotification,
    sendPrayerNotification,
    sendMessageNotification,
  };
}
