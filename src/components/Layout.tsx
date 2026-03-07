// Layout.jsx
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, MessageCircle, Users, Settings, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';

export default function Layout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) navigate('/login');
  }, [isLoading, isAuthenticated, navigate]);

  // Redirect to profile setup if needed
  useEffect(() => {
    if (user && !user.name && location.pathname !== '/profile-setup') {
      navigate('/profile-setup');
    }
  }, [user, location.pathname, navigate]);

  if (isLoading) return <div>Loading...</div>;

  // Pages that should NOT show back button
  const noBackPaths = ['/', '/login', '/profile-setup'];
  const showBackButton = !noBackPaths.includes(location.pathname);

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="bg-gray-900 text-white p-4 flex items-center shadow-md">
        {showBackButton && (
          <button
            onClick={() => navigate(-1)}
            className="mr-4 p-1 hover:bg-gray-700 rounded"
          >
            <ArrowLeft size={24} />
          </button>
        )}
        <h1 className="text-xl font-bold">One Ummah</h1>
      </header>

      {/* Page content */}
      <main className="flex-1 overflow-auto pb-[calc(64px+env(safe-area-inset-bottom))]">
        <Outlet />
      </main>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 flex justify-around items-center border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <button onClick={() => navigate('/')}>
          <Home size={24} />
        </button>
        <button onClick={() => navigate('/prayer-times')}>
          <Clock size={24} />
        </button>
        <button onClick={() => navigate('/messages')}>
          <MessageCircle size={24} />
        </button>
        <button onClick={() => navigate('/friends')}>
          <Users size={24} />
        </button>
        <button onClick={() => navigate('/settings')}>
          <Settings size={24} />
        </button>
      </nav>
    </div>
  );
}
