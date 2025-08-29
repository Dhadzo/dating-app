import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { AuthProvider } from './contexts/AuthContext';
import { RealtimeProvider } from './providers/RealtimeProvider';
import Landing from './pages/Landing';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import Discover from './pages/Discover';
import Matches from './pages/Matches';
import Profile from './pages/Profile';
import Likes from './pages/Likes';
import ProfileSetup from './pages/ProfileSetup';
import Settings from './pages/Settings';
import Terms from './pages/Terms';
import Privacy from './pages/Privacy';
import ProtectedRoute from './components/ProtectedRoute';
import ResponsiveLayout from './components/ResponsiveLayout';
import Header from './components/Header';
import LogoutOverlay from './components/LogoutOverlay';
import LoginOverlay from './components/LoginOverlay';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 3,
      refetchOnWindowFocus: false
    }
  }
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RealtimeProvider>
          <Router>
            <div className="min-h-screen">
              <LogoutOverlay />
              <LoginOverlay />
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/terms" element={<Terms />} />
                <Route path="/privacy" element={<Privacy />} />
                <Route
                  path="/profile-setup"
                  element={
                    <ProtectedRoute>
                      <ProfileSetup />
                    </ProtectedRoute>
                  }
                />

                {/* Protected routes with responsive layout */}
                <Route
                  path="/app"
                  element={
                    <ProtectedRoute>
                      <>
                        <Header />
                        <ResponsiveLayout />
                      </>
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Discover />} />
                  <Route path="discover" element={<Discover />} />
                  <Route path="matches" element={<Matches />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="likes" element={<Likes />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
              </Routes>
            </div>
          </Router>
        </RealtimeProvider>
      </AuthProvider>

      {/* React Query DevTools - only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  );
}

export default App;
