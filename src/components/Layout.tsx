import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Users, Settings, ArrowLeft } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  const showBackButton = location.pathname !== '/';

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      
      <header className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        )}
        <h1 className="text-xl font-bold text-center flex-1">One Ummah</h1>
        <div className="w-20"></div>
      </header>

      <main className="p-4 pb-24">
        <Outlet />
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-gray-800 text-white flex justify-around p-3 border-t border-gray-700">
        <button onClick={() => navigate('/')} className="flex flex-col items-center">
          <Home className="w-6 h-6" />
          <span className="text-xs">Home</span>
        </button>

        <button onClick={() => navigate('/friends')} className="flex flex-col items-center">
          <Users className="w-6 h-6" />
          <span className="text-xs">Friends</span>
        </button>

        <button onClick={() => navigate('/messages')} className="flex flex-col items-center">
          <MessageCircle className="w-6 h-6" />
          <span className="text-xs">Messages</span>
        </button>

        <button onClick={() => navigate('/settings')} className="flex flex-col items-center">
          <Settings className="w-6 h-6" />
          <span className="text-xs">Settings</span>
        </button>
      </nav>
    </div>
  );
}
