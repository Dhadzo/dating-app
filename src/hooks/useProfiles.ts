import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { Profile } from '../stores/useProfileStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useUIStore } from '../stores/useUIStore';

export interface ProfileFilters {
  gender?: string;
  ageRange?: [number, number];
  stateFilter?: string;
  cityFilter?: string;
  interests?: string[];
}

// Fetch current user profile
export const useCurrentProfile = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
};

// Fetch discoverable profiles
export const useDiscoverProfiles = (
  filters: ProfileFilters,
  userId: string | undefined
) => {
  const { setDiscoveredProfiles, setDiscoveredLoading, setDiscoveredError } =
    useProfileStore();

  return useQuery({
    queryKey: ['discover-profiles', filters, userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      setDiscoveredLoading(true);
      setDiscoveredError(null);

      try {
        // Get liked profiles to exclude
        const { data: likedData } = await supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', userId);

        const likedProfileIds = likedData?.map((like) => like.liked_id) || [];

        // Build query using privacy-respecting view
        let query = supabase
          .from('privacy_respecting_profiles')
          .select('*')
          .neq('id', userId)
          .limit(50);

        // Apply filters
        if (filters.gender && filters.gender !== 'everyone') {
          query = query.eq('gender', filters.gender);
        }

        if (filters.ageRange) {
          query = query
            .gte('age', filters.ageRange[0])
            .lte('age', filters.ageRange[1]);
        }

        if (filters.stateFilter) {
          query = query.eq('state', filters.stateFilter);
        }

        if (filters.cityFilter) {
          query = query.eq('city', filters.cityFilter);
        }

        // Exclude already liked profiles
        if (likedProfileIds.length > 0) {
          query = query.not('id', 'in', `(${likedProfileIds.join(',')})`);
        }

        const { data, error } = await query;

        if (error) throw error;

        // Transform profiles for display (privacy already enforced by view)
        const transformedProfiles = (data || []).map((profile) => ({
          ...profile,
          displayName:
            profile.show_age && profile.age
              ? `${profile.first_name} ${profile.last_name}, ${profile.age}`
              : `${profile.first_name} ${profile.last_name}`,
          displayLocation:
            profile.show_location && profile.city && profile.state
              ? `${profile.city}, ${profile.state}`
              : 'Location hidden',
          showAge: profile.show_age,
          showLocation: profile.show_location,
          showOnline: profile.show_online
        }));

        setDiscoveredProfiles(transformedProfiles);
        setDiscoveredLoading(false);

        return transformedProfiles;
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch profiles';
        setDiscoveredError(errorMessage);
        setDiscoveredLoading(false);
        throw error;
      }
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Fetch liked profiles
export const useLikedProfiles = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['liked-profiles', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('likes')
        .select(
          `
          *,
          liked_profile:profiles!likes_liked_id_fkey(*)
        `
        )
        .eq('liker_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform profiles to respect privacy settings
      const transformedData = (data || []).map((like) => {
        const profile = like.liked_profile;
        return {
          ...like,
          liked_profile: {
            ...profile,
            displayName: profile.age
              ? `${profile.first_name} ${profile.last_name}, ${profile.age}`
              : `${profile.first_name} ${profile.last_name}`,
            displayLocation:
              profile.city && profile.state
                ? `${profile.city}, ${profile.state}`
                : 'Location hidden',
            showAge: true, // Liked profiles show full info since user already liked them
            showLocation: true,
            showOnline: true
          }
        };
      });

      return transformedData;
    },
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 10 * 60 * 1000 // 10 minutes
  });
};

// Like a profile
export const useLikeProfile = () => {
  const queryClient = useQueryClient();
  const { removeDiscoveredProfile } = useProfileStore();

  return useMutation({
    mutationFn: async ({
      profileId,
      userId
    }: {
      profileId: string;
      userId: string;
    }) => {
      const { error } = await supabase.from('likes').insert({
        liker_id: userId,
        liked_id: profileId
      });

      if (error) throw error;
      return { profileId, userId };
    },
    onSuccess: ({ profileId }) => {
      // Remove from discovered profiles (optimistic update)
      removeDiscoveredProfile(profileId);

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['liked-profiles'] });
    },
    onError: (error) => {
      console.error('Error liking profile:', error);
    }
  });
};

// Unlike a profile
export const useUnlikeProfile = () => {
  const queryClient = useQueryClient();
  const { selectedChatMatch, setSelectedChatMatch } = useUIStore();

  return useMutation({
    mutationFn: async ({
      profileId,
      userId
    }: {
      profileId: string;
      userId: string;
    }) => {
      // Check for match in both directions
      const { data: matchData } = await supabase
        .from('matches')
        .select('*')
        .or(
          `and(user1_id.eq.${userId},user2_id.eq.${profileId}),and(user1_id.eq.${profileId},user2_id.eq.${userId})`
        );

      // If there's a match, delete messages and match
      if (matchData && matchData.length > 0) {
        const matchId = matchData[0].id;

        // Use RPC function to delete match and messages
        const { error: deletionError } = await supabase.rpc(
          'delete_match_and_messages',
          {
            p_match_id: matchId,
            p_user_id: userId
          }
        );

        if (deletionError) {
          console.error('Error deleting match and messages:', deletionError);
          // Continue with unlike even if match deletion fails
        }
      }

      // Delete the like
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('liker_id', userId)
        .eq('liked_id', profileId);

      if (error) throw error;
      return { profileId, userId };
    },
    onSuccess: ({ profileId, userId }) => {
      // Clear selected chat match if it's the one being deleted
      if (selectedChatMatch) {
        // Check if the selected chat match involves the profile being unliked
        const isSelectedMatchBeingDeleted =
          selectedChatMatch.otherUserId === profileId ||
          (selectedChatMatch.otherProfile &&
            selectedChatMatch.otherProfile.id === profileId);

        if (isSelectedMatchBeingDeleted) {
          setSelectedChatMatch(null);
        }
      }

      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['liked-profiles'] });
      queryClient.invalidateQueries({ queryKey: ['matches'] });
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
    },
    onError: (error) => {
      console.error('Error unliking profile:', error);
    }
  });
};

// Pass a profile
export const usePassProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ profileId }: { profileId: string }) => {
      // For now, just remove from discovered profiles
      // In a real app, you might want to track passes
      return { profileId };
    },
    onSuccess: ({ profileId }) => {
      // Update React Query cache to remove the passed profile
      // We need to update all discover-profiles queries since we don't know the exact filters
      queryClient.setQueriesData(
        { queryKey: ['discover-profiles'] },
        (oldData: any) => {
          if (!oldData) return oldData;
          return oldData.filter((profile: any) => profile.id !== profileId);
        }
      );
    }
  });
};
