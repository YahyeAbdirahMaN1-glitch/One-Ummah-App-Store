import { useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import { useNotifications } from './useNotifications';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
  read: boolean;
  sender: {
    id: string;
    name: string | null;
    profilePicture: string | null;
  };
}

export function useMessageNotifications(enabled: boolean) {
  const { user } = useAuth();
  const { sendMessageNotification } = useNotifications();
  const lastCheckedRef = useRef<string>(new Date().toISOString());
  const notifiedMessagesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!enabled || !user?.id) return;

    const checkForNewMessages = async () => {
      try {
        const response = await CapacitorHttp.post({
          url: `${API_URL}/getRecentMessages`,
          headers: { 'Content-Type': 'application/json' },
          data: {
            userId: user.id,
            lastChecked: lastCheckedRef.current,
          },
        });

        if (response.status === 200 && response.data.messages) {
          const newMessages: Message[] = response.data.messages;

          newMessages.forEach((message) => {
            // Only notify for messages we haven't notified about
            if (!notifiedMessagesRef.current.has(message.id)) {
              const senderName = message.sender.name || 'Someone';
              sendMessageNotification(senderName, message.content);
              notifiedMessagesRef.current.add(message.id);
            }
          });

          // Update last checked timestamp
          if (newMessages.length > 0) {
            lastCheckedRef.current = new Date().toISOString();
          }
        }
      } catch (error) {
        console.error('Failed to check for new messages:', error);
      }
    };

    // Check immediately
    checkForNewMessages();

    // Then check every 10 seconds
    const interval = setInterval(checkForNewMessages, 10000);

    return () => clearInterval(interval);
  }, [enabled, user?.id, sendMessageNotification]);
}
