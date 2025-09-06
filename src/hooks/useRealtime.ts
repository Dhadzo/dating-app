import { useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { useQueryClient } from '@tanstack/react-query';

// Optimized consolidated real-time hook that replaces multiple subscriptions
export const useOptimizedRealtime = (userId: string | undefined) => {
  const queryClient = useQueryClient();
  const subscriptionRef = useRef<any>(null);

  useEffect(() => {
    if (!userId) return;

    // Clean up existing subscription first
    if (subscriptionRef.current) {
      console.log('🧹 Cleaning up existing subscription');
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }

    console.log('🚀 Creating real-time subscription for user:', userId);
    // Single consolidated subscription for all real-time updates
    subscriptionRef.current = supabase
      .channel(`user-${userId}-updates`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: `or(user1_id.eq.${userId},user2_id.eq.${userId})`
        },
        (payload) => {
          // Handle match changes
          console.log('🔥 MATCHES REAL-TIME TRIGGERED!', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({ queryKey: ['match-count', userId] });
          queryClient.invalidateQueries({
            queryKey: ['unread-message-count', userId]
          });

          if (payload.eventType === 'INSERT') {
            queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
            queryClient.invalidateQueries({
              queryKey: ['discover-profiles-paginated']
            });
            queryClient.invalidateQueries({
              queryKey: ['discover-profiles-optimized']
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          // Handle notification changes
          queryClient.invalidateQueries({
            queryKey: ['unread-notification-count', userId]
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes'
        },
        (payload) => {
          // Test subscription - listen to ALL likes changes
          console.log(
            '🧪 TEST: ALL LIKES CHANGES:',
            payload.eventType,
            payload.new,
            payload.old
          );
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'likes',
          filter: `or(liker_id.eq.${userId},liked_id.eq.${userId})`
        },
        (payload) => {
          // Handle like changes (only for likes involving this user)
          console.log('🔥 LIKES REAL-TIME TRIGGERED!', payload.eventType);
          queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
          queryClient.invalidateQueries({
            queryKey: ['discover-profiles-paginated']
          });
          queryClient.invalidateQueries({
            queryKey: ['discover-profiles-optimized']
          });
          queryClient.invalidateQueries({ queryKey: ['matches'] });
          queryClient.invalidateQueries({
            queryKey: ['liked-profiles', userId]
          });
        }
      )
      .subscribe((status) => {
        console.log('🔌 Real-time subscription status:', status);
        if (status === 'CHANNEL_ERROR') {
          console.error('❌ Real-time subscription ERROR');
        } else if (status === 'SUBSCRIBED') {
          console.log('✅ Real-time subscription active for user:', userId);
        } else if (status === 'CLOSED') {
          console.log('🔌 Real-time subscription closed');
        } else if (status === 'TIMED_OUT') {
          console.warn('⏰ Real-time subscription timed out');
        }
      });

    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, queryClient]);
};

// DEPRECATED: Use useOptimizedRealtime instead for better performance
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

// DEPRECATED: Use useOptimizedRealtime instead for better performance
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
          queryClient.invalidateQueries({ queryKey: ['matches'] });

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
            console.log(
              '📨 Real-time: New message received:',
              newMessage.id,
              'for match:',
              matchId
            );

            // Update paginated messages query
            queryClient.setQueryData(
              ['match-messages-paginated', matchId],
              (old: any) => {
                if (!old || !old.pages || old.pages.length === 0) {
                  // If no data yet, create initial page
                  return {
                    pages: [
                      {
                        messages: [newMessage],
                        nextPage: undefined,
                        hasMore: false,
                        totalLoaded: 1
                      }
                    ],
                    pageParams: [0]
                  };
                }

                // Check if message already exists to avoid duplicates
                const allMessages = old.pages.flatMap((page) => page.messages);
                if (allMessages.find((msg: any) => msg.id === newMessage.id)) {
                  return old;
                }

                // Add new message to the first page (most recent)
                const updatedPages = [...old.pages];
                if (updatedPages[0]) {
                  updatedPages[0] = {
                    ...updatedPages[0],
                    messages: [...updatedPages[0].messages, newMessage],
                    totalLoaded: updatedPages[0].totalLoaded + 1
                  };
                }

                return {
                  ...old,
                  pages: updatedPages
                };
              }
            );

            // Also update the original query for fallback compatibility
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

            // Update paginated messages query
            queryClient.setQueryData(
              ['match-messages-paginated', matchId],
              (old: any) => {
                if (!old || !old.pages) return old;

                const updatedPages = old.pages.map((page: any) => ({
                  ...page,
                  messages: page.messages.map((msg: any) =>
                    msg.id === updatedMessage.id ? updatedMessage : msg
                  )
                }));

                return {
                  ...old,
                  pages: updatedPages
                };
              }
            );

            // Also update the original query for fallback compatibility
            queryClient.setQueryData(
              ['match-messages', matchId],
              (old: any[] | undefined) => {
                if (!old) return old;
                return old.map((msg) =>
                  msg.id === updatedMessage.id ? updatedMessage : msg
                );
              }
            );
          } else if (payload.eventType === 'DELETE') {
            // Message deleted
            const deletedMessage = payload.old;

            // Update paginated messages query
            queryClient.setQueryData(
              ['match-messages-paginated', matchId],
              (old: any) => {
                if (!old || !old.pages) return old;

                const updatedPages = old.pages.map((page: any) => ({
                  ...page,
                  messages: page.messages.filter(
                    (msg: any) => msg.id !== deletedMessage.id
                  ),
                  totalLoaded: page.totalLoaded - 1
                }));

                return {
                  ...old,
                  pages: updatedPages
                };
              }
            );

            // Also update the original query for fallback compatibility
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

// DEPRECATED: Use useOptimizedRealtime instead for better performance
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

// DEPRECATED: Use useOptimizedRealtime instead for better performance
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

// DEPRECATED: Use useOptimizedRealtime instead for better performance
// Combined real-time hook for all subscriptions
export const useRealtimeSubscriptions = (userId: string | undefined) => {
  useProfilesRealtime(userId);
  useMatchesRealtime(userId);
  useLikesRealtime(userId);
};
