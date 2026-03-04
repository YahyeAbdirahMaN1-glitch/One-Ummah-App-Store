import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';

export default function SignUpPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [gender, setGender] = useState<'male' | 'female'>('male');
  const [loading, setLoading] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !email || !password || !confirmPassword) {
      toast.error('Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signup(email, password, name, gender);
      toast.success('Welcome to One Ummah!');
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-amber-400 mb-2">🕌 One Ummah</h1>
          <p className="text-gray-400">Join the community</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div>
            <Input
              type="password"
              placeholder="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-black/50 border-amber-900/30 text-white placeholder:text-gray-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-white text-sm font-medium">Gender</label>
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setGender('male')}
                className={`flex-1 py-3 rounded-lg border transition-all ${
                  gender === 'male'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-black/30 border-amber-900/30 text-gray-400'
                }`}
              >
                Male
              </button>
              <button
                type="button"
                onClick={() => setGender('female')}
                className={`flex-1 py-3 rounded-lg border transition-all ${
                  gender === 'female'
                    ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                    : 'bg-black/30 border-amber-900/30 text-gray-400'
                }`}
              >
                Female
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-400">
            Already have an account?{' '}
            <Link to="/login" className="text-amber-400 hover:text-amber-300 font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
}
