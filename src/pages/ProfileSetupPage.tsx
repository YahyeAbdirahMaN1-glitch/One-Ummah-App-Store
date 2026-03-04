import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';

export default function ProfileSetupPage() {
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Please enter your name');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/profile/setup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio, city, country }),
        credentials: 'include',
      });

      if (!response.ok) throw new Error('Failed to update profile');

      toast.success('Profile updated successfully!');
      navigate('/');
    } catch (error) {
      toast.error('Failed to update profile');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-8">
        <h2 className="text-2xl font-bold text-amber-400 mb-6">Complete Your Profile</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-white text-sm font-medium mb-2 block">Name *</label>
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white"
              placeholder="Your name"
            />
          </div>

          <div>
            <label className="text-white text-sm font-medium mb-2 block">Bio</label>
            <Textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white"
              placeholder="Tell us about yourself..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-white text-sm font-medium mb-2 block">City</label>
              <Input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="bg-black/50 border-amber-900/30 text-white"
              />
            </div>
            <div>
              <label className="text-white text-sm font-medium mb-2 block">Country</label>
              <Input
                type="text"
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="bg-black/50 border-amber-900/30 text-white"
              />
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {loading ? 'Saving...' : 'Complete Profile'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
