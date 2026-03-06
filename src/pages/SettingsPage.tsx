import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Settings, FileText, Shield, AlertCircle, ChevronRight, User } from 'lucide-react';
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

        <div className="space-y-3">
          {/* Edit Profile */}
          <button
            onClick={() => navigate('/profile-settings')}
            className="w-full flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-amber-900/20 hover:border-amber-800/40 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <User className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">Edit Profile</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Privacy Policy */}
          <button
            onClick={() => navigate('/privacy')}
            className="w-full flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-amber-900/20 hover:border-amber-800/40 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">Privacy Policy</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Terms of Service */}
          <button
            onClick={() => navigate('/terms')}
            className="w-full flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-amber-900/20 hover:border-amber-800/40 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">Terms of Service</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Report a Problem */}
          <button
            onClick={() => navigate('/report-problem')}
            className="w-full flex items-center justify-between p-4 bg-black/30 hover:bg-black/50 border border-amber-900/20 hover:border-amber-800/40 rounded-lg transition-all"
          >
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-amber-400" />
              <span className="text-white font-medium">Report a Problem</span>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </button>

          {/* Logout */}
          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full mt-6"
          >
            Logout
          </Button>
        </div>
      </Card>
    </div>
  );
}
