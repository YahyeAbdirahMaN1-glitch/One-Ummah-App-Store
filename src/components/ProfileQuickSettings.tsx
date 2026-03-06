import { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, User, Wifi, WifiOff } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';
import { toast } from 'sonner';

interface ProfileQuickSettingsProps {
  userId: string;
  userName: string;
  isOnline: boolean;
  onClose: () => void;
}

export default function ProfileQuickSettings({ userId, userName, isOnline: initialOnlineStatus, onClose }: ProfileQuickSettingsProps) {
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(initialOnlineStatus);
  const [isToggling, setIsToggling] = useState(false);

  const toggleOnlineStatus = async () => {
    setIsToggling(true);
    const newValue = !isOnline;

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/updateOnlineStatus`,
        headers: { 'Content-Type': 'application/json' },
        data: { userId, isOnline: newValue },
      });

      if (response.status === 200) {
        setIsOnline(newValue);
        toast.success(
          newValue 
            ? 'You are now visible as ONLINE' 
            : 'You appear OFFLINE - others won\'t see you\'re active'
        );
        // Close modal after successful update (NO PAGE RELOAD)
        setTimeout(() => onClose(), 500);
      } else {
        toast.error('Failed to update online status');
      }
    } catch (error) {
      console.error('Failed to update online status:', error);
      toast.error('Failed to update online status');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/80 z-[100000]"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100001] w-full max-w-md px-4">
        <Card className="bg-gradient-to-br from-amber-950/95 to-black border-amber-900/50 p-6 relative">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-black/30 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>

          {/* Header */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-amber-400 mb-2">{userName}</h2>
            <p className="text-sm text-gray-400">Quick Settings</p>
          </div>

          {/* Online Status Toggle */}
          <div className="mb-4 p-4 bg-black/30 border border-amber-900/20 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isOnline ? (
                  <Wifi className="w-5 h-5 text-green-400" />
                ) : (
                  <WifiOff className="w-5 h-5 text-red-400" />
                )}
                <div>
                  <h3 className="text-white font-semibold">Online Status</h3>
                  <p className="text-xs text-gray-400">
                    {isOnline ? 'You appear ONLINE' : 'You appear OFFLINE'}
                  </p>
                </div>
              </div>

              {/* Toggle Switch */}
              <button
                onClick={toggleOnlineStatus}
                disabled={isToggling}
                className={`
                  relative inline-flex h-6 w-11 items-center rounded-full transition-colors flex-shrink-0
                  ${isOnline ? 'bg-green-500' : 'bg-red-500'}
                  ${isToggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
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

          {/* Edit Profile Button */}
          <Button
            onClick={() => {
              navigate('/profile-settings');
              onClose();
            }}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex items-center justify-center gap-2"
          >
            <User className="w-4 h-4" />
            Edit Profile
          </Button>

          {/* Info */}
          <p className="mt-4 text-xs text-center text-gray-400">
            For more settings, go to Settings → Privacy Settings
          </p>
        </Card>
      </div>
    </>
  );
}
