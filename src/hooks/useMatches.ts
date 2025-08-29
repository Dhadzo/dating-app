import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface Match {
  id: string;
  user1_id: string;
  user2_id: string;
  created_at: string;
  user1_profile?: any;
  user2_profile?: any;
  last_message?: any;
  unread_count?: number;
}

export interface Message {
  id: string;
  match_id: string;
  sender_id: string;
  content: string;
  created_at: string;
  read_at?: string;
}

// Fetch user's matches
export const useMatches = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['matches', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('matches')
        .select(
          `
          *,
          user1_profile:profiles!matches_user1_id_fkey(*),
          user2_profile:profiles!matches_user2_id_fkey(*)
        `
        )
        .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching matches:', error);
        throw error;
      }

      // Transform matches to include the other user's profile
      const transformedMatches = (data || []).map((match) => {
        const isUser1 = match.user1_id === userId;
        const otherProfile = isUser1
          ? match.user2_profile
          : match.user1_profile;

        return {
          ...match,
          otherProfile,
          otherUserId: isUser1 ? match.user2_id : match.user1_id
        };
      });

      return transformedMatches;
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Fetch messages for a specific match
export const useMatchMessages = (matchId: string | undefined) => {
  return useQuery({
    queryKey: ['match-messages', matchId],
    queryFn: async () => {
      if (!matchId) throw new Error('No match ID provided');

      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!matchId,
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000 // 5 minutes
  });
};

// Send a message
export const useSendMessage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      content,
      senderId
    }: {
      matchId: string;
      content: string;
      senderId: string;
    }) => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          match_id: matchId,
          sender_id: senderId,
          content
        })
        .select()
        .single();

      if (error) throw error;
      return data as Message;
    },
    onSuccess: (newMessage, { matchId }) => {
      // Optimistically update the messages cache
      queryClient.setQueryData(
        ['match-messages', matchId],
        (old: Message[] | undefined) => {
          if (!old) return [newMessage];
          return [...old, newMessage];
        }
      );

      // Invalidate matches to update last message
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    },
    onError: (error) => {
      console.error('Error sending message:', error);
    }
  });
};

// Mark messages as read
export const useMarkMessagesAsRead = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      matchId,
      userId
    }: {
      matchId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('messages')
        .update({ read_at: new Date().toISOString() })
        .eq('match_id', matchId)
        .neq('sender_id', userId)
        .is('read_at', null);

      if (error) throw error;
      return { matchId, userId };
    },
    onSuccess: ({ matchId }) => {
      // Update messages cache to mark as read
      queryClient.setQueryData(
        ['match-messages', matchId],
        (old: Message[] | undefined) => {
          if (!old) return old;
          return old.map((msg) => ({
            ...msg,
            read_at: msg.read_at || new Date().toISOString()
          }));
        }
      );

      // Invalidate matches to update unread count
      queryClient.invalidateQueries({ queryKey: ['matches'] });
    }
  });
};

// Check if there's a match between two users
export const useCheckMatch = (
  userId1: string | undefined,
  userId2: string | undefined
) => {
  return useQuery({
    queryKey: ['check-match', userId1, userId2],
    queryFn: async () => {
      if (!userId1 || !userId2) return null;

      const { data, error } = await supabase
        .from('matches')
        .select('*')
        .or(
          `and(user1_id.eq.${userId1},user2_id.eq.${userId2}),and(user1_id.eq.${userId2},user2_id.eq.${userId1})`
        )
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!userId1 && !!userId2,
    staleTime: 1 * 60 * 1000 // 1 minute
  });
};
