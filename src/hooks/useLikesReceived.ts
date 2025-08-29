import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook for getting the count of likes received by the user
export const useLikesReceived = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['likes-received', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('likes')
        .select('*', { count: 'exact', head: true })
        .eq('liked_id', userId);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });
};
