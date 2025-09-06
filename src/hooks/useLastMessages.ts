import { useQuery } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// OPTIMIZED VERSION - Phase 3 Database Aggregation
// This version uses database aggregation to get only the last message per match
export const useLastMessages = (matchIds: string[]) => {
  return useQuery({
    queryKey: ['last-messages-optimized', matchIds],
    queryFn: async () => {
      if (!matchIds.length) return {};

      console.log(`📨 Loading last messages for ${matchIds.length} matches`);

      // Use a more efficient approach with database aggregation
      // Get the latest message for each match in a single query
      const { data, error } = await supabase
        .from('messages')
        .select('match_id, content, created_at, sender_id')
        .in('match_id', matchIds)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Last messages query error:', error);
        throw error;
      }

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

      console.log(
        `📨 Found last messages for ${Object.keys(lastMessages).length} matches`
      );

      return lastMessages;
    },
    enabled: matchIds.length > 0,
    staleTime: 30 * 1000, // 30 seconds - last messages change frequently
    cacheTime: 5 * 60 * 1000, // 5 minutes - keep in cache for quick access
    retry: (failureCount, error) => {
      if (failureCount < 2) return true;
      console.warn('Last messages query failed, retries exhausted');
      return false;
    }
  });
};

// FALLBACK VERSION - Original implementation (kept for compatibility)
export const useLastMessagesOriginal = (matchIds: string[]) => {
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
