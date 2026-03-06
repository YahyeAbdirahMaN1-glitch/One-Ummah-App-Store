import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { useAuth } from '../hooks/useAuth';
import ProfilePictureUpload from '../components/ProfilePictureUpload';
import { API_URL } from '../config';
import { CapacitorHttp } from '@capacitor/core';

export default function ProfileSettingsPage() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  
  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [country, setCountry] = useState(user?.country || '');
  const [profilePicture, setProfilePicture] = useState(user?.profilePicture || null);
  const [gender, setGender] = useState(user?.gender || 'male');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!user?.id) {
      toast.error('User not found');
      return;
    }

    setIsSaving(true);

    try {
      const response = await CapacitorHttp.post({
        url: `${API_URL}/updateProfile`,
        headers: { 'Content-Type': 'application/json' },
        data: {
          userId: user.id,
          name,
          bio,
          city,
          country,
          profilePicture,
          gender,
        },
      });

      if (response.status === 200) {
        toast.success('Profile updated successfully! ✨');
        await refreshUser(); // Refresh user data
        navigate('/settings');
      } else {
        toast.error(response.data?.error || 'Failed to update profile');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <button
        onClick={() => navigate('/settings')}
        className="mb-4 flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Settings</span>
      </button>

      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 mb-6">Edit Profile</h2>

        <div className="space-y-6">
          {/* Profile Picture Upload */}
          <div className="flex flex-col items-center py-4">
            <ProfilePictureUpload
              currentPicture={profilePicture}
              gender={gender}
              onUpload={setProfilePicture}
            />
          </div>

          {/* Gender Selection */}
          <div>
            <label className="block text-sm font-medium text-amber-300 mb-2">
              Gender *
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setGender('male')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  gender === 'male'
                    ? 'border-amber-500 bg-amber-500/20 text-white'
                    : 'border-gray-600 bg-black/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                Brother 👨
              </button>
              <button
                onClick={() => setGender('female')}
                className={`flex-1 py-3 px-4 rounded-lg border-2 transition-all ${
                  gender === 'female'
                    ? 'border-amber-500 bg-amber-500/20 text-white'
                    : 'border-gray-600 bg-black/30 text-gray-400 hover:border-gray-500'
                }`}
              >
                Sister 👩
              </button>
            </div>
            {gender === 'female' && (
              <p className="text-xs text-amber-300/70 mt-2">
                ✨ Your profile photo will automatically include a hijab overlay for modesty
              </p>
            )}
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-amber-300 mb-2">
              Name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter your name"
              className="bg-black/30 border-amber-900/30 text-white"
            />
          </div>

          {/* Bio */}
          <div>
            <label className="block text-sm font-medium text-amber-300 mb-2">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself..."
              rows={4}
              className="w-full px-3 py-2 bg-black/30 border border-amber-900/30 rounded-lg text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-amber-300 mb-2">
                City
              </label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Your city"
                className="bg-black/30 border-amber-900/30 text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-300 mb-2">
                Country
              </label>
              <Input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                placeholder="Your country"
                className="bg-black/30 border-amber-900/30 text-white"
              />
            </div>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Saving...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <Save className="w-4 h-4" />
                Save Profile
              </span>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
