import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, MessageCircle, Users, Settings } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useEffect } from 'react';
import BackButton from './BackButton'; // Make sure BackButton.jsx exists

export default function Layout() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isLoading, isAuthenticated, navigate]);

  // Redirect to profile setup if needed
  useEffect(() => {
    if (user && !user.name && location.pathname !== '/profile-setup') {
      navigate('/profile-setup');
    }
  }, [user, location.pathname, navigate]);

  if (isLoading) return <div>Loading...</div>;

  const showBackButton = location.pathname !== '/';

  return (
    <div className="pb-[calc(60px+env(safe-area-inset-bottom))]">
      {/* Back Button */}
      {showBackButton && (
        <div className="pt-[env(safe-area-inset-top)] px-4">
          <BackButton />
        </div>
      )}

      {/* Page Content */}
      <Outlet />

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 flex justify-around items-center border-t border-gray-200 bg-white pb-[env(safe-area-inset-bottom)]">
        <button onClick={() => navigate("/")}>
          <Home size={24} />
        </button>

        <button onClick={() => navigate("/prayer-times")}>
          <Clock size={24} />
        </button>

        <button onClick={() => navigate("/messages")}>
          <MessageCircle size={24} />
        </button>

        <button onClick={() => navigate("/friends")}>
          <Users size={24} />
        </button>

        <button onClick={() => navigate("/settings")}>
          <Settings size={24} />
        </button>
      </nav>
    </div>
  );
}
