import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

// Real-time subscription for profiles
export const useProfilesRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to profile changes
    subscriptionRef.current = supabase
      .channel('profiles-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=neq.${userId}` // Don't listen to own profile changes
        },
        (payload) => {
          // Invalidate queries based on event type
          if (payload.eventType === 'INSERT') {
            queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
          } else if (payload.eventType === 'UPDATE') {
            queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
            // Invalidate user profile if it's the current user's profile
            queryClient.invalidateQueries({ queryKey: ['user-profile'] });
          } else if (payload.eventType === 'DELETE') {
            queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
            queryClient.invalidateQueries({ queryKey: ['matches'] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Profiles real-time subscription ERROR');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, queryClient]);
};

// Real-time subscription for matches
export const useMatchesRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to match changes
    subscriptionRef.current = supabase
      .channel('matches-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        },
        (payload) => {
          // Invalidate matches query
          queryClient.invalidateQueries({ queryKey: ['matches', userId] });

          // Invalidate match count
          queryClient.invalidateQueries({ queryKey: ['match-count', userId] });

          // Invalidate unread message count
          queryClient.invalidateQueries({
            queryKey: ['unread-message-count', userId]
          });

          // If new match created, invalidate discover profiles
          if (payload.eventType === 'INSERT') {
            queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Matches real-time subscription ERROR');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, queryClient]);
};

// Real-time subscription for messages
export const useMessagesRealtime = (
  matchId: string | undefined,
  userId: string | undefined
) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!matchId || !userId) {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
      return;
    }

    // Subscribe to message changes for specific match
    subscriptionRef.current = supabase
      .channel(`messages-${matchId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
          schema: 'public',
          table: 'messages',
          filter: `match_id=eq.${matchId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            // New message received
            const newMessage = payload.new;

            queryClient.setQueryData(
              ['match-messages', matchId],
              (old: any[] | undefined) => {
                if (!old) {
                  return [newMessage];
                }
                // Check if message already exists to avoid duplicates
                if (old.find((msg) => msg.id === newMessage.id)) {
                  return old;
                }

                return [...old, newMessage];
              }
            );
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (e.g., marked as read)
            const updatedMessage = payload.new;

            queryClient.setQueryData(
              ['match-messages', matchId],
              (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                );
              }
            );
          } else if (payload.eventType === 'UPDATE') {
            // Message updated (e.g., marked as read)
            const updatedMessage = payload.new;

            queryClient.setQueryData(
              ['match-messages', matchId],
              (old: any[] | undefined) => {
                if (!old) return old;
                return old.filter((msg) => msg.id !== deletedMessage.id);
              }
            );
          }

          // Invalidate matches to update last message
          queryClient.invalidateQueries({ queryKey: ['matches'] });

          // Invalidate unread message count for both users in the match
          if (payload.eventType === 'INSERT') {
            const newMessage = payload.new;
            if (newMessage?.match_id) {
              // Invalidate unread message count for both users
              queryClient.invalidateQueries({
                queryKey: ['unread-message-count']
              });
              // Invalidate last messages to update the match list
              queryClient.invalidateQueries({
                queryKey: ['last-messages']
              });
            }
          }
        }
      )
      .subscribe((status) => {
        console.log(
          '🔌 Message subscription status for match',
          matchId,
          ':',
          status
        );

        // Log detailed status information
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription ERROR for match:', matchId);
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
        subscriptionRef.current = null;
      }
    };
  }, [matchId, userId, queryClient]);
};

// Real-time subscription for likes
export const useLikesRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to like changes
    subscriptionRef.current = supabase
      .channel('likes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        (payload) => {
          // Invalidate relevant queries
          queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
          queryClient.invalidateQueries({ queryKey: ['matches'] });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Likes real-time subscription ERROR');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, queryClient]);
};

// Real-time subscription for notifications
export const useNotificationsRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Subscribe to notification changes
    subscriptionRef.current = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Invalidate unread notification count
          queryClient.invalidateQueries({
            queryKey: ['unread-notification-count', userId]
          });
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Notifications real-time subscription ERROR');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, queryClient]);
};

// Combined real-time hook for all subscriptions
export const useRealtimeSubscriptions = (userId: string | undefined) => {
  useProfilesRealtime(userId);
  useMatchesRealtime(userId);
  useLikesRealtime(userId);
};
