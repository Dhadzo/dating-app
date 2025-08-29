import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook for getting the count of matches
export const useMatchCount = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['match-count', userId],
    queryFn: async () => {
      if (!userId) return 0;

      const { count, error } = await supabase
        .from('matches')
        .select('*', { count: 'exact', head: true })
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`);

      if (error) throw error;
      return count || 0;
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 30 * 1000 // Refetch every 30 seconds
  });
};
