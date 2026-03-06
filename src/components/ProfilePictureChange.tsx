import { useState, useRef } from 'react';
import { Card } from './ui/card';
import { Button } from './ui/button';
import { X, Camera, Upload } from 'lucide-react';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';
import { toast } from 'sonner';

interface ProfilePictureChangeProps {
  userId: string;
  userName: string;
  currentImage?: string;
  onClose: () => void;
}

export default function ProfilePictureChange({ userId, userName, currentImage, onClose }: ProfilePictureChangeProps) {
  const [uploading, setUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(currentImage || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }

    setUploading(true);

    try {
      // Convert to base64
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve) => {
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });

      setPreviewImage(base64);

      // Upload to server
      const response = await CapacitorHttp.post({
        url: `${API_URL}/updateProfilePicture`,
        headers: { 'Content-Type': 'application/json' },
        data: { 
          userId, 
          profilePicture: base64 
        },
      });

      if (response.status === 200) {
        toast.success('Profile picture updated! Refreshing...');
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error('Failed to update profile picture');
        setPreviewImage(currentImage || null);
      }
    } catch (error) {
      console.error('Profile picture upload error:', error);
      toast.error('Failed to update profile picture');
      setPreviewImage(currentImage || null);
    } finally {
      setUploading(false);
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
            <div className="flex items-center gap-2 mb-2">
              <Camera className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-bold text-amber-400">Change Profile Picture</h2>
            </div>
            <p className="text-sm text-gray-400">{userName}</p>
          </div>

          {/* Current/Preview Image */}
          <div className="mb-6 flex justify-center">
            <div className="relative">
              {previewImage ? (
                <img
                  src={previewImage}
                  alt="Profile preview"
                  className="w-32 h-32 rounded-full object-cover border-4 border-amber-900/30"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-900/30 to-black border-4 border-amber-900/30 flex items-center justify-center">
                  <span className="text-4xl text-amber-400">
                    {userName.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
              {uploading && (
                <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                  <div className="w-8 h-8 border-4 border-amber-400 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
          </div>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />

          {/* Upload Button */}
          <Button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white flex items-center justify-center gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Choose New Picture'}
          </Button>

          {/* Info */}
          <div className="mt-4 p-3 bg-amber-950/20 border border-amber-900/30 rounded-lg">
            <p className="text-xs text-gray-300 leading-relaxed">
              <strong>Requirements:</strong>
              <br />• Image files only (JPG, PNG, etc.)
              <br />• Maximum size: 5MB
              <br />• Recommended: Square images (1:1 ratio)
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
