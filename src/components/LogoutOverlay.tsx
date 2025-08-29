import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from './LoadingOverlay';

const LogoutOverlay: React.FC = () => {
  const { isLoggingOut } = useAuth();

  return (
    <LoadingOverlay
      isVisible={isLoggingOut}
      message="Signing out..."
      zIndex="z-[60]"
    />
  );
};

export default LogoutOverlay;
