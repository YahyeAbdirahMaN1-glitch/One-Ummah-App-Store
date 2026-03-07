// src/components/Layout.tsx
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageCircle, Users, Settings, ArrowLeft } from 'lucide-react';

export default function Layout() {
  const navigate = useNavigate();
  const location = useLocation();

  // Show back button on all pages except home
  const showBackButton = location.pathname !== '/';

  return (
    <div className="flex flex-col min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4 flex items-center justify-between border-b border-gray-800">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 hover:opacity-80"
          >
            <ArrowLeft className="w-5 h-5" /> Back
          </button>
        )}
        <h1 className="text-xl font-bold text-center flex-1">One-Ummah</h1>
        <div className="w-20">{/* placeholder for spacing */}</div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto p-4">
        <Outlet />
      </main>

      {/* Bottom Tabs */}
      <nav className="bg-gray-800 text-white flex justify-around p-3 border-t border-gray-700">
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
