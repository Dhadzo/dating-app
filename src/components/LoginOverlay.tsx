import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import LoadingOverlay from './LoadingOverlay';

const LoginOverlay: React.FC = () => {
  const { isLoggingIn } = useAuth();

  return (
    <LoadingOverlay
      isVisible={isLoggingIn}
      message="Signing in..."
      zIndex="z-[60]"
    />
  );
};

export default LoginOverlay;
