import { useState, useEffect } from 'react';
import { Card } from '../components/ui/card';
import { Eye, EyeOff, ArrowLeft, Wifi, WifiOff } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';

export default function PrivacySettingsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [readReceiptsEnabled, setReadReceiptsEnabled] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadPrivacySettings();
  }, [user]);

  const loadPrivacySettings = async () => {
    if (!user) return;
    
    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/getUser`,
        headers: { 'Content-Type': 'application/json' },
        data: { userId: user.id },
      });

      if (response.status === 200 && response.data.user) {
        setReadReceiptsEnabled(response.data.user.readReceiptsEnabled ?? true);
        setIsOnline(response.data.user.isOnline ?? true);
      }
    } catch (error) {
      console.error('Failed to load privacy settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleOnlineStatus = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    const newValue = !isOnline;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/updateOnlineStatus`,
        headers: { 'Content-Type': 'application/json' },
        data: { 
          userId: user.id,
          isOnline: newValue
        },
      });

      if (response.status === 200) {
        setIsOnline(newValue);
        toast.success(
          newValue 
            ? 'You are now visible as ONLINE' 
            : 'You appear OFFLINE - others won\'t see you\'re active'
        );
      } else {
        toast.error('Failed to update online status');
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
      toast.error('Failed to update online status');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleReadReceipts = async () => {
    if (!user || isSaving) return;

    setIsSaving(true);
    const newValue = !readReceiptsEnabled;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/updatePrivacySettings`,
        headers: { 'Content-Type': 'application/json' },
        data: { 
          userId: user.id,
          readReceiptsEnabled: newValue
        },
      });

      if (response.status === 200) {
        setReadReceiptsEnabled(newValue);
        toast.success(
          newValue 
            ? 'Others can now see when you read their messages' 
            : 'Read receipts hidden - others won\'t know when you read messages'
        );
      } else {
        toast.error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Failed to update read receipts:', error);
      toast.error('Failed to update privacy settings');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate('/settings')}
            className="p-2 hover:bg-black/30 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-400" />
          </button>
          <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2">
            <Eye className="w-6 h-6" />
            Privacy Settings
          </h2>
        </div>

        {isLoading ? (
          <div className="text-center text-gray-400 py-8">Loading...</div>
        ) : (
          <div className="space-y-4">
            {/* Online Status Toggle */}
            <div className="p-5 bg-black/30 border border-amber-900/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {isOnline ? (
                      <Wifi className="w-5 h-5 text-green-400" />
                    ) : (
                      <WifiOff className="w-5 h-5 text-red-400" />
                    )}
                    <h3 className="text-white font-semibold">Online Status</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {isOnline
                      ? 'You appear ONLINE. Others can see you\'re active with a green dot.'
                      : 'You appear OFFLINE. Others won\'t see you\'re active (red dot or no status).'}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={toggleOnlineStatus}
                  disabled={isSaving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0
                    ${isOnline ? 'bg-green-500' : 'bg-red-500'}
                    ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${isOnline ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            {/* Read Receipts Toggle */}
            <div className="p-5 bg-black/30 border border-amber-900/20 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {readReceiptsEnabled ? (
                      <Eye className="w-5 h-5 text-green-400" />
                    ) : (
                      <EyeOff className="w-5 h-5 text-gray-400" />
                    )}
                    <h3 className="text-white font-semibold">Read Receipts</h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {readReceiptsEnabled
                      ? 'Others can see when you read their messages. Your read receipts are visible.'
                      : 'Your read receipts are hidden. Others won\'t know when you read their messages.'}
                  </p>
                </div>

                {/* Toggle Switch */}
                <button
                  onClick={toggleReadReceipts}
                  disabled={isSaving}
                  className={`
                    relative inline-flex h-6 w-11 items-center rounded-full transition-colors ml-4 flex-shrink-0
                    ${readReceiptsEnabled ? 'bg-green-500' : 'bg-gray-600'}
                    ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span
                    className={`
                      inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                      ${readReceiptsEnabled ? 'translate-x-6' : 'translate-x-1'}
                    `}
                  />
                </button>
              </div>
            </div>

            {/* Info Box */}
            <div className="p-4 bg-amber-950/20 border border-amber-900/30 rounded-lg">
              <p className="text-sm text-amber-200/80 leading-relaxed">
                <strong>Note:</strong> When read receipts are disabled, you also won't be able to see when others have read your messages. This setting affects both incoming and outgoing message read status.
              </p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
