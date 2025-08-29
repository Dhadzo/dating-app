import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Hook for getting last message for each match
export const useLastMessages = (matchIds: string[]) => {
  return useQuery({
    queryKey: ['last-messages', matchIds],
    queryFn: async () => {
      if (!matchIds.length) return {};

      const { data, error } = await supabase
        .from('messages')
        .select('match_id, content, created_at, sender_id')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Group by match_id and get the latest message for each
      const lastMessages: Record<string, any> = {};
      data?.forEach((message) => {
        if (
          !lastMessages[message.match_id] ||
          new Date(message.created_at) >
            new Date(lastMessages[message.match_id].created_at)
        ) {
          lastMessages[message.match_id] = message;
        }
      });

      return lastMessages;
    },
    enabled: matchIds.length > 0,
    staleTime: 30 * 1000 // 30 seconds
  });
};
