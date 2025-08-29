import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook for unread message count
export const useUnreadMessageCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['unread-message-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { data, error } = await supabase.rpc('get_unread_message_count', {
        p_user_id: userId
      });

      if (error) throw error;
      return data || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });
};

// Hook for unread notification count
export const useUnreadNotificationCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['unread-notification-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });
};
