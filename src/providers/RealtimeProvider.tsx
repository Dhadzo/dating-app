import React, { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import {
  useProfilesRealtime,
  useMatchesRealtime,
  useLikesRealtime,
  useNotificationsRealtime
} from '../hooks/useRealtime';

// Centralized real-time provider that runs once at app level
export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => {
  const { user } = useAuthStore();

  // Set up all real-time subscriptions once when user is authenticated
  useEffect(() => {
    if (!user?.id) return;

    // These hooks will set up subscriptions and clean them up automatically
    // They're now centralized here instead of being called on every page
  }, [user?.id]);

  // Set up real-time subscriptions
  useProfilesRealtime(user?.id);
  useMatchesRealtime(user?.id);
  useLikesRealtime(user?.id);
  useNotificationsRealtime(user?.id);

  return <>{children}</>;
};
