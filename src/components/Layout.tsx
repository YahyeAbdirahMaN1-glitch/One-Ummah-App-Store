import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Home, Clock, MessageCircle, Users, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function Layout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Check if profile setup is needed
  useEffect(() => {
    if (user && !user.name && location.pathname !== '/profile-setup') {
      navigate('/profile-setup');
    }
  }, [user, location.pathname, navigate]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-amber-400 text-xl">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const navItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Clock, label: 'Prayer Times', path: '/prayer-times' },
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Users, label: 'Friends', path: '/friends' },
    { icon: Settings, label: 'Settings', path: '/settings' },
  ];

  // Pages that shouldn't show back button (main nav pages)
  const noBackButtonPages = ['/', '/prayer-times', '/messages', '/friends', '/settings'];
  const showBackButton = !noBackButtonPages.includes(location.pathname);

  return (
    <div className="min-h-screen bg-black text-white pb-20">
      {/* Header */}
      <header className="bg-gradient-to-b from-black to-amber-950/20 border-b border-amber-900/30 sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {showBackButton && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-amber-900/20 rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-amber-400" />
              </button>
            )}
            <h1 className="text-2xl font-bold text-amber-400">🕌 One Ummah</h1>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-2xl mx-auto px-4 py-6">
        <Outlet />
      </main>

      {/* Bottom Navigation - Icon Only Design with z-index 99999 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-black/95 border-t border-amber-900/30 backdrop-blur-md z-[99999]">
        <div className="max-w-2xl mx-auto px-4">
          <div className="flex justify-around items-center py-3">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-amber-400'
                      : 'text-gray-400 hover:text-amber-300'
                  }`}
                >
                  <Icon className={`w-6 h-6 ${isActive ? 'text-amber-400' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>
      </nav>
    </div>
  );
}
