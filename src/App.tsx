import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from './components/ui/sonner';

import Layout from './components/Layout';

import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ProfilePage from './pages/ProfilePage';
import ProfileSettingsPage from './pages/ProfileSettingsPage';
import PrivacySettingsPage from './pages/PrivacySettingsPage';
import MessagesPage from './pages/MessagesPage';
import FriendsPage from './pages/FriendsPage';
import PrayerTimesPage from './pages/PrayerTimesPage';
import SettingsPage from './pages/SettingsPage';
import PrivacyPolicyPage from './pages/PrivacyPolicyPage';
import TermsOfServicePage from './pages/TermsOfServicePage';
import ReportProblemPage from './pages/ReportProblemPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>

        <Routes>

          {/* Public Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/privacy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsOfServicePage />} />

          {/* Protected Routes with Layout */}
          <Route element={<Layout />}>

            <Route path="/" element={<HomePage />} />

            <Route path="/prayer-times" element={<PrayerTimesPage />} />

            <Route path="/friends" element={<FriendsPage />} />

            <Route path="/messages" element={<MessagesPage />} />
            <Route path="/messages/:userId" element={<MessagesPage />} />

            <Route path="/profile-setup" element={<ProfileSetupPage />} />

            <Route path="/profile/:userId" element={<ProfilePage />} />

            <Route path="/profile-settings" element={<ProfileSettingsPage />} />

            <Route path="/privacy-settings" element={<PrivacySettingsPage />} />

            <Route path="/settings" element={<SettingsPage />} />

            <Route path="/report-problem" element={<ReportProblemPage />} />

          </Route>

          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>

      </BrowserRouter>

      <Toaster />

    </QueryClientProvider>
  );
}

export default App;
