import { useState, useEffect, useRef } from 'react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { MessageCircle, Search, Send, Eye, EyeOff, ArrowLeft, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { CapacitorHttp } from '@capacitor/core';
import { API_URL } from '../config';
import { toast } from 'sonner';

interface Conversation {
  userId: string;
  userName: string;
  userImage: string | null;
  isOnline: boolean;
  lastMessage: string;
  timestamp: Date;
  unread: number;
}

interface ChatMessage {
  id: string;
  senderId: string;
  content: string;
  createdAt: Date;
  readAt: Date | null;
  openedWithoutNotifying: boolean;
}

export default function MessagesPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversations on mount
  useEffect(() => {
    if (user) {
      loadConversations();
      updateOnlineStatus(true);
    }

    // Set user offline when leaving page
    return () => {
      if (user) {
        updateOnlineStatus(false);
      }
    };
  }, [user]);

  // Load chat messages when conversation selected
  useEffect(() => {
    if (selectedChat && user) {
      loadChatMessages(selectedChat);
      // Mark messages as read
      markAsRead(selectedChat);
    }
  }, [selectedChat, user]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const updateOnlineStatus = async (isOnline: boolean) => {
    if (!user) return;

    try {
      await CapacitorHttp.post({
        url: `${API_URL}/updateOnlineStatus`,
        headers: { 'Content-Type': 'application/json' },
        data: { userId: user.id, isOnline },
      });
    } catch (error) {
      console.error('Failed to update online status:', error);
    }
  };

  const loadConversations = async () => {
    if (!user) return;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/getConversations`,
        headers: { 'Content-Type': 'application/json' },
        data: { userId: user.id },
      });

      if (response.data && response.data.conversations) {
        const formattedConversations: Conversation[] = response.data.conversations.map((conv: any) => ({
          userId: conv.userId,
          userName: conv.userName,
          userImage: conv.userImage,
          isOnline: conv.isOnline,
          lastMessage: conv.lastMessage,
          timestamp: new Date(conv.timestamp),
          unread: conv.unread,
        }));

        setConversations(formattedConversations);
      }
    } catch (error) {
      console.error('Failed to load conversations:', error);
    }
  };

  const loadChatMessages = async (partnerId: string) => {
    if (!user) return;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/getChatMessages`,
        headers: { 'Content-Type': 'application/json' },
        data: { userId: user.id, partnerId },
      });

      if (response.data && response.data.messages) {
        const formattedMessages: ChatMessage[] = response.data.messages.map((msg: any) => ({
          id: msg.id,
          senderId: msg.senderId,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          readAt: msg.readAt ? new Date(msg.readAt) : null,
          openedWithoutNotifying: msg.openedWithoutNotifying,
        }));

        setChatMessages(formattedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat messages:', error);
    }
  };

  const markAsRead = async (partnerId: string) => {
    if (!user) return;

    try {
      await CapacitorHttp.post({
        url: `${API_URL}/markMessagesAsRead`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          userId: user.id,
          partnerId,
          withoutNotifying: !readReceiptsEnabled,
        },
      });

      // Update unread count in conversations
      setConversations(conversations.map(conv =>
        conv.userId === partnerId ? { ...conv, unread: 0 } : conv
      ));
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedChat || !user) return;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/sendMessage`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          senderId: user.id,
          receiverId: selectedChat,
          content: newMessage,
        },
      });

      if (response.data && response.data.message) {
        const msg = response.data.message;
        const newChatMessage: ChatMessage = {
          id: msg.id,
          senderId: user.id,
          content: msg.content,
          createdAt: new Date(msg.createdAt),
          readAt: null,
          openedWithoutNotifying: false,
        };

        setChatMessages([...chatMessages, newChatMessage]);
        setNewMessage('');

        // Update conversation list
        loadConversations();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.userName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedConversation = conversations.find(c => c.userId === selectedChat);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-black">
        <p className="text-gray-400">Please sign in to view messages</p>
      </div>
    );
  }

  if (selectedChat && selectedConversation) {
    // Chat View
    return (
      <div className="flex flex-col h-screen bg-black">
        {/* Chat Header */}
        <div className="bg-gradient-to-r from-amber-950/30 to-black border-b border-amber-900/30 p-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedChat(null)}
              className="p-2 rounded-full hover:bg-amber-900/20 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-amber-400" />
            </button>

            <div className="relative">
              {selectedConversation.userImage ? (
                <img
                  src={selectedConversation.userImage}
                  alt={selectedConversation.userName}
                  className="w-12 h-12 rounded-full border-2 border-amber-500 object-cover"
                />
              ) : (
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                  <User className="w-6 h-6 text-white" />
                </div>
              )}
              
              {/* Online/Offline Indicator */}
              <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${
                selectedConversation.isOnline ? 'bg-green-400' : 'bg-red-500'
              }`} />
            </div>

            <div className="flex-1">
              <h2 className="text-white font-semibold">{selectedConversation.userName}</h2>
              <p className="text-sm text-gray-400">
                {selectedConversation.isOnline ? 'Online' : 'Offline'}
              </p>
            </div>

            {/* Read Receipts Toggle */}
            <button
              onClick={() => setReadReceiptsEnabled(!readReceiptsEnabled)}
              className={`p-2 rounded-full transition-colors ${
                readReceiptsEnabled ? 'bg-green-500/20 text-green-400' : 'bg-gray-700/20 text-gray-400'
              }`}
              title={readReceiptsEnabled ? 'Read receipts ON' : 'Read receipts OFF'}
            >
              {readReceiptsEnabled ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {chatMessages.length === 0 ? (
            <div className="text-center text-gray-500 mt-20">
              <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p>No messages yet</p>
              <p className="text-sm mt-2">Send a message to start the conversation</p>
            </div>
          ) : (
            chatMessages.map(msg => {
              const isMe = msg.senderId === user.id;
              
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] ${isMe ? 'bg-gradient-to-r from-amber-500 to-amber-600' : 'bg-gray-800'} rounded-lg p-3`}>
                    <p className="text-white text-sm">{msg.content}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs opacity-70 text-white">
                        {msg.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {isMe && msg.readAt && (
                        <span className="text-xs text-green-300" title={`Read at ${msg.readAt.toLocaleTimeString()}`}>
                          {msg.openedWithoutNotifying ? '(Private read)' : '✓✓ Read'}
                        </span>
                      )}
                      {isMe && !msg.readAt && (
                        <span className="text-xs text-gray-300">✓ Sent</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-gradient-to-r from-amber-950/30 to-black border-t border-amber-900/30 p-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
            <Button
              onClick={handleSendMessage}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="min-h-screen bg-black p-4">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <MessageCircle className="w-8 h-8" />
            Messages
          </h1>

          {/* Read Receipts Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setReadReceiptsEnabled(!readReceiptsEnabled)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                readReceiptsEnabled
                  ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                  : 'bg-gray-700/20 text-gray-400 border border-gray-600/30'
              }`}
            >
              {readReceiptsEnabled ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
              <span className="text-sm font-semibold">
                {readReceiptsEnabled ? 'Read Receipts ON' : 'Read Receipts OFF'}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
          />
        </div>

        {/* Conversations List */}
        {filteredConversations.length === 0 ? (
          <div className="text-center text-gray-500 py-12">
            <MessageCircle className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No conversations yet</p>
            <p className="text-sm mt-2">Start messaging people from the Friends page</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredConversations.map(conv => (
              <div
                key={conv.userId}
                onClick={() => setSelectedChat(conv.userId)}
                className="flex items-center gap-4 p-4 bg-black/30 rounded-lg border border-amber-900/20 hover:bg-amber-900/10 cursor-pointer transition-all"
              >
                <div className="relative">
                  {conv.userImage ? (
                    <img
                      src={conv.userImage}
                      alt={conv.userName}
                      className="w-14 h-14 rounded-full border-2 border-amber-500 object-cover"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
                      <User className="w-7 h-7 text-white" />
                    </div>
                  )}
                  
                  {/* Online/Offline Indicator */}
                  <div className={`absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-black ${
                    conv.isOnline ? 'bg-green-400' : 'bg-red-500'
                  }`} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-white font-semibold truncate">{conv.userName}</h3>
                    <span className="text-xs text-gray-400">
                      {conv.timestamp.toLocaleDateString() === new Date().toLocaleDateString()
                        ? conv.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : conv.timestamp.toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-400 truncate">{conv.lastMessage}</p>
                    {conv.unread > 0 && (
                      <span className="bg-amber-500 text-black text-xs font-bold px-2 py-1 rounded-full ml-2">
                        {conv.unread}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
