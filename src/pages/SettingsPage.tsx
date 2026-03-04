import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-amber-950/30 to-black border-amber-900/30 p-6">
        <h2 className="text-2xl font-bold text-amber-400 flex items-center gap-2 mb-6">
          <Settings className="w-6 h-6" />
          Settings
        </h2>

        <div className="space-y-4">
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full"
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
