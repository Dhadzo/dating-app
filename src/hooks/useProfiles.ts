import {
  useQuery,
  useMutation,
  useQueryClient,
  useInfiniteQuery
} from '@tanstack/react-query';
import { useState, useEffect } from 'react';
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
      // Check if like already exists
      const { data: existingLikes, error: checkError } = await supabase
        .from('likes')
        .select('id')
        .eq('liker_id', userId)
        .eq('liked_id', profileId);

      if (checkError) {
        throw checkError;
      }

      if (existingLikes && existingLikes.length > 0) {
        // Like already exists, return success without creating duplicate
        console.log('Like already exists for profile:', profileId);
        return { profileId, userId };
      }

      // Create new like
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

// PAGINATED VERSION - Phase 2 Pagination & Advanced Caching
// This version implements infinite scroll pagination with advanced caching
export const useDiscoverProfilesPaginated = (
  filters: ProfileFilters,
  userId: string | undefined,
  pageSize: number = 10
) => {
  const { setDiscoveredProfiles, setDiscoveredLoading, setDiscoveredError } =
    useProfileStore();

  return useInfiniteQuery({
    queryKey: ['discover-profiles-paginated', filters, userId],
    queryFn: async ({ pageParam = 0 }) => {
      if (!userId) throw new Error('No user ID provided');

      setDiscoveredLoading(true);
      setDiscoveredError(null);

      try {
        // Get liked profiles first (this is cached by React Query)
        const { data: likedData } = await supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', userId);

        const likedProfileIds = likedData?.map((like) => like.liked_id) || [];

        // Build query using privacy-respecting view with selective fields
        let query = supabase
          .from('privacy_respecting_profiles')
          .select(
            `
            id,
            first_name,
            last_name,
            age,
            bio,
            gender,
            city,
            state,
            interests,
            photos,
            show_age,
            show_location,
            show_online,
            created_at
          `
          )
          .neq('id', userId)
          .range(pageParam * pageSize, (pageParam + 1) * pageSize - 1)
          .order('created_at', { ascending: false });

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

        if (error) {
          console.error('Paginated query error:', error);
          throw error;
        }

        console.log(
          `Paginated query page ${pageParam}:`,
          data?.length,
          'profiles'
        );

        // Transform profiles for display
        const transformedProfiles = (data || []).map((profile) => ({
          ...profile,
          // Only keep first photo for discovery view to reduce payload
          photos:
            profile.photos && profile.photos.length > 0
              ? [profile.photos[0]]
              : [],
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

        setDiscoveredLoading(false);

        return {
          profiles: transformedProfiles,
          nextPage:
            data && data.length === pageSize ? pageParam + 1 : undefined,
          hasMore: data && data.length === pageSize
        };
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to fetch profiles';
        setDiscoveredError(errorMessage);
        setDiscoveredLoading(false);
        throw error;
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes - profiles don't change often
    cacheTime: 15 * 60 * 1000, // 15 minutes - keep in cache longer
    retry: (failureCount, error) => {
      if (failureCount < 2) return true;
      console.warn('Paginated query failed, retries exhausted');
      return false;
    }
  });
};

// OPTIMIZED VERSION - Phase 1 Database Query Optimization (kept for fallback)
// This version uses a single query with LEFT JOIN to exclude liked profiles
export const useDiscoverProfilesOptimized = (
  filters: ProfileFilters,
  userId: string | undefined
) => {
  const { setDiscoveredProfiles, setDiscoveredLoading, setDiscoveredError } =
    useProfileStore();

  return useQuery({
    queryKey: ['discover-profiles-optimized', filters, userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      setDiscoveredLoading(true);
      setDiscoveredError(null);

      try {
        // SIMPLIFIED OPTIMIZATION: Use the same approach as original but with better field selection
        // Get liked profiles first (this is cached by React Query)
        const { data: likedData } = await supabase
          .from('likes')
          .select('liked_id')
          .eq('liker_id', userId);

        const likedProfileIds = likedData?.map((like) => like.liked_id) || [];

        // Build query using privacy-respecting view with selective fields
        let query = supabase
          .from('privacy_respecting_profiles')
          .select(
            `
            id,
            first_name,
            last_name,
            age,
            bio,
            gender,
            city,
            state,
            interests,
            photos,
            show_age,
            show_location,
            show_online,
            created_at
          `
          )
          .neq('id', userId)
          .limit(20); // Reduced from 50 to 20 for better performance

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

        if (error) {
          console.error('Optimized query error:', error);
          throw error;
        }

        console.log('Optimized query raw data:', data?.length, 'profiles');

        // Transform profiles for display
        const transformedProfiles = (data || []).map((profile) => ({
          ...profile,
          // Only keep first photo for discovery view to reduce payload
          photos:
            profile.photos && profile.photos.length > 0
              ? [profile.photos[0]]
              : [],
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
    staleTime: 3 * 60 * 1000, // Reduced from 5 to 3 minutes for fresher data
    cacheTime: 8 * 60 * 1000, // Reduced from 10 to 8 minutes
    retry: (failureCount, error) => {
      // Retry up to 2 times, then fall back to original query
      if (failureCount < 2) return true;
      console.warn(
        'Optimized query failed, consider falling back to original query'
      );
      return false;
    }
  });
};

// ADVANCED CACHING CONFIGURATION
export const CACHE_CONFIG = {
  // Profile data caching
  profiles: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 15 * 60 * 1000, // 15 minutes
    refetchOnWindowFocus: false,
    refetchOnMount: false
  },
  // User settings caching (changes rarely)
  userSettings: {
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false
  },
  // Matches caching (moderate frequency)
  matches: {
    staleTime: 2 * 60 * 1000, // 2 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  },
  // Messages caching (high frequency)
  messages: {
    staleTime: 1 * 60 * 1000, // 1 minute
    cacheTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false
  },
  // Likes caching (moderate frequency)
  likes: {
    staleTime: 3 * 60 * 1000, // 3 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  }
};

// SMART HOOK - Automatically falls back to original query if optimized fails
export const useDiscoverProfilesSmart = (
  filters: ProfileFilters,
  userId: string | undefined
) => {
  const [useOptimized, setUseOptimized] = useState(true);

  // Try optimized first
  const optimizedQuery = useDiscoverProfilesOptimized(filters, userId);

  // Fallback to original if optimized fails
  const originalQuery = useDiscoverProfiles(filters, userId);

  // Use optimized if it's successful, otherwise fall back to original
  const shouldUseOptimized = useOptimized && !optimizedQuery.error;

  // Switch to original if optimized fails
  useEffect(() => {
    if (optimizedQuery.error && useOptimized) {
      console.warn('Optimized query failed, falling back to original query');
      setUseOptimized(false);
    }
  }, [optimizedQuery.error, useOptimized]);

  return shouldUseOptimized ? optimizedQuery : originalQuery;
};

// PAGINATED SMART HOOK - Uses pagination with fallback
export const useDiscoverProfilesPaginatedSmart = (
  filters: ProfileFilters,
  userId: string | undefined,
  pageSize: number = 10
) => {
  const [usePaginated, setUsePaginated] = useState(true);

  // Try paginated first
  const paginatedQuery = useDiscoverProfilesPaginated(
    filters,
    userId,
    pageSize
  );

  // Fallback to optimized if paginated fails
  const optimizedQuery = useDiscoverProfilesOptimized(filters, userId);

  // Use paginated if it's successful, otherwise fall back to optimized
  const shouldUsePaginated = usePaginated && !paginatedQuery.error;

  // Switch to optimized if paginated fails
  useEffect(() => {
    if (paginatedQuery.error && usePaginated) {
      console.warn('Paginated query failed, falling back to optimized query');
      setUsePaginated(false);
    }
  }, [paginatedQuery.error, usePaginated]);

  if (shouldUsePaginated) {
    return {
      ...paginatedQuery,
      // Flatten pages for compatibility with existing components
      data: paginatedQuery.data?.pages.flatMap((page) => page.profiles) || [],
      // Add pagination helpers
      loadMore: paginatedQuery.fetchNextPage,
      hasMore: paginatedQuery.hasNextPage,
      isLoadingMore: paginatedQuery.isFetchingNextPage
    };
  }

  return {
    ...optimizedQuery,
    loadMore: () => {},
    hasMore: false,
    isLoadingMore: false
  };
};
