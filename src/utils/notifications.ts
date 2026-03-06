// Notification utility for One Ummah
// Handles browser notifications for messages, friends, and other events

export type NotificationType = 
  | 'new_message'
  | 'friend_request' 
  | 'friend_accepted'
  | 'friend_suggestion'
  | 'prayer_time'
  | 'new_comment'
  | 'new_like';

export interface NotificationOptions {
  title: string;
  body: string;
  icon?: string;
  tag?: string;
  data?: any;
  requireInteraction?: boolean;
}

class NotificationService {
  private permission: NotificationPermission = 'default';

  constructor() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  // Request notification permission
  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.log('[Notifications] Not supported in this browser');
      return false;
    }

    if (this.permission === 'granted') {
      return true;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('[Notifications] Permission request failed:', error);
      return false;
    }
  }

  // Show a notification
  async show(type: NotificationType, options: NotificationOptions): Promise<void> {
    // Check permission first
    if (this.permission !== 'granted') {
      const granted = await this.requestPermission();
      if (!granted) {
        console.log('[Notifications] Permission denied');
        return;
      }
    }

    try {
      const notification = new Notification(options.title, {
        body: options.body,
        icon: options.icon || '/icon-192x192.png',
        tag: options.tag || `one-ummah-${type}-${Date.now()}`,
        requireInteraction: options.requireInteraction || false,
        data: {
          type,
          ...options.data,
        },
      });

      // Handle notification click
      notification.onclick = (event) => {
        event.preventDefault();
        window.focus();
        
        // Navigate based on notification type
        switch (type) {
          case 'new_message':
            window.location.href = '/messages';
            break;
          case 'friend_request':
          case 'friend_accepted':
            window.location.href = '/friends';
            break;
          case 'friend_suggestion':
            window.location.href = '/friends';
            break;
          case 'new_comment':
          case 'new_like':
            window.location.href = '/';
            break;
          default:
            window.location.href = '/';
        }
        
        notification.close();
      };

      console.log('[Notifications] Shown:', type, options.title);
    } catch (error) {
      console.error('[Notifications] Failed to show:', error);
    }
  }

  // Helper methods for specific notification types
  async newMessage(senderName: string, messagePreview: string): Promise<void> {
    await this.show('new_message', {
      title: `New message from ${senderName}`,
      body: messagePreview,
      tag: 'new-message',
      requireInteraction: true,
    });
  }

  async friendRequest(senderName: string): Promise<void> {
    await this.show('friend_request', {
      title: 'New Friend Request',
      body: `${senderName} wants to connect with you`,
      tag: 'friend-request',
    });
  }

  async friendAccepted(friendName: string): Promise<void> {
    await this.show('friend_accepted', {
      title: 'Friend Request Accepted',
      body: `${friendName} accepted your friend request`,
      tag: 'friend-accepted',
    });
  }

  async friendSuggestion(suggestedFriends: string[]): Promise<void> {
    const names = suggestedFriends.slice(0, 3).join(', ');
    await this.show('friend_suggestion', {
      title: 'Friend Suggestions',
      body: `People you may know: ${names}${suggestedFriends.length > 3 ? ' and more' : ''}`,
      tag: 'friend-suggestion',
    });
  }

  async newComment(userName: string, postPreview: string): Promise<void> {
    await this.show('new_comment', {
      title: `${userName} commented on your post`,
      body: postPreview,
      tag: 'new-comment',
    });
  }

  async newLike(userName: string): Promise<void> {
    await this.show('new_like', {
      title: 'New Like',
      body: `${userName} liked your post`,
      tag: 'new-like',
    });
  }

  async prayerTime(prayerName: string, minutesUntil: number): Promise<void> {
    await this.show('prayer_time', {
      title: `Prayer Time: ${prayerName}`,
      body: minutesUntil === 0 
        ? `It's time for ${prayerName} prayer` 
        : `${prayerName} prayer in ${minutesUntil} minutes`,
      tag: `prayer-${prayerName}`,
      requireInteraction: true,
    });
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
