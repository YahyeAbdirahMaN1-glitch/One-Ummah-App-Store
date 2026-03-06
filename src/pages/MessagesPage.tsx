import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MessageCircle, Search, Send, Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../hooks/useNotifications';
import { useMessageNotifications } from '../hooks/useMessageNotifications';
import { toast } from 'sonner';

interface Message {
  id: string;
  userId: string;
  userName: string;
  userImage: string;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface ChatMessage {
  id: string;
  text: string;
  sender: 'me' | 'them';
  timestamp: Date;
}

export default function MessagesPage() {
  const { permission, requestPermission } = useNotifications();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [messages] = useState<Message[]>([]);
  const [messageNotificationsEnabled, setMessageNotificationsEnabled] = useState(false);
  
  // Use message notifications hook
  useMessageNotifications(messageNotificationsEnabled);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      text: 'Assalamu Alaikum! How are you?',
      sender: 'them',
      timestamp: new Date(Date.now() - 1000 * 60 * 10),
    },
    {
      id: '2',
      text: 'Wa Alaikum Assalam! Alhamdulillah, doing well!',
      sender: 'me',
      timestamp: new Date(Date.now() - 1000 * 60 * 5),
    },
  ]);

  const filteredMessages = messages.filter(msg =>
    msg.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedMessage = messages.find(m => m.id === selectedChat);

  const toggleMessageNotifications = async () => {
    if (!messageNotificationsEnabled) {
      const granted = await requestPermission();
      if (granted) {
        setMessageNotificationsEnabled(true);
        toast.success('Message notifications enabled! 🔔');
        // Save preference to localStorage
        localStorage.setItem('messageNotificationsEnabled', 'true');
      }
    } else {
      setMessageNotificationsEnabled(false);
      toast.info('Message notifications disabled');
      localStorage.removeItem('messageNotificationsEnabled');
    }
  };

  // Load notification preference on mount
  useEffect(() => {
    const enabled = localStorage.getItem('messageNotificationsEnabled') === 'true';
    if (enabled && permission === 'granted') {
      setMessageNotificationsEnabled(true);
    }
  }, [permission]);

  const sendMessage = () => {
    if (!newMessage.trim()) return;

    const message: ChatMessage = {
      id: Date.now().toString(),
      text: newMessage,
      sender: 'me',
      timestamp: new Date(),
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (selectedChat && selectedMessage) {
    return (
      <div className="space-y-4">
        {/* Chat Header */}
        <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="text-amber-400 hover:text-amber-300"
            >
              ← Back
            </button>
            <div className="text-3xl">{selectedMessage.userImage}</div>
            <div className="flex-1">
              <h3 className="text-white font-semibold">{selectedMessage.userName}</h3>
              <p className="text-gray-400 text-sm">Active now</p>
            </div>
          </div>
        </Card>

        {/* Messages */}
        <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6 min-h-[400px] max-h-[500px] overflow-y-auto">
          <div className="space-y-4">
            {chatMessages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.sender === 'me' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-lg p-3 ${
                    msg.sender === 'me'
                      ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-white'
                      : 'bg-black/50 border border-amber-900/30 text-white'
                  }`}
                >
                  <p>{msg.text}</p>
                  <p className="text-xs mt-1 opacity-70">{formatTime(msg.timestamp)}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Message Input */}
        <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-4">
          <div className="flex gap-3">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={sendMessage}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <MessageCircle className="w-6 h-6" />
            Messages
          </h2>
          <Button
            onClick={toggleMessageNotifications}
            variant="outline"
            size="sm"
            className={`${
              messageNotificationsEnabled
                ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                : 'bg-black/30 border-amber-900/30 text-gray-400'
            } hover:bg-amber-500/30`}
          >
            {messageNotificationsEnabled ? (
              <>
                <Bell className="w-4 h-4 mr-2" />
                Notifications On
              </>
            ) : (
              <>
                <BellOff className="w-4 h-4 mr-2" />
                Enable Notifications
              </>
            )}
          </Button>
        </div>
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2 mb-4" style={{ display: 'none' }}>
          <MessageCircle className="w-6 h-6" />
          Messages
        </h2>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Message List */}
        {filteredMessages.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg mb-2">No messages yet</p>
            <p className="text-gray-500 text-sm">
              {searchQuery ? 'No messages found' : 'Start connecting with the One Ummah community'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMessages.map(msg => (
              <button
                key={msg.id}
                onClick={() => setSelectedChat(msg.id)}
                className="w-full flex items-center gap-3 p-4 bg-black/30 hover:bg-black/50 border border-amber-900/20 hover:border-amber-800/40 rounded-lg transition-all text-left"
              >
                <div className="text-3xl">{msg.userImage}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold">{msg.userName}</h3>
                    <span className="text-gray-400 text-xs">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="text-gray-400 text-sm truncate">{msg.lastMessage}</p>
                </div>
                {msg.unread > 0 && (
                  <div className="bg-amber-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                    {msg.unread}
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
