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
    console.log('[Notifications] requestPermission called', { isSupported, permission });
    
    if (!isSupported) {
      console.error('[Notifications] Not supported');
      toast.error('Notifications are not supported in this browser');
      return false;
    }

    if (permission === 'granted') {
      console.log('[Notifications] Already granted');
      return true;
    }

    try {
      console.log('[Notifications] Requesting permission...');
      
      // iOS Safari requires user interaction before showing permission dialog
      // The dialog should appear when this is called from a button click
      const result = await Notification.requestPermission();
      console.log('[Notifications] Permission result:', result);
      
      setPermission(result);
      
      if (result === 'granted') {
        console.log('[Notifications] Permission granted!');
        toast.success('Notifications enabled! You will receive prayer and message alerts.');
        
        // Test notification to confirm it works
        try {
          const testNotif = new Notification('One Ummah', {
            body: 'Prayer notifications are now enabled!',
            icon: '/icon-192x192.png',
          });
          setTimeout(() => testNotif.close(), 3000);
          console.log('[Notifications] Test notification sent');
        } catch (notifError) {
          console.error('[Notifications] Test notification failed:', notifError);
        }
        
        return true;
      } else if (result === 'denied') {
        console.warn('[Notifications] Permission denied');
        toast.error('Notification permission denied. Please enable in browser settings.');
        return false;
      } else {
        console.warn('[Notifications] Permission default/dismissed');
        return false;
      }
    } catch (error) {
      console.error('[Notifications] Permission request error:', error);
      toast.error('Failed to request notification permission. Please try again.');
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
