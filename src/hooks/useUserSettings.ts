import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  discovery: {
    showMe: string;
    ageRange: [number, number];
    stateFilter: string;
    cityFilter: string;
  };
  privacy: {
    showAge: boolean;
    showLocation: boolean;
    showOnline: boolean;
  };
  notifications: {
    newMatches: boolean;
    messages: boolean;
    likes: boolean;
  };
  created_at: string;
  updated_at: string;
}

// Fetch user settings
export const useUserSettings = (userId: string | undefined) => {
  return useQuery({
    queryKey: ['user-settings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID provided');

      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      // Return null if none exist, let the component handle creating them
      if (!data || data.length === 0) {
        return null;
      }

      return data[0] as UserSettings;
    },
    enabled: !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 30 * 60 * 1000 // 30 minutes
  });
};

// Update user settings
export const useUpdateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      settings
    }: {
      userId: string;
      settings: Partial<UserSettings>;
    }) => {
      // First, check if settings exist
      const { data: existingData } = await supabase
        .from('user_settings')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (existingData) {
        // Update existing record
        const { data, error } = await supabase
          .from('user_settings')
          .update({
            ...settings,
            updated_at: new Date().toISOString()
          })
          .eq('user_id', userId)
          .select()
          .single();

        if (error) throw error;
        return data as UserSettings;
      } else {
        // Insert new record
        const { data, error } = await supabase
          .from('user_settings')
          .insert({
            user_id: userId,
            ...settings,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          })
          .select()
          .single();

        if (error) throw error;
        return data as UserSettings;
      }
    },
    onSuccess: (updatedSettings, { userId }) => {
      // Update cache
      queryClient.setQueryData(['user-settings', userId], updatedSettings);

      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: ['discover-profiles'] });
    },
    onError: (error) => {
      console.error('Error updating user settings:', error);
    }
  });
};

// Create default user settings
export const useCreateUserSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userId: string) => {
      const defaultSettings = {
        user_id: userId,
        discovery: {
          showMe: 'everyone',
          ageRange: [22, 35],
          stateFilter: '',
          cityFilter: ''
        },
        privacy: {
          showAge: true,
          showLocation: true,
          showOnline: true
        },
        notifications: {
          newMatches: true,
          messages: true,
          likes: true
        }
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) throw error;
      return data as UserSettings;
    },
    onSuccess: (newSettings, userId) => {
      // Update cache
      queryClient.setQueryData(['user-settings', userId], newSettings);
    },
    onError: (error) => {
      console.error('Error creating user settings:', error);
    }
  });
};
