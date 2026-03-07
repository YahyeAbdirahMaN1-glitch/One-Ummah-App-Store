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
    return <div>Loading...</div>;
  }

  return (
    <div style={{ paddingBottom: "70px" }}>

      {/* Back Button */}
      {location.pathname !== "/" && (
        <button
          onClick={() => navigate(-1)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "10px",
            border: "none",
            background: "none",
            fontSize: "16px",
            cursor: "pointer"
          }}
        >
          <ArrowLeft size={20} />
          Back
        </button>
      )}

      {/* Page Content */}
      <Outlet />

      {/* Bottom Navigation */}
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          height: "60px",
          display: "flex",
          justifyContent: "space-around",
          alignItems: "center",
          borderTop: "1px solid #ddd",
          background: "#fff"
        }}
      >
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
