import React from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { useOptimizedRealtime } from '../hooks/useRealtime';

// Centralized real-time provider that runs once at app level
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuthStore();

  console.log('🔧 RealtimeProvider: user ID =', user?.id);

  // Use the optimized consolidated real-time subscription
  useOptimizedRealtime(user?.id);

  return <>{children}</>;
};
