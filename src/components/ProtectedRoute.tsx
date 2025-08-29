import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import LoadingOverlay from './LoadingOverlay';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, loading } = useAuth();
  const [profileStatus, setProfileStatus] = React.useState<
    'loading' | 'complete' | 'incomplete'
  >('loading');
  const location = useLocation();

  React.useEffect(() => {
    const checkProfileCompletion = async () => {
      if (!user) {
        setProfileStatus('incomplete');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('profile_complete')
          .eq('id', user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error checking profile:', error);
          setProfileStatus('incomplete');
          return;
        }

        // Set status based on profile completion
        setProfileStatus(data?.profile_complete ? 'complete' : 'incomplete');
      } catch (error) {
        console.error('Error checking profile completion:', error);
        setProfileStatus('incomplete');
      }
    };

    if (user) {
      checkProfileCompletion();
    } else if (!loading) {
      setProfileStatus('incomplete');
    }
  }, [user, loading]);

  // Show loading overlay while auth is loading OR while we're checking profile status
  if (loading || profileStatus === 'loading') {
    return (
      <LoadingOverlay isVisible={true} message="Loading..." zIndex="z-[60]" />
    );
  }

  // If no user, redirect to signin
  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  // Now we know the user exists and we know their profile status
  const protectedPaths = ['/discover', '/matches', '/profile', '/likes'];
  const isOnProtectedPath = protectedPaths.includes(location.pathname);
  const isOnProfileSetup = location.pathname === '/profile-setup';

  // If user is on a protected path but profile is incomplete, redirect to setup
  if (isOnProtectedPath && profileStatus === 'incomplete') {
    return <Navigate to="/profile-setup" replace />;
  }

  // If user is on profile setup but profile is complete, redirect to discover
  if (isOnProfileSetup && profileStatus === 'complete') {
    return <Navigate to="/app" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
